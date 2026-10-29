import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home as HomeIcon } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="max-w-md mx-auto my-20 px-4 text-center">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
        >
          <HomeIcon className="w-4 h-4 mr-2" /> Back to Home Page
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
