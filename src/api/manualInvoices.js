import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

/**
 * Generate a unique invoice number for manual invoices
 * Format: MINV-YYYYMMDDxxxx where xxxx is a sequential number
 */
const generateInvoiceNumber = async () => {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `MINV-${today}`;
  
  try {
    // Get the highest invoice number for today
    const { data, error } = await supabase
      .from('manual_invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    let sequentialNumber = 1;
    
    // If there are existing invoices for today, increment the sequential number
    if (data && data.length > 0) {
      const lastInvoiceNumber = data[0].invoice_number;
      const lastSequentialNumber = parseInt(lastInvoiceNumber.substring(prefix.length));
      sequentialNumber = lastSequentialNumber + 1;
    }
    
    // Pad the sequential number to 4 digits
    const paddedNumber = String(sequentialNumber).padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp if there's an error
    return `MINV-${today}-${Date.now().toString().substring(8)}`;
  }
};

/**
 * Save a manual invoice PDF to the database
 * @param {Object} invoiceData - Data for the manual invoice
 * @param {Blob} pdfBlob - The PDF file as a blob
 * @returns {Promise} - The saved invoice data
 */
const saveManualInvoice = async (invoiceData, pdfBlob) => {
  try {
    // Generate a unique invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Upload the PDF to storage
    const fileName = `manual-invoice-${invoiceNumber}.pdf`;
    const filePath = `manual-invoices/${fileName}`;
    
    // Upload the PDF to the existing 'avatars' bucket
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('avatars') // Use the existing bucket name 'avatars'
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // Save the invoice record in the database
    const { data, error } = await supabase
      .from('manual_invoices')
      .insert({
        file_name: fileName,
        file_path: filePath,
        invoice_date: invoiceData.invoice_date,
        invoice_number: invoiceNumber,
        description: invoiceData.description || ''
      })
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error saving manual invoice:', error);
    throw new Error(`Failed to save invoice: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get all manual invoices
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise} - List of manual invoices
 */
const getManualInvoices = async (filters = {}) => {
  try {
    let query = supabase
      .from('manual_invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply date range filter if provided
    if (filters.startDate && filters.endDate) {
      query = query
        .gte('invoice_date', filters.startDate)
        .lte('invoice_date', filters.endDate);
    }
    
    // Apply limit if provided
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching manual invoices:', error);
    throw error;
  }
};

/**
 * Get a manual invoice by ID
 * @param {string} id - The invoice ID
 * @returns {Promise} - The invoice data
 */
const getManualInvoiceById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('manual_invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching manual invoice:', error);
    throw error;
  }
};

/**
 * Delete a manual invoice by ID
 * @param {string} id - The invoice ID
 * @returns {Promise} - Success status
 */
const deleteManualInvoice = async (id) => {
  try {
    // First get the invoice to find the file path
    const invoice = await getManualInvoiceById(id);
    
    if (!invoice) throw new Error('Invoice not found');
    
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('avatars') // Use the existing bucket name 'avatars'
      .remove([invoice.file_path]);
    
    if (storageError) throw storageError;
    
    // Delete the invoice record
    const { error } = await supabase
      .from('manual_invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting manual invoice:', error);
    throw error;
  }
};

/**
 * Get a download URL for a manual invoice PDF
 * @param {string} filePath - The file path in storage
 * @returns {Promise} - The download URL
 */
const getManualInvoiceDownloadUrl = async (filePath) => {
  try {
    // Create a signed URL with download disposition
    const { data, error } = await supabase.storage
      .from('avatars') // Use the existing bucket name 'avatars'
      .createSignedUrl(filePath, 60 * 60, { 
        disposition: 'attachment' // Force download behavior
      });
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

// Export both ways to ensure compatibility
export {
  generateInvoiceNumber,
  saveManualInvoice,
  getManualInvoices,
  getManualInvoiceById,
  deleteManualInvoice,
  getManualInvoiceDownloadUrl
};

// Also provide default export for backward compatibility
/**
 * Generate a manual invoice in the database
 * @param {Object} formData - The invoice form data
 * @returns {Promise} - The created invoice data
 */
export const generateManualInvoice = async (formData) => {
  try {
    console.log('Creating manual invoice with data:', formData);
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Create the invoice record with timeout to prevent long-hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    );
    
    const dbPromise = supabase
      .from('manual_invoices')
      .insert([{
        ...formData,
        invoice_number: invoiceNumber,
        status: 'completed',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    const result = await Promise.race([dbPromise, timeoutPromise]);
    
    if (result.error) {
      console.error('Database error generating invoice:', result.error);
      throw result.error;
    }
    return result.data;
  } catch (error) {
    console.error('Error generating manual invoice:', error);
    // Provide a user-friendly error
    throw new Error(`Failed to generate invoice: ${error.message || 'Unknown error'}`);
  }
};

const manualInvoicesApi = {
  generateInvoiceNumber,
  generateManualInvoice,
  saveManualInvoice,
  getManualInvoices,
  getManualInvoiceById,
  deleteManualInvoice,
  getManualInvoiceDownloadUrl
};

export default manualInvoicesApi;
