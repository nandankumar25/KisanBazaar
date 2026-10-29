import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, CheckCircle, Package, Star } from 'lucide-react';

const BuyerCard = ({ matchData, selectedLotId }) => {
  const { buyer, matchScore, matchReasons } = matchData;
  const profile = buyer.buyerProfile || {};

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Possible Match';
    return 'Low Match';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5 hover:shadow-md transition flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            {profile.businessName || buyer.name}
            {profile.verified && (
              <span className="ml-2 inline-flex items-center text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100" title="Demo Verified">
                <CheckCircle className="w-3 h-3 mr-0.5" /> Demo Verified
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500 flex items-center mt-1">
            <Building2 className="w-4 h-4 mr-1 text-emerald-600" />
            {profile.businessType || 'General Buyer'}
          </p>
        </div>
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${getScoreColor(matchScore)} min-w-[70px]`}>
          <span className="text-xl font-black">{matchScore}%</span>
          <span className="text-[10px] font-semibold text-center leading-tight mt-1">{getScoreLabel(matchScore)}</span>
        </div>
      </div>

      <div className="space-y-3 flex-1 mb-4">
        <div className="flex items-start text-sm">
          <Star className="w-4 h-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-700 block">Interested In</span>
            <span className="text-slate-600">
              {profile.interestedCrops?.join(', ') || 'Various crops'}
            </span>
          </div>
        </div>

        <div className="flex items-start text-sm">
          <Package className="w-4 h-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-700 block">Quantity Needed</span>
            <span className="text-slate-600">
              {profile.minQuantity && profile.maxQuantity 
                ? `${profile.minQuantity} - ${profile.maxQuantity} quintals` 
                : 'Varies'}
            </span>
          </div>
        </div>

        <div className="flex items-start text-sm">
          <MapPin className="w-4 h-4 mr-2 text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-700 block">Preferred Locations</span>
            <span className="text-slate-600">
              {profile.preferredLocations?.join(', ') || 'Any location'}
            </span>
          </div>
        </div>
      </div>

      {matchReasons && matchReasons.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-slate-700 mb-1">Match Highlights:</p>
          <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
            {matchReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto border-t border-slate-100 pt-4">
        <Link 
          to={`/buyer/${buyer._id}${selectedLotId ? `?cropLot=${selectedLotId}` : ''}`}
          className="w-full block text-center bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default BuyerCard;
