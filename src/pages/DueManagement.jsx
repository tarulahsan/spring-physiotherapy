import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { format, startOfToday, parseISO } from 'date-fns';
import { FaSearch, FaMoneyBillWave, FaUserCircle, FaCalendarAlt } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import invoiceApi from '../api/invoiceApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard = ({ icon: Icon, title, value, subtitle, className }) => (
  <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-3 bg-blue-100 rounded-full">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

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
              Patient: <span className="font-medium">{invoice.patient?.name}</span>
            </p>
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

export default function DueManagement() {
  const [dueData, setDueData] = useState({
    totalDue: 0,
    todayDue: 0,
    totalDueInvoices: 0,
    patientDues: [],
    dueByDate: [],
    recentDueInvoices: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'desc' });

  useEffect(() => {
    loadDueData();
  }, []);

  // Apply search filter
  useEffect(() => {
    if (!dueData.recentDueInvoices) return;
    
    const filtered = dueData.recentDueInvoices.filter(invoice => {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.patient?.name?.toLowerCase().includes(searchLower) ||
        invoice.patient?.phone?.includes(searchTerm) ||
        invoice.id?.toLowerCase().includes(searchLower) ||
        format(parseISO(invoice.invoice_date), 'yyyy-MM-dd').includes(searchTerm)
      );
    });

    // Apply sorting
    const sortedInvoices = [...filtered].sort((a, b) => {
      if (sortConfig.key === 'invoice_date') {
        return sortConfig.direction === 'asc' 
          ? parseISO(a.invoice_date) - parseISO(b.invoice_date)
          : parseISO(b.invoice_date) - parseISO(a.invoice_date);
      }
      if (sortConfig.key === 'due_amount') {
        return sortConfig.direction === 'asc'
          ? a.due_amount - b.due_amount
          : b.due_amount - a.due_amount;
      }
      return 0;
    });

    setFilteredInvoices(sortedInvoices);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, dueData.recentDueInvoices, sortConfig]);

  const loadDueData = async () => {
    try {
      setLoading(true);
      const today = format(startOfToday(), 'yyyy-MM-dd');

      // Get all due invoices
      let { data: dueInvoices } = await supabase
        .from('invoices')
        .select(`
          *,
          patient:patient_id (
            name,
            phone
          )
        `)
        .gt('due_amount', 0)
        .order('created_at', { ascending: false });

      if (!dueInvoices) dueInvoices = [];

      // Calculate total due
      const totalDue = dueInvoices.reduce((sum, inv) => sum + (inv.due_amount || 0), 0);

      // Get today's due
      const todayDue = dueInvoices
        .filter(inv => inv.invoice_date === today)
        .reduce((sum, inv) => sum + (inv.due_amount || 0), 0);

      // Calculate patient-wise dues
      const patientDuesMap = dueInvoices.reduce((acc, inv) => {
        const patientName = inv.patient?.name || 'Unknown';
        acc[patientName] = (acc[patientName] || 0) + (inv.due_amount || 0);
        return acc;
      }, {});

      const patientDues = Object.entries(patientDuesMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate due by date
      const dueByDate = dueInvoices.reduce((acc, inv) => {
        const date = inv.invoice_date;
        acc[date] = (acc[date] || 0) + (inv.due_amount || 0);
        return acc;
      }, {});

      const dueByDateArray = Object.entries(dueByDate)
        .map(([date, amount]) => ({
          date: format(parseISO(date), 'MMM dd'),
          amount
        }))
        .sort((a, b) => parseISO(b.date) - parseISO(a.date))
        .slice(0, 7)
        .reverse();

      setDueData({
        totalDue,
        todayDue,
        totalDueInvoices: dueInvoices.length,
        patientDues,
        dueByDate: dueByDateArray,
        recentDueInvoices: dueInvoices
      });
    } catch (error) {
      console.error('Error loading due data:', error);
      toast.error('Failed to load due data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get current invoices for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handlePaymentClick = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePaymentConfirm = async (amount) => {
    try {
      await invoiceApi.recordPayment(selectedInvoice.id, amount);
      toast.success('Payment recorded successfully');
      setSelectedInvoice(null);
      loadDueData(); // Refresh the data
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FaMoneyBillWave}
          title="Total Due Amount"
          value={`৳${dueData.totalDue.toLocaleString()}`}
          className="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          icon={FaCalendarAlt}
          title="Today's Due"
          value={`৳${dueData.todayDue.toLocaleString()}`}
          className="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          icon={FaUserCircle}
          title="Due Invoices"
          value={dueData.totalDueInvoices}
          className="bg-gradient-to-br from-purple-50 to-purple-100"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Due Invoices</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, phone, or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('invoice_date')}
                >
                  Date {sortConfig.key === 'invoice_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('due_amount')}
                >
                  Due Amount {sortConfig.key === 'due_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.patient?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.patient?.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ৳{invoice.due_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handlePaymentClick(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Record Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onConfirm={handlePaymentConfirm}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Due by Patient Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Patients by Due Amount</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dueData.patientDues}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, value }) => `${name}: ৳${value.toLocaleString()}`}
                >
                  {dueData.patientDues.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Due by Date Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Due Amount by Date</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dueData.dueByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
