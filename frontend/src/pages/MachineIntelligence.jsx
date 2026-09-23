import React, { useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { getMachineIntelligence } from '../api/machines';
import WhyAlertModal from '../components/WhyAlertModal';
import { AlertTriangle, ShieldCheck, Activity, Brain, UserCheck, Heart, TrendingUp, TrendingDown, Minus, CheckCircle2, HelpCircle } from 'lucide-react';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';

const MachineIntelligence = () => {
  const { selectedMachine } = useMachine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMachineIntelligence(selectedMachine);
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

  if (loading) return <Loading message="Loading intelligence data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No intelligence data available" onRetry={fetchData} />;

  const isRiskHigh = data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH';
  const isRiskMed = data.risk_level === 'MEDIUM';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT AI CORE</span>
            <span className="text-xs font-semibold text-gray-500">PREDICTIVE RISK ENGINE</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <Brain className="text-gray-900" size={26} /> Machine Intelligence Diagnostics
          </h1>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="cat-btn-primary"
        >
          <HelpCircle size={16} /> Explain Risk Factors (Why?)
        </button>
      </div>

      {/* Risk & Sub-scores Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overall Risk Score */}
        <div className={`cat-card flex flex-col justify-between border-l-4 ${
          isRiskHigh ? 'border-l-red-600 bg-red-50/10' : isRiskMed ? 'border-l-amber-500 bg-amber-50/10' : 'border-l-emerald-600 bg-emerald-50/10'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="cat-card-title">Overall Risk Index</span>
              <span className={`cat-status-badge ${isRiskHigh ? 'cat-status-critical' : isRiskMed ? 'cat-status-warning' : 'cat-status-normal'}`}>
                {data.risk_level}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Multi-factor operational vulnerability score</p>
          </div>

          <div className="my-6">
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-black tracking-tight ${
                isRiskHigh ? 'text-red-600' : isRiskMed ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {data.overall_risk}
              </span>
              <span className="text-lg font-bold text-gray-400">/ 100</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Scale 0-100 (Lower is safer; scores &gt; 65 require supervisor intervention)
            </p>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${isRiskHigh ? 'bg-red-600' : isRiskMed ? 'bg-amber-500' : 'bg-emerald-600'}`}
              style={{ width: `${Math.min(data.overall_risk, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* 4 Performance Pillar Scores */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ScoreCard 
            title="SAFETY SCORE" 
            score={data.safety_score} 
            icon={<ShieldCheck size={20} className="text-emerald-700" />} 
            description="Compliance & sensor integrity"
          />
          <ScoreCard 
            title="EFFICIENCY SCORE" 
            score={data.efficiency_score} 
            icon={<Activity size={20} className="text-blue-700" />} 
            description="Fuel economy & cycle rates"
          />
          <ScoreCard 
            title="MACHINE HEALTH" 
            score={data.machine_health_score} 
            icon={<Heart size={20} className="text-rose-700" />} 
            description="Engine stress & hydraulic wear"
          />
          <ScoreCard 
            title="OPERATOR BEHAVIOR" 
            score={data.operator_safety_score} 
            icon={<UserCheck size={20} className="text-amber-700" />} 
            description="Smooth operation & safety adherence"
          />
        </div>
      </div>

      {/* Two Column Section: Key Findings and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Key Diagnostic Findings */}
        <div className="cat-card lg:col-span-2">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title">Key Analytical Findings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Automated ML risk diagnostics and pattern correlations</p>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {data.key_findings?.length || 0} Insights
            </span>
          </div>

          {data.key_findings && data.key_findings.length > 0 ? (
            <div className="space-y-3">
              {data.key_findings.map((finding, i) => (
                <div key={i} className="p-4 rounded border border-gray-200 bg-amber-50/20 border-l-4 border-l-[#FFCD00] flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-900 text-sm font-medium leading-relaxed">{finding}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 p-6 text-center bg-gray-50 rounded border border-dashed border-gray-300">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-sm font-semibold">No critical risk flags detected.</p>
            </div>
          )}
        </div>

        {/* Operational Trends */}
        <div className="cat-card">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title">Shift Trends</h2>
              <p className="text-xs text-gray-500 mt-0.5">Metric telemetry trajectories</p>
            </div>
          </div>

          {data.trends && data.trends.length > 0 ? (
            <div className="space-y-3">
              {data.trends.map((trend, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-900 font-bold text-xs uppercase tracking-wide">
                      {trend.metric?.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      {trend.trend === 'INCREASING' && <TrendingUp className="text-red-600" size={14} />}
                      {trend.trend === 'DECREASING' && <TrendingDown className="text-emerald-600" size={14} />}
                      {trend.trend === 'STABLE' && <Minus className="text-gray-400" size={14} />}
                      <span className={`text-xs font-bold ${
                        trend.trend === 'INCREASING' ? 'text-red-600' : 
                        trend.trend === 'DECREASING' ? 'text-emerald-700' : 'text-gray-600'
                      }`}>
                        {trend.change_percent != null ? `${trend.change_percent > 0 ? '+' : ''}${trend.change_percent}%` : trend.trend}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">{trend.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-xs text-center py-6">Telemetry trends nominal.</div>
          )}
        </div>
      </div>

      {/* Recommended Remediation Actions */}
      <div className="cat-card">
        <div className="cat-card-header">
          <div>
            <h2 className="cat-card-title">Recommended Safety & Operations Actions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Generated directly by Caterpillar operator guidance model</p>
          </div>
        </div>

        {data.recommended_actions && data.recommended_actions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recommended_actions.map((action, i) => (
              <div key={i} className="p-4 rounded border border-emerald-200 bg-emerald-50/40 flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-gray-900 text-sm font-semibold">{action}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 p-6 text-center bg-gray-50 rounded border border-dashed border-gray-300">
            No active remedial steps required.
          </div>
        )}
      </div>

      <WhyAlertModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        machineId={selectedMachine}
      />
    </div>
  );
};

const ScoreCard = ({ title, score, icon, description }) => {
  const isGood = score >= 70;
  const isMed = score >= 40 && score < 70;

  return (
    <div className="cat-card flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
          <div className="p-2 rounded bg-gray-100">{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black tracking-tight ${isGood ? 'text-emerald-700' : isMed ? 'text-amber-600' : 'text-red-600'}`}>
            {score !== undefined ? score : '--'}
          </span>
          <span className="text-xs font-semibold text-gray-400">/ 100</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden">
        <div 
          className={`h-full rounded-full ${isGood ? 'bg-emerald-600' : isMed ? 'bg-amber-500' : 'bg-red-600'}`}
          style={{ width: `${Math.min(score || 0, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MachineIntelligence;
