import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Calendar, TrendingUp } from 'lucide-react';

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const PriceTable = ({ prices = [], showHeader = true, onBookMandi }) => {
  if (!prices || prices.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
        No mandi price data available matching your search or filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <th className="py-3.5 px-4">Crop</th>
              <th className="py-3.5 px-4">Grade</th>
              <th className="py-3.5 px-4">Mandi</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-right">Min Price</th>
              <th className="py-3.5 px-4 text-right">Max Price</th>
              <th className="py-3.5 px-4 text-right">Modal Price</th>
              <th className="py-3.5 px-4">Price Source</th>
              <th className="py-3.5 px-4 text-right">Date</th>
              {onBookMandi && <th className="py-3.5 px-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {prices.map((item) => {
              const mandiName = item.mandi?.name || 'Mandi Market';
              const locationStr = item.mandi
                ? `${item.mandi.city || item.mandi.district}, ${item.mandi.state}`
                : 'Punjab';

              return (
                <tr key={item._id} className="hover:bg-emerald-50/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>{item.crop} {item.variety ? `(${item.variety})` : ''}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                    {item.qualityGrade || 'Standard'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {item.mandi?._id ? (
                      <Link
                        to={`/mandi/${item.mandi._id}`}
                        className="hover:text-emerald-700 hover:underline font-semibold"
                      >
                        {mandiName}
                      </Link>
                    ) : (
                      mandiName
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{locationStr}</td>
                  <td className="py-3.5 px-4 text-right text-slate-600 font-mono text-xs">
                    {formatCurrency(item.minPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 font-mono text-xs">
                    {formatCurrency(item.maxPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono">
                    {formatCurrency(item.modalPrice)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.isOfficiallyVerified
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {item.isOfficiallyVerified ? 'Official MSP' : 'Mandi Reported'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 text-xs whitespace-nowrap">
                    {formatDate(item.date)}
                  </td>
                  {onBookMandi && (
                    <td className="py-3.5 px-4 text-right">
                      {item.mandi && (
                        <button
                          type="button"
                          onClick={() => onBookMandi(item.mandi)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Sell Here →
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {prices.map((item) => {
          const mandiName = item.mandi?.name || 'Mandi Market';
          const locationStr = item.mandi
            ? `${item.mandi.city || item.mandi.district}, ${item.mandi.state}`
            : 'Punjab';

          return (
            <div key={item._id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {item.crop}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.qualityGrade || 'Standard'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center">
                    <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {item.mandi?._id ? (
                      <Link
                        to={`/mandi/${item.mandi._id}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {mandiName}
                      </Link>
                    ) : (
                      mandiName
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">{locationStr}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Modal Rate</span>
                  <div className="text-lg font-bold text-emerald-700 font-mono">
                    {formatCurrency(item.modalPrice)}
                  </div>
                  <span className="text-xs text-slate-400">/ {item.unit || 'quintal'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-600">
                <div>Min: <span className="font-semibold text-slate-800">{formatCurrency(item.minPrice)}</span></div>
                <div>Max: <span className="font-semibold text-slate-800">{formatCurrency(item.maxPrice)}</span></div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {item.isOfficiallyVerified ? 'MSP' : 'Reported'}
                </span>
              </div>

              {onBookMandi && item.mandi && (
                <button
                  type="button"
                  onClick={() => onBookMandi(item.mandi)}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-2"
                >
                  Sell Produce to this Mandi →
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PriceTable;
