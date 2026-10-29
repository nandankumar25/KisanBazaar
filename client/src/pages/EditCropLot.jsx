import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CropLotForm from '../components/CropLotForm';
import { getCropLotById, updateCropLot } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';

const EditCropLot = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchLot = async () => {
      try {
        const res = await getCropLotById(id);
        setInitialData(res.data);
      } catch (err) {
        setError('Failed to fetch crop lot details.');
      } finally {
        setLoading(false);
      }
    };
    fetchLot();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setUpdating(true);
      setError(null);
      await updateCropLot(id, formData);
      alert('Crop lot updated successfully.');
      navigate('/my-crops');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update crop lot. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading message="Loading crop lot details..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Edit Crop Lot</h1>
        <p className="text-slate-600 mt-1">Update your market listing</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {initialData && (
        <CropLotForm 
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={updating}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default EditCropLot;
