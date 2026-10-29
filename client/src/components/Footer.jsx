import React from 'react';
import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Info */}
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-xl mb-3">
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span>KisanBazaar</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">
              Better Prices. Better Markets. Better Farming.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Empowering farmers across mandis with direct market linkage and smart transport solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition">Home</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition">Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition">Register</Link>
              </li>
            </ul>
          </div>

          {/* Platform Info */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">KisanBazaar Platform</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed to optimize local mandi price discovery, reduce transport overheads, and streamline crop lot trade.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-xs text-center text-slate-500">
          © {new Date().getFullYear()} KisanBazaar. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
