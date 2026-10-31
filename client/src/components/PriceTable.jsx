import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Calendar, TrendingUp, MapPin, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

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

const getCropEmoji = (cropName) => {
  const map = {
    wheat: '🌾',
    rice: '🍚',
    paddy: '🌾',
    maize: '🌽',
    corn: '🌽',
    potato: '🥔',
    mustard: '🟡',
    cotton: '☁️',
    sugarcane: '🎋',
    soybean: '🫘',
    onion: '🧅',
    tomato: '🍅',
    chilli: '🌶️',
    barley: '🌾',
    gram: '🫘',
    garlic: '🧄',
    ginger: '🫚'
  };
  return map[cropName?.toLowerCase()] || '🌱';
};

const PriceTable = ({ prices = [], showHeader = true, onBookMandi }) => {
  if (!prices || prices.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200/90 text-center shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
          📊
        </div>
        <h3 className="text-base font-bold text-slate-800">No Price Records Found</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          No mandi price records match your current search criteria or active filters. Try resetting the filters above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">
              <th className="py-4 px-5">Crop Commodity</th>
              <th className="py-4 px-4">Quality Grade</th>
              <th className="py-4 px-5">Mandi Yard</th>
              <th className="py-4 px-4">Location</th>
              <th className="py-4 px-4 text-right">Min Rate</th>
              <th className="py-4 px-4 text-right">Max Rate</th>
              <th className="py-4 px-5 text-right">Modal Rate (Avg)</th>
              <th className="py-4 px-4 text-center">Verification</th>
              <th className="py-4 px-4 text-right">Reported Date</th>
              {onBookMandi && <th className="py-4 px-5 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {prices.map((item) => {
              const mandiName = item.mandi?.name || 'Mandi Market';
              const locationStr = item.mandi
                ? `${item.mandi.city || item.mandi.district || ''}${item.mandi.state ? `, ${item.mandi.state}` : ''}`
                : 'Punjab';
              const cropEmoji = getCropEmoji(item.crop);

              // Calculate price spread position %
              const min = Number(item.minPrice || 0);
              const max = Number(item.maxPrice || 0);
              const modal = Number(item.modalPrice || 0);
              const spreadPct = max > min ? Math.min(100, Math.max(0, Math.round(((modal - min) / (max - min)) * 100))) : 50;

              return (
                <tr 
                  key={item._id} 
                  className="hover:bg-emerald-50/30 transition-colors duration-150 group"
                >
                  {/* Crop Commodity */}
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                        {cropEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.crop}
                        </div>
                        {item.variety && (
                          <div className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
                            {item.variety}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Quality Grade */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                      Grade {item.qualityGrade || 'A'}
                    </span>
                  </td>

                  {/* Mandi Yard */}
                  <td className="py-4 px-5">
                    {item.mandi?._id ? (
                      <Link
                        to={`/mandi/${item.mandi._id}`}
                        className="font-bold text-slate-900 hover:text-emerald-600 hover:underline flex items-center space-x-1.5 transition-colors"
                      >
                        <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[180px]">{mandiName}</span>
                      </Link>
                    ) : (
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{mandiName}</span>
                      </span>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{locationStr}</span>
                    </span>
                  </td>

                  {/* Min Rate */}
                  <td className="py-4 px-4 text-right text-xs font-semibold text-slate-500 font-mono">
                    {formatCurrency(item.minPrice)}
                  </td>

                  {/* Max Rate */}
                  <td className="py-4 px-4 text-right text-xs font-semibold text-slate-500 font-mono">
                    {formatCurrency(item.maxPrice)}
                  </td>

                  {/* Modal Rate (Avg) */}
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex flex-col items-end">
                      <span className="text-sm font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 font-mono shadow-2xs">
                        {formatCurrency(item.modalPrice)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">/ {item.unit || 'qtl'}</span>
                    </div>
                  </td>

                  {/* Verification */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center space-x-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      item.isOfficiallyVerified
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      <span>{item.isOfficiallyVerified ? 'Official MSP' : 'Verified APMC'}</span>
                    </span>
                  </td>

                  {/* Reported Date */}
                  <td className="py-4 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(item.date)}
                  </td>

                  {/* Action */}
                  {onBookMandi && (
                    <td className="py-4 px-5 text-right">
                      {item.mandi ? (
                        <button
                          type="button"
                          onClick={() => onBookMandi(item.mandi)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-2xs hover:shadow-sm"
                        >
                          <span>Sell Here</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
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
      <div className="grid grid-cols-1 gap-3.5 md:hidden">
        {prices.map((item) => {
          const mandiName = item.mandi?.name || 'Mandi Market';
          const locationStr = item.mandi
            ? `${item.mandi.city || item.mandi.district || ''}${item.mandi.state ? `, ${item.mandi.state}` : ''}`
            : 'Punjab';
          const cropEmoji = getCropEmoji(item.crop);

          return (
            <div 
              key={item._id} 
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                    {cropEmoji}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {item.crop} {item.variety ? `• ${item.variety}` : ''}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                      Grade {item.qualityGrade || 'A'}
                    </span>
                  </div>
                </div>

                <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  item.isOfficiallyVerified
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>{item.isOfficiallyVerified ? 'MSP' : 'Verified'}</span>
                </span>
              </div>

              {/* Mandi & Location */}
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <div className="font-bold text-slate-800 flex items-center space-x-1 truncate">
                    <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {item.mandi?._id ? (
                      <Link to={`/mandi/${item.mandi._id}`} className="hover:text-emerald-700 hover:underline truncate">
                        {mandiName}
                      </Link>
                    ) : (
                      <span className="truncate">{mandiName}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{locationStr}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 text-[11px] text-slate-400">
                  {formatDate(item.date)}
                </div>
              </div>

              {/* Price Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Min Rate</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">{formatCurrency(item.minPrice)}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Modal Rate</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">{formatCurrency(item.modalPrice)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Rate</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">{formatCurrency(item.maxPrice)}</span>
                </div>
              </div>

              {/* Action Button */}
              {onBookMandi && item.mandi && (
                <button
                  type="button"
                  onClick={() => onBookMandi(item.mandi)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Sell Produce to {mandiName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
