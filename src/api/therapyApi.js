import { supabase } from '../lib/supabase';

const therapyApi = {
  // Get all therapies
  async getAllTherapies() {
    try {
      const { data, error } = await supabase
        .from('therapy_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching therapies:', error);
      throw error;
    }
  },

  // Get therapy by ID
  async getTherapyById(id) {
    try {
      const { data, error } = await supabase
        .from('therapy_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching therapy:', error);
      throw error;
    }
  },

  // Create therapy
  async createTherapy(therapy) {
    try {
      // Validate required fields
      if (!therapy.name) {
        throw new Error('Therapy name is required');
      }
      if (therapy.price === undefined || therapy.price === null) {
        throw new Error('Therapy price is required');
      }

      const { data, error } = await supabase
        .from('therapy_types')
        .insert([{
          name: therapy.name,
          price: therapy.price,
          duration: therapy.duration,
          description: therapy.description,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating therapy:', error);
      throw error;
    }
  },

  // Update therapy
  async updateTherapy(id, therapy) {
    try {
      // Validate required fields
      if (!therapy.name) {
        throw new Error('Therapy name is required');
      }
      if (therapy.price === undefined || therapy.price === null) {
        throw new Error('Therapy price is required');
      }

      const { data, error } = await supabase
        .from('therapy_types')
        .update({
          name: therapy.name,
          price: therapy.price,
          duration: therapy.duration,
          description: therapy.description
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating therapy:', error);
      throw error;
    }
  },

  // Delete therapy (soft delete by setting status to inactive)
  async deleteTherapy(id) {
    try {
      const { data, error } = await supabase
        .from('therapy_types')
        .update({ status: 'inactive' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting therapy:', error);
      throw error;
    }
  },

  // Get therapy sessions
  async getTherapySessions({ patientId, status, startDate, endDate }) {
    try {
      let query = supabase
        .from('therapy_sessions')
        .select(`
          id,
          patient_id,
          therapy_id,
          doctor_id,
          session_date,
          status,
          notes,
          created_at,
          therapy:therapies (
            id,
            name,
            price,
            duration
          ),
          doctor:doctors (
            id,
            name
          )
        `);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('session_date', startDate);
      }

      if (endDate) {
        query = query.lte('session_date', endDate);
      }

      const { data, error } = await query.order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching therapy sessions:', error);
      throw error;
    }
  },

  // Create therapy session
  async createTherapySession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert([{
          patient_id: sessionData.patient_id,
          therapy_id: sessionData.therapy_id,
          doctor_id: sessionData.doctor_id,
          session_date: sessionData.session_date,
          status: sessionData.status || 'scheduled',
          notes: sessionData.notes
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating therapy session:', error);
      throw error;
    }
  },

  // Update therapy session
  async updateTherapySession(id, sessionData) {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .update({
          therapy_id: sessionData.therapy_id,
          doctor_id: sessionData.doctor_id,
          session_date: sessionData.session_date,
          status: sessionData.status,
          notes: sessionData.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating therapy session:', error);
      throw error;
    }
  },

  // Delete therapy session
  async deleteTherapySession(id) {
    try {
      const { error } = await supabase
        .from('therapy_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting therapy session:', error);
      throw error;
    }
  },

  // Get therapies by patient ID
  async getTherapiesByPatientId(patientId) {
    try {
      console.log('Fetching therapies for patient:', patientId);

      // First get all therapy types for reference
      const { data: therapyTypes, error: therapyError } = await supabase
        .from('therapy_types')
        .select('*');

      if (therapyError) {
        console.error('Error fetching therapy types:', therapyError);
        throw therapyError;
      }

      // Create a map for quick lookup
      const therapyMap = new Map(therapyTypes.map(t => [t.id, t]));

      // Get invoices with items
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_date,
          patient_id,
          doctor_id,
          status,
          total_amount,
          paid_amount,
          doctor:doctors (
            id,
            name
          ),
          invoice_items (
            id,
            therapy_type_id,
            quantity,
            unit_price,
            total_amount
          )
        `)
        .eq('patient_id', patientId)
        .order('invoice_date', { ascending: false });

      if (invoiceError) {
        console.error('Invoice fetch error:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice data:', invoiceData);

      if (!invoiceData || invoiceData.length === 0) {
        console.log('No invoice data found');
        return [];
      }

      // Transform data to match expected format
      const transformedData = [];
      
      invoiceData.forEach(invoice => {
        if (!invoice.invoice_items) {
          console.log('No invoice items for invoice:', invoice.id);
          return;
        }

        invoice.invoice_items.forEach(item => {
          const therapy = therapyMap.get(item.therapy_type_id);
          if (!therapy) {
            console.log('No therapy found for item:', item.id);
            return;
          }
          
          const itemPaidAmount = invoice.paid_amount ? 
            (item.total_amount / invoice.total_amount) * invoice.paid_amount : 0;

          transformedData.push({
            id: item.id,
            invoice_id: invoice.id,
            therapy_id: therapy.id,
            therapy_name: therapy.name,
            therapy_price: item.unit_price || therapy.price,
            therapy_duration: therapy.duration || 0,
            doctor_name: invoice.doctor?.name || 'N/A',
            doctor_id: invoice.doctor_id,
            session_date: invoice.invoice_date,
            sessions: item.quantity,
            amount: item.total_amount || 0,
            paid_amount: itemPaidAmount,
            status: invoice.status || 'unpaid'
          });
        });
      });

      console.log('Transformed data:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching patient therapies:', error);
      throw error;
    }
  }
};

export default therapyApi;
