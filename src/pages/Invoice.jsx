import React, { useState, useEffect, useCallback } from 'react';
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
  FaIdCard
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import invoiceApi from '../api/invoiceApi';
import patientApi from '../api/patientApi';
import doctorApi from '../api/doctorApi';
import { settingsApi } from '../api/settingsApi';
import therapyApi from '../api/therapyApi';
import debounce from 'lodash/debounce';

const Invoice = () => {
  const [settings, setSettings] = useState(null);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [discountGivers, setDiscountGivers] = useState([]);
  const [therapyTypes, setTherapyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTherapies, setSelectedTherapies] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState({
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    doctor_id: '',
    discount_giver_id: null,
    discount_amount: 0,
    items: [],
    subtotal: 0,
    total_amount: 0,
    paid_amount: 0,
    due_amount: 0,
    notes: '',
    status: 'unpaid'
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          settingsData,
          doctorsData,
          discountGiversData,
          therapiesData
        ] = await Promise.all([
          settingsApi.getBusinessSettings(),
          doctorApi.getDoctors(),
          settingsApi.getDiscountGivers(),
          therapyApi.getAllTherapies()
        ]);

        if (!settingsData || !doctorsData || !therapiesData) {
          throw new Error('Failed to fetch required data');
        }

        setSettings(settingsData);
        setDoctors(doctorsData.filter(d => d.status === 'active'));
        setDiscountGivers(discountGiversData || []);
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

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
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
    }, 300),
    []
  );

  // Search patients when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handlePatientSelect = (patient) => {
    setCurrentInvoice(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_phone: patient.phone,
      doctor_id: patient.doctor_id || ''
    }));
    setSearchTerm('');
    setFilteredPatients([]);
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
              <div className="flex-1">
                <div className="font-medium text-gray-900">{patient.name}</div>
                <div className="text-sm text-gray-600">{patient.phone}</div>
              </div>
              <button
                className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePatientSelect(patient);
                }}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render selected patient info
  const renderSelectedPatientInfo = () => {
    if (currentInvoice.patient_id && currentInvoice.patient_name) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Selected Patient</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Name:</label>
              <div className="font-medium">{currentInvoice.patient_name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone:</label>
              <div className="font-medium">{currentInvoice.patient_phone}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle therapy selection
  const handleTherapySelection = (therapy) => {
    if (!therapy) return;

    // Check if therapy is already selected
    const existingTherapy = selectedTherapies.find(t => t.therapy_type_id === therapy.id);
    
    if (existingTherapy) {
      // If therapy is already selected, remove it
      const updatedTherapies = selectedTherapies.filter(t => t.therapy_type_id !== therapy.id);
      setSelectedTherapies(updatedTherapies);
      calculateTotals(updatedTherapies);
    } else {
      // If therapy is not selected, add it
      const newTherapy = {
        therapy_type_id: therapy.id,
        therapy_name: therapy.name,
        quantity: 1,
        days: 1,
        unit_price: therapy.price,
        discount_amount: 0,
        total_amount: therapy.price
      };

      const updatedTherapies = [...selectedTherapies, newTherapy];
      setSelectedTherapies(updatedTherapies);
      calculateTotals(updatedTherapies);
    }
  };

  // Handle therapy removal
  const handleRemoveTherapy = (index) => {
    const updatedTherapies = selectedTherapies.filter((_, i) => i !== index);
    setSelectedTherapies(updatedTherapies);
    calculateTotals(updatedTherapies);
  };

  // Handle quantity change
  const handleQuantityChange = (index, quantity) => {
    const updatedTherapies = [...selectedTherapies];
    const therapy = updatedTherapies[index];
    therapy.quantity = quantity;
    therapy.total_amount = (therapy.unit_price * quantity * therapy.days) - (therapy.discount_amount || 0);
    setSelectedTherapies(updatedTherapies);
    calculateTotals(updatedTherapies);
  };

  // Handle days change
  const handleDaysChange = (index, days) => {
    const updatedTherapies = [...selectedTherapies];
    const therapy = updatedTherapies[index];
    therapy.days = days;
    therapy.total_amount = (therapy.unit_price * therapy.quantity * days) - (therapy.discount_amount || 0);
    setSelectedTherapies(updatedTherapies);
    calculateTotals(updatedTherapies);
  };

  // Handle discount change
  const handleDiscountChange = (index, discount) => {
    const updatedTherapies = [...selectedTherapies];
    const therapy = updatedTherapies[index];
    therapy.discount_amount = parseFloat(discount) || 0;
    therapy.total_amount = (therapy.unit_price * therapy.quantity * therapy.days) - therapy.discount_amount;
    setSelectedTherapies(updatedTherapies);
    calculateTotals(updatedTherapies);
  };

  // Handle paid amount change
  const handlePaidAmountChange = (amount) => {
    const paidAmount = parseFloat(amount) || 0;
    setCurrentInvoice(prev => ({
      ...prev,
      paid_amount: paidAmount,
      due_amount: prev.total_amount - paidAmount
    }));
  };

  // Calculate totals
  const calculateTotals = (therapies) => {
    const subtotal = therapies.reduce((sum, therapy) => 
      sum + (therapy.unit_price * therapy.quantity * therapy.days), 0);
    
    // Sum up all therapy discounts
    const totalDiscount = therapies.reduce((sum, therapy) => 
      sum + (parseFloat(therapy.discount_amount) || 0), 0);
    
    const total = subtotal - totalDiscount;
    const due = total - (currentInvoice.paid_amount || 0);

    setCurrentInvoice(prev => ({
      ...prev,
      subtotal,
      discount_amount: totalDiscount,
      total_amount: total,
      due_amount: due
    }));
  };

  // Handle invoice submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!currentInvoice.patient_id) {
        toast.error('Please select a patient');
        return;
      }

      if (selectedTherapies.length === 0) {
        toast.error('Please add at least one therapy');
        return;
      }

      // Format the invoice data
      const invoiceData = {
        ...currentInvoice,
        items: selectedTherapies.map(therapy => ({
          therapy_type_id: therapy.therapy_type_id,
          quantity: therapy.quantity,
          days: therapy.days,
          unit_price: therapy.unit_price,
          discount_amount: therapy.discount_amount || 0,
          total_amount: therapy.total_amount
        }))
      };

      const invoice = await invoiceApi.createInvoice(invoiceData);
      toast.success('Invoice generated successfully');

      // Print the invoice
      const printContent = `
        <html>
        <head>
          <title>Invoice #${invoice.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .business-info {
              margin-bottom: 20px;
            }
            .invoice-details {
              margin-bottom: 20px;
            }
            .patient-info {
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
            .totals {
              float: right;
              width: 300px;
            }
            .totals table {
              margin-top: 20px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 0.9em;
            }
            @media print {
              body { margin: 0; }
              .totals { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="${settings?.business_name || 'Spring Physiotherapy'} Logo" style="max-height: 100px; margin: 0 auto 20px;">` : ''}
            <h1>${settings?.business_name || 'Spring Physiotherapy'}</h1>
            <p>${settings?.address || ''}</p>
            <p>Phone: ${settings?.phone || ''}</p>
            <p>Email: ${settings?.email || ''}</p>
          </div>

          <div class="invoice-details">
            <h2>Invoice</h2>
            <p><strong>Invoice Date:</strong> ${format(new Date(currentInvoice.invoice_date), 'MMMM dd, yyyy')}</p>
            <p><strong>Invoice Number:</strong> #${invoice.id.slice(0, 8)}</p>
          </div>

          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${currentInvoice.patient_name}</p>
            <p><strong>Phone:</strong> ${currentInvoice.patient_phone}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Therapy</th>
                <th>Quantity</th>
                <th>Days</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedTherapies.map(therapy => `
                <tr>
                  <td>${therapy.therapy_name}</td>
                  <td>${therapy.quantity}</td>
                  <td>${therapy.days}</td>
                  <td>${settings?.currency || '৳'} ${therapy.unit_price.toFixed(2)}</td>
                  <td>${settings?.currency || '৳'} ${(therapy.discount_amount || 0).toFixed(2)}</td>
                  <td>${settings?.currency || '৳'} ${therapy.total_amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td>${settings?.currency || '৳'} ${currentInvoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total Discount:</strong></td>
                <td>${settings?.currency || '৳'} ${currentInvoice.discount_amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td>${settings?.currency || '৳'} ${currentInvoice.total_amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Paid Amount:</strong></td>
                <td>${settings?.currency || '৳'} ${currentInvoice.paid_amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Due Amount:</strong></td>
                <td>${settings?.currency || '৳'} ${currentInvoice.due_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for being with us!</p>
            <p>${settings?.business_name || 'Spring Physiotherapy'}</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      printWindow.onload = function() {
        printWindow.print();
        // Close the print window after printing (optional)
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      };
      
      // Reset form
      setCurrentInvoice({
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        patient_id: '',
        patient_name: '',
        patient_phone: '',
        doctor_id: '',
        discount_giver_id: null,
        discount_amount: 0,
        items: [],
        subtotal: 0,
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0,
        notes: '',
        status: 'unpaid'
      });
      setSelectedTherapies([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        {/* Business Information Header */}
        {settings && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Business Logo" 
                    className="h-24 w-24 object-contain bg-white rounded-lg p-2"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold">{settings.business_name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <FaBuilding className="text-white/80" />
                    <p className="text-white/90">{settings.address}</p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2 justify-end">
                  <FaPhone className="text-white/80" />
                  <p>{settings.phone}</p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <FaEnvelope className="text-white/80" />
                  <p>{settings.email}</p>
                </div>
                {settings.website && (
                  <div className="flex items-center gap-2 justify-end">
                    <FaGlobe className="text-white/80" />
                    <p>{settings.website}</p>
                  </div>
                )}
                {settings.tax_id && (
                  <div className="flex items-center gap-2 justify-end">
                    <FaIdCard className="text-white/80" />
                    <p>Tax ID: {settings.tax_id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-b-2xl p-8">
          {/* Invoice Details Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Patient Search Section */}
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <FaUserMd className="text-blue-600" />
                  Patient Information
                </h2>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patient by name or phone"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <FaSearch className="absolute left-3 top-3.5 text-blue-400" />
                  </div>
                  
                  {renderPatientSearchResults()}
                  {renderSelectedPatientInfo()}
                </div>
              </div>
            </div>

            {/* Invoice Details Section */}
            <div className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-600" />
                  Invoice Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={currentInvoice.invoice_date}
                      onChange={(e) => setCurrentInvoice(prev => ({
                        ...prev,
                        invoice_date: e.target.value
                      }))}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Doctor</label>
                    <select
                      value={currentInvoice.doctor_id}
                      onChange={(e) => setCurrentInvoice(prev => ({
                        ...prev,
                        doctor_id: e.target.value
                      }))}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Discount Giver</label>
                    <select
                      value={currentInvoice.discount_giver_id || ''}
                      onChange={(e) => setCurrentInvoice(prev => ({
                        ...prev,
                        discount_giver_id: e.target.value || null
                      }))}
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select Discount Giver</option>
                      {discountGivers.map(giver => (
                        <option key={giver.id} value={giver.id}>
                          {giver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Therapy Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FaCheckCircle className="text-green-600" />
              Select Therapies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {therapyTypes.map(therapy => {
                const isSelected = selectedTherapies.some(t => t.therapy_type_id === therapy.id);
                return (
                  <div
                    key={therapy.id}
                    className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                      isSelected
                        ? 'border-2 border-green-500 bg-green-50 shadow-lg transform scale-[1.02]'
                        : 'border-2 border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    <div 
                      className="p-4 cursor-pointer relative"
                      onClick={() => handleTherapySelection(therapy)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-500 scale-110'
                            : 'border-gray-300 group-hover:border-green-300'
                        }`}>
                          {isSelected && (
                            <FaCheckCircle className="text-white text-sm animate-scale-in" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium transition-colors ${
                            isSelected ? 'text-green-700' : 'text-gray-900'
                          }`}>{therapy.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{therapy.description}</p>
                          <p className={`text-lg font-semibold mt-2 transition-colors ${
                            isSelected ? 'text-green-600' : 'text-gray-700'
                          }`}>
                            {settings?.currency || 'BDT'} {therapy.price}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="text-green-500 bg-green-50 rounded-full p-1">
                            <FaCheckCircle className="text-lg" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Therapy Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FaCheckCircle className="text-green-600" />
              Therapy Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTherapies.map((therapy, index) => (
                <div
                  key={therapy.therapy_type_id}
                  className="bg-white shadow-lg rounded-xl p-4"
                >
                  <h3 className="font-medium text-gray-900">{therapy.therapy_name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700">Sessions:</label>
                    <input
                      type="number"
                      value={therapy.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                      min="1"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700">Days:</label>
                    <input
                      type="number"
                      value={therapy.days}
                      onChange={(e) => handleDaysChange(index, parseInt(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                      min="1"
                    />
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
                  <div className="flex justify-end mt-4">
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
                    onChange={(e) => setCurrentInvoice(prev => ({
                      ...prev,
                      discount_amount: parseFloat(e.target.value) || 0
                    }))}
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

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 text-sm"
            >
              <FaPrint />
              Generate Invoice
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Invoice;
