import { supabase } from '../lib/supabase';

export default {
  // Get all doctors
  getDoctors: async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
    return data;
  },

  // Get doctor by ID
  getDoctorById: async (id) => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching doctor:', error);
      throw error;
    }
    return data;
  },

  // Create doctor
  createDoctor: async (doctorData) => {
    const { data, error } = await supabase
      .from('doctors')
      .insert([{ ...doctorData, status: 'active' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
    return data;
  },

  // Update doctor
  updateDoctor: async (id, updates) => {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
    return data;
  },

  // Delete doctor (soft delete)
  deleteDoctor: async (id) => {
    const { error } = await supabase
      .from('doctors')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
    return true;
  }
};
