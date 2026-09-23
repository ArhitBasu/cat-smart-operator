import React from 'react';
import { useMachine } from '../context/MachineContext';
import { ChevronDown, ShieldCheck, Cpu } from 'lucide-react';

const Navbar = () => {
  const { machines, selectedMachine, setSelectedMachine } = useMachine();

  const currentMachine = machines?.find(m => m.machine_id === selectedMachine);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Top Yellow Caterpillar Corporate Accent Line */}
      <div className="cat-header-stripe"></div>

      <div className="h-16 px-6 flex items-center justify-between">
        {/* Machine Unit Selection Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded px-3 py-1.5 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse"></span>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">UNIT:</span>
            <div className="relative inline-flex items-center">
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="bg-transparent text-gray-900 font-bold text-sm focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                {machines && machines.length > 0 ? (
                  machines.map(m => (
                    <option key={m.machine_id} value={m.machine_id} className="bg-white text-gray-900">
                      {m.machine_id} — {m.machine_type} ({m.status})
                    </option>
                  ))
                ) : (
                  <option value="EXC001" className="bg-white text-gray-900">EXC001</option>
                )}
              </select>
              <ChevronDown size={14} className="text-gray-500 pointer-events-none -ml-3" />
            </div>
          </div>

          {currentMachine && (
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {currentMachine.machine_type}
            </span>
          )}
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            AI Telemetry: Live
          </div>

          <div className="hidden lg:flex items-center gap-3 border-l border-gray-200 pl-4 text-xs text-gray-600 font-medium">
            <span>Caterpillar Inc. Internal Operations</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
