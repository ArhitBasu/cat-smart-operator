import React, { useEffect, useState } from 'react';
import { getTrainingModules } from '../api/training';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import { GraduationCap, PlayCircle, BookOpen, Star, Award, CheckCircle2 } from 'lucide-react';

const Training = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrainingModules();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to connect to Training Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading training modules..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const modules = data?.modules || [];
  const recommendedIds = data?.recommended_module_ids || [];
  const reasons = data?.recommendation_reasons || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT UNIVERSITY</span>
            <span className="text-xs font-semibold text-gray-500">CERTIFICATION & OPERATOR RE-SKILLING</span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight mt-1 flex items-center gap-2">
            <GraduationCap className="text-gray-950" size={26} /> Operator Training & Skill Hub
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          <Award size={16} className="text-amber-600" />
          <span>OSHA & ISO 3411 Certified</span>
        </div>
      </div>

      {/* Recommended Reasons Banner */}
      {reasons.length > 0 && (
        <div className="cat-card border-l-4 border-l-[#FFCD00] bg-amber-50/20">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            AI RECOMMENDED TRAINING ROADMAP
          </div>
          <div className="space-y-2">
            {reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2.5 text-gray-900 text-xs font-medium">
                <Star size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules Grid */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module, i) => {
            const isRecommended = recommendedIds.includes(module.id) || module.recommended;
            return (
              <div 
                key={i} 
                className={`cat-card flex flex-col justify-between hover:shadow-md transition-all ${
                  isRecommended ? 'ring-2 ring-[#FFCD00] bg-amber-50/10' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-[#FFF9E6] border border-[#FFCD00]/40 p-2.5 rounded text-gray-950">
                      <BookOpen size={20} />
                    </div>
                    {isRecommended && (
                      <span className="cat-badge-brand">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                    {module.category}
                  </div>
                  <h3 className="text-base font-black text-gray-950 mb-2 leading-snug">{module.title}</h3>
                  <p className="text-gray-600 text-xs mb-4 line-clamp-3 leading-relaxed">{module.description}</p>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">{module.duration}</div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-auto flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Curriculum Progress</span>
                      <span className="text-gray-950">{module.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#FFCD00] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${module.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <button className="text-gray-900 hover:text-amber-600 transition-colors p-1" title="Start Module">
                    <PlayCircle size={32} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cat-card p-12 text-center text-gray-500">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-gray-800">All Training Requirements Completed</p>
          <p className="text-xs text-gray-400 mt-1">No mandatory courses pending for active operators.</p>
        </div>
      )}
    </div>
  );
};

export default Training;
