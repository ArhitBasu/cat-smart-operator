import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-16 text-center h-full min-h-[300px]">
    <div className="bg-red-50 p-4 rounded-full mb-3 border border-red-200">
      <AlertCircle className="text-red-600 w-10 h-10" />
    </div>
    <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-1">Telemetry Link Failure</h3>
    <p className="text-gray-600 text-xs mb-5 max-w-md">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="cat-btn-secondary"
      >
        Retry Diagnostic Query
      </button>
    )}
  </div>
);

export default ErrorState;
