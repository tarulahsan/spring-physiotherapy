import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfToday, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import {
  FaUsers, FaMoneyBillWave, FaHandHoldingUsd, FaPercentage,
  FaUserCircle, FaCalendarAlt, FaArrowUp, FaArrowDown,
  FaClock, FaReceipt, FaChartPie, FaChartLine,
  FaChartBar, FaUserFriends, FaStethoscope, FaChevronLeft, FaChevronRight,
  FaCalendarCheck
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import patientApi from '../api/patientApi';
import invoiceApi from '../api/invoiceApi';
import { getDailyRecords } from '../api/dailyRecords';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF69B4'];

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
  <div className="p-4 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('-600', '-100')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-1">
        {trend > 0 ? (
          <FaArrowUp className="text-green-500 mr-1 w-3 h-3" />
        ) : (
          <FaArrowDown className="text-red-500 mr-1 w-3 h-3" />
        )}
        <span className={`text-xs ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
          {Math.abs(trend)}% from last month
        </span>
      </div>
    )}
  </div>
);

const AppointmentCard = ({ appointment }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <FaUserCircle className="text-blue-500 w-5 h-5" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{appointment.patients.name}</h3>
          <p className="text-xs text-gray-500">{appointment.therapy_types.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-gray-900">{appointment.therapy_time}</p>
        <p className="text-xs text-gray-500">৳{appointment.therapy_types.price}</p>
      </div>
    </div>
  </div>
);

const RecentInvoiceCard = ({ invoice }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <FaReceipt className="text-purple-500 w-4 h-4" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{invoice.patient?.name}</h3>
          <p className="text-xs text-gray-500">
            {format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-gray-900">৳{invoice.total_amount.toLocaleString()}</p>
        <p className={`text-xs ${invoice.due_amount > 0 ? 'text-red-500' : 'text-green-500'}`}>
          {invoice.due_amount > 0 
            ? `Due: ৳${invoice.due_amount.toLocaleString()}`
            : 'Paid'
          }
        </p>
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? 
              `৳${entry.value.toLocaleString()}` : 
              entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PaginationButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-1 rounded ${
      disabled
        ? 'text-gray-400 cursor-not-allowed'
        : 'text-purple-600 hover:bg-purple-50 active:bg-purple-100'
    }`}
  >
    {children}
  </button>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-center space-x-2 text-sm">
    <PaginationButton
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage <= 1}
    >
      <FaChevronLeft className="w-4 h-4" />
    </PaginationButton>
    <span className="text-gray-600">
      Page {currentPage} of {totalPages}
    </span>
    <PaginationButton
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage >= totalPages}
    >
      <FaChevronRight className="w-4 h-4" />
    </PaginationButton>
  </div>
);

