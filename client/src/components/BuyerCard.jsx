import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Package, 
  Star, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  Tag
} from 'lucide-react';

const getCropEmoji = (crop) => {
  const c = (crop || '').toLowerCase();
  if (c.includes('wheat') || c.includes('kanak')) return '🌾';
  if (c.includes('rice') || c.includes('paddy') || c.includes('basmati')) return '🍚';
  if (c.includes('potato') || c.includes('aalu')) return '🥔';
  if (c.includes('mustard') || c.includes('sarson') || c.includes('oil')) return '🌼';
  if (c.includes('maize') || c.includes('makka')) return '🌽';
  if (c.includes('onion') || c.includes('pyaz')) return '🧅';
  if (c.includes('tomato') || c.includes('tamatar')) return '🍅';
  if (c.includes('cotton') || c.includes('kapas')) return '🌿';
  if (c.includes('veg')) return '🥬';
  return '🌱';
};

const BuyerCard = ({ matchData, selectedLotId }) => {
  const { buyer, matchScore, matchReasons } = matchData;
  const profile = buyer.buyerProfile || {};

  const getScoreTheme = (score) => {
    if (score >= 70) {
      return {
        line: 'from-emerald-500 via-teal-500 to-emerald-600',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        scoreText: 'text-emerald-700',
        scoreBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
        label: 'High Match',
        glow: 'group-hover:border-emerald-400',
      };
    }
    if (score >= 45) {
      return {
        line: 'from-blue-500 via-indigo-500 to-blue-600',
        badge: 'bg-blue-50 text-blue-800 border-blue-200/80',
        scoreText: 'text-blue-700',
        scoreBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
        label: 'Good Match',
        glow: 'group-hover:border-blue-400',
      };
    }
    if (score >= 30) {
      return {
        line: 'from-amber-500 via-orange-500 to-amber-600',
        badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
        scoreText: 'text-amber-700',
        scoreBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
        label: 'Possible Match',
        glow: 'group-hover:border-amber-400',
      };
    }
    return {
      line: 'from-rose-400 via-pink-400 to-rose-500',
      badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
      scoreText: 'text-rose-700',
      scoreBg: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200',
      label: 'Low Match',
      glow: 'group-hover:border-rose-400',
    };
  };

  const theme = getScoreTheme(matchScore);
  const crops = profile.interestedCrops || [];

  return (
    <div
      className={`group relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-2xl ${theme.glow} hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
    >
      <div>
        {/* 1. Top Match Gradient Accent Bar */}
        <div className={`h-2 w-full bg-gradient-to-r ${theme.line} group-hover:h-2.5 transition-all duration-300`} />

        <div className="p-6 space-y-4">
          {/* Header Row: Buyer Name, Business Type & Match Score Dial */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-700 transition leading-snug truncate">
                  {profile.businessName || buyer.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{profile.businessType || 'Commercial Buyer'}</span>
                </span>

                {profile.verified && (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
            </div>

            {/* Match Score Badge */}
            <div className={`p-2.5 px-3 rounded-2xl border ${theme.scoreBg} flex flex-col items-center justify-center shrink-0 shadow-xs`}>
              <div className={`text-xl font-black ${theme.scoreText} leading-none tracking-tight`}>
                {matchScore}%
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                {theme.label}
              </span>
            </div>
          </div>

          {/* Interested Commodities / Crops */}
          <div className="pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center space-x-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Procurement Needs</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {crops.length > 0 ? (
                crops.map((crop, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 text-xs bg-emerald-50/80 text-emerald-900 font-bold px-2.5 py-1 rounded-xl border border-emerald-200/60"
                  >
                    <span>{getCropEmoji(crop)}</span>
                    <span>{crop}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Various seasonal produce</span>
              )}
            </div>
          </div>

          {/* Quantity & Location Tiles */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100/90">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center space-x-1">
                <Package className="w-3 h-3 text-purple-600" />
                <span>Quantity</span>
              </span>
              <span className="font-extrabold text-slate-800 text-xs truncate block">
                {profile.minQuantity && profile.maxQuantity 
                  ? `${profile.minQuantity} - ${profile.maxQuantity} qtl` 
                  : 'Flexible Volume'}
              </span>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100/90">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Target Yards</span>
              </span>
              <span className="font-extrabold text-slate-800 text-xs truncate block" title={profile.preferredLocations?.join(', ')}>
                {profile.preferredLocations?.length > 0 
                  ? profile.preferredLocations.slice(0, 2).join(', ') + (profile.preferredLocations.length > 2 ? '...' : '')
                  : 'Pan-Punjab'}
              </span>
            </div>
          </div>

          {/* Match Reasons / Highlights Box */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100/80 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smart Match Highlights</span>
              </div>
              <ul className="space-y-1 text-xs text-emerald-950 font-medium">
                {matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="p-5 bg-gradient-to-b from-slate-50/50 to-slate-100/80 border-t border-slate-100">
        <Link 
          to={`/buyer/${buyer._id}${selectedLotId ? `?cropLot=${selectedLotId}` : ''}`}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 shadow-md shadow-emerald-700/20 hover:shadow-lg flex items-center justify-center space-x-2 group-hover:scale-[1.01]"
        >
          <span>Connect & View Buyer Profile</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
        </Link>
      </div>
    </div>
  );
};

export default BuyerCard;
