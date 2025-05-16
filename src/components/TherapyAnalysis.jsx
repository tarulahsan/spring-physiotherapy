import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  FaChartLine, FaFilter, FaSearch, FaAngleDown, FaAngleUp,
  FaUserCircle, FaCalendarAlt, FaClock, FaMoneyBillWave,
  FaUsers, FaSortAmountDown, FaSortAmountUp, FaInfoCircle,
  FaChartBar, FaStethoscope, FaProcedures, FaHospital,
  FaCheckCircle, FaExclamationTriangle, FaSpinner,
  FaTimesCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getAllTherapyRecords, getFilteredTherapyRecords, getTherapyRecordsGroupedByType } from '../api/therapyAnalysisApi';

const TherapyAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [therapyData, setTherapyData] = useState([]);
  const [expandedTherapy, setExpandedTherapy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter options with icons and colors
  const filterOptions = [
    { id: 'all', label: 'All Time', icon: <FaChartBar />, color: 'bg-gradient-to-r from-purple-600 to-blue-600' },
    { id: 'daily', label: 'Daily', icon: <FaCalendarAlt />, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { id: 'weekly', label: 'Weekly', icon: <FaChartLine />, color: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    { id: 'monthly', label: 'Monthly', icon: <FaChartBar />, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { id: 'sixMonth', label: '6 Months', icon: <FaChartLine />, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { id: 'yearly', label: 'Yearly', icon: <FaChartBar />, color: 'bg-gradient-to-r from-pink-500 to-rose-500' }
  ];

  useEffect(() => {
    loadTherapyData();
  }, [activeFilter]);

  const loadTherapyData = async () => {
    try {
      setLoading(true);
      
      // Use the appropriate API based on filter
      const therapyGroups = await getTherapyRecordsGroupedByType();
      setTherapyData(therapyGroups);
      toast.success('Therapy analysis data loaded successfully');
    } catch (error) {
      console.error('Error loading therapy analysis data:', error);
      toast.error('Failed to load therapy analysis data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setExpandedTherapy(null); // Close any expanded therapy when changing filter
  };

  const handleTherapyExpand = (therapyId) => {
    setExpandedTherapy(expandedTherapy === therapyId ? null : therapyId);
  };

  const handlePatientClick = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Search and sort the therapy data
  const filteredAndSortedTherapies = therapyData
    .filter(therapy => 
      therapy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapy.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Handle special case for patient count
      if (sortField === 'patientCount') {
        valueA = a.patients.length;
        valueB = b.patients.length;
      }
      
      // Handle string comparison
      if (typeof valueA === 'string') {
        if (sortDirection === 'asc') {
          return valueA.localeCompare(valueB);
        }
        return valueB.localeCompare(valueA);
      }
      
      // Handle number comparison
      if (sortDirection === 'asc') {
        return valueA - valueB;
      }
      return valueB - valueA;
    });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaSpinner className="animate-spin text-blue-500 text-xl" />
          <h2 className="text-xl font-bold text-gray-800">Loading Therapy Analysis...</h2>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
              <div className="p-4 bg-gray-50">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                
                <div className="flex justify-between mt-4">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header and Search Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaChartLine className="mr-2 text-blue-500" />
            Therapy Analysis
          </h2>
        </div>
        
        {/* Search Input - Full Width */}
        <div className="relative w-full mb-6">
          <div className="flex items-center bg-gray-50 p-1 rounded-xl shadow-sm border border-gray-200">
            <FaSearch className="text-blue-500 mx-3 text-lg" />
            <input
              type="text"
              placeholder="Search therapies by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 px-2 bg-transparent rounded-lg focus:outline-none text-gray-700 placeholder-gray-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mr-3 p-1 rounded-full hover:bg-gray-200"
              >
                <FaTimesCircle className="text-gray-500 hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-2">
          <div className="flex space-x-2 mx-auto">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                className={`px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  activeFilter === option.id
                    ? `${option.color} text-white font-medium shadow-md scale-105`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange(option.id)}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-600 flex items-center">
          <FaFilter className="mr-1" /> Sort by:
        </span>
        {[
          { id: 'name', label: 'Name' },
          { id: 'count', label: 'Session Count' },
          { id: 'patientCount', label: 'Patient Count' },
          { id: 'revenue', label: 'Revenue' }
        ].map((option) => (
          <button
            key={option.id}
            className={`px-3 py-1 text-sm rounded-lg flex items-center ${
              sortField === option.id
                ? 'bg-gray-200 text-gray-800 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleSort(option.id)}
          >
            {option.label}
            {sortField === option.id && (
              sortDirection === 'asc' 
                ? <FaSortAmountUp className="ml-1" />
                : <FaSortAmountDown className="ml-1" />
            )}
          </button>
        ))}
      </div>

      {/* Therapy List */}
      {filteredAndSortedTherapies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No therapy data found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTherapies.map((therapy) => (
            <div 
              key={therapy.id}
              className={`border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${therapy.needsAttention ? 'border-l-4 border-l-amber-500' : ''}`}
            >
              {/* Therapy Summary Row - Always visible */}
              <div 
                className={`p-4 ${expandedTherapy === therapy.id ? 'bg-blue-50 border-b-2 border-blue-200' : 'bg-gradient-to-r from-gray-50 to-white'} flex flex-wrap md:flex-nowrap items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors duration-200`}
                onClick={() => handleTherapyExpand(therapy.id)}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {therapy.needsAttention ? 
                        <FaExclamationTriangle className="text-amber-500" /> : 
                        <FaStethoscope className="text-blue-600" />
                      }
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 truncate">
                      {therapy.name}
                    </h3>
                    {therapy.needsAttention && (
                      <div className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                        Needs configuration
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate ml-10">{therapy.description || 'No description available'}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-lg min-w-[80px]">
                    <div className="text-sm text-blue-600 font-medium flex items-center justify-center gap-1">
                      <FaCalendarAlt className="text-xs" /> Sessions
                    </div>
                    <div className="font-bold text-gray-800">{therapy.count}</div>
                  </div>
                  
                  <div className="text-center p-2 bg-green-50 rounded-lg min-w-[80px]">
                    <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                      <FaUsers className="text-xs" /> Patients
                    </div>
                    <div className="font-bold text-gray-800">{therapy.patientCount}</div>
                  </div>
                  
                  <div className="text-center p-2 bg-purple-50 rounded-lg min-w-[80px]">
                    <div className="text-sm text-purple-600 font-medium flex items-center justify-center gap-1">
                      <FaMoneyBillWave className="text-xs" /> Revenue
                    </div>
                    <div className="font-bold text-gray-800">৳{therapy.revenue.toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center justify-center w-8 h-8">
                    {expandedTherapy === therapy.id ? <FaAngleUp /> : <FaAngleDown />}
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedTherapy === therapy.id && (
                <div className="p-6 bg-white border-t border-gray-200">
                  {/* Therapy Stats Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg shadow-md text-white">
                      <div className="flex items-center mb-2">
                        <FaCalendarAlt className="mr-2" />
                        <h5 className="font-bold">Total Sessions</h5>
                      </div>
                      <p className="text-3xl font-bold">{therapy.count}</p>
                      <p className="text-blue-100 text-sm mt-1">All time therapy sessions</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg shadow-md text-white">
                      <div className="flex items-center mb-2">
                        <FaUsers className="mr-2" />
                        <h5 className="font-bold">Unique Patients</h5>
                      </div>
                      <p className="text-3xl font-bold">{therapy.patientCount}</p>
                      <p className="text-green-100 text-sm mt-1">Different patients treated</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg shadow-md text-white">
                      <div className="flex items-center mb-2">
                        <FaMoneyBillWave className="mr-2" />
                        <h5 className="font-bold">Total Revenue</h5>
                      </div>
                      <p className="text-3xl font-bold">৳{therapy.revenue.toLocaleString()}</p>
                      <p className="text-purple-100 text-sm mt-1">Revenue from this therapy</p>
                    </div>
                  </div>
                  
                  {/* Patients Section */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-5">
                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <FaUsers className="mr-2 text-blue-500" />
                      Patients Who Received This Therapy
                    </h4>
                  
                    {therapy.records.length === 0 ? (
                      <div className="py-8 text-center bg-white rounded-lg border border-gray-200">
                        <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-3" />
                        <p className="text-gray-500">No patient records found for this therapy.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {therapy.records.slice(0, 5).map((record) => (
                              <tr key={record.id} className="hover:bg-blue-50 transition-colors duration-150">
                                 <td className="px-4 py-3 whitespace-nowrap">
                                  <div 
                                    className={`flex items-center ${record.patients?.id ? 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline' : 'text-gray-500'} transition-colors duration-150`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (record.patients?.id) {
                                        handlePatientClick(record.patients.id);
                                      }
                                    }}
                                  >
                                    <div className={`w-8 h-8 rounded-full ${record.patients?.id ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center mr-2`}>
                                      <FaUserCircle className={record.patients?.id ? 'text-blue-500' : 'text-gray-400'} />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {record.patients?.name || 'Unnamed Patient'}
                                        {!record.patients?.id && (
                                          <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                                            Missing Link
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">{record.patients?.phone || 'No contact information'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center bg-blue-50 p-1 px-2 rounded-lg text-blue-800 text-sm inline-flex">
                                    <FaCalendarAlt className="mr-2 text-blue-500" />
                                    {format(parseISO(record.therapy_date), 'MMM dd, yyyy')}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center bg-green-50 p-1 px-2 rounded-lg text-green-800 text-sm inline-flex">
                                    <FaClock className="mr-2 text-green-500" />
                                    {record.therapy_time}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center bg-purple-50 p-1 px-2 rounded-lg text-purple-800 text-sm font-medium inline-flex">
                                    <FaMoneyBillWave className="mr-2 text-purple-500" />
                                    ৳{record.therapy_types?.price?.toLocaleString() || '0'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {therapy.records.length > 5 && (
                          <div className="py-3 px-4 bg-gray-50 border-t border-gray-200 text-right">
                            <button 
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm font-medium inline-flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Full patient list will be available in a future update');
                              }}
                            >
                              <FaUsers className="mr-2" />
                              View all {therapy.records.length} records
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TherapyAnalysis;
