import React, { useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { getIncidents, reportIncident } from '../api/incidents';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import { AlertCircle, Plus, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

const Incidents = () => {
  const { selectedMachine } = useMachine();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ machine_id: selectedMachine, operator_id: '', type: '', severity: 'LOW', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getIncidents();
      setIncidents(Array.isArray(res) ? res : res.incidents || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to Incidents Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setForm(prev => ({ ...prev, machine_id: selectedMachine }));
  }, [selectedMachine]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportIncident(form);
      setIsModalOpen(false);
      setForm({ ...form, description: '', type: '', operator_id: '' });
      fetchData();
    } catch (err) {
      alert("Failed to report incident: " + (err.message || "Server Error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading incident reports..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT COMPLIANCE</span>
            <span className="text-xs font-semibold text-gray-500">OFFICIAL INCIDENT & LOG AUDIT</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <AlertCircle className="text-gray-950" size={26} /> Incident Management & Logs
          </h1>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="cat-btn-primary"
        >
          <Plus size={16} /> LOG NEW INCIDENT
        </button>
      </div>

      {/* Incidents Table */}
      <div className="cat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="cat-card-title">Fleet Safety Records</h2>
            <p className="text-xs text-gray-500 mt-0.5">Formal records reported by site supervisors</p>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {incidents.length} Incident Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {incidents.length > 0 ? (
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="text-xs uppercase bg-gray-100/80 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">ID</th>
                  <th className="px-5 py-3.5 font-bold">Timestamp</th>
                  <th className="px-5 py-3.5 font-bold">Unit ID</th>
                  <th className="px-5 py-3.5 font-bold">Operator</th>
                  <th className="px-5 py-3.5 font-bold">Category</th>
                  <th className="px-5 py-3.5 font-bold">Severity</th>
                  <th className="px-5 py-3.5 font-bold">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incidents.map((incident, i) => {
                  const isHigh = incident.severity === 'HIGH' || incident.severity === 'CRITICAL';
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-500">{incident.id}</td>
                      <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(incident.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-950">{incident.machine_id}</td>
                      <td className="px-5 py-4 font-semibold text-gray-700">{incident.operator_id}</td>
                      <td className="px-5 py-4 text-gray-900 font-medium">{incident.type}</td>
                      <td className="px-5 py-4">
                        <span className={`cat-status-badge ${isHigh ? 'cat-status-critical' : incident.severity === 'MEDIUM' ? 'cat-status-warning' : 'cat-status-normal'}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded text-xs font-semibold">
                          {incident.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800">Zero Incident Reports Recorded</p>
              <p className="text-xs text-gray-400 mt-1">No past equipment incidents logged in the system.</p>
            </div>
          )}
        </div>
      </div>

      {/* Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 w-full max-w-lg rounded shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-black text-gray-950 uppercase tracking-tight">Report Machinery Incident</h2>
                <p className="text-xs text-gray-500">Submit an entry into the Caterpillar telematics ledger</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit ID</label>
                  <input 
                    type="text" 
                    value={form.machine_id}
                    onChange={(e) => setForm({...form, machine_id: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-semibold focus:outline-none focus:border-gray-900" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Operator ID</label>
                  <input 
                    type="text" 
                    value={form.operator_id}
                    onChange={(e) => setForm({...form, operator_id: e.target.value})}
                    placeholder="e.g. OP1001"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Incident Category</label>
                  <input 
                    type="text" 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    placeholder="e.g. Hydraulic Leak, Collision"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Severity Level</label>
                  <select 
                    value={form.severity}
                    onChange={(e) => setForm({...form, severity: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-semibold focus:outline-none focus:border-gray-900"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Incident Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Detail the circumstances, damage, or immediate actions taken..."
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium h-24 focus:outline-none focus:border-gray-900" 
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cat-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="cat-btn-primary">
                  {submitting ? 'Transmitting...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
