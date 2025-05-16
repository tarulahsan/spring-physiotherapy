import { supabase } from '../lib/supabase';

const patientApi = {
  // Search patients
  searchPatients: async (searchTerm) => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, phone, patient_id, email')
      .eq('status', 'active')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
    return data;
  },

  // Get all patients
  getPatients: async ({ searchTerm = '' } = {}) => {
    let query = supabase
      .from('patients')
      .select(`
        *,
        invoices (
          id,
          due_amount
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting patients:', error);
      throw error;
    }

    // Calculate total due for each patient
    const patientsWithDue = data.map(patient => ({
      ...patient,
      total_due: patient.invoices?.reduce((sum, inv) => sum + (parseFloat(inv.due_amount) || 0), 0) || 0
    }));

    return patientsWithDue;
  },

  // Get patient by ID
  async getPatientById(id) {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select(`
          id,
          patient_id,
          name,
          gender,
          date_of_birth,
          age,
          phone,
          email,
          address,
          medical_history,
          diagnosis,
          remarks,
          primary_doctor_id,
          discount_giver_id,
          referrer_id,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Patient fetch error:', error);
        throw error;
      }

      return patient;
    } catch (error) {
      console.error('Error in getPatientById:', error);
      throw error;
    }
  },

  // Create patient
  createPatient: async (patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...patientData, status: 'active' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
    return data;
  },

  // Update patient
  updatePatient: async (id, updates) => {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
    return data;
  },

  // Delete patient (soft delete)
  deletePatient: async (id) => {
    const { error } = await supabase
      .from('patients')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
    return true;
  }
};

export default patientApi;
