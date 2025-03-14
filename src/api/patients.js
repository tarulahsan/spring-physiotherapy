import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export const patientApi = {
  // Create a new patient
  async createPatient(patientData) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all patients with optional filters
  async getPatients(filters = {}) {
    let query = supabase
      .from('patients')
      .select(`
        *,
        doctors!left (
          id,
          name
        ),
        therapy_sessions!left (
          id,
          session_date,
          status,
          therapy:therapy_id (
            id,
            name
          ),
          doctor:doctor_id (
            id,
            name
          )
        ),
        invoices!left (
          id,
          invoice_number,
          invoice_date,
          total_amount,
          paid_amount,
          due_amount,
          status
        )
      `);

    // Apply filters if provided
    if (filters.searchTerm) {
      query = query.or(`name.ilike.%${filters.searchTerm}%,patient_id.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get a single patient by ID
  async getPatientById(patientId) {
    try {
      // Get patient basic info
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          primary_doctor:primary_doctor_id (id, name),
          discount_giver:discount_giver_id (id, name),
          referrer:referrer_id (id, name)
        `)
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      // Get all invoices for the patient
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_date,
          total_amount,
          paid_amount,
          status,
          invoice_items (
            id,
            days,
            quantity,
            therapy_type_id,
            therapy_types (
              id,
              name,
              description,
              price
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('invoice_date', { ascending: false });

      if (invoiceError) throw invoiceError;

      // Get therapy history
      const { data: therapyRecords, error: recordsError } = await supabase
        .from('daily_therapy_records')
        .select(`
          id,
          therapy_date,
          therapy_time,
          therapy_types (
            id,
            name,
            description,
            price
          )
        `)
        .eq('patient_id', patientId)
        .order('therapy_date', { ascending: false });

      if (recordsError) throw recordsError;

      // Process therapy data
      const activeInvoices = invoices.filter(inv => ['paid', 'partially_paid'].includes(inv.status));
      const activeTherapies = new Map();

      // Calculate remaining days for each therapy
      activeInvoices.forEach(invoice => {
        invoice.invoice_items.forEach(item => {
          if (!item.therapy_types) return;

          const therapy = item.therapy_types;
          const totalDays = item.days * item.quantity;
          
          // Count used days
          const usedDays = therapyRecords.filter(
            record => record.therapy_types.id === therapy.id
          ).length;

          const remaining = totalDays - usedDays;

          if (remaining > 0) {
            if (activeTherapies.has(therapy.id)) {
              const existing = activeTherapies.get(therapy.id);
              activeTherapies.set(therapy.id, {
                ...existing,
                totalDays: existing.totalDays + totalDays,
                remainingDays: existing.remainingDays + remaining,
                invoices: [...existing.invoices, invoice.id]
              });
            } else {
              activeTherapies.set(therapy.id, {
                ...therapy,
                totalDays,
                remainingDays: remaining,
                usedDays,
                invoices: [invoice.id]
              });
            }
          }
        });
      });

      // Calculate due amount
      const totalDue = activeInvoices.reduce((sum, invoice) => {
        if (invoice.status === 'partially_paid') {
          return sum + (invoice.total_amount - (invoice.paid_amount || 0));
        }
        return sum;
      }, 0);

      // Group therapy records by month
      const therapyHistory = therapyRecords.reduce((acc, record) => {
        const monthYear = format(new Date(record.therapy_date), 'MMMM yyyy');
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(record);
        return acc;
      }, {});

      return {
        ...patient,
        activeTherapies: Array.from(activeTherapies.values()),
        therapyHistory,
        invoices,
        totalDue,
        therapyStats: {
          totalSessions: therapyRecords.length,
          lastSession: therapyRecords[0]?.therapy_date || null,
          uniqueTherapies: new Set(therapyRecords.map(r => r.therapy_types.id)).size
        }
      };
    } catch (error) {
      console.error('Error in getPatientById:', error);
      throw error;
    }
  },

  // Update a patient
  async updatePatient(id, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a patient
  async deletePatient(id) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
