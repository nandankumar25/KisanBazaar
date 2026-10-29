import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCropLots, getMatchedBuyers } from '../services/api';
import BuyerCard from '../components/BuyerCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { Search, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        setCropLots(res.data);
        
        if (preSelectedLot && res.data.some(l => l._id === preSelectedLot)) {
          setSelectedLotId(preSelectedLot);
        } else if (res.data.length > 0) {
          // Auto select first if none specified
          setSelectedLotId(res.data[0]._id);
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
        setMatchedBuyers(res.data);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Find Buyers</h1>
        <p className="text-slate-600 mt-1">Find buyers whose crop, quantity, quality and location requirements match your lot.</p>
        <div className="mt-2 inline-flex items-center text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
          Demo Match Score • Sample Buyer Data
        </div>
      </div>

      {/* Crop Lot Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <Sprout className="w-5 h-5 mr-2 text-emerald-600" />
          Select a Crop Lot to Match
        </h2>
        
        {cropLots.length === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
            You don't have any available crop lots. Create one first to find buyers.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {cropLots.map(lot => (
              <button
                key={lot._id}
                onClick={() => setSelectedLotId(lot._id)}
                className={`flex items-center px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  selectedLotId === lot._id 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <span>{lot.crop}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-500">{lot.quantity} {lot.unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Matching Results */}
      {error && <ErrorMessage message={error} />}

      {!error && selectedLotId && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Search className="w-5 h-5 mr-2 text-emerald-600" />
            Suitable Buyers
          </h2>

          {loadingBuyers ? (
            <Loading message="Finding suitable buyers..." />
          ) : matchedBuyers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedBuyers.map(match => (
                <BuyerCard key={match.buyer._id} matchData={match} selectedLotId={selectedLotId} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No suitable buyers found for this crop lot.</h3>
              <p className="text-slate-500">Try matching a different crop lot or check back later as new buyers register.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindBuyers;
