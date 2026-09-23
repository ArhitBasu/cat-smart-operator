import React, { useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { getAnomalies } from '../api/anomalies';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import { AlertTriangle, TrendingUp, CheckCircle2, Activity, Cpu } from 'lucide-react';

const Anomalies = () => {
  const { selectedMachine } = useMachine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnomalies(selectedMachine);
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to connect to Anomalies Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMachine) fetchData();
  }, [selectedMachine]);

  if (loading) return <Loading message="Detecting anomalies..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No anomaly data available" onRetry={fetchData} />;

  const isAnomaly = data.anomaly === true;
  const isHigh = data.severity === 'HIGH' || data.severity === 'CRITICAL';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT TELEMATICS</span>
            <span className="text-xs font-semibold text-gray-500">ISOLATION FOREST INFERENCE</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <AlertTriangle className="text-gray-950" size={26} /> Equipment Anomaly Detection
          </h1>
        </div>

        <div className={`cat-status-badge ${isAnomaly ? 'cat-status-critical' : 'cat-status-normal'}`}>
          {isAnomaly ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          <span>{isAnomaly ? 'ANOMALY DETECTED' : 'SYSTEM NOMINAL'}</span>
        </div>
      </div>

      {isAnomaly ? (
        <div className="space-y-6">
          {/* Main Anomaly Diagnostics Card */}
          <div className={`cat-card border-l-4 ${isHigh ? 'border-l-red-600 bg-red-50/20' : 'border-l-amber-500 bg-amber-50/20'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  PRIMARY ROOT CAUSE DIAGNOSIS
                </div>
                <h2 className="text-xl font-black text-gray-950 tracking-tight">{data.reason}</h2>
              </div>
              <span className={`cat-status-badge ${isHigh ? 'cat-status-critical' : 'cat-status-warning'}`}>
                SEVERITY: {data.severity}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div className="flex items-center gap-3 bg-white p-4 rounded border border-gray-200 shadow-2xs">
                <Activity size={20} className="text-gray-700" />
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase">Calculated Outlier Score</div>
                  <div className="text-xl font-black text-gray-950">{data.anomaly_score?.toFixed(3)}</div>
                </div>
              </div>

              {data.recommendation && (
                <div className="bg-white p-4 rounded border border-gray-200 shadow-2xs">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">RECOMMENDED OPERATOR ACTION</div>
                  <p className="text-sm font-semibold text-gray-900">{data.recommendation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contributing Factors */}
          {data.contributing_factors && data.contributing_factors.length > 0 && (
            <div className="cat-card">
              <div className="cat-card-header">
                <div>
                  <h2 className="cat-card-title">Sensor Deviations & Contributing Factors</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Discrepancy vs calibrated operating baseline</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.contributing_factors.map((factor, idx) => {
                  const isSevere = Math.abs(factor.deviation_percent) > 100;
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded bg-gray-50 border border-gray-200 border-l-4 ${
                        isSevere ? 'border-l-red-600' : 'border-l-amber-500'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                        {factor.feature?.replace(/_/g, ' ')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500 block">Current Telemetry</span>
                          <span className="font-black text-gray-950 text-base">{factor.value}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Baseline Expected</span>
                          <span className="font-bold text-emerald-700 text-base">{factor.expected?.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold">
                        <TrendingUp size={14} className={isSevere ? "text-red-600" : "text-amber-700"} />
                        <span className={isSevere ? "text-red-700" : "text-amber-800"}>
                          {factor.deviation_percent > 0 ? '+' : ''}{factor.deviation_percent}% variance
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anomaly Details */}
          {data.anomaly_details && data.anomaly_details.length > 0 && (
            <div className="cat-card">
              <div className="cat-card-header">
                <h2 className="cat-card-title">Telemetry Sensor Logs</h2>
              </div>
              <div className="space-y-2">
                {data.anomaly_details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-900 font-medium">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="cat-card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tight">All Machinery Systems Nominal</h2>
          <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">
            Isolation forest statistical filters indicate standard baseline vibration, temperature, and hydraulic pressures for {selectedMachine}.
          </p>
        </div>
      )}
    </div>
  );
};

export default Anomalies;
