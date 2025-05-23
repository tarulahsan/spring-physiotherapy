import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUser,
  FaPhone,
  FaVenusMars,
  FaCalendarAlt,
  FaClinicMedical,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock,
  FaUserMd,
  FaHeartbeat,
  FaStethoscope,
  FaBandAid,
  FaNotesMedical,
  FaIdCard,
  FaMapMarkerAlt,
  FaEnvelope,
  FaHandHoldingUsd,
  FaUserShield,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import patientApi from '../api/patientApi';
import doctorApi from '../api/doctorApi';
import therapyApi from '../api/therapyApi';
import { settingsApi } from '../api/settingsApi';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Card, CardBody, Checkbox, Select, Option, Dialog, DialogHeader, DialogBody, DialogFooter, Button } from "@material-tailwind/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDailyRecord, getDailyRecords, getAvailableTherapies, updateDailyRecord, deleteDailyRecord } from '../api/dailyRecords';
import { supabase } from '../lib/supabase';

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

const PatientRecordCard = ({ record, onEdit, onDelete, index, doctors, discountGivers, referrers }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Function to get background color based on index
  const getSerialBackground = (idx) => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#ef4444', // red
      '#f97316', // orange
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#eab308'  // yellow
    ];
    return colors[idx % colors.length];
  };

  // Calculate age from date of birth if available
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

  // Get patient information
  const patientName = record.patients?.name || 'Unknown Patient';
  const patientId = record.patients?.patient_id || 'No ID';
  const patientGender = record.patients?.gender || 'N/A';
  
  // Try getting age directly first, then fall back to calculating from DOB
  const patientAge = record.patients?.age && record.patients.age !== '0' && record.patients.age !== 'N/A' 
    ? `${record.patients.age} yrs`
    : record.patients?.date_of_birth 
      ? `${getPatientAge(record.patients.date_of_birth) || 'N/A'} yrs` 
      : 'N/A';
  
  const therapyName = record.therapy_types?.name || 'Unknown Therapy';

  return (
    <>
      <div className="w-full">
        <div className="relative">
          <div className={`transform transition-all duration-300 hover:scale-[1.02]
            rounded-xl shadow-lg hover:shadow-2xl border border-gray-100
            bg-gray-50 hover:bg-gray-100 backdrop-blur-lg
            relative overflow-hidden
            before:content-[''] before:absolute before:inset-0 
            before:bg-gradient-to-r before:from-emerald-50/30 before:to-blue-50/30
            before:pointer-events-none
            md:flex md:flex-col`}
          >
            {/* Main Info Section */}
            <div className="px-6 py-4 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Serial Number with Icon */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform rotate-3"
                    style={{ backgroundColor: getSerialBackground(index) }}
                  >
                    <span className="text-white font-bold text-lg transform -rotate-3" style={{ color: '#ffffff' }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Patient and Therapy Info */}
                <div className="flex-1 ml-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {patientName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {patientId}
                      </span>
                    </div>
                  </div>
                  {/* Therapy Name - More Prominent and Centered */}
                  <div className="mt-2 mb-1 text-center md:text-left">
                    <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-200 text-gray-800 rounded-lg shadow-md">
                      <span className="font-semibold text-base">{therapyName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Age:</span> {patientAge}
                    </div>
                    <div>
                      <span className="font-medium">Gender:</span> {patientGender}
                    </div>
                  </div>
                  {/* Doctor, Discount Giver, Referrer information */}
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                    {record.patients?.primary_doctor_id && (
                      <div>
                        <span className="font-medium">Doctor:</span> {doctors.find(d => d.id === record.patients.primary_doctor_id)?.name || 'N/A'}
                      </div>
                    )}
                    {record.patients?.discount_giver_id && (
                      <div>
                        <span className="font-medium">Discount Giver:</span> {discountGivers.find(d => d.id === record.patients.discount_giver_id)?.name || 'N/A'}
                      </div>
                    )}
                    {record.patients?.referrer_id && (
                      <div>
                        <span className="font-medium">Referrer:</span> {referrers.find(r => r.id === record.patients.referrer_id)?.name || 'N/A'}
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
            </div>
          </div>
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
  // Initialize with today's date using the correct timezone consideration
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    console.log('Initializing with today\'s date:', today);
    console.log('Today ISO string:', today.toISOString());
    console.log('Today formatted for display:', format(today, 'yyyy-MM-dd'));
    return today;
  });
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Log the current date for debugging
  useEffect(() => {
    console.log('Current date and time:', new Date());
    console.log('Selected date value:', selectedDate);
    console.log('Formatted selected date:', format(selectedDate, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    loadDailyRecords();
    loadInitialData();
  }, [selectedDate]);
  
  // Function to load available therapies for the selected patient
  const loadAvailableTherapies = async () => {
    if (!selectedPatient?.id || !selectedDate) return;
    
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const therapies = await getAvailableTherapies(
        selectedPatient.id,
        formattedDate
      );

      setAvailableTherapies(Array.isArray(therapies) ? therapies : []);
    } catch (error) {
      console.error('Error loading available therapies:', error);
      toast.error('Failed to load therapies');
      setAvailableTherapies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    try {
      setSearchTerm(value);
      
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      const results = await patientApi.searchPatients(value.trim());
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    if (!patient?.id) {
      console.error('Invalid patient selected');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Selected patient:', patient);

      // Get full patient details
      const fullPatient = await patientApi.getPatientById(patient.id);
      if (!fullPatient) {
        throw new Error('Failed to load patient details');
      }

      setSelectedPatient(fullPatient);
      setSearchTerm('');
      setSearchResults([]);
      
      // Load available therapies for the selected patient
      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const therapies = await getAvailableTherapies(
          fullPatient.id,
          formattedDate
        );

        setAvailableTherapies(Array.isArray(therapies) ? therapies : []);
        
        if (!therapies || therapies.length === 0) {
          toast.info('No active therapies available for this patient');
        }
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

  const loadDailyRecords = async () => {
    try {
      setLoading(true);
      
      // Ensure we're using the correct date format and time zone handling
      if (!selectedDate) {
        console.error('Selected date is undefined or null');
        toast.error('Invalid date selection');
        setDailyRecords([]);
        return;
      }
      
      // Force correct date handling with explicit formatting
      const dateToUse = new Date(selectedDate);
      const formattedDateString = format(dateToUse, 'yyyy-MM-dd');
      
      console.log('Loading daily records with improved date handling:');
      console.log(' - Original selected date:', selectedDate);
      console.log(' - Date object to use:', dateToUse);
      console.log(' - Formatted date string:', formattedDateString);
      console.log(' - Current local time:', new Date().toLocaleString());
      
      try {
        // Pass the formatted date string rather than the date object
        const records = await getDailyRecords(formattedDateString);
        console.log('Daily records loaded successfully:', records);
        setDailyRecords(Array.isArray(records) ? records : []);
        
        if (!records || records.length === 0) {
          console.log('No records found for date:', formattedDateString);
        } else {
          console.log('Sample record date:', records[0].therapy_date);
        }
      } catch (apiError) {
        console.error('API error when loading records:', apiError);
        toast.error(`Failed to load records: ${apiError.message || 'Unknown error'}`);
        setDailyRecords([]);
      }
    } catch (error) {
      console.error('Unexpected error in loadDailyRecords:', error);
      toast.error('Failed to load records due to an unexpected error');
      setDailyRecords([]);
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
      
      // Ensure consistent date handling with explicit formatting
      const dateToUse = new Date(selectedDate);
      const formattedDate = format(dateToUse, 'yyyy-MM-dd');
      
      console.log('Adding records with enhanced date handling:');
      console.log(' - Original selected date:', selectedDate);
      console.log(' - Date object to use:', dateToUse); 
      console.log(' - Formatted date string for DB:', formattedDate);
      console.log(' - Therapy time:', therapyTime);
      console.log(' - Selected therapies:', selectedTherapies);

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

  // Function to format time to HH:MM:SS for database storage
  const formatTimeForDB = (timeString) => {
    if (!timeString) return null;
    
    // If already in HH:MM:SS format
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // If in HH:MM format
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return `${timeString}:00`;
    }
    
    // Invalid format
    throw new Error(`Invalid time format: ${timeString}. Expected HH:MM or HH:MM:SS`);
  };
  
  // This is a super-simplified approach focusing on the core issue
  const handleTimeUpdate = async (record) => {
    try {
      // Close modal immediately
      setShowEditModal(false);
      setLoading(true);
      
      console.log(`Updating therapy time for record ${record.id}:`);
      console.log(`Current time: ${record.therapy_time} → New time: ${therapyTime}`);
      
      // Validate
      if (!therapyTime || !record?.id) {
        throw new Error('Invalid time or record');
      }
      
      // Format time properly
      let formattedTime = therapyTime;
      if (therapyTime.length === 5 && therapyTime.includes(':')) {
        formattedTime = `${therapyTime}:00`;
      }
      
      // First-try approach: Simple direct update with database reload
      await supabase
        .from('daily_therapy_records')
        .update({
          therapy_time: formattedTime,
          // These two fields ensure the database sees this as a true change
          updated_at: new Date().toISOString(),
          update_id: `update-${Date.now()}`
        })
        .eq('id', record.id);
      
      // Clean up UI state
      setEditingRecord(null);
      setTherapyTime('');
      
      // Force database reload - CRITICAL STEP
      // We must reload everything from the database to see updates
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay 
      await loadDailyRecords();
        
      toast.success('Therapy time updated successfully!');
      
      // Force page re-render to ensure UI reflects updates
      setTimeout(() => {
        // This is just to trigger a re-render
        setSelectedDate(prev => new Date(prev.getTime()));
      }, 1000);
    } catch (error) {
      console.error('Error updating time:', error);
      toast.error('Failed to update therapy time');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    if (!record?.id) {
      console.error('Invalid record:', record);
      toast.error('Invalid record');
      return;
    }

    console.log('Setting therapy time in modal:', record.therapy_time);
    setEditingRecord(record);
    setTherapyTime(record.therapy_time || '');
    setShowEditModal(true);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      console.log('Deleting record with ID:', record.id);
      await deleteDailyRecord(record.id);
      toast.success('Record deleted successfully');
      
      // Refresh the data
      setTimeout(async () => {
        await loadDailyRecords();
        
        // Also refresh available therapies if a patient is selected
        if (selectedPatient?.id && selectedDate) {
          const formattedDate = format(selectedDate, 'yyyy-MM-dd');
          try {
            const therapies = await getAvailableTherapies(
              selectedPatient.id,
              formattedDate
            );
            setAvailableTherapies(Array.isArray(therapies) ? therapies : []);
          } catch (refreshError) {
            console.error('Error refreshing therapies after delete:', refreshError);
          }
        }
      }, 500); // Small delay to ensure database operation completes
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record: ' + (error.message || 'Unknown error'));
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

  const renderEditModal = () => (
    <Dialog open={showEditModal} handler={() => setShowEditModal(false)}>
      <DialogHeader>Update Therapy Time</DialogHeader>
      <DialogBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Therapy Time
            </label>
            <input
              type="time"
              value={therapyTime}
              onChange={(e) => {
                console.log('Setting therapy time in modal:', e.target.value);
                setTherapyTime(e.target.value);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="text"
          color="gray"
          onClick={() => {
            setShowEditModal(false);
            setEditingRecord(null);
            setTherapyTime('');
          }}
          className="mr-1"
        >
          Cancel
        </Button>
        <Button
          color="blue"
          onClick={() => handleTimeUpdate(editingRecord)}
          disabled={!therapyTime || loading}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogFooter>
    </Dialog>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Calendar Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-500" />
          Select Date
        </h2>
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date)}
          dateFormat="MMMM d, yyyy"
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Patient Search Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaSearch className="text-blue-500" />
          Search Patient
        </h2>
        <div className="relative">
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, phone, or ID..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchLoading && (
              <div className="absolute right-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <div className="font-medium">{patient.name || 'No Name'}</div>
                        <div className="text-sm text-gray-500">
                          {patient.phone || 'No Phone'} • ID: {patient.id}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchTerm && !searchLoading && searchResults.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border p-3 text-center text-gray-500">
              No patients found
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
                doctors={doctors}
                discountGivers={discountGivers}
                referrers={referrers}
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

      {renderEditModal()}
    </div>
  );
};

export default DailyRecords;
