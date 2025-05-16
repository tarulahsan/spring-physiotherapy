import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInYears, isValid } from 'date-fns';
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaIdCard, FaCalendarAlt, FaNotesMedical,
  FaArrowLeft, FaComments, FaClinicMedical,
  FaChevronLeft, FaChevronRight, FaClock,
  FaMoneyBillWave, FaReceipt, FaUserMd,
  FaHandHoldingUsd, FaUserShield
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import patientApi from '../api/patientApi';
import invoiceApi from '../api/invoiceApi';
import doctorApi from '../api/doctorApi';
import { getPatientTherapyHistory, getAvailableTherapies } from '../api/dailyRecords';
import { supabase } from '../lib/supabase';

const PaymentModal = ({ invoice, onClose, onConfirm }) => {
  const [paymentAmount, setPaymentAmount] = useState(invoice.due_amount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }
    if (paymentAmount > invoice.due_amount) {
      toast.error('Payment amount cannot exceed due amount');
      return;
    }
    onConfirm(paymentAmount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Total Amount: <span className="font-medium">৳{invoice.total_amount.toLocaleString()}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Due Amount: <span className="font-medium">৳{invoice.due_amount.toLocaleString()}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <input
              type="number"
              step="0.01"
              max={invoice.due_amount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientProfile = () => {
  console.log('PatientProfile component rendering...');

  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapyHistory, setTherapyHistory] = useState({ records: [], totalPages: 1, currentPage: 1 });
  const [availableTherapies, setAvailableTherapies] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTherapies, setLoadingTherapies] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [formData, setFormData] = useState({}); // State for form data during edit
  const [isSaving, setIsSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [discountGivers, setDiscountGivers] = useState([]);
  const [referrers, setReferrers] = useState([]);

  // Simple function to get age from date of birth - matching DailyRecords implementation
  const getPatientAge = (dob) => {
    if (!dob) return null;
    try {
      // First try ISO format
      let birthDate = parseISO(dob);
      
      // If that fails, try direct Date constructor
      if (isNaN(birthDate.getTime())) {
        birthDate = new Date(dob);
      }
      
      // If valid date now, calculate age
      if (!isNaN(birthDate.getTime())) {
        return differenceInYears(new Date(), birthDate);
      }
      return null;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const loadPatient = async () => {
    console.log(`loadPatient called for ID: ${id}`);
    try {
      setLoading(true);
      setError(null);
      const data = await patientApi.getPatientById(id);
      console.log('Patient data fetched from API:', data);
      
      if (!data) {
        throw new Error('Patient not found');
      }
      
      // Process patient data to ensure all required fields exist
      const processedPatient = {
        ...data,
        diagnosis: data.diagnosis || '', // Ensure diagnosis exists
      };
      
      // Explicitly process age information
      console.log('Processing age information');
      console.log('Original age:', processedPatient.age);
      console.log('Original DOB:', processedPatient.date_of_birth);
      
      // If age is not present or invalid, but date_of_birth is available, calculate age
      if (processedPatient.date_of_birth) {
        const calculatedAge = getPatientAge(processedPatient.date_of_birth);
        console.log('Calculated age from DOB:', calculatedAge);
        
        // Only override age if it's not already valid
        if (!processedPatient.age || processedPatient.age === '0' || processedPatient.age === 'N/A') {
          if (calculatedAge !== null) {
            processedPatient.age = calculatedAge.toString();
            console.log('Setting calculated age:', processedPatient.age);
          }
        }
      }
      
      // Log final processed patient
      console.log('Final processed patient:', processedPatient);
      
      // Update state with processed patient data
      setPatient(processedPatient);
      setFormData({
        ...processedPatient,
        date_of_birth: processedPatient.date_of_birth ? format(parseISO(processedPatient.date_of_birth), 'yyyy-MM-dd') : ''
      });
      
      await Promise.all([
        loadTherapyHistory(1),
        loadAvailableTherapiesForPatient(),
        loadInvoices()
      ]);
    } catch (err) {
      console.error('Error loading patient:', err);
      setError(err.message || 'Failed to load patient details');
      toast.error('Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const { data } = await invoiceApi.getInvoices(id);
      setInvoices(data || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
      toast.error('Failed to load invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handlePaymentClick = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePaymentConfirm = async (amount) => {
    try {
      await invoiceApi.recordPayment(selectedInvoice.id, amount);
      toast.success('Payment recorded successfully');
      setSelectedInvoice(null);
      loadInvoices(); // Refresh invoice data
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment: ' + error.message);
    }
  };

  const loadTherapyHistory = async (page) => {
    try {
      setLoadingHistory(true);
      const history = await getPatientTherapyHistory(id, page);
      setTherapyHistory(history);
    } catch (err) {
      console.error('Error loading therapy history:', err);
      toast.error('Failed to load therapy history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAvailableTherapiesForPatient = async () => {
    try {
      setLoadingTherapies(true);
      const today = new Date().toISOString().split('T')[0];
      const therapies = await getAvailableTherapies(id, today);
      setAvailableTherapies(therapies);
    } catch (err) {
      console.error('Error loading available therapies:', err);
      toast.error('Failed to load available therapies');
    } finally {
      setLoadingTherapies(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getDoctors();
      setDoctors(data || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const loadDiscountGivers = async () => {
    try {
      const { data } = await supabase
        .from('discount_givers')
        .select('*')
        .order('name');
      setDiscountGivers(data || []);
    } catch (err) {
      console.error('Error loading discount givers:', err);
    }
  };

  const loadReferrers = async () => {
    try {
      const { data } = await supabase
        .from('referrers')
        .select('*')
        .order('name');
      setReferrers(data || []);
    } catch (err) {
      console.error('Error loading referrers:', err);
    }
  };
  
  // Load all required data when the component mounts
  useEffect(() => {
    loadPatient();
    loadDoctors();
    loadDiscountGivers();
    loadReferrers();
  }, [id]);

  // Debug effect to log relationship data when it changes
  useEffect(() => {
    if (patient && doctors.length && discountGivers.length && referrers.length) {
      console.log('Patient has relationships:', { 
        primary_doctor_id: patient.primary_doctor_id, 
        discount_giver_id: patient.discount_giver_id, 
        referrer_id: patient.referrer_id 
      });
      console.log('Doctor match:', doctors.find(d => d.id === patient.primary_doctor_id));
      console.log('Discount Giver match:', discountGivers.find(d => d.id === patient.discount_giver_id));
      console.log('Referrer match:', referrers.find(r => r.id === patient.referrer_id));
    }
  }, [patient, doctors, discountGivers, referrers]);

  const handleEditClick = () => {
    setFormData({ ...patient, date_of_birth: patient?.date_of_birth ? format(parseISO(patient.date_of_birth), 'yyyy-MM-dd') : '' }); // Initialize form data, format date
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({}); // Clear form data or reset to original if needed
  };

  const handleSaveClick = async () => {
    try {
      setIsSaving(true);

      // Check for required fields
      if (!formData.name) {
        toast.error('Patient name is required');
        setIsSaving(false);
        return;
      }

      // Log what we're sending to the API
      console.log('Updating patient with data:', formData);
      
      const { error } = await patientApi.updatePatient(patient.id, {
        name: formData.name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        medical_history: formData.medical_history,
        diagnosis: formData.diagnosis,
        remarks: formData.remarks,
        primary_doctor_id: formData.primary_doctor_id || null,
        discount_giver_id: formData.discount_giver_id || null,
        referrer_id: formData.referrer_id || null
      });

      if (error) {
        toast.error(`Failed to update: ${error.message}`);
      } else {
        // Update the patient state with the form data
        setPatient({ ...patient, ...formData });
        toast.success('Patient information updated successfully');
        setIsEditing(false);
        
        // Force reload to ensure we get the latest data
        loadPatient();
      }
    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // Handle potential number conversion if needed in the future
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    console.log('PatientProfile useEffect triggered.');
    if (id) {
      console.log(`PatientProfile useEffect - ID found: ${id}. Calling loadPatient.`);
      loadPatient();
    } else {
      console.log('PatientProfile useEffect - No ID found.');
    }
  }, [id]);

  console.log('Patient state before render:', patient); // Log the patient state just before rendering

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-red-500 text-lg mb-3 font-semibold">{error}</div>
        <button 
          onClick={loadPatient}
          className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-[50vh] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-gray-500 text-lg font-semibold">No patient data available</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-3 px-4 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <FaArrowLeft className="mr-2 transform -translate-x-1 group-hover:translate-x-0 transition-transform" />
          Back
        </button>

        <div className="grid gap-3">
          {/* Main Content Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.01] transition-all duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 transform -skew-y-6"></div>
              <div className="relative flex items-center space-x-3">
                <div className="bg-white p-2 rounded-xl shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
                  <FaUser className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-transparent bg-clip-text" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{patient.name}</h1>
                  <p className="text-blue-100 flex items-center">
                    <FaIdCard className="mr-1.5" />
                    {patient.patient_id}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Basic Info Grid - Conditionally Rendered */}
              <div className="pt-2">
                {/* Patient Information Section in Beautiful 3D Cards */}
                <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
            {/* Patient ID Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-teal-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-teal-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-teal-100 rounded-lg mr-3 shadow-sm">
                  <FaIdCard className="text-teal-600" />
                </div>
                Patient ID
              </dt>
              <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                {patient.patient_id || 'N/A'}
              </dd>
            </div>

            {/* Gender Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-pink-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-pink-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-pink-100 rounded-lg mr-3 shadow-sm">
                  <FaUser className="text-pink-600" />
                </div>
                Gender
              </dt>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {patient.gender || 'N/A'}
                </dd>
              )}
            </div>

            {/* Date of Birth Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-orange-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-orange-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-orange-100 rounded-lg mr-3 shadow-sm">
                  <FaCalendarAlt className="text-orange-600" />
                </div>
                Date of Birth / Age
              </dt>
              {isEditing ? (
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-2 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                />
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {/* IMPORTANT: Using the EXACT same code as in DailyRecords.jsx for showing age */}
                  {(() => {
                    // Add debug logging to diagnose the issue
                    console.log('Patient data in age display:', { 
                      patientAge: patient?.age, 
                      dob: patient?.date_of_birth,
                      calculatedAge: patient?.date_of_birth ? getPatientAge(patient.date_of_birth) : null
                    });
                    
                    // Use EXACTLY the same logic as DailyRecords.jsx
                    const age = patient?.age && patient.age !== '0' && patient.age !== 'N/A' 
                      ? `${patient.age} yrs`
                      : patient?.date_of_birth 
                        ? `${getPatientAge(patient.date_of_birth) || 'N/A'} yrs` 
                        : 'N/A';
                      
                    console.log('Final age display:', age);
                    return age;
                  })()}
                  
                  {/* Show date of birth if available */}
                  {patient?.date_of_birth && (
                    <span className="text-gray-500 ml-2">
                      (DoB: {(() => {
                        try {
                          return format(parseISO(patient.date_of_birth), 'MMM dd, yyyy');
                        } catch (e) {
                          console.error('Error formatting date:', e);
                          return patient.date_of_birth;
                        }
                      })()})
                    </span>
                  )}
                </dd>
              )}
            </div>

            {/* Phone Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-green-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-green-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-green-100 rounded-lg mr-3 shadow-sm">
                  <FaPhone className="text-green-600" />
                </div>
                Phone
              </dt>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-2 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                  placeholder="Phone Number"
                />
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {patient.phone || 'N/A'}
                </dd>
              )}
            </div>

            {/* Email Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-purple-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-purple-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-purple-100 rounded-lg mr-3 shadow-sm">
                  <FaEnvelope className="text-purple-600" />
                </div>
                Email
              </dt>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-2 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                  placeholder="Email Address"
                />
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {patient.email || 'N/A'}
                </dd>
              )}
            </div>

            {/* Assigned Doctor Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-blue-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 shadow-sm">
                  <FaUserMd className="text-blue-600" />
                </div>
                Assigned Doctor
              </dt>
              {isEditing ? (
                <select
                  name="primary_doctor_id"
                  value={formData.primary_doctor_id || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {doctors.find(d => d.id === patient.primary_doctor_id)?.name || 'N/A'}
                </dd>
              )}
            </div>
            
            {/* Discount Giver Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-yellow-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-yellow-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3 shadow-sm">
                  <FaHandHoldingUsd className="text-yellow-600" />
                </div>
                Discount Giver
              </dt>
              {isEditing ? (
                <select
                  name="discount_giver_id"
                  value={formData.discount_giver_id || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                >
                  <option value="">Select Discount Giver</option>
                  {discountGivers.map(discountGiver => (
                    <option key={discountGiver.id} value={discountGiver.id}>{discountGiver.name}</option>
                  ))}
                </select>
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {discountGivers.find(d => d.id === patient.discount_giver_id)?.name || 'N/A'}
                </dd>
              )}
            </div>
            
            {/* Referrer Card - 3D Styled */}
            <div className="bg-gradient-to-br from-white to-indigo-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-indigo-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg mr-3 shadow-sm">
                  <FaUserShield className="text-indigo-600" />
                </div>
                Referrer
              </dt>
              {isEditing ? (
                <select
                  name="referrer_id"
                  value={formData.referrer_id || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-inner"
                >
                  <option value="">Select Referrer</option>
                  {referrers.map(referrer => (
                    <option key={referrer.id} value={referrer.id}>{referrer.name}</option>
                  ))}
                </select>
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {referrers.find(r => r.id === patient.referrer_id)?.name || 'N/A'}
                </dd>
              )}
            </div>

            {/* Address Card - 3D Styled */}
            <div className="md:col-span-2 bg-gradient-to-br from-white to-red-50 p-5 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-red-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-full -mt-8 -mr-8 opacity-50"></div>
              <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                <div className="p-2 bg-red-100 rounded-lg mr-3 shadow-sm">
                  <FaMapMarkerAlt className="text-red-600" />
                </div>
                Address
              </dt>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-4 pr-4 py-2 text-base bg-white/80 border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 sm:text-sm rounded-lg shadow-inner"
                  placeholder="Full Address"
                />
              ) : (
                <dd className="text-base font-semibold text-gray-900 bg-white/80 p-2 rounded-lg shadow-inner border border-gray-100">
                  {patient.address || 'N/A'}
                </dd>
              )}
            </div>
          </div>

          {/* Medical Notes Section with 3D Effect */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Medical Notes</h3>
            
            <div className="space-y-6">
              {/* Medical History - 3D Card */}
              <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-blue-100">
                <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FaNotesMedical className="text-blue-600" />
                  </div>
                  Medical History
                </dt>
                {isEditing ? (
                  <textarea
                    name="medical_history"
                    value={formData.medical_history || ''}
                    onChange={handleInputChange}
                    className="mt-2 block w-full pl-4 pr-4 py-3 text-base border-0 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm rounded-lg shadow-inner min-h-[150px] resize-none"
                    placeholder="Relevant medical history"
                  />
                ) : (
                  <dd className="mt-2 text-sm text-gray-800 whitespace-pre-wrap bg-white/80 p-4 rounded-lg shadow-inner">{patient.medical_history || 'No medical history recorded.'}</dd>
                )}
              </div>

              {/* Diagnosis - 3D Card */}
              <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-green-100">
                <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <FaClinicMedical className="text-green-600" />
                  </div>
                  Diagnosis
                </dt>
                {isEditing ? (
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis || ''}
                    onChange={handleInputChange}
                    className="mt-2 block w-full pl-4 pr-4 py-3 text-base border-0 bg-white/80 focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm rounded-lg shadow-inner min-h-[150px] resize-none"
                    placeholder="Diagnosis details"
                  />
                ) : (
                  <dd className="mt-2 text-sm text-gray-800 whitespace-pre-wrap bg-white/80 p-4 rounded-lg shadow-inner">{patient.diagnosis || 'No diagnosis recorded.'}</dd>
                )}
              </div>

              {/* Remarks - 3D Card */}
              <div className="bg-gradient-to-br from-white to-amber-50 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-amber-100">
                <dt className="text-base font-semibold text-gray-700 flex items-center mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <FaComments className="text-amber-600" />
                  </div>
                  Remarks
                </dt>
                {isEditing ? (
                  <textarea
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleInputChange}
                    className="mt-2 block w-full pl-4 pr-4 py-3 text-base border-0 bg-white/80 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm rounded-lg shadow-inner min-h-[150px] resize-none"
                    placeholder="Additional remarks"
                  />
                ) : (
                  <dd className="mt-2 text-sm text-gray-800 whitespace-pre-wrap bg-white/80 p-4 rounded-lg shadow-inner">{patient.remarks || 'No remarks recorded.'}</dd>
                )}
              </div>
            </div>
          </div>



              </div>
            </div>
          </div>

          {/* Therapy History Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FaClinicMedical className="mr-2" />
                Recent Therapies
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadTherapyHistory(therapyHistory.currentPage - 1)}
                  disabled={therapyHistory.currentPage === 1 || loadingHistory}
                  className="p-1 text-white opacity-75 hover:opacity-100 disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-white text-sm">
                  {therapyHistory.currentPage} / {therapyHistory.totalPages}
                </span>
                <button
                  onClick={() => loadTherapyHistory(therapyHistory.currentPage + 1)}
                  disabled={therapyHistory.currentPage === therapyHistory.totalPages || loadingHistory}
                  className="p-1 text-white opacity-75 hover:opacity-100 disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>

            {/* Active Therapies Table */}
            <div className="p-3 border-b border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Therapy</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">Total Days</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">Remaining</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Price/Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTherapies ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center">
                          <div className="animate-spin inline-block w-6 h-6 border-t-2 border-b-2 border-teal-500 rounded-full"></div>
                        </td>
                      </tr>
                    ) : availableTherapies.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">
                          No active therapy packages
                        </td>
                      </tr>
                    ) : (
                      availableTherapies.map((therapy) => (
                        <tr key={therapy.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <div className="flex items-center">
                              <FaClinicMedical className="text-teal-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{therapy.name}</div>
                                <div className="text-xs text-gray-500">{therapy.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-sm text-gray-900">{therapy.totalDays}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                              ${therapy.remainingDays <= 3 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {therapy.remainingDays} days
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-sm font-medium text-gray-900">৳{therapy.price}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="divide-y divide-gray-100">
              {loadingHistory ? (
                <div className="p-4 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-t-2 border-b-2 border-teal-500 rounded-full"></div>
                </div>
              ) : therapyHistory.records.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No therapy records found
                </div>
              ) : (
                therapyHistory.records.map((record) => (
                  <div key={record.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {record.therapy_types.name}
                        </h3>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1" />
                            {format(new Date(record.therapy_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <FaClock className="mr-1" />
                            {record.therapy_time}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-teal-600">
                        ৳{record.therapy_types.price}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment History & Due Management Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden mt-3 transform hover:scale-[1.01] transition-all duration-500">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FaMoneyBillWave className="mr-2" />
                Payment History & Due Management
              </h2>
            </div>

            <div className="p-3">
              {loadingInvoices ? (
                <div className="text-center py-4">
                  <div className="animate-spin inline-block w-6 h-6 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No invoices found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Invoice Date</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Total Amount</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Paid Amount</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Due Amount</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">Status</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 border-t border-gray-100">
                          <td className="py-2 px-3">
                            <div className="flex items-center">
                              <FaReceipt className="text-purple-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {invoice.notes || 'No notes'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              ৳{invoice.total_amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-sm font-medium text-emerald-600">
                              ৳{invoice.paid_amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-sm font-medium text-red-600">
                              ৳{invoice.due_amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                              ${invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'partially_paid'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {invoice.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {invoice.due_amount > 0 && (
                              <button
                                onClick={() => handlePaymentClick(invoice)}
                                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <FaMoneyBillWave className="mr-1" />
                                <span className="text-xs">Pay</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
};

export default PatientProfile;
