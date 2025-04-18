import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaSave, FaTimes, FaUserMd, FaNotesMedical, FaComments, FaClinicMedical } from 'react-icons/fa';
import { toast } from 'react-toastify';
import patientApi from '../api/patientApi';
import { format, parseISO } from 'date-fns';

const MedicalNotes = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    diagnosis: '',
    medical_history: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  // Load patients
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await patientApi.getPatients();
        setPatients(data);
        setFilteredPatients(data);
      } catch (err) {
        console.error('Error loading patients:', err);
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Filter patients when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = patients.filter(
        patient =>
          patient.name?.toLowerCase().includes(lowerCaseSearch) ||
          patient.patient_id?.toLowerCase().includes(lowerCaseSearch) ||
          patient.phone?.toLowerCase().includes(lowerCaseSearch) ||
          patient.email?.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // Handle editing patient
  const handleEditClick = (patient) => {
    setEditingPatient(patient);
    setFormData({
      diagnosis: patient.diagnosis || '',
      medical_history: patient.medical_history || '',
      remarks: patient.remarks || ''
    });
  };

  // Handle saving changes
  const handleSaveClick = async () => {
    if (!editingPatient) return;

    try {
      setSaving(true);
      
      // Explicitly log what we're saving
      console.log('Saving patient data:', {
        id: editingPatient.id,
        updates: {
          diagnosis: formData.diagnosis,
          medical_history: formData.medical_history,
          remarks: formData.remarks
        }
      });
      
      // Update patient data
      await patientApi.updatePatient(editingPatient.id, {
        diagnosis: formData.diagnosis,
        medical_history: formData.medical_history,
        remarks: formData.remarks
      });

      // Update local state
      const updatedPatients = patients.map(p => 
        p.id === editingPatient.id 
          ? { ...p, ...formData } 
          : p
      );
      
      setPatients(updatedPatients);
      setEditingPatient(null);
      toast.success('Patient medical notes updated successfully');
    } catch (err) {
      console.error('Error updating patient:', err);
      toast.error('Failed to update patient medical notes');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const today = new Date();
      const birthDate = parseISO(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return `${age} years`;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Patient Medical Notes</h1>
      
      {/* Search bar */}
      <div className="mb-6 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, ID, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      {/* Patient list and details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Patients ({filteredPatients.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading patients...</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {filteredPatients.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No patients found</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredPatients.map(patient => (
                    <li 
                      key={patient.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ${editingPatient?.id === patient.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleEditClick(patient)}
                    >
                      <h3 className="font-medium text-gray-800">{patient.name}</h3>
                      <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                      <div className="text-sm text-gray-500">{patient.phone}</div>
                      <div className="mt-1 flex space-x-2">
                        {patient.diagnosis && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <FaClinicMedical className="mr-1" size={10} /> Diagnosis
                          </span>
                        )}
                        {patient.medical_history && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <FaNotesMedical className="mr-1" size={10} /> History
                          </span>
                        )}
                        {patient.remarks && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FaComments className="mr-1" size={10} /> Remarks
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        
        {/* Medical notes editor */}
        <div className="lg:col-span-2">
          {!editingPatient ? (
            <div className="bg-white rounded-lg shadow p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <FaUserMd size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Select a patient to view or edit their medical notes</h3>
                <p className="text-gray-400">Click on any patient from the list to get started</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              {/* Patient header */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingPatient.name}</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <div className="text-sm text-blue-100">ID: {editingPatient.patient_id}</div>
                      <div className="text-sm text-blue-100">Age: {calculateAge(editingPatient.date_of_birth)}</div>
                      <div className="text-sm text-blue-100">Phone: {editingPatient.phone || 'N/A'}</div>
                      <div className="text-sm text-blue-100">Email: {editingPatient.email || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {saving ? (
                      <button disabled className="flex items-center px-3 py-1 bg-gray-400 text-white rounded text-sm">
                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                        Saving...
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveClick}
                          className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition duration-150"
                        >
                          <FaSave className="mr-1" /> Save
                        </button>
                        <button
                          onClick={() => setEditingPatient(null)}
                          className="flex items-center px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition duration-150"
                        >
                          <FaTimes className="mr-1" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Medical notes form */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Diagnosis */}
                  <div>
                    <div className="flex items-center mb-2">
                      <FaClinicMedical className="text-lime-500 mr-2" />
                      <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                    </div>
                    <textarea
                      name="diagnosis"
                      value={formData.diagnosis || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 min-h-[100px] resize-none"
                      placeholder="Enter patient diagnosis"
                    />
                  </div>
                  
                  {/* Medical History */}
                  <div>
                    <div className="flex items-center mb-2">
                      <FaNotesMedical className="text-blue-500 mr-2" />
                      <label className="block text-sm font-medium text-gray-700">Medical History</label>
                    </div>
                    <textarea
                      name="medical_history"
                      value={formData.medical_history || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 min-h-[100px] resize-none"
                      placeholder="Enter patient medical history"
                    />
                  </div>
                  
                  {/* Remarks */}
                  <div>
                    <div className="flex items-center mb-2">
                      <FaComments className="text-amber-500 mr-2" />
                      <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    </div>
                    <textarea
                      name="remarks"
                      value={formData.remarks || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 min-h-[100px] resize-none"
                      placeholder="Enter additional remarks about the patient"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalNotes;
