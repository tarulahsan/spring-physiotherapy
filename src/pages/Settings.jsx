import React, { useState, useEffect } from 'react';
import { 
  FaUpload, 
  FaSave, 
  FaPlus, 
  FaTrash, 
  FaHospital, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaUserMd,
  FaStethoscope,
  FaUserNurse,
  FaBuilding,
  FaCog,
  FaIdCard,
  FaUserTie,
  FaUser,
  FaUserFriends
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { settingsApi } from '../api/settingsApi';
import ReferrerManager from '../components/ReferrerManager';

const Settings = () => {
  const [settings, setSettings] = useState({
    business_name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: null,
    id: null,
    discountGivers: [],
    doctors: []
  });

  const [newDiscountGiver, setNewDiscountGiver] = useState({ 
    name: ''
  });
  const [newDoctor, setNewDoctor] = useState({ 
    name: '', 
    specialization: '', 
    phone: ''
  });
  const [activeTab, setActiveTab] = useState('business');

  const tabs = [
    { id: 'business', label: 'Business', icon: <FaBuilding /> },
    { id: 'doctors', label: 'Doctors', icon: <FaUserMd /> },
    { id: 'discountGivers', label: 'Discount Givers', icon: <FaUserTie /> },
    { id: 'referrers', label: 'Referrers', icon: <FaUserFriends /> }
  ];

  useEffect(() => {
    fetchBusinessSettings();
    fetchDoctors();
    fetchDiscountGivers();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const data = await settingsApi.getBusinessSettings();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
      toast.error('Failed to load business settings');
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await settingsApi.getDoctors();
      if (data) {
        setSettings(prev => ({ ...prev, doctors: data }));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const fetchDiscountGivers = async () => {
    try {
      const data = await settingsApi.getDiscountGivers();
      if (data) {
        setSettings(prev => ({ ...prev, discountGivers: data }));
      }
    } catch (error) {
      console.error('Error fetching discount givers:', error);
      toast.error('Failed to load discount givers');
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Update local state
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));

    if (!settings.id) {
      toast.error('Business settings not initialized');
      return;
    }

    try {
      // Only send the changed field and ID
      const updateData = {
        id: settings.id,
        [name]: value
      };
      
      await settingsApi.updateBusinessSettings(updateData);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating business settings:', error);
      toast.error('Failed to update business settings');
      
      // Revert local state on error
      setSettings(prev => ({
        ...prev,
        [name]: prev[name]
      }));
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!settings.id) {
      toast.error('Business settings not initialized');
      return;
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size should be less than 5MB');
        return;
      }

      try {
        const logoUrl = await settingsApi.uploadLogo(file);
        
        // Force a refresh of the business settings to get the new logo URL
        await fetchBusinessSettings();
        
        toast.success('Logo uploaded successfully');
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo');
      }
    }
  };

  const handleAddDiscountGiver = async () => {
    if (newDiscountGiver.name.trim()) {
      try {
        const data = await settingsApi.createDiscountGiver({ 
          name: newDiscountGiver.name,
          status: 'active'
        });
        setSettings(prev => ({ ...prev, discountGivers: [...prev.discountGivers, data] }));
        setNewDiscountGiver({ name: '' });
        toast.success('Discount giver added successfully');
      } catch (error) {
        console.error('Error adding discount giver:', error);
        toast.error('Failed to add discount giver');
      }
    } else {
      toast.error('Please enter a name for the discount giver');
    }
  };

  const handleRemoveDiscountGiver = async (id) => {
    try {
      await settingsApi.deleteDiscountGiver(id);
      setSettings(prev => ({ 
        ...prev, 
        discountGivers: prev.discountGivers.filter(giver => giver.id !== id) 
      }));
      toast.success('Discount giver removed successfully');
    } catch (error) {
      console.error('Error removing discount giver:', error);
      toast.error('Failed to remove discount giver');
    }
  };

  const handleAddDoctor = async () => {
    if (newDoctor.name.trim() && newDoctor.specialization.trim()) {
      try {
        const data = await settingsApi.addDoctor({ ...newDoctor });
        setSettings(prev => ({ ...prev, doctors: [...prev.doctors, data] }));
        setNewDoctor({ name: '', specialization: '', phone: '' });
        toast.success('Doctor added successfully');
      } catch (error) {
        console.error('Error adding doctor:', error);
        toast.error('Failed to add doctor');
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleRemoveDoctor = async (id) => {
    try {
      await settingsApi.removeDoctor(id);
      setSettings(prev => ({ ...prev, doctors: prev.doctors.filter(doctor => doctor.id !== id) }));
      toast.success('Doctor removed successfully');
    } catch (error) {
      console.error('Error removing doctor:', error);
      toast.error('Failed to remove doctor');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FaCog className="text-3xl text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'business' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaBuilding className="text-2xl text-primary" />
            <h2 className="text-xl font-semibold">Business Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-gray-700 mb-2">
                <FaHospital className="text-primary" />
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={settings.business_name}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-700 mb-2">
                <FaMapMarkerAlt className="text-primary" />
                Address
              </label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-700 mb-2">
                <FaPhone className="text-primary" />
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-700 mb-2">
                <FaEnvelope className="text-primary" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-700 mb-2">
                <FaUpload className="text-primary" />
                Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Business Logo"
                    className="w-16 h-16 object-contain"
                  />
                )}
                <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
                  <FaUpload className="inline-block mr-2 text-primary" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaUserMd className="text-2xl text-primary" />
            <h2 className="text-xl font-semibold">Doctor Management</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <FaUserMd className="text-primary" />
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Doctor's Name"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <FaStethoscope className="text-primary" />
                  Specialization
                </label>
                <input
                  type="text"
                  placeholder="Specialization"
                  value={newDoctor.specialization}
                  onChange={(e) => setNewDoctor(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <FaPhone className="text-primary" />
                  Phone
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 border rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={handleAddDoctor}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {settings.doctors.map(doctor => (
                <div key={doctor.id} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex gap-3">
                    <FaUserMd className="text-2xl text-primary mt-1" />
                    <div>
                      <div className="font-semibold">{doctor.name}</div>
                      <div className="text-gray-600">{doctor.specialization}</div>
                      {doctor.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FaPhone className="text-primary" />
                          {doctor.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDoctor(doctor.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'discountGivers' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaUserTie className="text-blue-500 mr-2" /> Discount Givers
          </h2>

          {/* Add Discount Giver Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleAddDiscountGiver(); }} className="mb-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <label className="block text-gray-700 mb-2 flex items-center">
                  <FaUser className="text-blue-500 mr-2" />
                  Name *
                </label>
                <input
                  type="text"
                  value={newDiscountGiver.name}
                  onChange={(e) => setNewDiscountGiver({ ...newDiscountGiver, name: e.target.value })}
                  className="w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
                <FaUser className="absolute left-3 top-[38px] text-gray-400" />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Discount Giver
              </button>
            </div>
          </form>

          {/* Discount Givers List */}
          <div className="space-y-4">
            {settings.discountGivers.map((giver) => (
              <div key={giver.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <FaUserTie className="text-blue-500 mr-3" />
                  <span className="font-medium">{giver.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveDiscountGiver(giver.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'referrers' && (
        <div className="mt-4">
          <ReferrerManager />
        </div>
      )}
    </div>
  );
};

export default Settings;
