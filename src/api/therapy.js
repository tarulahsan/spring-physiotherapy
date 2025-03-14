import { supabase } from '../lib/supabase';

export const therapyApi = {
  // Create a new therapy session
  async createSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert([{
          patient_id: sessionData.patient_id,
          therapy_type_id: sessionData.therapy_type_id,
          doctor_id: sessionData.doctor_id,
          session_date: sessionData.session_date,
          status: sessionData.status || 'scheduled',
          pain_level: sessionData.pain_level,
          progress_level: sessionData.progress_level,
          notes: sessionData.notes
        }])
        .select(`
          *,
          patient:patients (
            id,
            name
          ),
          doctor:doctors (
            id,
            name
          ),
          therapy_type:therapy_types (
            id,
            name,
            price,
            duration
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating therapy session:', error);
      throw error;
    }
  },

  // Get all therapy sessions with pagination and filters
  async getSessions({ page = 1, limit = 10, filters = {} }) {
    try {
      let query = supabase
        .from('therapy_sessions')
        .select(`
          *,
          patient:patients (
            id,
            name
          ),
          doctor:doctors (
            id,
            name
          ),
          therapy_type:therapy_types (
            id,
            name,
            price,
            duration
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('session_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('session_date', filters.dateTo);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('session_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      return { data, count, totalPages: Math.ceil(count / limit) };
    } catch (error) {
      console.error('Error fetching therapy sessions:', error);
      throw error;
    }
  },

  // Get a single therapy session by ID
  async getSessionById(id) {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          patient:patients (
            id,
            name
          ),
          doctor:doctors (
            id,
            name
          ),
          therapy_type:therapy_types (
            id,
            name,
            price,
            duration
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching therapy session by ID:', error);
      throw error;
    }
  },

  // Update a therapy session
  async updateSession(id, updates) {
    try {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          patient:patients (
            id,
            name
          ),
          doctor:doctors (
            id,
            name
          ),
          therapy_type:therapy_types (
            id,
            name,
            price,
            duration
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating therapy session:', error);
      throw error;
    }
  },

  // Delete a therapy session
  async deleteSession(id) {
    try {
      const { error } = await supabase
        .from('therapy_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting therapy session:', error);
      throw error;
    }
  },

  // Get today's sessions
  async getTodaySessions() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          patient:patients (
            id,
            name
          ),
          doctor:doctors (
            id,
            name
          ),
          therapy_type:therapy_types (
            id,
            name,
            price,
            duration
          )
        `)
        .eq('session_date', today)
        .order('session_date');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching today\'s therapy sessions:', error);
      throw error;
    }
  }
};
