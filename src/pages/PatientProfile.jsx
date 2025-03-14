import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
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
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <InfoCard
                  icon={FaUser}
                  label="Gender"
                  value={patient.gender}
                  color="from-pink-500 to-rose-500"
                />
                <InfoCard
                  icon={FaPhone}
                  label="Phone"
                  value={patient.phone}
                  color="from-green-500 to-emerald-500"
                />
                <InfoCard
                  icon={FaEnvelope}
                  label="Email"
                  value={patient.email || 'Not provided'}
                  color="from-blue-500 to-cyan-500"
                />
                <InfoCard
                  icon={FaMapMarkerAlt}
                  label="Address"
                  value={patient.address || 'Not provided'}
                  color="from-orange-500 to-amber-500"
                />
                <InfoCard
                  icon={FaCalendarAlt}
                  label="Registration"
                  value={format(new Date(patient.created_at), 'MMM dd, yyyy')}
                  color="from-violet-500 to-purple-500"
                />
              </div>

              {/* Medical History & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 transform hover:scale-[1.01] transition-all duration-300 shadow-md">
                  <h2 className="text-base font-semibold text-indigo-900 mb-2 flex items-center">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg shadow-md transform -rotate-3 hover:rotate-0 transition-all duration-300 mr-2">
                      <FaNotesMedical className="text-white" />
                    </div>
                    Medical History
                  </h2>
                  <p className="text-sm text-gray-700 bg-white/80 p-2 rounded-lg shadow-inner max-h-24 overflow-auto">
                    {patient.medical_history || 'No medical history recorded'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 transform hover:scale-[1.01] transition-all duration-300 shadow-md">
                  <h2 className="text-base font-semibold text-purple-900 mb-2 flex items-center">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg shadow-md transform rotate-3 hover:rotate-0 transition-all duration-300 mr-2">
                      <FaComments className="text-white" />
                    </div>
                    Remarks
                  </h2>
                  <p className="text-sm text-gray-700 bg-white/80 p-2 rounded-lg shadow-inner max-h-24 overflow-auto">
                    {patient.remarks || 'No remarks recorded'}
                  </p>
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

const InfoCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-lg shadow-md p-2 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg">
    <div className="flex items-center space-x-2">
      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color} transform hover:rotate-6 transition-all duration-300 shadow-md`}>
        <Icon className="text-sm text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-sm text-gray-800 font-semibold truncate">{value}</p>
      </div>
    </div>
  </div>
);

export default PatientProfile;
