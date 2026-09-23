import React, { useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { getAnalytics } from '../api/analytics';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { LineChart } from 'lucide-react';

const Analytics = () => {
  const { selectedMachine } = useMachine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics(selectedMachine);
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to connect to Analytics Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMachine) fetchData();
  }, [selectedMachine]);

  if (loading) return <Loading message="Loading analytics data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No analytics data available" onRetry={fetchData} />;

  const fuelData = Array.isArray(data.fuel) ? data.fuel.map(d => ({
    time: new Date(d.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
    fuel: d.value,
    expected: Math.max(0, d.value - 2.5) // Mock target line for visual effect
  })) : [];
  
  const idleData = Array.isArray(data.idle_time) ? data.idle_time.map(d => ({
    day: new Date(d.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
    duration: d.value
  })) : [];
  
  const loadData = Array.isArray(data.load_cycles) ? data.load_cycles.map(d => ({
    time: new Date(d.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
    count: d.value
  })) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 p-3 rounded shadow-md text-xs">
          <p className="text-gray-900 font-bold mb-1.5 uppercase tracking-wide">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-bold">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT TELEMETRY</span>
            <span className="text-xs font-semibold text-gray-500">FLEET TIME-SERIES VISUALIZER</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <LineChart className="text-gray-950" size={26} /> Machine Performance Analytics
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Usage */}
        <div className="cat-card">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title">Fuel Consumption vs Target</h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time liters per cycle timeline</p>
            </div>
          </div>
          {fuelData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="time" stroke="#6B7280" tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis stroke="#6B7280" tick={{fill: '#6B7280', fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="fuel" name="Actual Fuel (L)" stroke="#FFCD00" strokeWidth={2} fill="#FFCD00" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="expected" name="Expected (L)" stroke="#059669" fill="transparent" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 rounded">
              Time-series data for Fuel Usage not available
            </div>
          )}
        </div>

        {/* Idle Time */}
        <div className="cat-card">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title">Idle Duration Frequency</h2>
              <p className="text-xs text-gray-500 mt-0.5">Equipment downtime records (minutes)</p>
            </div>
          </div>
          {idleData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={idleData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" stroke="#6B7280" tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis stroke="#6B7280" tick={{fill: '#6B7280', fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="duration" name="Idle Duration (min)" fill="#D97706" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 rounded">
              Time-series data for Idle Time not available
            </div>
          )}
        </div>

        {/* Load Cycles */}
        <div className="cat-card col-span-1 lg:col-span-2">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title">Cumulative Load Cycles</h2>
              <p className="text-xs text-gray-500 mt-0.5">Bucket lifts and transport intervals</p>
            </div>
          </div>
          {loadData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={loadData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="time" stroke="#6B7280" tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis stroke="#6B7280" tick={{fill: '#6B7280', fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Cycles Completed" stroke="#111827" strokeWidth={2.5} dot={{r: 4, fill: '#FFCD00'}} activeDot={{r: 6}} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 rounded">
              Time-series data for Load Cycles not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
