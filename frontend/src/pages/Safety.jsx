import React, { useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { getSafety } from '../api/safety';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import WhyAlertModal from '../components/WhyAlertModal';
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Clock, ShieldCheck, HelpCircle } from 'lucide-react';

const Safety = () => {
  const { selectedMachine } = useMachine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSafety(selectedMachine);
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to connect to Safety Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMachine) fetchData();
  }, [selectedMachine]);

  const handleWhyClick = (alert) => {
    setActiveAlert(alert);
    setModalOpen(true);
  };

  if (loading) return <Loading message="Loading safety monitor..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No safety data available" onRetry={fetchData} />;

  const isCritical = data.safety_status === 'CRITICAL' || data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH';
  const isMed = data.safety_status === 'WARNING' || data.risk_level === 'MEDIUM';

  // Map backend schema to UI variables
  const seatbeltPct = data.seatbelt_compliance?.compliance_percentage || 0;
  
  const isUnfastened = data.recent_violations?.some(v => v.type.includes('Seatbelt') || v.type.includes('Unfastened'));
  const currentSeatbeltStatus = isUnfastened ? 'UNFASTENED' : 'FASTENED';

  const idleViolations = data.recent_violations?.filter(v => v.type.includes('Idling')).length || 0;
  const opScore = Math.max(0, 100 - ((data.recent_violations?.length || 0) * 15));

  const activeAlerts = data.active_alerts || [];
  const recentEvents = data.recent_violations?.map(v => ({
    timestamp: v.timestamp,
    event_type: v.type,
    description: `Violation Severity: ${v.severity}`
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT COMPLIANCE</span>
            <span className="text-xs font-semibold text-gray-500">OPERATOR CABIN & SITE HAZARDS</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <ShieldAlert className="text-gray-950" size={26} /> Safety & ISO Compliance Monitor
          </h1>
        </div>

        <div className={`cat-status-badge ${isCritical ? 'cat-status-critical' : isMed ? 'cat-status-warning' : 'cat-status-normal'}`}>
          {isCritical ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
          <span>OVERALL: {data.safety_status || 'NORMAL'}</span>
        </div>
      </div>

      {/* 4 Compliance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cat-card">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Seatbelt Compliance</div>
          <div className="text-3xl font-black text-gray-950 mt-1">{seatbeltPct}%</div>
          <div className="text-xs text-gray-500 mt-1">Shift session average</div>
        </div>

        <div className="cat-card">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Seatbelt Sensor</div>
          <div className={`text-2xl font-black mt-1 uppercase ${currentSeatbeltStatus === 'UNFASTENED' ? 'text-red-600' : 'text-emerald-700'}`}>
            {currentSeatbeltStatus}
          </div>
          <div className="text-xs text-gray-500 mt-1">Real-time cabin switch</div>
        </div>

        <div className="cat-card">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Idle Violations</div>
          <div className={`text-3xl font-black mt-1 ${idleViolations > 0 ? 'text-amber-600' : 'text-gray-950'}`}>
            {idleViolations}
          </div>
          <div className="text-xs text-gray-500 mt-1">&gt; 30 min threshold logs</div>
        </div>

        <div className="cat-card">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Operator Safety Score</div>
          <div className={`text-3xl font-black mt-1 ${opScore < 70 ? 'text-red-600' : opScore < 90 ? 'text-amber-600' : 'text-gray-950'}`}>{opScore}</div>
          <div className="text-xs text-gray-500 mt-1">Out of 100 benchmark</div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Safety Alerts */}
        <div className="cat-card">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={18} /> Safety Advisory & Alerts
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Threshold violations triggering supervisory notices</p>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {activeAlerts.length} ALERTS
            </span>
          </div>

          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert, i) => {
                const isHigh = alert.severity === 'HIGH' || alert.severity === 'CRITICAL';
                return (
                  <div 
                    key={i} 
                    className={`p-4 rounded border flex justify-between items-start gap-3 ${
                      isHigh ? 'border-l-4 border-l-red-600 bg-red-50/40 border-gray-200' : 'border-l-4 border-l-amber-500 bg-amber-50/30 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isHigh ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-gray-600 uppercase">Alert Notice</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{alert.message}</div>
                    </div>
                    <button 
                      onClick={() => handleWhyClick(alert)}
                      className="cat-btn-secondary text-xs py-1 px-3"
                    >
                      <HelpCircle size={14} /> WHY?
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 p-8 text-center bg-gray-50 rounded border border-dashed border-gray-300">
              <CheckCircle2 className="text-emerald-500 w-10 h-10 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">Zero Safety Violations Detected</p>
              <p className="text-xs text-gray-500 mt-1">Operator is fully compliant with equipment safety protocols.</p>
            </div>
          )}
        </div>

        {/* Safety Event Timeline */}
        <div className="cat-card">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title flex items-center gap-2">
                <Clock className="text-gray-700" size={18} /> Shift Incident & Event Timeline
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Chronological safety logs from black box sensors</p>
            </div>
          </div>

          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event, i) => (
                <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5 whitespace-nowrap bg-white px-2 py-1 rounded border border-gray-200">
                    {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Recent'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 uppercase tracking-wide">{event.event_type}</div>
                    <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 p-8 text-center bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-xs font-semibold">No recent events in this shift timeline.</p>
            </div>
          )}
        </div>
      </div>

      <WhyAlertModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        machineId={selectedMachine}
        alertInfo={activeAlert}
      />
    </div>
  );
};

export default Safety;
