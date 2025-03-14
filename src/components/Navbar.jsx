import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../api/settingsApi';
import {
  FaHome,
  FaUsers,
  FaFileInvoiceDollar,
  FaCog,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaClinicMedical,
  FaCalendarCheck
} from 'react-icons/fa';

const NavItem = ({ to, icon: Icon, color, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center px-6 py-3 rounded-lg mb-2 transition-all duration-200 transform hover:scale-105 ${
        isActive
          ? `bg-${color}-100 text-${color}-600`
          : `text-gray-600 hover:bg-${color}-50 hover:text-${color}-500`
      }`}
    >
      <Icon className={`w-6 h-6 mr-4 ${isActive ? `text-${color}-500` : `text-${color}-400`}`} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const [businessName, setBusinessName] = useState('Spring Physiotherapy');

  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const settings = await settingsApi.getBusinessSettings();
        if (settings?.business_name) {
          setBusinessName(settings.business_name);
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
      }
    };

    fetchBusinessName();
  }, []);

  const navItems = [
    { to: '/', icon: FaHome, color: 'blue', label: 'Dashboard' },
    { to: '/patients', icon: FaUsers, color: 'green', label: 'Patients' },
    { to: '/daily-records', icon: FaCalendarCheck, color: 'emerald', label: 'Daily Records' },
    { to: '/therapy', icon: FaClinicMedical, color: 'indigo', label: 'Therapy' },
    { to: '/invoice', icon: FaFileInvoiceDollar, color: 'purple', label: 'Invoice' },
    { to: '/due-management', icon: FaMoneyBillWave, color: 'yellow', label: 'Due Management' },
    { to: '/settings', icon: FaCog, color: 'gray', label: 'Settings' },
  ];

  // If user is not admin, don't render navbar
  if (role !== 'admin') {
    return null;
  }

  // Split business name into two parts for the gradient effect
  const [firstWord, ...restWords] = businessName.split(' ');

  return (
    <nav className="bg-white w-72 min-h-screen shadow-lg sticky top-0">
      {/* Logo Section */}
      <div className="flex items-center justify-center py-6 border-b border-gray-100">
        <FaClinicMedical className="w-8 h-8 text-blue-500 mr-3" />
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {firstWord}
          </h1>
          <h2 className="text-sm text-gray-500">{restWords.join(' ')}</h2>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            color={item.color}
            label={item.label}
          />
        ))}
      </div>

      {/* Sign Out Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <button
          onClick={signOut}
          className="flex items-center w-full px-6 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-200 transform hover:scale-105"
        >
          <FaSignOutAlt className="w-6 h-6 mr-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
