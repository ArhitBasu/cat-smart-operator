import React, { useState, useEffect } from 'react';
import { X, AlertOctagon, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import { explainAlert } from '../api/assistant';

const WhyAlertModal = ({ isOpen, onClose, machineId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !machineId) return;
    
    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await explainAlert(machineId);
        setData(response);
      } catch (err) {
        setError(err.message || "Failed to load explanation from Machine Intelligence API");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExplanation();
  }, [isOpen, machineId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-300 w-full max-w-2xl rounded shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <span className="cat-badge-brand">ROOT CAUSE</span>
            <h2 className="text-lg font-black text-gray-950 uppercase tracking-tight">
              Diagnostic Rationale & Evidence
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 size={32} className="animate-spin text-gray-900 mb-3" />
              <span className="text-sm font-semibold">Running telemetry correlation...</span>
            </div>
          ) : error ? (
            <div className="text-red-700 p-4 border border-red-200 bg-red-50 rounded text-sm text-center">
              {error}
            </div>
          ) : data && (
            <>
              {/* Alert + Severity */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Triggered Event</div>
                  <div className="text-gray-900 font-bold text-sm">{data.alert}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Severity</div>
                  <div className={`text-xl font-black ${
                    data.severity === 'HIGH' || data.severity === 'CRITICAL' ? 'text-red-600' : 
                    data.severity === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {data.severity}
                  </div>
                </div>
              </div>

              {/* Why */}
              <div>
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Causal Explanation</h3>
                <p className="text-gray-900 text-sm leading-relaxed bg-amber-50/30 p-4 rounded border border-gray-200 border-l-4 border-l-[#FFCD00]">
                  {data.why}
                </p>
              </div>

              {/* Evidence */}
              <div>
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Sensor Telemetry Evidence</h3>
                {data.evidence && data.evidence.length > 0 ? (
                  <div className="space-y-2">
                    {data.evidence.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-gray-50 p-3 rounded border border-gray-200 text-xs">
                        <span className="text-gray-900 font-bold mt-0.5">▪</span>
                        <span className="text-gray-800 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic text-xs">No specific sensor anomalies provided.</div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Prescribed Corrective Steps</h3>
                {data.recommendations && data.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {data.recommendations.map((action, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-emerald-50/50 p-3 rounded border border-emerald-200 text-xs">
                        <CheckCircle2 className="text-emerald-700 flex-shrink-0 mt-0.5" size={15} />
                        <span className="text-gray-900 font-semibold">{action}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic text-xs">No immediate action necessary.</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="cat-btn-secondary">
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhyAlertModal;
