import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInYears } from 'date-fns';
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaIdCard, FaCalendarAlt, FaNotesMedical,
  FaArrowLeft, FaComments, FaClinicMedical,
  FaChevronLeft, FaChevronRight, FaClock,
  FaMoneyBillWave, FaReceipt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import patientApi from '../api/patientApi';
import invoiceApi from '../api/invoiceApi';
import { getPatientTherapyHistory, getAvailableTherapies } from '../api/dailyRecords';

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

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    try {
      return differenceInYears(new Date(), parseISO(dob));
    } catch (e) {
      console.error("Error calculating age:", e);
      return 'N/A';
    }
  };

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientApi.getPatientById(id);
      if (!data) {
        throw new Error('Patient not found');
      }
      setPatient(data);
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

  const handleEditClick = () => {
    setFormData({ ...patient, date_of_birth: patient?.date_of_birth ? format(parseISO(patient.date_of_birth), 'yyyy-MM-dd') : '' }); // Initialize form data, format date
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({}); // Clear form data or reset to original if needed
  };

  const handleSaveClick = async () => {
    console.log('Saving data:', formData); // Debugging
    if (!formData.name || !formData.phone) {
      toast.error('Patient Name and Phone are required.');
      return;
    }
    // Optional: Add more validation here

    try {
      setLoading(true); // Indicate loading state
      // Ensure date_of_birth is not an empty string before sending
      const dataToSend = { ...formData };
      if (dataToSend.date_of_birth === '') {
        dataToSend.date_of_birth = null;
      }

      const updatedPatient = await patientApi.updatePatient(id, dataToSend);
      setPatient(updatedPatient); // Update local patient state
      setIsEditing(false); // Exit edit mode
      toast.success('Patient details updated successfully!');
    } catch (err) {
      console.error('Error updating patient:', err);
      toast.error(`Failed to update patient: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // Handle potential number conversion if needed in the future
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (id) loadPatient();
  }, [id]);

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
              <div className="mt-6 border-t border-gray-200 pt-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

                  {/* Patient ID (Read-only) */}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaIdCard className="mr-2 text-teal-500" /> Patient ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{patient.patient_id || 'N/A'}</dd>
                  </div>

                  {/* Gender */}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaUser className="mr-2 text-pink-500" /> Gender
                    </dt>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900">{patient.gender || 'N/A'}</dd>
                    )}
                  </div>

                  {/* Date of Birth / Age */}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaCalendarAlt className="mr-2 text-orange-500" /> Date of Birth / Age
                    </dt>
                    {isEditing ? (
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth || ''} // Expects yyyy-MM-dd format
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900">
                        {patient.date_of_birth ? `${format(parseISO(patient.date_of_birth), 'MMM dd, yyyy')} (${calculateAge(patient.date_of_birth)} yrs)` : 'N/A'}
                      </dd>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaPhone className="mr-2 text-green-500" /> Phone
                    </dt>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Phone Number"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900">{patient.phone || 'N/A'}</dd>
                    )}
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaEnvelope className="mr-2 text-purple-500" /> Email
                    </dt>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Email Address"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900">{patient.email || 'N/A'}</dd>
                    )}
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" /> Address
                    </dt>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        rows="2"
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Full Address"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900">{patient.address || 'N/A'}</dd>
                    )}
                  </div>

                  {/* Medical History */}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaNotesMedical className="mr-2 text-cyan-500" /> Medical History
                    </dt>
                    {isEditing ? (
                      <textarea
                        name="medical_history"
                        value={formData.medical_history || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Relevant medical history"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{patient.medical_history || 'N/A'}</dd>
                    )}
                  </div>

                  {/* Diagnosis */}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaClinicMedical className="mr-2 text-lime-500" /> Diagnosis
                    </dt>
                    {isEditing ? (
                      <textarea
                        name="diagnosis"
                        value={formData.diagnosis || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Diagnosis details"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{patient.diagnosis || 'N/A'}</dd>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaComments className="mr-2 text-amber-500" /> Remarks
                    </dt>
                    {isEditing ? (
                      <textarea
                        name="remarks"
                        value={formData.remarks || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Additional remarks"
                      />
                    ) : (
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{patient.remarks || 'N/A'}</dd>
                    )}
                  </div>

                </dl>
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

      {/* Patient Profile */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg">
            <FaUser size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {/* Conditional Rendering for Name - Input field will be here */} 
              {isEditing ? (
                <input 
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="text-2xl font-bold text-gray-800 border-b-2 border-blue-300 focus:outline-none focus:border-blue-500 bg-transparent"
                  placeholder="Patient Name"
                />
              ) : (
                patient.name
              )}
            </h1>
            <p className="text-sm text-gray-500">Patient ID: {patient.patient_id}</p>
          </div>
        </div>
        {/* Edit/Save/Cancel Buttons */} 
        <div className="absolute top-4 right-4 flex space-x-2">
          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveClick}
                disabled={loading} // Disable save button while loading
                className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelClick}
                disabled={loading} // Disable cancel button while loading
                className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
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
