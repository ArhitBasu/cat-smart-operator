import React, { useState } from 'react';
import { useMachine } from '../context/MachineContext';
import { predictTask } from '../api/predictions';
import { Clock, Navigation2, AlertCircle, BarChart3, ChevronRight } from 'lucide-react';

const TaskPrediction = () => {
  const { selectedMachine } = useMachine();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    task_type: 'Excavation',
    machine_type: 'Excavator',
    load_cycles: 20,
    terrain: 'Hard Clay',
    temperature: 32,
    operator_experience: 3
  });
  
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        task_type: form.task_type,
        machine_type: form.machine_type,
        load_cycles: parseInt(form.load_cycles),
        terrain: form.terrain,
        temperature: parseInt(form.temperature),
        operator_experience: parseInt(form.operator_experience)
      };
      const res = await predictTask(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT LOGISTICS</span>
            <span className="text-xs font-semibold text-gray-500">MACHINE LEARNING COMPLETION FORECASTER</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <Clock className="text-gray-950" size={26} /> Task Duration Prediction
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="cat-card lg:col-span-5">
          <div className="cat-card-header">
            <div>
              <h2 className="cat-card-title">Job Site Parameters</h2>
              <p className="text-xs text-gray-500 mt-0.5">Input current operating conditions</p>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Task Operation Type
              </label>
              <select 
                value={form.task_type} 
                onChange={e=>setForm({...form, task_type: e.target.value})} 
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900"
              >
                <option value="Excavation">Excavation</option>
                <option value="Trenching">Trenching</option>
                <option value="Loading">Loading</option>
                <option value="Site Grading">Site Grading</option>
                <option value="Material Hauling">Material Hauling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Equipment Class
              </label>
              <select 
                value={form.machine_type} 
                onChange={e=>setForm({...form, machine_type: e.target.value})} 
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900"
              >
                <option value="Excavator">Excavator</option>
                <option value="Wheel Loader">Wheel Loader</option>
                <option value="Backhoe">Backhoe</option>
                <option value="Haul Truck">Haul Truck</option>
                <option value="Crane">Crane</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Cycles
                </label>
                <input 
                  type="number" 
                  value={form.load_cycles} 
                  onChange={e=>setForm({...form, load_cycles: e.target.value})} 
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ambient Temp (°C)
                </label>
                <input 
                  type="number" 
                  value={form.temperature} 
                  onChange={e=>setForm({...form, temperature: e.target.value})} 
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Ground & Terrain Type
              </label>
              <select 
                value={form.terrain} 
                onChange={e=>setForm({...form, terrain: e.target.value})} 
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900"
              >
                <option value="Hard Clay">Hard Clay</option>
                <option value="Rocky">Rocky</option>
                <option value="Soft Mud">Soft Mud</option>
                <option value="Gravel">Gravel</option>
                <option value="Paved">Paved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Operator Experience (Years)
              </label>
              <input 
                type="number" 
                value={form.operator_experience} 
                min="1" 
                max="20" 
                onChange={e=>setForm({...form, operator_experience: e.target.value})} 
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="cat-btn-primary w-full py-3 mt-2"
            >
              {loading ? "Computing Forecast..." : <><Navigation2 size={16} /> Run Time Prediction</>}
            </button>
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-200 text-xs p-3 rounded flex items-center gap-1.5 mt-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </form>
        </div>

        {/* Prediction Results Column */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <>
              <div className="cat-card border-l-4 border-l-[#FFCD00]">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  ESTIMATED CYCLE DURATION
                </div>
                <div className="flex items-baseline gap-3 my-3">
                  <div className="text-6xl font-black text-gray-950 tracking-tight">
                    {result.estimated_minutes}
                  </div>
                  <div className="text-xl font-bold text-gray-500">minutes</div>
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Confidence interval: <strong className="text-gray-950">{result.prediction_range}</strong>
                </div>
              </div>

              <div className="cat-card">
                <div className="cat-card-header">
                  <div>
                    <h3 className="cat-card-title">Forecast Bounds & Factors</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Statistical deviation boundary</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-5 border-b border-gray-200">
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 uppercase block">Optimal / Lower Bound</span>
                    <span className="text-2xl font-black text-emerald-700">{result.lower_bound} min</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 uppercase block">Max / Upper Bound</span>
                    <span className="text-2xl font-black text-amber-700">{result.upper_bound} min</span>
                  </div>
                </div>

                {result.key_factors && result.key_factors.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      PRIMARY INFLUENCE FACTORS
                    </h4>
                    <div className="space-y-3">
                      {result.key_factors.map((factor, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <BarChart3 size={15} className="text-gray-500 flex-shrink-0" />
                          <span className="text-gray-900 text-xs font-bold uppercase tracking-wide flex-1">
                            {factor.feature?.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-[#FFCD00] h-full rounded-full" 
                                style={{ width: `${(factor.importance * 100).toFixed(0)}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-950 font-black text-xs w-10 text-right">
                              {(factor.importance * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="cat-card p-12 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
              <Clock size={40} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Ready for Forecast Calculation</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Adjust site parameters on the left and select "Run Time Prediction" to generate an AI regression estimate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskPrediction;
