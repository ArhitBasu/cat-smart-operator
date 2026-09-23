import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Synchronizing machine telemetry...' }) => (
  <div className="flex flex-col items-center justify-center p-16 h-full min-h-[300px]">
    <div className="w-12 h-12 rounded-full bg-[#FFF9E6] border border-[#FFCD00]/40 flex items-center justify-center mb-3">
      <Loader2 className="w-6 h-6 text-gray-950 animate-spin" />
    </div>
    <p className="text-gray-700 font-bold text-sm tracking-tight">{message}</p>
    <p className="text-xs text-gray-400 mt-1">Caterpillar Smart Operator Gateway</p>
  </div>
);

export default Loading;
