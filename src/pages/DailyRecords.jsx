import React, { useState, useEffect } from 'react';
import { 
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
  FaClinicMedical,
  FaNotesMedical,
  FaCalendarAlt,
  FaHandHoldingUsd,
  FaIdCard,
  FaCog,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaHeartbeat,
  FaStethoscope,
  FaBandAid,
  FaUserPlus
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import patientApi from '../api/patientApi';
import doctorApi from '../api/doctorApi';
import therapyApi from '../api/therapyApi';
import { settingsApi } from '../api/settingsApi';
import { format } from 'date-fns';
import { Card, CardBody, Checkbox, Select, Option, Dialog, DialogHeader, DialogBody, DialogFooter, Button } from "@material-tailwind/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDailyRecord, getDailyRecords, getAvailableTherapies, updateDailyRecord, deleteDailyRecord } from '../api/dailyRecords';

const TherapyCard = ({ therapy, selected, onSelect, remainingDays }) => (
  <Card 
    className={`transform transition-all duration-200 hover:scale-105 cursor-pointer ${
      selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
    }`}
    onClick={onSelect}
  >
    <CardBody className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <div className="flex items-center">
            <Checkbox
              checked={selected}
              onChange={onSelect}
              className="mr-3"
            />
            <div>
              <h3 className="text-lg font-semibold">{therapy.name}</h3>
              <p className="text-sm text-gray-600">{therapy.description || 'No description available'}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">
                  {remainingDays} days remaining
                </span>
                <span className="text-sm text-gray-500">
                  (৳{therapy.price}/day)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
);

const PatientRecordCard = ({ record, onEdit, onDelete, index }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Function to get gradient colors based on index
  const getSerialStyles = (idx) => {
    const styles = [
      { 
        gradient: 'from-blue-500 to-indigo-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-700',
        icon: <FaUserMd size={16} />
      },
      { 
        gradient: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-900',
        iconColor: 'text-emerald-700',
        icon: <FaHeartbeat size={16} />
      },
      { 
        gradient: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-900',
        iconColor: 'text-purple-700',
        icon: <FaStethoscope size={16} />
      },
      { 
        gradient: 'from-rose-500 to-red-500',
        bgColor: 'bg-rose-50',
        textColor: 'text-rose-900',
        iconColor: 'text-rose-700',
        icon: <FaBandAid size={16} />
      },
      { 
        gradient: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-900',
        iconColor: 'text-amber-700',
        icon: <FaNotesMedical size={16} />
      }
    ];
    return styles[idx % styles.length];
  };

  const serialStyle = getSerialStyles(index);

  return (
    <>
      <div 
        className={`transform transition-all duration-300 hover:scale-[1.02]
          rounded-xl shadow-lg hover:shadow-2xl border border-gray-100
          bg-gray-50 hover:bg-gray-100 backdrop-blur-lg
          ${showDetails ? 'scale-[1.02]' : ''}
          relative overflow-hidden
          before:content-[''] before:absolute before:inset-0 
          before:bg-gradient-to-r before:from-emerald-50/30 before:to-blue-50/30
          before:opacity-0 hover:before:opacity-100 before:transition-opacity
          md:flex md:flex-col`}
      >
        {/* Main Info Section */}
        <div className="px-6 py-4 cursor-pointer relative z-10" onClick={() => setShowDetails(!showDetails)}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Serial Number with Icon */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
              <div className={`w-16 h-16 flex flex-col items-center justify-center 
                ${serialStyle.bgColor} border-r-4 border-r-${serialStyle.gradient.split('-')[2]}-400
                rounded-r-xl shadow-lg transform hover:scale-110 transition-transform
                relative
                after:content-[''] after:absolute after:top-full after:left-0
                after:border-l-[12px] after:border-t-[6px]
                after:border-l-transparent
                ${serialStyle.gradient.includes('blue') ? 'after:border-t-blue-200' :
                  serialStyle.gradient.includes('emerald') ? 'after:border-t-emerald-200' :
                  serialStyle.gradient.includes('purple') ? 'after:border-t-purple-200' :
                  serialStyle.gradient.includes('rose') ? 'after:border-t-rose-200' :
                  'after:border-t-amber-200'}`}>
                <span className={`text-2xl font-black mb-0.5 ${serialStyle.textColor}`}>
                  {index + 1}
                </span>
                <div className={serialStyle.iconColor}>
                  {serialStyle.icon}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-grow ml-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-200
                  flex items-center justify-center transform rotate-3 transition-transform group-hover:rotate-6
                  shadow-lg">
                  <FaUser className="text-emerald-700 text-xl transform -rotate-3" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {record.patients.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-lg">
                      <FaPhone className="text-blue-500" size={12} />
                      {record.patients.phone}
                    </span>
                    <span className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded-lg">
                      <FaVenusMars className="text-purple-500" size={12} />
                      {record.patients.gender}
                    </span>
                    <span className="flex items-center gap-2 bg-amber-50 px-2 py-1 rounded-lg">
                      <FaCalendarAlt className="text-amber-500" size={12} />
                      {record.patients.age} years
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 md:mt-0 md:ml-6">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center transform rotate-3">
                    <FaClinicMedical className="text-white text-sm transform -rotate-3" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700">{record.therapy_types.name}</span>
                </div>
                {record.due_amount > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center transform rotate-3">
                      <FaExclamationCircle className="text-white text-sm transform -rotate-3" />
                    </div>
                    <span className="text-sm font-medium text-red-700">Due: ৳{record.due_amount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center transform rotate-3">
                  <FaClock className="text-white text-sm transform -rotate-3" />
                </div>
                <span className="text-sm font-medium text-indigo-700">
                  {format(new Date(`2000-01-01T${record.therapy_time}`), 'hh:mm a')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(record);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-100 
                    text-blue-600 hover:text-blue-700 rounded-lg transition-colors transform hover:scale-105"
                >
                  <FaEdit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 
                    text-red-600 hover:text-red-700 rounded-lg transition-colors transform hover:scale-105"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Details Section */}
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Additional Notes</h4>
                  <p className="text-gray-700">{record.notes || 'No notes available'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Treatment Details</h4>
                  <p className="text-gray-700">{record.therapy_types.description || 'No description available'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Payment Status</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-sm font-medium
                      ${record.due_amount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {record.due_amount > 0 ? 'Pending' : 'Paid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} handler={() => setShowDeleteConfirm(false)}>
        <DialogHeader>Confirm Delete</DialogHeader>
        <DialogBody>
          Are you sure you want to delete this record?
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="gray"
            onClick={() => setShowDeleteConfirm(false)}
            className="mr-1"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            color="red"
            onClick={() => {
              onDelete(record);
              setShowDeleteConfirm(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

const DailyRecords = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTherapies, setSelectedTherapies] = useState([]);
  const [availableTherapies, setAvailableTherapies] = useState([]);
  const [therapyTime, setTherapyTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [discountGivers, setDiscountGivers] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    loadDailyRecords();
    loadPatients();
    loadInitialData();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedPatient) {
      loadAvailableTherapies();
    }
  }, [selectedPatient, selectedDate]);

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await patientApi.searchPatients(value.trim());
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await patientApi.getPatients();
      if (error) throw error;
      setAllPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setAllPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyRecords = async () => {
    try {
      setLoading(true);
      console.log('Loading daily records for date:', selectedDate);
      const records = await getDailyRecords(format(selectedDate, 'yyyy-MM-dd'));
      console.log('Loaded daily records:', records);
      setDailyRecords(records || []);
    } catch (error) {
      console.error('Error loading daily records:', error);
      toast.error('Failed to load daily records');
      setDailyRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTherapies = async () => {
    try {
      setLoading(true);
      console.log('Loading therapies for patient:', selectedPatient.id);
      
      if (!selectedDate) {
        console.log('No date selected');
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Getting therapies for date:', formattedDate);

      const therapies = await getAvailableTherapies(
        selectedPatient.id,
        formattedDate
      );

      console.log('Loaded therapies:', therapies);
      if (!therapies || therapies.length === 0) {
        console.log('No therapies found');
        setAvailableTherapies([]);
        setSelectedTherapies([]);
      } else {
        setAvailableTherapies(therapies);
      }
    } catch (error) {
      console.error('Error loading therapies:', error);
      toast.error('Failed to load available therapies');
      setAvailableTherapies([]);
      setSelectedTherapies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [doctorsData, discountGiversData, referrersData, therapyTypesData] = await Promise.all([
        doctorApi.getDoctors(),
        settingsApi.getDiscountGivers(),
        settingsApi.getReferrers(),
        therapyApi.getAllTherapies()
      ]);

      setDoctors(doctorsData || []);
      setDiscountGivers(discountGiversData || []);
      setReferrers(referrersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    try {
      setLoading(true);
      console.log('Selected patient:', patient);

      // Get full patient details
      const fullPatient = await patientApi.getPatientById(patient.id);
      if (!fullPatient) {
        throw new Error('Failed to load patient details');
      }
      console.log('Full patient details:', fullPatient);

      setSelectedPatient(fullPatient);
      setSearchTerm('');
      setSearchResults([]);
      
      // Load available therapies for the selected patient
      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        console.log('Loading therapies for patient:', {
          patientId: fullPatient.id,
          date: formattedDate
        });

        const therapies = await getAvailableTherapies(
          fullPatient.id,
          formattedDate
        );

        console.log('Loaded therapies:', therapies);
        setAvailableTherapies(therapies || []);
        
        if (!therapies || therapies.length === 0) {
          console.log('No therapies found for patient');
          toast.info('No active therapies available for this patient');
        }
      } else {
        console.log('No date selected');
        toast.warning('Please select a date first');
      }
    } catch (error) {
      console.error('Error selecting patient:', error);
      toast.error('Failed to load patient details');
      setSelectedPatient(null);
      setAvailableTherapies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTherapySelect = (therapy) => {
    setSelectedTherapies(prevSelected => {
      const isAlreadySelected = prevSelected.some(t => t.therapy_type_id === therapy.id);
      if (isAlreadySelected) {
        return prevSelected.filter(t => t.therapy_type_id !== therapy.id);
      } else {
        return [...prevSelected, { ...therapy, therapy_type_id: therapy.id }];
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatient || selectedTherapies.length === 0 || !therapyTime) {
      toast.error('Please select patient, therapies and time');
      return;
    }

    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Adding records with time:', {
        therapyTime,
        selectedTherapies,
        formattedDate
      });

      // Add records for each selected therapy
      await Promise.all(
        selectedTherapies.map(therapy =>
          addDailyRecord(
            selectedPatient.id,
            therapy.therapy_type_id,
            formattedDate,
            therapyTime // Make sure this is in HH:mm format
          )
        )
      );

      toast.success('Records added successfully');
      setSelectedTherapies([]);
      setTherapyTime('');
      loadDailyRecords();
      loadAvailableTherapies(); // Reload available therapies to update remaining days
    } catch (error) {
      console.error('Error adding records:', error);
      toast.error('Failed to add records');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    // Convert therapy_time to HH:mm format for input
    const timeStr = record.therapy_time || '';
    const [hours, minutes] = timeStr.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    setTherapyTime(formattedTime);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!therapyTime) {
      toast.error('Please set a therapy time');
      return;
    }

    try {
      setLoading(true);
      console.log('Updating record with time:', {
        recordId: editingRecord.id,
        therapyTime
      });

      await updateDailyRecord(editingRecord.id, {
        therapy_time: therapyTime // Make sure this is in HH:mm format
      });

      toast.success('Record updated successfully');
      setEditingRecord(null);
      setTherapyTime('');
      loadDailyRecords();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      setLoading(true);
      await deleteDailyRecord(recordId);
      toast.success('Record deleted successfully');
      loadDailyRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = dailyRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(dailyRecords.length / recordsPerPage);

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Calendar Section */}
      <div className="mb-8">
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date)}
          dateFormat="MMMM d, yyyy"
          className="w-full p-4 rounded-xl shadow-lg bg-gray-50/80 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          wrapperClassName="w-full"
        />
      </div>

      {/* Patient Selection Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center">
            <FaSearch className="mr-2 text-blue-500" />
            Search Patient
          </h2>
          <Button
            onClick={() => setShowRedirectDialog(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaUserPlus className="text-white" />
            Add New Patient
          </Button>
        </div>

        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, phone, or ID..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 
                focus:ring-blue-500 focus:border-transparent pl-12 pr-4 bg-gray-50"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
          </div>

          {searchLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="absolute w-full mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0
                    transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 
                        flex items-center justify-center">
                        <FaUser className="text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaPhone className="mr-1 text-green-500" />
                            {patient.phone}
                          </span>
                          {patient.patient_id && (
                            <span className="flex items-center gap-1">
                              <FaIdCard className="mr-1 text-blue-500" />
                              {patient.patient_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400 hover:text-blue-500 transition-colors">
                      <FaChevronRight />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !searchLoading && (
            <div className="absolute w-full mt-2 bg-white rounded-xl shadow-lg p-4 text-center border border-gray-200">
              <p className="text-gray-500">No patients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Patient Info Card */}
      {selectedPatient && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <FaUser className="text-3xl text-blue-500" />
                </div>
                <div className="ml-4 text-white">
                  <h3 className="text-2xl font-bold">{selectedPatient.name}</h3>
                  <p className="text-blue-100">Patient ID: {selectedPatient.patient_id || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setSelectedTherapies([]);
                  setAvailableTherapies([]);
                }}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-b-2xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Contact Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <FaPhone className="text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedPatient.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FaEnvelope className="text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedPatient.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <FaMapMarkerAlt className="text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedPatient.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaVenusMars className="text-pink-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{selectedPatient.gender || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaUserMd className="text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Primary Doctor</p>
                    <p className="font-medium">
                      {doctors.find(d => d.id === selectedPatient.primary_doctor_id)?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FaHandHoldingUsd className="text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Discount Giver</p>
                    <p className="font-medium">
                      {discountGivers.find(d => d.id === selectedPatient.discount_giver_id)?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaUserShield className="text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Referrer</p>
                    <p className="font-medium">
                      {referrers.find(r => r.id === selectedPatient.referrer_id)?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Medical Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-start text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <FaNotesMedical className="text-teal-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Medical History</p>
                    <p className="font-medium whitespace-pre-wrap">
                      {selectedPatient.medical_history || 'No medical history recorded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mt-1">
                    <FaNotesMedical className="text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Remarks</p>
                    <p className="font-medium whitespace-pre-wrap">
                      {selectedPatient.remarks || 'No remarks recorded'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Therapy Selection Section */}
      {selectedPatient && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center">
              <FaClinicMedical className="mr-2 text-blue-500" />
              Select Therapies
            </h2>
            {selectedTherapies.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedTherapies.length} therapies selected
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : availableTherapies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTherapies.map((therapy) => (
                <TherapyCard
                  key={therapy.id}
                  therapy={therapy}
                  selected={selectedTherapies.some(t => t.therapy_type_id === therapy.id)}
                  onSelect={() => handleTherapySelect(therapy)}
                  remainingDays={therapy.remainingDays}
                />
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <FaNotesMedical className="mx-auto text-4xl text-yellow-400 mb-3" />
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                No Available Therapies
              </h3>
              <p className="text-yellow-600">
                This patient has no active therapies available. Please check their invoice or add new therapies.
              </p>
            </div>
          )}

          {selectedTherapies.length > 0 && (
            <div className="mt-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaClock className="mr-2 text-blue-500" />
                  Set Therapy Time
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="time"
                    value={therapyTime}
                    onChange={(e) => {
                      console.log('Setting therapy time:', e.target.value);
                      setTherapyTime(e.target.value);
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!therapyTime || loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg 
                      hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50
                      disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Add Record
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Records List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-500" />
          <span>Daily Records for {format(selectedDate, 'MMMM d, yyyy')}</span>
        </h2>
        <div className="space-y-6 pl-4">
          {currentRecords.map((record, index) => (
            <div key={record.id} className="relative">
              <PatientRecordCard 
                record={record}
                onEdit={handleEdit}
                onDelete={handleDelete}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`w-10 h-10 rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* No Records Message */}
        {dailyRecords.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No records found for this date</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        )}
      </div>

      {/* Edit Record Modal */}
      <Dialog
        open={showEditModal}
        handler={() => setShowEditModal(false)}
        className="bg-white p-6 rounded-xl max-w-md mx-auto"
      >
        <h2 className="text-xl font-bold mb-4">Edit Therapy Time</h2>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">New Time</label>
          <input
            type="time"
            value={therapyTime}
            onChange={(e) => {
              console.log('Setting therapy time in modal:', e.target.value);
              setTherapyTime(e.target.value);
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button
            color="gray"
            onClick={() => {
              setShowEditModal(false);
              setTherapyTime('');
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={handleUpdate}
            disabled={!therapyTime || loading}
          >
            Update
          </Button>
        </div>
      </Dialog>

      {/* Redirect Dialog */}
      <Dialog open={showRedirectDialog} handler={() => setShowRedirectDialog(false)}>
        <DialogHeader>Add New Patient</DialogHeader>
        <DialogBody>
          To add a new patient, please visit the Patient Management page. This ensures all patient information is properly recorded.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setShowRedirectDialog(false)}
            className="mr-1"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            color="blue"
            onClick={() => {
              window.location.href = '/patient-management';
            }}
          >
            Go to Patient Management
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default DailyRecords;
