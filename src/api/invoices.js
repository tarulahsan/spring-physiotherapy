import { supabase } from '../lib/supabase';

export const invoiceApi = {
  // Create a new invoice
  async createInvoice(invoiceData, items) {
    // Start a transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        patient_id: invoiceData.patient_id,
        doctor_id: invoiceData.doctor_id,
        discount_giver_id: invoiceData.discount_giver_id,
        invoice_date: invoiceData.invoice_date,
        discount_percentage: invoiceData.discount_percentage,
        notes: invoiceData.notes,
        subtotal: 0, // Will be calculated by trigger
        total_amount: 0, // Will be calculated by trigger
        due_amount: 0 // Will be calculated by trigger
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);

    if (itemsError) throw itemsError;

    return await this.getInvoiceById(invoice.id);
  },

  // Get all invoices with optional filters
  async getInvoices(filters = {}) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        patient:patient_id (
          id,
          name,
          phone,
          email
        ),
        invoice_items!left (
          id,
          therapy_session:therapy_session_id (
            id,
            session_date,
            therapy:therapy_id (
              id,
              name,
              price
            ),
            doctor:doctor_id (
              id,
              name
            )
          ),
          quantity,
          unit_price,
          discount_amount,
          total_amount
        ),
        discount_giver:discount_giver_id (
          id,
          name,
          discount_percentage
        )
      `);

    // Apply filters
    if (filters.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    if (filters.startDate) {
      query = query.gte('invoice_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('invoice_date', filters.endDate);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('invoice_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get a single invoice by ID
  async getInvoiceById(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patient_id (
          id,
          name,
          phone,
          email
        ),
        invoice_items!left (
          id,
          therapy_session:therapy_session_id (
            id,
            session_date,
            therapy:therapy_id (
              id,
              name,
              price
            ),
            doctor:doctor_id (
              id,
              name
            )
          ),
          quantity,
          unit_price,
          discount_amount,
          total_amount
        ),
        discount_giver:discount_giver_id (
          id,
          name,
          discount_percentage
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new invoice
  async createInvoiceNew(invoiceData) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        patient_id: invoiceData.patientId,
        invoice_date: new Date().toISOString(),
        due_date: invoiceData.dueDate,
        status: 'pending',
        total_amount: invoiceData.totalAmount,
        paid_amount: 0,
        due_amount: invoiceData.totalAmount,
        discount_giver_id: invoiceData.discountGiverId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an invoice
  async updateInvoice(id, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an invoice
  async deleteInvoice(id) {
    // Delete related records first
    await supabase.from('payments').delete().eq('invoice_id', id);
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Add payment to invoice
  async addPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
