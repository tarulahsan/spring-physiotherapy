// Debug component to directly view data
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugRecordDisplay() {
  const [recordId, setRecordId] = useState('');
  const [record, setRecord] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecord = async () => {
    if (!recordId) return;
    
    setLoading(true);
    try {
      // Direct database query with no abstractions
      const { data, error } = await supabase
        .from('daily_therapy_records')
        .select('*')
        .eq('id', recordId)
        .single();
        
      if (error) throw error;
      setRecord(data);
      setNewTime(data.therapy_time || '');
    } catch (err) {
      console.error('Error fetching record:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const updateTime = async () => {
    if (!recordId || !newTime) return;
    
    setLoading(true);
    try {
      // Super direct approach - raw SQL with max debug
      const { data, error } = await supabase.rpc(
        'execute_raw_sql',
        {
          sql_query: `
            UPDATE daily_therapy_records
            SET therapy_time = '${newTime}'::time,
                updated_at = now()
            WHERE id = '${recordId}'
            RETURNING id, therapy_time;
          `
        }
      );
      
      if (error) throw error;
      
      setMessage('Update successful at database level!');
      console.log('Raw update result:', data);
      
      // Force reload
      await fetchRecord();
    } catch (err) {
      console.error('Error updating time:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6">Debug Record Display</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Record ID:</label>
        <div className="flex">
          <input 
            type="text" 
            value={recordId} 
            onChange={e => setRecordId(e.target.value)}
            className="border p-2 flex-grow"
            placeholder="Enter record UUID"
          />
          <button 
            onClick={fetchRecord}
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Fetch'}
          </button>
        </div>
      </div>
      
      {record && (
        <>
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Record Data:</h2>
            <pre className="whitespace-pre-wrap">{JSON.stringify(record, null, 2)}</pre>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Update Time:</label>
            <div className="flex">
              <input 
                type="time" 
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="border p-2 flex-grow"
                step="1"
              />
              <button 
                onClick={updateTime}
                className="ml-2 bg-green-500 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Time'}
              </button>
            </div>
          </div>
        </>
      )}
      
      {message && (
        <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
