import React, { useState, useEffect } from 'react';
import { 
  FaUserPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaEnvelope,
  FaVenusMars,
  FaUserMd,
  FaTimes,
  FaSave,
  FaHandHoldingUsd,
  FaNotesMedical,
  FaCalendarAlt,
  FaUserShield,
  FaIdCard,
  FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import patientApi from '../api/patientApi';
import doctorApi from '../api/doctorApi';
import { settingsApi } from '../api/settingsApi';
import { Card, CardBody, Checkbox, Select, Option } from "@material-tailwind/react";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

export default function PatientManagement() {
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState([]); // Store all patients
  const [filteredPatients, setFilteredPatients] = useState([]); // Store filtered patients
  const [doctors, setDoctors] = useState([]);
  const [discountGivers, setDiscountGivers] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medical_history: '',
    doctor_id: '',
    remarks: '',
    diagnosis: '',
    registration_date: new Date().toISOString().split('T')[0],
    discount_giver_id: '',
    referrer_id: ''
  });

  const fetchDoctors = async () => {
    try {
        const data = await doctorApi.getDoctors();
        setDoctors(data || []);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to fetch doctors');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsData, doctorsData, discountGiversData, referrersData] = await Promise.all([
        patientApi.getPatients({ searchTerm: '' }), // Get all patients without filtering
        doctorApi.getDoctors(),
        settingsApi.getDiscountGivers(),
        settingsApi.getReferrers()
      ]);

      setAllPatients(patientsData || []); // Store all patients
      setFilteredPatients(patientsData || []); // Initially show all patients
      setDoctors(doctorsData || []);
      setDiscountGivers(discountGiversData || []);
      setReferrers(referrersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter patients when search term changes
  useEffect(() => {
    const filtered = allPatients.filter(patient => 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, allPatients]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const patientData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        address: formData.address,
        primary_doctor_id: formData.doctor_id,
        medical_history: formData.medical_history,
        remarks: formData.remarks,
        diagnosis: formData.diagnosis,
        registration_date: formData.registration_date,
        discount_giver_id: formData.discount_giver_id || null,
        referrer_id: formData.referrer_id || null
      };

      if (selectedPatient) {
        await patientApi.updatePatient(selectedPatient.id, patientData);
        toast.success('Patient updated successfully');
      } else {
        await patientApi.createPatient(patientData);
        toast.success('Patient added successfully');
      }

      // Reset form and refresh data
      setFormData({
        name: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        medical_history: '',
        doctor_id: '',
        remarks: '',
        diagnosis: '',
        registration_date: new Date().toISOString().split('T')[0],
        discount_giver_id: '',
        referrer_id: ''
      });
      setShowAddModal(false);
      setShowEditModal(false);
      
      // Refresh patient list
      const patientsData = await patientApi.getPatients({ searchTerm: '' });
      setAllPatients(patientsData || []);
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle patient deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientApi.deletePatient(id);
        toast.success('Patient deleted successfully');
        const patientsData = await patientApi.getPatients({ searchTerm: '' });
        setAllPatients(patientsData || []);
      } catch (err) {
        console.error('Error deleting patient:', err);
        toast.error(err.message);
      }
    }
  };

  // Handle edit
  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      medical_history: patient.medical_history,
      doctor_id: patient.primary_doctor_id,
      remarks: patient.remarks,
      diagnosis: patient.diagnosis,
      registration_date: patient.registration_date,
      discount_giver_id: patient.discount_giver_id || '',
      referrer_id: patient.referrer_id || ''
    });
    setShowEditModal(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  return (
    <div className="container-fluid px-4 py-8 max-w-full overflow-x-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          Patient Management
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
        >
          <FaUserPlus className="mr-2" /> Add New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 hover:bg-blue-50/50"
          />
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
        </div>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : (
        <>
          <div className="w-full overflow-x-auto rounded-lg shadow">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full table-auto">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                          #
                        </span>
                        Sl. No.
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaIdCard className="mr-2" />
                        Patient ID
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaUser className="mr-2" />
                        Name
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaVenusMars className="mr-2" />
                        Gender
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaPhone className="mr-2" />
                        Phone
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaHandHoldingUsd className="mr-2" />
                        Due Amount
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaHandHoldingUsd className="mr-2" />
                        Discount Giver
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaUserShield className="mr-2" />
                        Referrer
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaCog className="mr-2" />
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPatients.map((patient, index) => (
                    <tr 
                      key={patient.id} 
                      className={`${index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'} cursor-pointer transition-all duration-200`}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                            {startIndex + index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaIdCard className="text-blue-600 mr-2" />
                          <span className="font-semibold text-gray-900">
                            {patient.patient_id || 'Pending...'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="text-gray-500 mr-2" />
                          <span className="font-medium text-gray-900">{patient.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaVenusMars className="text-purple-500 mr-2" />
                          <span>{patient.gender}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaPhone className="text-green-500 mr-2" />
                          <span>{patient.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.total_due > 0 ? (
                          <div className="flex items-center justify-end">
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {patient.total_due.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'BDT'
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <span className="text-gray-500">-</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaHandHoldingUsd className="text-yellow-500 mr-2" />
                          {discountGivers.find(d => d.id === patient.discount_giver_id)?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUserShield className="text-purple-500 mr-2" />
                          {referrers.find(r => r.id === patient.referrer_id)?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(patient);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(patient.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {showAddModal ? 'Add New Patient' : 'Edit Patient'}
              </h2>
              <button
                onClick={() => {
                  showAddModal ? setShowAddModal(false) : setShowEditModal(false);
                  setFormData({
                    name: '',
                    gender: '',
                    phone: '',
                    email: '',
                    address: '',
                    medical_history: '',
                    doctor_id: '',
                    remarks: '',
                    diagnosis: '',
                    registration_date: new Date().toISOString().split('T')[0],
                    discount_giver_id: '',
                    referrer_id: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Patient Name */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaUser className="text-blue-500 mr-2" />
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 hover:bg-blue-50/50"
                    required
                    placeholder="Enter patient name"
                  />
                  <FaUser className="absolute left-4 top-[43px] text-blue-400 group-hover:text-blue-500 transition-colors" />
                </div>

                {/* Registration Date */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaCalendarAlt className="text-blue-500 mr-2" />
                    Registration Date *
                  </label>
                  <input
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 hover:bg-blue-50/50"
                    required
                  />
                  <FaCalendarAlt className="absolute left-4 top-[43px] text-blue-400 group-hover:text-blue-500 transition-colors" />
                </div>

                {/* Phone */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaPhone className="text-green-500 mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-green-50/30 hover:bg-green-50/50"
                    required
                    placeholder="Enter mobile number"
                  />
                  <FaPhone className="absolute left-4 top-[43px] text-green-400 group-hover:text-green-500 transition-colors" />
                </div>

                {/* Gender */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaVenusMars className="text-pink-500 mr-2" />
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-pink-50/30 hover:bg-pink-50/50 appearance-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <FaVenusMars className="absolute left-4 top-[43px] text-pink-400 group-hover:text-pink-500 transition-colors" />
                </div>

                {/* Email */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaEnvelope className="text-indigo-500 mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-indigo-50/30 hover:bg-indigo-50/50"
                    placeholder="Enter email address"
                  />
                  <FaEnvelope className="absolute left-4 top-[43px] text-indigo-400 group-hover:text-indigo-500 transition-colors" />
                </div>

                {/* Doctor */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaUserMd className="text-teal-500 mr-2" />
                    Assigned Doctor
                  </label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-teal-50/30 hover:bg-teal-50/50 appearance-none cursor-pointer"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                  <FaUserMd className="absolute left-4 top-[43px] text-teal-400 group-hover:text-teal-500 transition-colors" />
                </div>

                {/* Address */}
                <div className="md:col-span-2 relative">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaMapMarkerAlt className="text-red-500 mr-2" />
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-red-50/30 hover:bg-red-50/50"
                    rows={2}
                    placeholder="Enter address"
                  />
                  <FaMapMarkerAlt className="absolute left-4 top-[43px] text-red-400 group-hover:text-red-500 transition-colors" />
                </div>

                {/* Medical History */}
                <div className="md:col-span-2 relative">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaNotesMedical className="text-teal-500 mr-2" />
                    Medical History
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-teal-50/30 hover:bg-teal-50/50"
                    rows={3}
                    placeholder="Enter medical history"
                  />
                  <FaNotesMedical className="absolute left-4 top-[43px] text-teal-400 group-hover:text-teal-500 transition-colors" />
                </div>

                {/* Diagnosis */}
                <div className="md:col-span-2 relative">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaUserMd className="text-purple-500 mr-2" />
                    Diagnosis <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-purple-50/30 hover:bg-purple-50/50"
                    rows={3}
                    placeholder="Enter patient diagnosis (optional)"
                  />
                  <FaUserMd className="absolute left-4 top-[43px] text-purple-400 group-hover:text-purple-500 transition-colors" />
                </div>

                {/* Remarks */}
                <div className="md:col-span-2 relative">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaNotesMedical className="text-orange-500 mr-2" />
                    Remarks <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-orange-50/30 hover:bg-orange-50/50"
                    rows={2}
                    placeholder="Add any additional notes (optional)"
                  />
                  <FaNotesMedical className="absolute left-4 top-[43px] text-orange-400 group-hover:text-orange-500 transition-colors" />
                </div>

                {/* Discount Giver */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaHandHoldingUsd className="text-yellow-500 mr-2" />
                    Discount Giver <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <Select
                    value={formData.discount_giver_id || ""}
                    onChange={(value) => {
                      console.log('Selected discount giver:', value);
                      setFormData({ ...formData, discount_giver_id: value });
                    }}
                    selected={(element) => {
                      const selectedGiver = discountGivers.find(g => g.id === formData.discount_giver_id);
                      console.log('Selected element:', element);
                      console.log('Current formData.discount_giver_id:', formData.discount_giver_id);
                      console.log('Found giver:', selectedGiver);
                      return (
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <FaHandHoldingUsd className="text-yellow-500" />
                          {selectedGiver ? selectedGiver.name : "No Discount Giver"}
                        </div>
                      );
                    }}
                    className="!border-2 !rounded-xl bg-white hover:!bg-gray-50/80"
                    labelProps={{
                      className: "hidden"
                    }}
                    containerProps={{
                      className: "min-w-[200px]"
                    }}
                    menuProps={{
                      className: "p-2 bg-white"
                    }}
                  >
                    <Option value="" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 bg-white">
                      <span className="text-gray-700">No Discount Giver</span>
                    </Option>
                    {discountGivers.map((giver) => (
                      <Option 
                        key={giver.id} 
                        value={giver.id} 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-50 bg-white"
                      >
                        <FaHandHoldingUsd className="text-yellow-500" />
                        <span className="text-gray-900 font-medium">{giver.name}</span>
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Referrer */}
                <div className="relative group">
                  <label className="block text-gray-700 mb-2 flex items-center font-medium">
                    <FaUserShield className="text-purple-500 mr-2" />
                    Referrer <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <Select
                    value={formData.referrer_id || ""}
                    onChange={(value) => {
                      console.log('Selected referrer:', value);
                      setFormData({ ...formData, referrer_id: value });
                    }}
                    selected={(element) => {
                      const selectedReferrer = referrers.find(r => r.id === formData.referrer_id);
                      console.log('Selected referrer element:', element);
                      console.log('Current formData.referrer_id:', formData.referrer_id);
                      console.log('Found referrer:', selectedReferrer);
                      return (
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <FaUserShield className="text-purple-500" />
                          {selectedReferrer ? selectedReferrer.name : "No Referrer"}
                        </div>
                      );
                    }}
                    className="!border-2 !rounded-xl bg-white hover:!bg-gray-50/80"
                    labelProps={{
                      className: "hidden"
                    }}
                    containerProps={{
                      className: "min-w-[200px]"
                    }}
                    menuProps={{
                      className: "p-2 bg-white"
                    }}
                  >
                    <Option value="" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 bg-white">
                      <span className="text-gray-700">No Referrer</span>
                    </Option>
                    {referrers.map((referrer) => (
                      <Option 
                        key={referrer.id} 
                        value={referrer.id} 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 bg-white"
                      >
                        <FaUserShield className="text-purple-500" />
                        <span className="text-gray-900 font-medium">{referrer.name}</span>
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    showAddModal ? setShowAddModal(false) : setShowEditModal(false);
                    setFormData({
                      name: '',
                      gender: '',
                      phone: '',
                      email: '',
                      address: '',
                      medical_history: '',
                      doctor_id: '',
                      remarks: '',
                      diagnosis: '',
                      registration_date: new Date().toISOString().split('T')[0],
                      discount_giver_id: '',
                      referrer_id: ''
                    });
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center transition-colors"
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      {showAddModal ? 'Add Patient' : 'Update Patient'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
