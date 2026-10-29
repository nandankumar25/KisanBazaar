import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Loading sample market data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};

export default Loading;
