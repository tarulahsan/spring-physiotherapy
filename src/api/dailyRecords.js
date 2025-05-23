import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

export const addDailyRecord = async (patientId, therapyTypeId, therapyDate, therapyTime) => {
  try {
    console.log('Adding daily record:', { patientId, therapyTypeId, therapyDate, therapyTime });
    const { data, error } = await supabase
      .from('daily_therapy_records')
      .insert([
        {
          patient_id: patientId,
          therapy_type_id: therapyTypeId,
          therapy_date: therapyDate,
          therapy_time: therapyTime
        }
      ])
      .select(`
        id,
        therapy_date,
        therapy_time,
        patients!fk_daily_therapy_records_patient (
          id,
          name,
          phone,
          email,
          age,
          gender,
          address
        ),
        therapy_types!fk_daily_therapy_records_therapy (
          id,
          name,
          description,
          price
        )
      `);

    if (error) {
      console.error('Error adding daily record:', error);
      throw error;
    }
    
    console.log('Added daily record:', data);
    return data[0];
  } catch (error) {
    console.error('Error in addDailyRecord:', error);
    throw error;
  }
}

export const getDailyRecords = async (date) => {
  try {
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // Use the same foreign key references that are working in addDailyRecord
    const { data: records, error } = await supabase
      .from('daily_therapy_records')
      .select(`
        id,
        therapy_date,
        therapy_time,
        patient_id,
        therapy_type_id,
        patients!fk_daily_therapy_records_patient(
          id,
          name,
          phone,
          email,
          age,
          gender,
          address,
          patient_id,
          primary_doctor_id,
          discount_giver_id,
          referrer_id
        ),
        therapy_types!fk_daily_therapy_records_therapy(
          id,
          name,
          description,
          price
        )
      `)
      .eq('therapy_date', formattedDate)
      .order('therapy_time', { ascending: true });

    if (error) throw error;
    console.log('Daily records fetched with patient data:', records);
    return records;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
}

export const getRemainingTherapyDays = async (patientId, therapyId, date) => {
  try {
    console.log('Getting remaining days for:', { patientId, therapyId, date });
    
    const { data, error } = await supabase
      .rpc('get_remaining_therapy_days', {
        p_patient_id: patientId,
        p_therapy_id: therapyId,
        p_date: date
      });

    if (error) {
      console.error('Error getting remaining therapy days:', error);
      throw error;
    }

    console.log('Remaining days:', data);
    return data;
  } catch (error) {
    console.error('Error in getRemainingTherapyDays:', error);
    throw error;
  }
}

export const getAvailableTherapies = async (patientId, date) => {
  try {
    if (!patientId || !date) {
      console.log('Missing required parameters:', { patientId, date });
      return [];
    }

    console.log('Getting available therapies for:', { patientId, date });
    
    // First check therapy availability with debug function
    const { data: debugResults, error: debugError } = await supabase
      .rpc('debug_therapy_availability', {
        p_patient_id: patientId,
        p_therapy_type_id: '28e5be72-bc30-4701-8087-d5f18224d366', // Test with Backpain therapy
        p_date: date
      });

    if (debugError) {
      console.error('Debug error:', debugError);
    } else {
      console.log('Debug results:', debugResults);
    }
    
    // Get all invoice items with therapy types for the patient using correct foreign keys
    const { data: invoiceItems, error: invoiceError } = await supabase
      .from('invoice_items')
      .select(`
        id,
        days,
        quantity,
        therapy_type_id,
        therapy_types!invoice_items_therapy_type_id_fkey (
          id,
          name,
          description,
          price,
          status
        ),
        invoice:invoices!invoice_items_invoice_id_fkey (
          id,
          status,
          patient_id
        )
      `)
      .eq('invoice.patient_id', patientId)
      .in('invoice.status', ['paid', 'partially_paid'])
      .eq('therapy_types.status', 'active');

    if (invoiceError) {
      console.error('Error getting invoice items:', invoiceError);
      console.error('Error details:', invoiceError.details);
      return [];
    }

    if (!invoiceItems || invoiceItems.length === 0) {
      console.log('No invoice items found for patient:', patientId);
      return [];
    }

    console.log('Found invoice items:', JSON.stringify(invoiceItems, null, 2));

    // Filter active therapies
    const activeItems = invoiceItems.filter(item => 
      item.therapy_types && 
      item.therapy_types.status === 'active' &&
      item.therapy_type_id &&
      item.invoice &&
      ['paid', 'partially_paid'].includes(item.invoice.status)
    );

    if (activeItems.length === 0) {
      console.log('No active therapy items found');
      return [];
    }

    // Group therapies and sum their days
    const therapyMap = new Map();
    
    for (const item of activeItems) {
      const therapy = item.therapy_types;
      console.log('Processing invoice item:', {
        itemId: item.id,
        therapyTypeId: item.therapy_type_id,
        therapy: therapy,
        days: item.days,
        quantity: item.quantity
      });

      if (!therapy || therapy.status !== 'active') {
        console.log('Skipping therapy - inactive or missing:', {
          therapy,
          itemId: item.id
        });
        continue;
      }

      if (!therapyMap.has(therapy.id)) {
        console.log('Adding new therapy to map:', therapy);
        therapyMap.set(therapy.id, {
          ...therapy,
          totalDays: 0,
          remainingDays: 0
        });
      }

      const therapyData = therapyMap.get(therapy.id);
      const days = Number(item.days) || 0;
      const quantity = Number(item.quantity) || 0;
      therapyData.totalDays += days * quantity;
      
      console.log('Updated therapy data:', {
        therapyId: therapy.id,
        therapyName: therapy.name,
        days,
        quantity,
        totalDays: therapyData.totalDays
      });
    }

    console.log('Final therapy map:', Array.from(therapyMap.values()));

    // Get remaining days for each therapy
    const therapiesWithDays = await Promise.all(
      Array.from(therapyMap.values()).map(async (therapy) => {
        try {
          console.log('Getting remaining days for therapy:', {
            therapyId: therapy.id,
            therapyName: therapy.name,
            patientId,
            date
          });

          // Format date as YYYY-MM-DD
          const formattedDate = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
          console.log('Formatted date:', formattedDate);

          // Use the debug function to get detailed information
          const { data: debugInfo, error: debugError } = await supabase
            .rpc('debug_remaining_days', {
              p_patient_id: patientId,
              p_therapy_id: therapy.id,
              p_date: formattedDate
            });

          if (debugError) {
            console.error('Error getting debug info:', debugError);
            return null;
          }

          console.log('Debug info for therapy:', {
            therapyId: therapy.id,
            therapyName: therapy.name,
            debugInfo: debugInfo?.[0]
          });

          const remainingDays = debugInfo?.[0]?.remaining_days || 0;
          console.log('Remaining days:', remainingDays);
          
          return {
            ...therapy,
            remainingDays,
            debugInfo: debugInfo?.[0]
          };
        } catch (error) {
          console.error('Error getting remaining days for therapy:', therapy.id, error);
          return null;
        }
      })
    );

    const availableTherapies = therapiesWithDays
      .filter(therapy => {
        const isAvailable = therapy && therapy.remainingDays > 0;
        console.log('Therapy availability:', {
          therapyId: therapy?.id,
          therapyName: therapy?.name,
          remainingDays: therapy?.remainingDays,
          isAvailable
        });
        return isAvailable;
      });
    
    console.log('Final available therapies:', JSON.stringify(availableTherapies, null, 2));
    return availableTherapies;
  } catch (error) {
    console.error('Error in getAvailableTherapies:', error);
    return [];
  }
}

export const getPatientTherapyHistory = async (patientId, page = 1, pageSize = 5) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('daily_therapy_records')
      .select(`
        id,
        therapy_date,
        therapy_time,
        therapy_types!fk_daily_therapy_records_therapy (
          id,
          name,
          description,
          price
        )
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .order('therapy_date', { ascending: false })
      .order('therapy_time', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching patient therapy history:', error);
      throw error;
    }

    return {
      records: data,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (error) {
    console.error('Error in getPatientTherapyHistory:', error);
    throw error;
  }
};

export const updateDailyRecord = async (recordId, updates) => {
  try {
    const { error } = await supabase
      .from('daily_therapy_records')
      .update(updates)
      .eq('id', recordId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating daily record:', error);
    throw error;
  }
}

export const deleteDailyRecord = async (recordId) => {
  try {
    const { error } = await supabase
      .from('daily_therapy_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting daily record:', error);
    throw error;
  }
}
