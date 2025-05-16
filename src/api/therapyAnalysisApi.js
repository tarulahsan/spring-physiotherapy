import { supabase } from '../lib/supabase';

// Get all therapy records without date filtering
export const getAllTherapyRecords = async () => {
  try {
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
          patient_id
        ),
        therapy_types!fk_daily_therapy_records_therapy(
          id,
          name,
          description,
          price
        )
      `)
      .order('therapy_date', { ascending: false });

    if (error) throw error;
    return records;
  } catch (error) {
    console.error('Error fetching all therapy records:', error);
    throw error;
  }
};

// Get therapy records filtered by date range
export const getFilteredTherapyRecords = async (startDate, endDate) => {
  try {
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
          patient_id
        ),
        therapy_types!fk_daily_therapy_records_therapy(
          id,
          name,
          description,
          price
        )
      `)
      .gte('therapy_date', startDate)
      .lte('therapy_date', endDate)
      .order('therapy_date', { ascending: false });

    if (error) throw error;
    return records;
  } catch (error) {
    console.error('Error fetching filtered therapy records:', error);
    throw error;
  }
};

// Get therapy records grouped by therapy type
export const getTherapyRecordsGroupedByType = async () => {
  try {
    // First get all records
    const records = await getAllTherapyRecords();
    
    // Fetch all therapy types from the database to get accurate names
    const { data: allTherapyTypes, error: therapyError } = await supabase
      .from('therapy_types')
      .select('id, name, description, price');
      
    if (therapyError) throw therapyError;
    
    // Create a lookup map for therapy types
    const therapyTypeMap = {};
    if (allTherapyTypes) {
      allTherapyTypes.forEach(therapy => {
        therapyTypeMap[therapy.id] = therapy;
      });
    }
    
    // Group records by therapy type
    const groupedByTherapy = records.reduce((acc, record) => {
      const therapyId = record.therapy_type_id;
      
      // Try to get therapy name from multiple sources in order of reliability
      let therapyName, therapyDescription, therapyPrice;
      
      // 1. Try from the direct therapy types relation in the record
      if (record.therapy_types?.name) {
        therapyName = record.therapy_types.name;
        therapyDescription = record.therapy_types.description || '';
        therapyPrice = record.therapy_types.price || 0;
      } 
      // 2. Try from our fetched therapy types lookup
      else if (therapyTypeMap[therapyId]) {
        therapyName = therapyTypeMap[therapyId].name;
        therapyDescription = therapyTypeMap[therapyId].description || '';
        therapyPrice = therapyTypeMap[therapyId].price || 0;
      } 
      // 3. Fall back to a better formatted ID if we still can't find it
      else {
        therapyName = `Unnamed Therapy`;
        therapyDescription = 'This therapy needs to be properly configured';
        therapyPrice = 0;
      }
      
      if (!acc[therapyId]) {
        acc[therapyId] = {
          id: therapyId,
          name: therapyName,
          description: therapyDescription,
          price: therapyPrice,
          records: [],
          patients: new Set(), // Use Set to avoid duplicates
          count: 0,
          revenue: 0,
          needsAttention: !record.therapy_types?.name && !therapyTypeMap[therapyId]
        };
      }
      
      // Process patient information
      const patientData = record.patients || {};
      const processedRecord = {
        ...record,
        patients: patientData.id ? {
          ...patientData,
          name: patientData.name || 'Unnamed Patient',
          phone: patientData.phone || 'No contact info'
        } : null
      };
      
      // Add record
      acc[therapyId].records.push(processedRecord);
      if (patientData.id) acc[therapyId].patients.add(patientData.id);
      acc[therapyId].count += 1;
      acc[therapyId].revenue += (record.therapy_types?.price || 0);
      
      return acc;
    }, {});
    
    // Convert to array and format patient counts
    const result = Object.values(groupedByTherapy).map(therapy => ({
      ...therapy,
      patients: Array.from(therapy.patients),
      patientCount: therapy.patients.size,
      averagePerPatient: (therapy.revenue / therapy.patients.size) || 0
    }));
    
    return result.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error analyzing therapy records:', error);
    throw error;
  }
};
