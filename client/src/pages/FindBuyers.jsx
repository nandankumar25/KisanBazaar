import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getCropLots, getMatchedBuyers } from '../services/api';
import BuyerCard from '../components/BuyerCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { 
  Search, 
  Sprout, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Banknote, 
  Plus, 
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getCropEmoji = (crop) => {
  const c = (crop || '').toLowerCase();
  if (c.includes('wheat') || c.includes('kanak')) return '🌾';
  if (c.includes('rice') || c.includes('paddy') || c.includes('basmati')) return '🍚';
  if (c.includes('potato') || c.includes('aalu')) return '🥔';
  if (c.includes('mustard') || c.includes('sarson') || c.includes('oil')) return '🌼';
  if (c.includes('maize') || c.includes('makka')) return '🌽';
  if (c.includes('onion') || c.includes('pyaz')) return '🧅';
  if (c.includes('cotton') || c.includes('kapas')) return '🌿';
  return '🌱';
};

const FindBuyers = () => {
  const { user } = useAuth();
  const [cropLots, setCropLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [matchedBuyers, setMatchedBuyers] = useState([]);
  
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [error, setError] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preSelectedLot = queryParams.get('cropLot');

  const farmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoadingLots(true);
        const res = await getCropLots({ farmer: farmerId, status: 'AVAILABLE' });
        const lots = res.data || [];
        setCropLots(lots);
        
        if (preSelectedLot && lots.some(l => l._id === preSelectedLot)) {
          setSelectedLotId(preSelectedLot);
        } else if (lots.length > 0) {
          setSelectedLotId(lots[0]._id);
        }
      } catch (err) {
        setError('Unable to load your crop lots.');
      } finally {
        setLoadingLots(false);
      }
    };
    fetchLots();
  }, [farmerId, preSelectedLot]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedLotId) return;
      
      try {
        setLoadingBuyers(true);
        setError(null);
        const res = await getMatchedBuyers(selectedLotId);
        setMatchedBuyers(res.data || []);
      } catch (err) {
        setError('Unable to find buyers. Please try again.');
        setMatchedBuyers([]);
      } finally {
        setLoadingBuyers(false);
      }
    };

    fetchMatches();
  }, [selectedLotId]);

  if (loadingLots) return <Loading message="Loading your crop lots..." />;

  const selectedLot = cropLots.find(l => l._id === selectedLotId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Page Header & Matchmaking Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-10 text-white shadow-2xl border border-emerald-700/50">
        {/* Subtle Ambient Glow Lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Produce Matching • Direct Commercial Buyer Network</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Find Verified <span className="text-emerald-300">Buyers</span> 🤝
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-medium max-w-2xl">
            Match your active harvest lots with grain processors, millers, and verified wholesalers across Punjab. Get high-margin direct offers without middleman commission deductions.
          </p>

          {/* Value Props Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs text-emerald-200 font-medium">
            <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Commercial Buyers</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Direct Bank Escrow Settlement</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Crop Lot Selection Hub */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-6 rounded-full bg-emerald-600" />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Select Your Crop Lot to Match
              </h2>
              <p className="text-xs text-slate-500">
                Click a crop lot below to immediately discover buyers with matching procurement requirements
              </p>
            </div>
          </div>

          <Link
            to="/create-crop-lot"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition border border-emerald-200/80 w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Crop Lot</span>
          </Link>
        </div>
        
        {cropLots.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-2">
            <Sprout className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">You don't have any active crop listings yet.</p>
            <p className="text-xs text-slate-500">Create a crop listing first to unlock automated buyer matching.</p>
            <div className="pt-2">
              <Link
                to="/create-crop-lot"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Crop Lot</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
            {cropLots.map((lot) => {
              const isSelected = selectedLotId === lot._id;
              const emoji = getCropEmoji(lot.crop);

              return (
                <button
                  key={lot._id}
                  type="button"
                  onClick={() => setSelectedLotId(lot._id)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-2 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-slate-50/70 border-slate-200/90 hover:bg-white hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-2xl p-1.5 rounded-xl bg-white shadow-2xs border border-slate-100">
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-sm truncate group-hover:text-emerald-700 transition">
                          {lot.crop}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold truncate">
                          Grade {lot.qualityGrade || 'A'}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="p-1 rounded-full bg-emerald-600 text-white shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="font-extrabold text-slate-800">
                      {lot.quantity} <span className="text-[10px] text-slate-500 font-semibold">{lot.unit || 'qtl'}</span>
                    </span>
                    <span className="font-black text-emerald-800">
                      ₹{Number(lot.expectedPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Matching Results Section */}
      {error && <ErrorMessage message={error} />}

      {!error && selectedLotId && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-6 rounded-full bg-emerald-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Suitable Buyers
                  </h2>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span>{matchedBuyers.length} Verified Matches</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by crop compatibility, required quantity range, and target district proximity
                </p>
              </div>
            </div>

            {selectedLot && (
              <div className="hidden sm:inline-flex items-center space-x-2 text-xs bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold">
                <span>Matching for:</span>
                <strong className="text-emerald-700">{selectedLot.crop} ({selectedLot.quantity} {selectedLot.unit})</strong>
              </div>
            )}
          </div>

          {loadingBuyers ? (
            <Loading message="Running intelligent buyer match algorithm..." />
          ) : matchedBuyers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {matchedBuyers.map((match) => (
                <BuyerCard 
                  key={match.buyer._id} 
                  matchData={match} 
                  selectedLotId={selectedLotId} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">No suitable buyers found for this crop lot</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Currently, registered buyers' procurement needs do not match this specific quantity or grade. Select another lot or check back as new buyers register daily.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindBuyers;