const TopTherapyCard = ({ title, icon: Icon, therapies, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-lg">
    <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
      <Icon className={`mr-2 text-${color}-500`} />
      {title}
    </h2>
    <div className="space-y-3">
      {therapies.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No therapies found</p>
      ) : (
        therapies.map((therapy, index) => (
          <div 
            key={therapy.name} 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center`}>
                <span className="text-sm font-semibold text-gray-700">#{index + 1}</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800">{therapy.name}</h3>
                <p className="text-xs text-gray-500">{therapy.count} sessions</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full bg-${color}-100 text-${color}-600 text-xs font-medium`}>
              {therapy.percentage}%
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalDue: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [topDuePatients, setTopDuePatients] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [therapyDistribution, setTherapyDistribution] = useState([]);
  const [topTherapies, setTopTherapies] = useState({
    daily: [],
    weekly: [],
    monthly: []
  });
  
  // Pagination states
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const calculateTopTherapies = (records) => {
    // Count therapy occurrences
    const therapyCount = records.reduce((acc, record) => {
      const therapyName = record.therapy_types.name;
      acc[therapyName] = (acc[therapyName] || 0) + 1;
      return acc;
    }, {});

    // Calculate total sessions
    const totalSessions = Object.values(therapyCount).reduce((sum, count) => sum + count, 0);

    // Convert to array and sort by count
    return Object.entries(therapyCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalSessions) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = format(startOfToday(), 'yyyy-MM-dd');

      // Load patients with dues
      const patients = await patientApi.getPatients();
      
      // Load invoices
      const { data: invoices } = await invoiceApi.getInvoices();
      
      // Load today's appointments
      const appointments = await getDailyRecords(today);

      // Load records for weekly and monthly calculations
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Filter records for different time ranges
      const dailyRecords = appointments || [];
      const weeklyRecords = appointments?.filter(record => {
        const date = record.therapy_date;
        return date >= weekStart && date <= weekEnd;
      }) || [];
      const monthlyRecords = appointments?.filter(record => {
        const date = record.therapy_date;
        return date >= monthStart && date <= monthEnd;
      }) || [];

      // Calculate top therapies for each time range
      setTopTherapies({
        daily: calculateTopTherapies(dailyRecords),
        weekly: calculateTopTherapies(weeklyRecords),
        monthly: calculateTopTherapies(monthlyRecords)
      });

      // Calculate stats
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;
      const totalDue = invoices?.reduce((sum, inv) => sum + (inv.due_amount || 0), 0) || 0;

      // Calculate top due patients
      const patientDues = patients
        .map(patient => ({
          name: patient.name,
          amount: patient.total_due
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Generate revenue data for the last 7 days
      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        const dayInvoices = invoices?.filter(inv => 
          format(parseISO(inv.invoice_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ) || [];
        
        return {
          date: format(date, 'MMM dd'),
          revenue: dayInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
          due: dayInvoices.reduce((sum, inv) => sum + (inv.due_amount || 0), 0)
        };
      }).reverse();

      // Calculate therapy distribution from today's appointments
      const therapyCount = appointments?.reduce((acc, curr) => {
        const therapyName = curr.therapy_types.name;
        acc[therapyName] = (acc[therapyName] || 0) + 1;
        return acc;
      }, {});

      const therapyData = Object.entries(therapyCount || {}).map(([name, value]) => ({
        name,
        value
      }));

      setStats({
        totalPatients: patients?.length || 0,
        totalInvoices: invoices?.length || 0,
        totalRevenue,
        totalDue
      });

      // Store all data and set initial page
      setAllAppointments(appointments || []);
      setAllInvoices(invoices || []);
      setTodayAppointments(appointments?.slice(0, itemsPerPage) || []);
      setRecentInvoices(invoices?.slice(0, itemsPerPage) || []);
      setTopDuePatients(patientDues);
      setRevenueData(last7DaysData);
      setTherapyDistribution(therapyData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle page changes
  const handleAppointmentPageChange = (page) => {
    const startIndex = (page - 1) * itemsPerPage;
    setAppointmentPage(page);
    setTodayAppointments(allAppointments.slice(startIndex, startIndex + itemsPerPage));
  };

  const handleInvoicePageChange = (page) => {
    const startIndex = (page - 1) * itemsPerPage;
    setInvoicePage(page);
    setRecentInvoices(allInvoices.slice(startIndex, startIndex + itemsPerPage));
  };

  // Calculate total pages
  const totalAppointmentPages = Math.ceil(allAppointments.length / itemsPerPage);
  const totalInvoicePages = Math.ceil(allInvoices.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaStethoscope className="mr-2 text-blue-500" />
          Dashboard
        </h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            icon={FaUsers}
            title="Total Patients"
            value={stats.totalPatients}
            color="text-blue-600"
          />
          <StatCard
            icon={FaHandHoldingUsd}
            title="Total Invoices"
            value={stats.totalInvoices}
            color="text-green-600"
          />
          <StatCard
            icon={FaMoneyBillWave}
            title="Total Revenue"
            value={`৳${stats.totalRevenue.toLocaleString()}`}
            color="text-purple-600"
          />
          <StatCard
            icon={FaPercentage}
            title="Total Due"
            value={`৳${stats.totalDue.toLocaleString()}`}
            color="text-red-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Revenue Trend Chart */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-blue-500" />
              Revenue Trend (Last 7 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="due"
                    stackId="1"
                    stroke="#FF8042"
                    fill="#FF8042"
                    name="Due"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Due Patients */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
              <FaChartBar className="mr-2 text-purple-500" />
              Top Due Patients
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDuePatients}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" name="Due Amount" fill="#8884d8">
                    {topDuePatients.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Therapies Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <TopTherapyCard
            title="Top Daily Therapies"
            icon={FaCalendarAlt}
            therapies={topTherapies.daily}
            color="blue"
          />
          <TopTherapyCard
            title="Top Weekly Therapies"
            icon={FaCalendarCheck}
            therapies={topTherapies.weekly}
            color="purple"
          />
          <TopTherapyCard
            title="Top Monthly Therapies"
            icon={FaChartBar}
            therapies={topTherapies.monthly}
            color="green"
          />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" />
                Today's Appointments
              </h2>
              <span className="text-xs text-gray-500">
                {format(new Date(), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="space-y-2">
              {todayAppointments.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No appointments for today</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {todayAppointments.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                  {allAppointments.length > itemsPerPage && (
                    <div className="mt-4 pt-3 border-t">
                      <Pagination
                        currentPage={appointmentPage}
                        totalPages={totalAppointmentPages}
                        onPageChange={handleAppointmentPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800 flex items-center">
                <FaReceipt className="mr-2 text-purple-500" />
                Recent Invoices
              </h2>
              <button
                onClick={() => navigate('/invoices')}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {recentInvoices.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No recent invoices</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {recentInvoices.map((invoice) => (
                      <RecentInvoiceCard key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                  {allInvoices.length > itemsPerPage && (
                    <div className="mt-4 pt-3 border-t">
                      <Pagination
                        currentPage={invoicePage}
                        totalPages={totalInvoicePages}
                        onPageChange={handleInvoicePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Therapy Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
              <FaChartPie className="mr-2 text-green-500" />
              Today's Therapy Distribution
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={therapyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {therapyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
