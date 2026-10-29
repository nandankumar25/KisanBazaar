import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message = 'Unable to load data. Please try again.', onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
      <div className="flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
