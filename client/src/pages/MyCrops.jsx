import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCropLots, deleteCropLot } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyCrops = () => {
  const { user } = useAuth();
  const [cropLots, setCropLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const farmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID;


  const fetchCropLots = async () => {
    try {
      setLoading(true);
      // Fetch all statuses for the farmer
      const res = await getCropLots({ farmer: farmerId, status: 'ALL' });
      setCropLots(res.data);
      setError(null);
    } catch (err) {
      setError('Unable to load your crop lots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCropLots();
  }, []);

  const handleDelete = async (id, status) => {
    if (status === 'SOLD') return;
    
    if (window.confirm('Are you sure you want to delete this crop lot?')) {
      try {
        await deleteCropLot(id);
        fetchCropLots();
        alert('Crop lot deleted successfully.');
      } catch (err) {
        alert('Error deleting crop lot.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'RESERVED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SOLD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) return <Loading message="Loading your crop lots..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Crop Lots</h1>
          <p className="text-slate-600 mt-1">Manage your market listings</p>
        </div>
        <Link 
          to="/create-crop-lot"
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Crop Lot</span>
        </Link>
      </div>

      {cropLots.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-12 text-center">
          <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No crop lots found.</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            You haven't added any crop lots to the marketplace yet. Create your first lot to start receiving offers.
          </p>
          <Link 
            to="/create-crop-lot"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition"
          >
            + Create Your First Crop Lot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cropLots.map(lot => (
            <div key={lot._id} className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5 hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{lot.crop}</h3>
                  <p className="text-sm text-slate-500">{lot.quantity} {lot.unit} • {lot.qualityGrade}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(lot.status)}`}>
                  {lot.status}
                </span>
              </div>
              
              <div className="flex items-center text-slate-600 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-1 text-emerald-600" />
                <span>{lot.location.district}, {lot.location.state}</span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-slate-500 mb-1">Expected Price</div>
                <div className="font-semibold text-emerald-700 text-lg">
                  ₹{lot.expectedPrice} <span className="text-sm font-normal">/ {lot.unit}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                {lot.status === 'AVAILABLE' && (
                  <button 
                    onClick={() => navigate(`/find-buyers?cropLot=${lot._id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-medium">Find Buyers</span>
                  </button>
                )}
                
                <div className="flex justify-between gap-3">
                  <button 
                    onClick={() => lot.status !== 'SOLD' && navigate(`/edit-crop-lot/${lot._id}`)}
                    disabled={lot.status === 'SOLD'}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(lot._id, lot.status)}
                    disabled={lot.status === 'SOLD'}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCrops;
