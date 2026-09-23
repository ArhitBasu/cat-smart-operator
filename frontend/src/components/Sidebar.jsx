import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, ShieldAlert, LineChart, AlertTriangle, Clock, AlertCircle, GraduationCap, MessageSquare } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Machine Intel', path: '/machine-intelligence', icon: <BrainCircuit size={18} /> },
    { name: 'Safety Monitor', path: '/safety', icon: <ShieldAlert size={18} /> },
    { name: 'Fleet Analytics', path: '/analytics', icon: <LineChart size={18} /> },
    { name: 'Anomaly Detection', path: '/anomalies', icon: <AlertTriangle size={18} /> },
    { name: 'Task Prediction', path: '/task-prediction', icon: <Clock size={18} /> },
    { name: 'Incident Logs', path: '/incidents', icon: <AlertCircle size={18} /> },
    { name: 'Operator Training', path: '/training', icon: <GraduationCap size={18} /> },
    { name: 'AI Copilot', path: '/assistant', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col justify-between flex-shrink-0 z-20 shadow-sm">
      <div>
        {/* Top Caterpillar Branding */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="cat-badge-brand">CAT</span>
            <span className="font-black text-xl tracking-tight text-gray-950 font-sans">CATERPILLAR<span className="text-xs align-top font-normal text-gray-400">®</span></span>
          </div>
          <div className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mt-1">
            Smart Operator System
          </div>
        </div>

        {/* Section title */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Fleet Operations
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `cat-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-gray-500 group-hover:text-gray-900">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Shift Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gray-900 text-white font-bold text-xs flex items-center justify-center">
            OP
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">Operator Active</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Telematics Linked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
