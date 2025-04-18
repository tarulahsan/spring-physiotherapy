import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPrint, 
  FaSearch,
  FaSave,
  FaUserMd,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaPercent,
  FaCheckCircle,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaIdCard,
  FaDownload,
  FaTrash,
  FaFilter
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as manualInvoicesApi from '../api/manualInvoices';
import patientApi from '../api/patientApi';
import doctorApi from '../api/doctorApi';
import { settingsApi } from '../api/settingsApi';
import therapyApi from '../api/therapyApi';
import debounce from 'lodash/debounce';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ManualInvoice = () => {
  // State
  const [settings, setSettings] = useState(null);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [therapyTypes, setTherapyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTherapies, setSelectedTherapies] = useState([]);
  const [manualInvoices, setManualInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'list'
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Last 30 days
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [currentInvoice, setCurrentInvoice] = useState({
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    patient_id: '',
    patient_display_id: '',
    patient_name: '',
    patient_phone: '',
    doctor_id: '',
    discount_amount: 0,
    items: [],
    subtotal: 0,
    total_amount: 0,
    paid_amount: 0,
    due_amount: 0,
    notes: '',
    description: ''
  });
  
  const invoiceRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          settingsData,
          doctorsData,
          therapiesData
        ] = await Promise.all([
          settingsApi.getBusinessSettings(),
          doctorApi.getDoctors(),
          therapyApi.getAllTherapies()
        ]);

        if (!settingsData || !doctorsData || !therapiesData) {
          throw new Error('Failed to fetch required data');
        }

        setSettings(settingsData);
        setDoctors(doctorsData.filter(d => d.status === 'active'));
        setTherapyTypes(therapiesData.filter(t => t.status === 'active'));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load existing manual invoices when tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'list') {
      loadManualInvoices();
    }
  }, [activeTab, dateFilter]);

  // Load manual invoices with filter
  const loadManualInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const invoices = await manualInvoicesApi.getManualInvoices({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });
      setManualInvoices(invoices);
    } catch (error) {
      console.error('Error loading manual invoices:', error);
      toast.error('Failed to load manual invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce(async (term) => {
    if (!term) {
      setFilteredPatients([]);
      return;
    }

    try {
      const results = await patientApi.searchPatients(term);
      setFilteredPatients(results);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
    }
  }, 300);

  // Search patients when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setCurrentInvoice(prev => ({
      ...prev,
      patient_id: patient.id, 
      patient_display_id: patient.patient_id, 
      patient_name: patient.name,
      patient_phone: patient.phone,
      doctor_id: patient.doctor_id || ''
    }));
    setSearchTerm('');
    setFilteredPatients([]);
  };

  // Handle therapy selection
  const handleTherapySelection = (therapy) => {
    // Check if therapy is already selected
    const exists = selectedTherapies.some(t => t.id === therapy.id);
    if (exists) {
      toast.info('This therapy is already added to the invoice');
      return;
    }

    const newTherapy = {
      id: therapy.id,
      name: therapy.name,
      price: therapy.price,
      quantity: 1,
      days: 1, // Default to 1 day
      discount_amount: 0,
      total_price: therapy.price
    };

    setSelectedTherapies([...selectedTherapies, newTherapy]);
    
    // Recalculate totals
    const updatedTherapies = [...selectedTherapies, newTherapy];
    const totals = calculateTotals(updatedTherapies);
    
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedTherapies,
      ...totals
    }));
  };

  // Handle therapy removal
  const handleRemoveTherapy = (index) => {
    const updatedTherapies = selectedTherapies.filter((_, i) => i !== index);
    setSelectedTherapies(updatedTherapies);
    
    // Recalculate totals
    const totals = calculateTotals(updatedTherapies);
    
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedTherapies,
      ...totals
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (index, quantity) => {
    const updatedTherapies = [...selectedTherapies];
    quantity = parseInt(quantity) || 1;
    
    // Update the therapy quantity and total price
    updatedTherapies[index] = {
      ...updatedTherapies[index],
      quantity,
      total_price: (updatedTherapies[index].price * quantity) - updatedTherapies[index].discount_amount
    };
    
    setSelectedTherapies(updatedTherapies);
    
    // Recalculate totals
    const totals = calculateTotals(updatedTherapies);
    
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedTherapies,
      ...totals
    }));
  };

  // Handle days change
  const handleDaysChange = (index, days) => {
    const updatedTherapies = [...selectedTherapies];
    days = parseInt(days) || 1;
    
    updatedTherapies[index] = {
      ...updatedTherapies[index],
      days
    };
    
    setSelectedTherapies(updatedTherapies);
    
    // No need to recalculate totals as days don't affect price
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedTherapies
    }));
  };

  // Handle discount change
  const handleDiscountChange = (index, discount) => {
    const updatedTherapies = [...selectedTherapies];
    discount = parseFloat(discount) || 0;
    
    const therapy = updatedTherapies[index];
    const basePrice = therapy.price * therapy.quantity;
    
    // Update the therapy discount and total price
    updatedTherapies[index] = {
      ...therapy,
      discount_amount: discount,
      total_price: basePrice - discount
    };
    
    setSelectedTherapies(updatedTherapies);
    
    // Recalculate totals
    const totals = calculateTotals(updatedTherapies);
    
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedTherapies,
      ...totals
    }));
  };

  // Handle paid amount change
  const handlePaidAmountChange = (amount) => {
    amount = parseFloat(amount) || 0;
    
    // Calculate due amount
    const dueAmount = Math.max(0, currentInvoice.total_amount - amount);
    
    setCurrentInvoice(prev => ({
      ...prev,
      paid_amount: amount,
      due_amount: dueAmount,
      status: dueAmount > 0 ? 'partially_paid' : 'paid'
    }));
  };

  // Calculate totals from selected therapies
  const calculateTotals = (therapies) => {
    // Calculate subtotal (sum of therapy prices before discount)
    const subtotal = therapies.reduce((sum, therapy) => {
      return sum + (therapy.price * therapy.quantity);
    }, 0);
    
    // Calculate total discount (sum of all therapy discounts)
    const therapyDiscounts = therapies.reduce((sum, therapy) => {
      return sum + (therapy.discount_amount || 0);
    }, 0);
    
    // Get the additional invoice discount
    const invoiceDiscount = parseFloat(currentInvoice.discount_amount) || 0;
    
    // Calculate total amount after all discounts
    const totalAmount = Math.max(0, subtotal - therapyDiscounts - invoiceDiscount);
    
    // Calculate due amount based on paid amount
    const paidAmount = parseFloat(currentInvoice.paid_amount) || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    
    return {
      subtotal,
      total_amount: totalAmount,
      due_amount: dueAmount
    };
  };

  // Handle form submission and PDF generation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!currentInvoice.patient_name) {
      toast.error('Please select a patient');
      return;
    }
    
    if (selectedTherapies.length === 0) {
      toast.error('Please add at least one therapy');
      return;
    }
    
    try {
      setIsGeneratingPdf(true);
      
      // Generate PDF from the invoice
      const pdf = await generatePDF();
      
      // Convert the PDF to a blob
      const pdfBlob = pdf.output('blob');
      
      // Save the invoice PDF to the database
      await manualInvoicesApi.saveManualInvoice(currentInvoice, pdfBlob);
      
      toast.success('Manual invoice created successfully');
      
      // Reset the form
      setSelectedTherapies([]);
      setCurrentInvoice({
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        patient_id: '',
        patient_display_id: '',
        patient_name: '',
        patient_phone: '',
        doctor_id: '',
        discount_amount: 0,
        items: [],
        subtotal: 0,
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0,
        notes: '',
        description: ''
      });
      
      // Switch to the list tab
      setActiveTab('list');
      
      // Reload the list of manual invoices
      await loadManualInvoices();
    } catch (error) {
      console.error('Error creating manual invoice:', error);
      toast.error('Failed to create manual invoice');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate PDF from the invoice
  const generatePDF = async () => {
    // Get the invoice content
    const invoiceElement = invoiceRef.current;
    
    // Add text elements programmatically
    const pdf = new jsPDF({
      orientation: 'portrait', 
      unit: 'mm',
      format: 'a4'
    });
    
    // Define PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // mm
    const contentWidth = pdfWidth - (margin * 2);
    
    // Define starting position
    let yPos = margin;
    
    // Business Information - Header
    const businessName = settings?.business_name || 'Spring Physiotherapy';
    const businessAddress = settings?.business_address || '123 Main St, City';
    const businessPhone = settings?.business_phone || '';
    const businessEmail = settings?.business_email || '';
    
    // Add logo if available
    if (settings?.logo_url) {
      const logoImg = new Image();
      logoImg.src = settings?.logo_url;
      
      // Wait for the image to load
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve; // Continue even if logo fails to load
      });
      
      // Add logo centered at the top
      try {
        const logoWidth = 30; // mm
        const logoHeight = (logoWidth * logoImg.height) / logoImg.width;
        const logoX = (pdfWidth - logoWidth) / 2;
        
        pdf.addImage(logoImg, 'PNG', logoX, yPos, logoWidth, logoHeight);
        yPos += logoHeight + 5; // Add space after logo
      } catch (e) {
        console.error('Error adding logo:', e);
        // Continue without logo
      }
    }
    
    // Add business name and address
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(businessName, pdfWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(businessAddress, pdfWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    // Add contact info if available
    if (businessPhone || businessEmail) {
      const contactInfo = [];
      if (businessPhone) contactInfo.push(`Phone: ${businessPhone}`);
      if (businessEmail) contactInfo.push(`Email: ${businessEmail}`);
      
      pdf.text(contactInfo.join(' | '), pdfWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    } else {
      yPos += 5;
    }
    
    // Add a separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pdfWidth - margin, yPos);
    yPos += 5;
    
    // Invoice Details - Grid layout
    pdf.setDrawColor(150, 150, 150);
    pdf.setFillColor(250, 250, 250);
    
    // Customer details (left side)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', margin, yPos + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(currentInvoice.patient_name || 'Patient Name', margin, yPos + 10);
    pdf.text(currentInvoice.patient_phone || 'Phone', margin, yPos + 15);
    if (currentInvoice.patient_display_id) {
      pdf.text(`ID: ${currentInvoice.patient_display_id}`, margin, yPos + 20);
    }
    
    // Invoice details (right side)
    const invoiceDate = format(new Date(currentInvoice.invoice_date), 'MMM dd, yyyy');
    const invoiceNumber = `Invoice #: ${currentInvoice.invoice_number || 'MINV-XXXXXXXX'}`;
    const paymentStatus = currentInvoice.status === 'paid' ? 'PAID' : 
                         currentInvoice.status === 'partially_paid' ? 'PARTIALLY PAID' : 'DUE';
    
    pdf.text(`Date: ${invoiceDate}`, pdfWidth - margin, yPos + 5, { align: 'right' });
    pdf.text(invoiceNumber, pdfWidth - margin, yPos + 10, { align: 'right' });
    
    // Add payment status
    pdf.setFontSize(12);
    pdf.setTextColor(0, 150, 0); // Green for payment status
    pdf.setFont('helvetica', 'bold');
    pdf.text(paymentStatus, pdfWidth - margin, yPos + 20, { align: 'right' });
    pdf.setTextColor(0, 0, 0); // Reset text color
    
    yPos += 30; // Move down after customer and invoice info
    
    // Items Table
    const tableTop = yPos;
    const tableHeadHeight = 8;
    const tableRowHeight = 8;
    const colWidths = {
      item: contentWidth * 0.45,
      qty: contentWidth * 0.1,
      days: contentWidth * 0.1,
      price: contentWidth * 0.15,
      total: contentWidth * 0.2
    };
    
    // Table Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos, contentWidth, tableHeadHeight, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    let xPos = margin;
    pdf.text('Item', xPos + 2, yPos + 5.5);
    xPos += colWidths.item;
    
    pdf.text('Qty', xPos + 2, yPos + 5.5, { align: 'center' });
    xPos += colWidths.qty;
    
    pdf.text('Days', xPos + 2, yPos + 5.5, { align: 'center' });
    xPos += colWidths.days;
    
    pdf.text('Price', xPos + 2, yPos + 5.5, { align: 'right' });
    xPos += colWidths.price;
    
    pdf.text('Total', xPos + colWidths.total - 2, yPos + 5.5, { align: 'right' });
    
    yPos += tableHeadHeight;
    
    // Table Rows
    pdf.setFont('helvetica', 'normal');
    
    if (selectedTherapies.length === 0) {
      // No items
      pdf.setFontSize(9);
      pdf.text('No items added', pdfWidth / 2, yPos + 5, { align: 'center' });
      yPos += tableRowHeight;
    } else {
      // Add each therapy item
      for (const therapy of selectedTherapies) {
        // Check if we need a new page
        if (yPos > pdfHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }
        
        xPos = margin;
        
        // Item name
        pdf.text(therapy.name, xPos + 2, yPos + 5);
        xPos += colWidths.item;
        
        // Quantity
        pdf.text(therapy.quantity.toString(), xPos + (colWidths.qty / 2), yPos + 5, { align: 'center' });
        xPos += colWidths.qty;
        
        // Days
        pdf.text(therapy.days.toString(), xPos + (colWidths.days / 2), yPos + 5, { align: 'center' });
        xPos += colWidths.days;
        
        // Price
        const priceText = `${settings?.currency || '৳'} ${therapy.price}`;
        pdf.text(priceText, xPos + colWidths.price - 2, yPos + 5, { align: 'right' });
        xPos += colWidths.price;
        
        // Total
        const totalText = `${settings?.currency || '৳'} ${therapy.total_price}`;
        pdf.text(totalText, xPos + colWidths.total - 2, yPos + 5, { align: 'right' });
        
        yPos += tableRowHeight;
        
        // Add a light separator line
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, yPos, margin + contentWidth, yPos);
      }
    }
    
    // Table bottom line
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 5;
    
    // Summary section
    const summaryWidth = contentWidth * 0.4;
    const summaryX = pdfWidth - margin - summaryWidth;
    
    // Summary Rows
    pdf.text('Subtotal:', summaryX, yPos + 5);
    pdf.text(`${settings?.currency || '৳'} ${currentInvoice.subtotal}`, pdfWidth - margin, yPos + 5, { align: 'right' });
    yPos += 7;
    
    // Discount, if any
    if (currentInvoice.discount_amount > 0) {
      pdf.setTextColor(255, 0, 0); // Red for discount
      pdf.text('Discount:', summaryX, yPos + 5);
      pdf.text(`- ${settings?.currency || '৳'} ${currentInvoice.discount_amount}`, pdfWidth - margin, yPos + 5, { align: 'right' });
      pdf.setTextColor(0, 0, 0); // Reset text color
      yPos += 7;
    }
    
    // Total
    pdf.setDrawColor(200, 200, 200);
    pdf.line(summaryX, yPos, pdfWidth - margin, yPos);
    yPos += 5;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', summaryX, yPos + 5);
    pdf.text(`${settings?.currency || '৳'} ${currentInvoice.total_amount}`, pdfWidth - margin, yPos + 5, { align: 'right' });
    yPos += 7;
    
    // Paid amount
    if (currentInvoice.paid_amount > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 150, 0); // Green for paid amount
      pdf.text('Paid Amount:', summaryX, yPos + 5);
      pdf.text(`${settings?.currency || '৳'} ${currentInvoice.paid_amount}`, pdfWidth - margin, yPos + 5, { align: 'right' });
      pdf.setTextColor(0, 0, 0); // Reset text color
      yPos += 7;
    }
    
    // Due amount
    if (currentInvoice.due_amount > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 0, 0); // Red for due amount
      pdf.text('Due Amount:', summaryX, yPos + 5);
      pdf.text(`${settings?.currency || '৳'} ${currentInvoice.due_amount}`, pdfWidth - margin, yPos + 5, { align: 'right' });
      pdf.setTextColor(0, 0, 0); // Reset text color
      yPos += 10;
    }
    
    // Notes
    if (currentInvoice.notes) {
      // Check if we need a new page
      if (yPos > pdfHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }
      
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, yPos, margin + contentWidth, yPos);
      yPos += 5;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes:', margin, yPos + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(currentInvoice.notes, margin, yPos + 12);
      yPos += 20;
    }
    
    // Footer
    // Check if we need a new page
    if (yPos > pdfHeight - 30) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pdfHeight - 25, pdfWidth - margin, pdfHeight - 25);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This invoice does not affect patient records or billing system.', pdfWidth / 2, pdfHeight - 18, { align: 'center' });
    pdf.text('Thank you for your business!', pdfWidth / 2, pdfHeight - 12, { align: 'center' });
    
    return pdf;
  };

  // Handle downloading the invoice
  const handleDownloadInvoice = async (invoice) => {
    try {
      setLoading(true);
      const downloadUrl = await manualInvoicesApi.getManualInvoiceDownloadUrl(invoice.file_path);
      
      // Create an anchor element for downloading
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = invoice.file_name || 'manual-invoice.pdf';
      link.target = '_blank';
      
      // Append to the body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Error downloading invoice: ' + error.message);
      toast.error('Failed to download invoice');
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    try {
      setLoadingInvoices(true);
      await manualInvoicesApi.deleteManualInvoice(id);
      toast.success('Invoice deleted successfully');
      
      // Reload the list of manual invoices
      await loadManualInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Render patient search results
  const renderPatientSearchResults = () => {
    if (searchTerm && filteredPatients.length > 0) {
      return (
        <div className="absolute z-10 w-full max-w-md bg-white rounded-md shadow-lg border border-gray-200 mt-1 max-h-60 overflow-y-auto">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => handlePatientSelect(patient)}
            >
              <FaIdCard className="text-blue-500" />
              <div>
                <p className="font-medium text-gray-800">{patient.name}</p>
                <p className="text-sm text-gray-500">{patient.phone}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render selected patient info
  const renderSelectedPatientInfo = () => {
    if (!currentInvoice.patient_name) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Selected Patient</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name:</p>
            <p className="font-medium">{currentInvoice.patient_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ID:</p>
            <p className="font-medium">{currentInvoice.patient_display_id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone:</p>
            <p className="font-medium">{currentInvoice.patient_phone || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  // Render the invoice list tab
  const renderInvoiceList = () => {
    return (
      <div>
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Filter Invoices</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={loadManualInvoices}
              >
                <FaFilter className="inline mr-2" /> Apply Filter
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Manual Invoices</h2>
          </div>

          {loadingInvoices ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : manualInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No manual invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {manualInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-blue-600">{invoice.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        {invoice.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="px-3 py-1 mr-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 focus:outline-none"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={loadingInvoices}
                        >
                          <FaDownload className="inline mr-1" /> Download
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          disabled={loadingInvoices}
                        >
                          <FaTrash className="inline mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manual Invoice</h1>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('create')}
          >
            Create Invoice
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('list')}
          >
            View Invoices
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        renderInvoiceList()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
                <h2 className="text-2xl font-bold text-white">Manual Invoice Details</h2>
                <p className="text-blue-100 mt-1">This invoice will only be saved as a PDF and won't affect patient records</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for patient by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <FaSearch className="absolute right-3 top-3 text-gray-400" />
                    {renderPatientSearchResults()}
                  </div>
                  {renderSelectedPatientInfo()}
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={currentInvoice.invoice_date}
                      onChange={(e) => setCurrentInvoice(prev => ({ ...prev, invoice_date: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <div className="relative">
                    <select
                      value={currentInvoice.doctor_id || ''} // Ensure value is never null
                      onChange={(e) => setCurrentInvoice(prev => ({ ...prev, doctor_id: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="">Select a doctor (Optional)</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} ({doctor.specialization})
                        </option>
                      ))}
                    </select>
                    <FaUserMd className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Optional description for this manual invoice"
                    value={currentInvoice.description || ''}
                    onChange={(e) => setCurrentInvoice(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    rows="2"
                  />
                </div>
                
                {/* Therapy Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Therapies</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Therapy</label>
                    <select
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                      onChange={(e) => {
                        const therapy = therapyTypes.find(t => t.id === e.target.value);
                        if (therapy) handleTherapySelection(therapy);
                      }}
                      value=""
                    >
                      <option value="" disabled>Select a therapy...</option>
                      {therapyTypes.map(therapy => (
                        <option key={therapy.id} value={therapy.id}>
                          {therapy.name} - {settings?.currency || '৳'} {therapy.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Therapies */}
                  <div className="space-y-4">
                    {selectedTherapies.map((therapy, index) => (
                      <div key={`${therapy.id}-${index}`} className="p-4 border-2 border-gray-100 rounded-xl">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-800">{therapy.name}</h4>
                          <div className="text-gray-600 text-sm">
                            Unit Price: {settings?.currency || '৳'} {therapy.price}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity:</label>
                            <input
                              type="number"
                              value={therapy.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Days:</label>
                            <input
                              type="number"
                              value={therapy.days}
                              onChange={(e) => handleDaysChange(index, e.target.value)}
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="block text-sm font-medium text-gray-700">Discount:</label>
                          <input
                            type="number"
                            value={therapy.discount_amount}
                            onChange={(e) => handleDiscountChange(index, parseFloat(e.target.value))}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                            min="0"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div className="font-medium text-gray-800">
                            Total: {settings?.currency || '৳'} {therapy.total_price}
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            onClick={() => handleRemoveTherapy(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border-t-2 border-gray-100 pt-6">
                  <div className="max-w-md ml-auto space-y-4 bg-gray-50 p-6 rounded-xl">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">{settings?.currency || 'BDT'} {currentInvoice.subtotal}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">Discount:</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={currentInvoice.discount_amount || ''}
                          onChange={(e) => {
                            const discount = parseFloat(e.target.value) || 0;
                            const totals = calculateTotals(selectedTherapies);
                            setCurrentInvoice(prev => ({
                              ...prev,
                              discount_amount: discount,
                              total_amount: Math.max(0, totals.subtotal - discount),
                              due_amount: Math.max(0, totals.subtotal - discount - prev.paid_amount)
                            }));
                          }}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                          min="0"
                        />
                        <FaPercent className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex justify-between text-gray-800 font-semibold">
                      <span>Total Amount:</span>
                      <span>{settings?.currency || 'BDT'} {currentInvoice.total_amount}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">Paid Amount:</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={currentInvoice.paid_amount || ''}
                          onChange={(e) => handlePaidAmountChange(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                          min="0"
                        />
                        <FaMoneyBillWave className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
                      <span>Due Amount:</span>
                      <span className="text-red-600">{settings?.currency || '৳'} {currentInvoice.due_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    placeholder="Any additional notes"
                    value={currentInvoice.notes}
                    onChange={(e) => setCurrentInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    rows="2"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={isGeneratingPdf}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPdf ? (
                      <>Generating Invoice...</>
                    ) : (
                      <>
                        <FaPrint className="text-lg" />
                        Generate Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Invoice Preview */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Invoice Preview</h3>
              
              <div ref={invoiceRef} id="invoice-content" className="p-4 border border-gray-200 rounded bg-white">
                {/* Invoice Header */}
                <div className="text-center mb-6">
                  {settings?.logo_url && (
                    <img 
                      src={settings.logo_url} 
                      alt="Business Logo" 
                      className="h-16 mx-auto mb-2" 
                    />
                  )}
                  <h2 className="text-2xl font-bold text-gray-800">
                    {settings?.business_name || 'Spring Physiotherapy'}
                  </h2>
                  <p className="text-gray-600">
                    {settings?.business_address || '123 Main St, City'}
                  </p>
                  <div className="flex justify-center items-center gap-4 mt-2 text-sm text-gray-600">
                    {settings?.business_phone && (
                      <span className="flex items-center gap-1">
                        <FaPhone /> {settings.business_phone}
                      </span>
                    )}
                    {settings?.business_email && (
                      <span className="flex items-center gap-1">
                        <FaEnvelope /> {settings.business_email}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Invoice Title - Removed as requested */}
                {/* DO NOT add any title here - it will be handled in the PDF generation */}
                
                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-700">Bill To:</h4>
                    <p className="font-bold">{currentInvoice.patient_name || 'Patient Name'}</p>
                    <p className="text-gray-600">{currentInvoice.patient_phone || 'Phone'}</p>
                    {currentInvoice.patient_display_id && (
                      <p className="text-gray-600">ID: {currentInvoice.patient_display_id}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p><span className="font-medium">Date:</span> {format(new Date(currentInvoice.invoice_date), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">Invoice #:</span> MINV-{format(new Date(), 'yyyyMMdd')}-XXXX</p>
                    <p className="text-xl font-bold mt-2 text-green-600">
                      {currentInvoice.status === 'paid' ? 'PAID' : currentInvoice.status === 'partially_paid' ? 'PARTIALLY PAID' : 'DUE'}
                    </p>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <table className="w-full mb-6">
                  <thead className="bg-gray-50 border-t border-b border-gray-200">
                    <tr>
                      <th className="py-2 text-left">Item</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-center">Days</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTherapies.length > 0 ? (
                      selectedTherapies.map((therapy, index) => (
                        <tr key={index}>
                          <td className="py-3">{therapy.name}</td>
                          <td className="py-3 text-center">{therapy.quantity}</td>
                          <td className="py-3 text-center">{therapy.days}</td>
                          <td className="py-3 text-right">{settings?.currency || '৳'} {therapy.price}</td>
                          <td className="py-3 text-right">{settings?.currency || '৳'} {therapy.total_price}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">No items added</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Invoice Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{settings?.currency || '৳'} {currentInvoice.subtotal}</span>
                  </div>
                  {currentInvoice.discount_amount > 0 && (
                    <div className="flex justify-between mb-2 text-red-600">
                      <span className="font-medium">Discount:</span>
                      <span>- {settings?.currency || '৳'} {currentInvoice.discount_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                    <span>Total:</span>
                    <span>{settings?.currency || '৳'} {currentInvoice.total_amount}</span>
                  </div>
                  {currentInvoice.paid_amount > 0 && (
                    <div className="flex justify-between mt-2 text-green-600">
                      <span className="font-medium">Paid Amount:</span>
                      <span>{settings?.currency || '৳'} {currentInvoice.paid_amount}</span>
                    </div>
                  )}
                  {currentInvoice.due_amount > 0 && (
                    <div className="flex justify-between font-bold text-red-600 mt-2">
                      <span>Due Amount:</span>
                      <span>{settings?.currency || '৳'} {currentInvoice.due_amount}</span>
                    </div>
                  )}
                </div>
                
                {/* Notes */}
                {currentInvoice.notes && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Notes:</h4>
                    <p className="text-gray-600">{currentInvoice.notes}</p>
                  </div>
                )}
                
                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
                  <p>This invoice does not affect patient records or billing system.</p>
                  <p className="mt-2">Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualInvoice;
