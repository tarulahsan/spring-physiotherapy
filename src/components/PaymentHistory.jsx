import React from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const PaymentHistory = ({ invoices }) => {
  const chartData = invoices.map(invoice => ({
    date: format(new Date(invoice.date), 'MMM dd'),
    amount: invoice.amount,
    status: invoice.status
  }));

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Payment History</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="amount"
              fill="#8884d8"
              name="Payment Amount"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Recent Payments</h4>
        <div className="space-y-2">
          {invoices.slice(0, 5).map((invoice, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span>{format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
              <span className="font-medium">${invoice.amount}</span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {invoice.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
