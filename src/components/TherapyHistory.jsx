import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const TherapyHistory = ({ therapies, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="w-full p-4 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-[300px] bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-white rounded-lg shadow-md">
        <div className="text-red-500">
          <h3 className="text-lg font-semibold mb-2">Error Loading Therapy History</h3>
          <p>{error.message || 'An error occurred while loading the therapy history.'}</p>
        </div>
      </div>
    );
  }

  if (!therapies?.length) {
    return (
      <div className="w-full p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">No Therapy History</h3>
        <p className="text-gray-600">No therapy sessions have been recorded yet.</p>
      </div>
    );
  }

  const chartData = therapies.map(therapy => ({
    date: format(parseISO(therapy.session_date), 'MMM dd'),
    painLevel: therapy.pain_level || 0,
    progressLevel: therapy.progress_level || 0,
    therapyName: therapy.therapy_type?.name || 'Unknown Therapy'
  }));

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Therapy Progress</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 10]} 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Level', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-sm text-red-500">
                        Pain Level: {payload[0].value}
                      </p>
                      <p className="text-sm text-green-500">
                        Progress Level: {payload[1].value}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payload[0].payload.therapyName}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="painLevel"
              stroke="#ef4444"
              name="Pain Level"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="progressLevel"
              stroke="#22c55e"
              name="Progress Level"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TherapyHistory;
