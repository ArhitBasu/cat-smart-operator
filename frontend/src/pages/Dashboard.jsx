import React, { useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { getDashboard } from '../api/dashboard';
import { Activity, Clock, Droplets, RotateCcw, AlertTriangle, ShieldCheck, Gauge, ShieldAlert, CheckCircle2 } from 'lucide-react';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { selectedMachine } = useMachine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard(selectedMachine);
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to connect to Machine Intelligence Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMachine) fetchData();
  }, [selectedMachine]);

  if (loading) return <Loading message="Loading dashboard data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No data available" onRetry={fetchData} />;

  const isSafe = data.safety_status === 'NORMAL' || data.safety_status === 'SAFE';
  const isCritical = data.safety_status === 'CRITICAL' || data.safety_status === 'HIGH';

  const latestRecord = data.recent_records?.[0];
  const seatbeltStatus = latestRecord?.seatbelt_status || 'Fastened';
  const isSeatbeltFastened = seatbeltStatus.toLowerCase() === 'fastened';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">FLEET OVERVIEW</span>
            <span className="text-xs font-semibold text-gray-500">REAL-TIME TELEMATICS</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1">
            Machine Dashboard & Analytics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold text-gray-700">
            Operator ID: <span className="font-bold text-gray-950">{data.operator_id}</span>
          </div>

          <div className={`cat-status-badge ${isCritical ? 'cat-status-critical' : isSafe ? 'cat-status-normal' : 'cat-status-warning'}`}>
            {isCritical ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            <span>SAFETY: {data.safety_status}</span>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="ENGINE HOURS"
          value={`${data.engine_hours?.toLocaleString()} h`}
          subtitle="Operating runtime"
          icon={<Activity size={20} className="text-gray-900" />}
        />
        <MetricCard
          title="FUEL CONSUMPTION"
          value={`${data.fuel_used} L`}
          subtitle="Current shift usage"
          icon={<Droplets size={20} className="text-gray-900" />}
        />
        <MetricCard
          title="LOAD CYCLES"
          value={data.load_cycles}
          subtitle="Excavation & Haul rounds"
          icon={<RotateCcw size={20} className="text-gray-900" />}
        />
        <MetricCard
          title="IDLE TIME"
          value={`${data.idle_time} min`}
          subtitle={data.idle_time > 30 ? "Exceeds optimal threshold" : "Within normal limit"}
          highlight={data.idle_time > 30}
          icon={<Clock size={20} className={data.idle_time > 30 ? "text-amber-600" : "text-gray-900"} />}
        />
      </div>

      {/* Primary Status Overview: 3 Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Seatbelt Compliance */}
        <div className="cat-card">
          <div className="cat-card-header">
            <span className="cat-card-title">Seatbelt Compliance</span>
            <span className="text-xs font-semibold text-gray-500">ISO 3411 Standard</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-4xl font-black text-gray-950 tracking-tight">
                {data.seatbelt_compliance}%
              </div>
              <div className="text-xs font-medium text-gray-500 mt-1">Shift Compliance Score</div>
            </div>
            <div className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${isSeatbeltFastened ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {seatbeltStatus}
            </div>
          </div>
        </div>

        {/* Anomaly Detection Status */}
        <div className="cat-card">
          <div className="cat-card-header">
            <span className="cat-card-title">Machine Health Status</span>
            <Gauge size={18} className="text-gray-400" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className={`text-2xl font-black uppercase tracking-tight ${data.anomaly_status === 'ANOMALY' ? 'text-red-600' : 'text-emerald-700'}`}>
                {data.anomaly_status === 'ANOMALY' ? 'ANOMALY ALERT' : 'SYSTEM NOMINAL'}
              </div>
              <div className="text-xs font-medium text-gray-500 mt-1">Engine & Hydraulic Sensors</div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.anomaly_status === 'ANOMALY' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {data.anomaly_status === 'ANOMALY' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
          </div>
        </div>

        {/* Active Alerts Count */}
        <div className="cat-card">
          <div className="cat-card-header">
            <span className="cat-card-title">Active Safety Alerts</span>
            <AlertTriangle size={18} className={data.active_alerts > 0 ? "text-amber-500" : "text-gray-400"} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className={`text-4xl font-black tracking-tight ${data.active_alerts > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {data.active_alerts}
              </div>
              <div className="text-xs font-medium text-gray-500 mt-1">Requiring immediate attention</div>
            </div>
            <div className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${data.active_alerts > 0 ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-gray-100 text-gray-700'}`}>
              {data.active_alerts > 0 ? 'Attention Needed' : 'Clear'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="cat-card">
        <div className="cat-card-header">
          <div>
            <h2 className="cat-card-title">Live Intelligence & Advisory Log</h2>
            <p className="text-xs text-gray-500 mt-0.5">Automated telemetry diagnostics generated by the ML inference engine</p>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {data.recent_alerts?.length || 0} Events
          </span>
        </div>

        {data.recent_alerts && data.recent_alerts.length > 0 ? (
          <div className="space-y-3">
            {data.recent_alerts.map((alert, i) => {
              const isHigh = alert.severity === 'HIGH' || alert.severity === 'CRITICAL';
              return (
                <div
                  key={i}
                  className={`p-4 rounded border-l-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isHigh 
                      ? 'border-l-red-500 bg-red-50/50 border border-gray-200' 
                      : 'border-l-[#FFCD00] bg-amber-50/30 border border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isHigh ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {alert.alert_type}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{alert.message}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      <strong className="text-gray-800">Action:</strong> {alert.recommendation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 p-8 text-center bg-gray-50 rounded border border-dashed border-gray-300">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-gray-800 text-sm">All telemetric indicators are operating nominally.</p>
            <p className="text-xs text-gray-500 mt-1">No pending warnings or safety anomalies detected for {selectedMachine}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, highlight }) => (
  <div className={`cat-card flex items-center justify-between ${highlight ? 'border-amber-300 bg-amber-50/20' : ''}`}>
    <div>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</div>
      <div className={`text-2xl font-black mt-1 tracking-tight ${highlight ? 'text-amber-700' : 'text-gray-950'}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
    </div>
    <div className={`w-12 h-12 rounded flex items-center justify-center ${highlight ? 'bg-amber-100' : 'bg-[#FFF9E6] border border-[#FFCD00]/30'}`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
