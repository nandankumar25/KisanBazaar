import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  ArrowRight, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Scale,
  Truck
} from 'lucide-react';

const getCropEmoji = (crop) => {
  const c = (crop || '').toLowerCase();
  if (c.includes('wheat') || c.includes('kanak')) return '🌾';
  if (c.includes('rice') || c.includes('paddy') || c.includes('basmati')) return '🍚';
  if (c.includes('potato') || c.includes('aalu')) return '🥔';
  if (c.includes('mustard') || c.includes('sarson') || c.includes('oil')) return '🌼';
  if (c.includes('maize') || c.includes('makka')) return '🌽';
  if (c.includes('cotton') || c.includes('kapas')) return '🌿';
  if (c.includes('veg') || c.includes('onion') || c.includes('tomato')) return '🥬';
  return '🌱';
};

const MandiCard = ({ mandi, onBookSale }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/mandi/${mandi._id}`);
  };

  const crops = mandi.cropsSupported || [];

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-emerald-400 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      <div>
        {/* 1. High-Aesthetic Banner Header */}
        <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 overflow-hidden">
          {/* Subtle Ambient Glow Lights */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Top Status & Verification Row */}
          <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-black/30 text-emerald-200 border border-white/15 backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{mandi.mandiType || 'Govt APMC Yard'}</span>
            </span>

            {/* Active Market Pulse */}
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gate Open Today</span>
            </span>
          </div>

          {/* Mandi Icon, Full Name & Location */}
          <div className="relative z-10 flex items-start space-x-3.5">
            <div className="w-13 h-13 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg">
              <Store className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Full Mandi Name without truncated dots */}
              <h3 className="font-black text-white text-base sm:text-lg leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
                {mandi.name}
              </h3>
              <p className="text-xs text-emerald-200/90 flex items-center mt-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                <span>{mandi.city || mandi.district}, {mandi.state}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Card Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Address Quote */}
          {mandi.address && (
            <div className="flex items-start space-x-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="line-clamp-2">{mandi.address}</p>
            </div>
          )}

          {/* Timings & Helpline Tiles */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition">
              <div className="flex items-center space-x-1.5 text-amber-600 font-bold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Trading Hours</span>
              </div>
              <div className="font-extrabold text-slate-900 text-xs truncate">
                {mandi.operatingHours || '08:00 AM - 06:00 PM'}
              </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition">
              <div className="flex items-center space-x-1.5 text-teal-600 font-bold mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Yard Helpline</span>
              </div>
              <div className="font-extrabold text-slate-900 text-xs truncate">
                {mandi.contactPhone || '+91 Mandi Desk'}
              </div>
            </div>
          </div>

          {/* Mandi Features / Perks */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1 py-0.5 border-y border-slate-100">
            <span className="flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Govt Scale Weight</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center space-x-1">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Fast Gate Entry</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Pay</span>
            </span>
          </div>

          {/* Crops Procured & Traded with colorful tags & emojis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Crops Procured & Traded
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {crops.length > 0 ? `${crops.length} Listed` : 'All Seasonal'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {crops.length > 0 ? (
                crops.map((crop, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 text-xs bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-xl border border-emerald-200/70 transition-colors shadow-2xs"
                  >
                    <span>{getCropEmoji(crop)}</span>
                    <span>{crop}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Wheat, Paddy, Mustard & Cotton</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. High-Conversion CTA Action Footer */}
      <div className="p-5 bg-gradient-to-b from-slate-50/50 to-slate-100/80 border-t border-slate-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/mandi/${mandi._id}`);
          }}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 shadow-md shadow-emerald-700/25 hover:shadow-xl hover:shadow-emerald-600/35 flex items-center justify-center space-x-2.5 group-hover:scale-[1.02]"
        >
          <span>View Mandi Prices & Book Sale</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default MandiCard;