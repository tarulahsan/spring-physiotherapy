import React, { useState, useEffect } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaStethoscope,
  FaMoneyBillWave,
  FaInfoCircle,
  FaSave,
  FaTimes,
  FaClock,
  FaCheck,
  FaExclamationCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import therapyApi from '../api/therapyApi';

const Therapy = () => {
  const [therapies, setTherapies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    status: 'active'
  });

  useEffect(() => {
    fetchTherapies();
  }, []);

  const fetchTherapies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await therapyApi.getAllTherapies();
      setTherapies(data || []);
    } catch (error) {
      console.error('Error fetching therapies:', error);
      setError(error.message || 'Failed to fetch therapies');
      toast.error('Failed to fetch therapies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const therapyData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        price: parseFloat(formData.price) || 0,
        duration: formData.duration ? parseInt(formData.duration) : null,
        status: formData.status || 'active'
      };

      if (showEditModal) {
        await therapyApi.updateTherapy(selectedTherapy.id, therapyData);
        toast.success('Therapy updated successfully');
      } else {
        await therapyApi.createTherapy(therapyData);
        toast.success('Therapy created successfully');
      }
      fetchTherapies();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving therapy:', error);
      toast.error(error.message || 'Failed to save therapy');
    }
  };

  const handleDelete = async (therapy) => {
    if (window.confirm('Are you sure you want to delete this therapy?')) {
      try {
        await therapyApi.deleteTherapy(therapy.id);
        toast.success('Therapy deleted successfully');
        fetchTherapies();
      } catch (error) {
        console.error('Error deleting therapy:', error);
        toast.error('Failed to delete therapy');
      }
    }
  };

  const handleEdit = (therapy) => {
    setSelectedTherapy(therapy);
    setFormData({
      name: therapy.name,
      description: therapy.description,
      price: therapy.price,
      duration: therapy.duration,
      status: therapy.status
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedTherapy(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      status: 'active'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaExclamationCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Therapies</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchTherapies}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Therapy Management
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add New Therapy</span>
        </button>
      </div>

      {/* Therapy List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapies.map((therapy) => (
          <div
            key={therapy.id}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{therapy.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(therapy)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(therapy)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">{therapy.description || 'No description available'}</p>
              
              <div className="flex items-center text-gray-700">
                <FaMoneyBillWave className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-medium">৳{therapy.price}</span>
              </div>
              
              {therapy.duration && (
                <div className="flex items-center text-gray-700">
                  <FaClock className="w-5 h-5 text-orange-500 mr-2" />
                  <span>{therapy.duration} minutes</span>
                </div>
              )}
              
              <div className="flex items-center">
                <div className={`px-3 py-1 rounded-full text-sm ${
                  therapy.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {therapy.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl transform transition-all hover:scale-[1.02] duration-300">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white flex items-center">
                {showEditModal ? (
                  <>
                    <FaEdit className="mr-2" />
                    Edit Therapy
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    Add New Therapy
                  </>
                )}
              </h2>
              <button 
                onClick={handleCloseModal} 
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Name Field */}
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg border border-gray-100">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FaStethoscope className="w-5 h-5 text-blue-500 mr-2" />
                      Therapy Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="Enter therapy name"
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg border border-gray-100">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FaInfoCircle className="w-5 h-5 text-purple-500 mr-2" />
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="Enter therapy description"
                    />
                  </div>
                </div>

                {/* Price Field */}
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg border border-gray-100">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FaMoneyBillWave className="w-5 h-5 text-green-500 mr-2" />
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">৳</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-8 transition-colors"
                        required
                        placeholder="Enter price"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Field */}
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg border border-gray-100">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FaClock className="w-5 h-5 text-orange-500 mr-2" />
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="Enter duration (optional)"
                      min="0"
                    />
                  </div>
                </div>

                {/* Status Field */}
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg border border-gray-100">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FaCheck className="w-5 h-5 text-teal-500 mr-2" />
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center transform hover:scale-105 duration-200"
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center transform hover:scale-105 duration-200 shadow-lg"
                >
                  {showEditModal ? (
                    <>
                      <FaSave className="mr-2" />
                      Update
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Create
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
};

export default Therapy;
