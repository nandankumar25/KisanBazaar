import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Tag, ArrowRight } from 'lucide-react';

const MandiCard = ({ mandi, onBookSale }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/mandi/${mandi._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer group"
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 group-hover:bg-emerald-200 transition">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition">
                {mandi.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center mt-0.5">
                <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                {mandi.city || mandi.district}, {mandi.state}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 shrink-0">
            {mandi.mandiType || 'Government'}
          </span>
        </div>

        {mandi.address && (
          <p className="text-xs text-slate-600 mt-2 line-clamp-2">
            {mandi.address}
          </p>
        )}

        <div className="mt-2 text-xs text-slate-500 space-y-0.5">
          {mandi.operatingHours && (
            <div>
              Hours: <span className="font-medium text-slate-700">{mandi.operatingHours}</span>
            </div>
          )}
          {mandi.contactPhone && (
            <div>
              Contact: <span className="font-medium text-slate-700">{mandi.contactPhone}</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Crops Procured
          </span>
          <div className="flex flex-wrap gap-1.5">
            {mandi.cropsSupported && mandi.cropsSupported.length > 0 ? (
              mandi.cropsSupported.map((crop, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                >
                  <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                  {crop}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">All major crops</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/mandi/${mandi._id}`);
          }}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
        >
          <span>View Prices & Sell</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default MandiCard;