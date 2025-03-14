import { supabase } from '../lib/supabase';

export const reportsApi = {
  // Get revenue summary
  async getRevenueSummary(startDate, endDate) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_date,
        total_amount,
        paid_amount,
        due_amount
      `)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate);

    if (error) throw error;
    return data;
  },

  // Get therapy sessions summary
  async getTherapySummary(startDate, endDate) {
    const { data: therapyData, error: therapyError } = await supabase
      .from('therapy_sessions')
      .select(`
        id,
        session_date,
        status,
        therapy_types (
          id,
          name,
          description,
          price
        ),
        patients (
          id,
          name
        )
      `)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: false });

    if (therapyError) throw therapyError;

    // Get monthly trends
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('therapy_sessions')
      .select(`
        id,
        session_date,
        therapy_types (
          id,
          name
        )
      `)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date');

    if (monthlyError) throw monthlyError;

    return {
      therapyData,
      monthlyData
    };
  },

  // Get doctor performance
  async getDoctorPerformance(startDate, endDate) {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id,
        name,
        therapy_sessions (
          id,
          session_date,
          status
        ),
        invoices (
          id,
          invoice_date,
          total_amount
        )
      `)
      .gte('therapy_sessions.session_date', startDate)
      .lte('therapy_sessions.session_date', endDate);

    if (error) throw error;
    return data;
  },

  // Get patient statistics
  async getPatientStatistics(startDate, endDate) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        name,
        therapy_sessions (
          id,
          session_date,
          status,
          therapy_types (
            id,
            name
          )
        ),
        invoices (
          id,
          invoice_date,
          total_amount,
          paid_amount,
          due_amount
        )
      `)
      .gte('therapy_sessions.session_date', startDate)
      .lte('therapy_sessions.session_date', endDate);

    if (error) throw error;
    return data;
  },

  // Get due amount summary
  async getDueAmountSummary() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        total_amount,
        paid_amount,
        due_amount,
        status,
        patients (
          id,
          patient_id,
          name,
          phone
        )
      `)
      .gt('due_amount', 0)
      .order('invoice_date');

    if (error) throw error;
    return data;
  }
};
