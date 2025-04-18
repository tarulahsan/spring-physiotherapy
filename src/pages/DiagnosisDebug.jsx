import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const DiagnosisDebug = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [directApiData, setDirectApiData] = useState(null);
  const [supabaseData, setSupabaseData] = useState(null);

  // Load data from all possible sources to debug
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // 1. Attempt to fetch via the normal API import
        try {
          // Dynamically import to avoid any bundling issues
          const patientApiModule = await import('../api/patientApi');
          const patientApi = patientApiModule.default;
          
          console.log('patientApi module loaded:', patientApiModule);
          console.log('getPatientById exists:', typeof patientApi.getPatientById === 'function');
          
          const apiData = await patientApi.getPatientById(id);
          console.log('API data fetched:', apiData);
          setPatientData(apiData);
        } catch (apiError) {
          console.error('Error fetching via API:', apiError);
          setError(prev => ({ ...prev, apiError }));
        }

        // 2. Try to fetch from alternate API
        try {
          const patientsModule = await import('../api/patients');
          const patientApiAlt = patientsModule.patientApi;
          
          if (patientApiAlt && typeof patientApiAlt.getPatientById === 'function') {
            const directData = await patientApiAlt.getPatientById(id);
            console.log('Direct API data fetched:', directData);
            setDirectApiData(directData);
          } else {
            console.log('Alternative API not found or incompatible');
          }
        } catch (directError) {
          console.error('Error fetching directly:', directError);
          setError(prev => ({ ...prev, directError }));
        }

        // 3. Fetch directly from Supabase as a last resort
        try {
          const { data, error: supabaseError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();
            
          if (supabaseError) throw supabaseError;
          
          console.log('Supabase direct data:', data);
          setSupabaseData(data);
        } catch (supabaseError) {
          console.error('Error fetching from Supabase:', supabaseError);
          setError(prev => ({ ...prev, supabaseError }));
        }
      } catch (err) {
        console.error('Global error in data fetching:', err);
        setError(prev => ({ ...prev, globalError: err }));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAllData();
    }
  }, [id]);

  // Helper function to display data with possibility of diagnosis being missing
  const renderDataSection = (title, data, source) => {
    if (!data) return null;
    
    const hasDiagnosis = 'diagnosis' in data;
    const diagnosisValue = data.diagnosis;
    
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {hasDiagnosis ? (
            <div className="text-green-600 flex items-center">
              <FaCheckCircle className="mr-1" /> Diagnosis field present
            </div>
          ) : (
            <div className="text-red-600 flex items-center">
              <FaExclamationTriangle className="mr-1" /> No diagnosis field
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Basic Patient Info</h4>
            <p><span className="font-medium">Name:</span> {data.name || 'N/A'}</p>
            <p><span className="font-medium">ID:</span> {data.id || 'N/A'}</p>
            <p><span className="font-medium">Source:</span> {source}</p>
          </div>
          
          <div className={`p-3 rounded-md ${hasDiagnosis ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className="font-medium">Diagnosis Field</h4>
            <p><span className="font-medium">Exists in data:</span> {hasDiagnosis ? 'Yes' : 'No'}</p>
            {hasDiagnosis && (
              <p><span className="font-medium">Value:</span> {diagnosisValue || '<empty string>'}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {hasDiagnosis 
                ? 'The diagnosis field exists in the data. If the field appears empty, it means the diagnosis exists but has no value.'
                : 'The diagnosis field is completely missing from the returned data object. This indicates an API or permissions issue.'}
            </p>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium">Full Data Object (Truncated)</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to={`/patients/${id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <FaArrowLeft className="mr-2" /> Back to Patient Profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Diagnosis Field Debug Page</h1>
        <p className="text-gray-600">Patient ID: {id}</p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2">Loading patient data from all sources...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errors occurred while fetching data</h3>
              <div className="mt-2 text-sm text-red-700">
                <pre className="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div>
          {renderDataSection("Data from patientApi.js", patientData, "patientApi.js import")}
          {renderDataSection("Data from patients.js", directApiData, "patients.js direct import")}
          {renderDataSection("Raw Supabase Data", supabaseData, "Direct Supabase query")}
          
          {!patientData && !directApiData && !supabaseData && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">No data retrieved</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Unable to retrieve patient data from any source.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisDebug;
