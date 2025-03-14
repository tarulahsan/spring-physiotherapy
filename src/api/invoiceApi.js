import { supabase } from '../lib/supabase';

export default {
  // Get all invoices
  getInvoices: async (patientId = null) => {
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_date,
        patient_id,
        doctor_id,
        discount_giver_id,
        subtotal,
        total_amount,
        paid_amount,
        due_amount,
        status,
        notes,
        created_at,
        updated_at,
        patient:patient_id (
          id, 
          name, 
          patient_id
        ),
        doctor:doctor_id (
          id, 
          name
        ),
        discount_giver:discount_giver_id (
          id, 
          name
        )
      `)
      .order('created_at', { ascending: false });

    // If patientId is provided, filter by patient
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    return { data };
  },

  // Get invoice by ID with items
  getInvoiceById: async (id) => {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_date,
        patient_id,
        doctor_id,
        discount_giver_id,
        subtotal,
        total_amount,
        paid_amount,
        due_amount,
        status,
        notes,
        created_at,
        updated_at,
        patient:patient_id (
          id, 
          name, 
          patient_id
        ),
        doctor:doctor_id (
          id, 
          name
        ),
        discount_giver:discount_giver_id (
          id, 
          name
        )
      `)
      .eq('id', id)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      throw invoiceError;
    }

    // Fetch invoice items separately
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select(`
        id,
        invoice_id,
        therapy_type_id,
        quantity,
        unit_price,
        discount_amount,
        total_amount,
        therapy_type:therapy_type_id (
          id,
          name,
          price
        )
      `)
      .eq('invoice_id', id);

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
      throw itemsError;
    }

    return { ...invoice, items };
  },

  // Create invoice
  createInvoice: async (invoiceData) => {
    if (!invoiceData.patient_id) {
      throw new Error('Patient ID is required');
    }

    // Helper function to round to 2 decimal places
    const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    // Validate therapy types are active
    if (invoiceData.items && invoiceData.items.length > 0) {
      const therapyIds = invoiceData.items.map(item => item.therapy_type_id);
      
      const { data: therapies, error: therapyError } = await supabase
        .from('therapy_types')
        .select('id, status')
        .in('id', therapyIds);

      if (therapyError) {
        console.error('Error validating therapy types:', therapyError);
        throw therapyError;
      }

      // Check if all therapies exist and are active
      const inactiveTherapies = therapies.filter(t => t.status !== 'active');
      if (inactiveTherapies.length > 0) {
        throw new Error('All therapy types must exist and be active');
      }
    }

    const paidAmount = round(invoiceData.paid_amount || 0);
    const totalAmount = round(invoiceData.total_amount);
    const dueAmount = round(totalAmount - paidAmount);

    // Start a Supabase transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        invoice_date: invoiceData.invoice_date,
        patient_id: invoiceData.patient_id,
        doctor_id: invoiceData.doctor_id,
        discount_giver_id: invoiceData.discount_giver_id || null,
        discount_amount: round(invoiceData.discount_amount || 0),
        subtotal: round(invoiceData.subtotal),
        total_amount: totalAmount,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        notes: invoiceData.notes || '',
        status: paidAmount >= totalAmount ? 'paid' : 
                paidAmount > 0 ? 'partially_paid' : 'unpaid'
      }])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    // Insert invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const items = invoiceData.items.map(item => ({
        invoice_id: invoice.id,
        therapy_type_id: item.therapy_type_id,
        quantity: item.quantity,
        days: item.days || 1,
        unit_price: round(item.unit_price),
        discount: round(item.discount_amount || 0),
        total_amount: round(item.total_amount)
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        throw itemsError;
      }
    }

    return invoice;
  },

  // Update invoice
  updateInvoice: async (id, updates) => {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    return data;
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    // First delete related invoice items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);

    if (itemsError) {
      console.error('Error deleting invoice items:', itemsError);
      throw itemsError;
    }

    // Then delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },

  // Record payment for an invoice
  recordPayment: async (invoiceId, paymentAmount) => {
    // Helper function to round to 2 decimal places
    const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    // First get the current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError) {
      console.error('Error fetching invoice:', fetchError);
      throw fetchError;
    }

    // Calculate new amounts with proper rounding
    const newPaidAmount = round(Number(invoice.paid_amount || 0) + Number(paymentAmount));
    const totalAmount = round(Number(invoice.total_amount));
    const newDueAmount = round(Math.max(0, totalAmount - newPaidAmount));
    
    // Determine new status based on rounded values
    let newStatus = 'unpaid';
    if (newPaidAmount >= totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }

    // Update the invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        due_amount: newDueAmount,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      throw updateError;
    }

    return updatedInvoice;
  }
};
