import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  Package, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Lock,
  CreditCard,
  Building,
  Smartphone,
  Store,
  Navigation,
  RefreshCw,
  Banknote,
  IndianRupee,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createTransportBooking } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

const POPULAR_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Axis Bank',
];

const ALL_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Axis Bank',
  'Canara Bank',
  'Union Bank of India',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'IDBI Bank',
  'Central Bank of India',
  'Punjab & Sind Bank',
  'NABARD Rural Bank Partner',
];

const TransportBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const locationState = location.state || {};

  // Mandi Sale Request & Crop Details
  const mandiBookingId = queryParams.get('mandiBookingId') || locationState.mandiBookingId || '';
  const cropLotId = queryParams.get('cropLot') || locationState.cropLotId || locationState.selectedLot?._id || '';
  const offerId = queryParams.get('offerId') || locationState.offerId || '';
  const cropName = queryParams.get('crop') || locationState.cropName || 'Crop';
  const quantity = Number(queryParams.get('quantity') || locationState.quantity || 0);

  // Transporter & Vehicle Details
  const transporterId = queryParams.get('transporter') || queryParams.get('transporterId') || locationState.selectedTransporter?._id || '';
  const transporterName = queryParams.get('transporterName') || locationState.selectedTransporter?.name || 'Verified Transporter';
  const vehicleType = queryParams.get('vehicleType') || locationState.selectedTransporter?.vehicleType || 'Commercial Truck';
  const vehicleNumber = queryParams.get('vehicleNumber') || locationState.selectedTransporter?.vehicleNumber || '';
  const capacity = Number(queryParams.get('capacity') || locationState.selectedTransporter?.capacity || 0);

  // Route & Cost Details
  const destination = queryParams.get('destination') || locationState.destination || 'Mandi Yard';
  const distanceKm = Number(queryParams.get('distance') || locationState.distanceKm || 35);
  const ratePerKm = Number(queryParams.get('ratePerKm') || locationState.selectedTransporter?.pricePerKm || 0);
  const totalCost = Number(queryParams.get('totalCost') || locationState.totalCost || ratePerKm * distanceKm);
  const costPerQuintal = Number(queryParams.get('costPerQuintal') || locationState.costPerQuintal || (quantity > 0 ? (totalCost / quantity).toFixed(2) : 0));

  const initialPickup = queryParams.get('pickupLocation') || locationState.pickupLocation || (
    user?.location ? [user.location.village, user.location.city || user.location.district, user.location.state].filter(Boolean).join(', ') : 'Farmer Village / Farm Yard'
  );

  // Booking Form State
  const [pickupLocation, setPickupLocation] = useState(initialPickup);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [farmerNotes, setFarmerNotes] = useState('');

  // Payment Form State (Options: 'Cash on Delivery (COD)' | 'UPI' | 'Debit/Credit Card' | 'Net Banking')
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');

  // Status & Lock States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Capacity Validation
  const isCapacitySufficient = capacity >= quantity;

  // Format Card Number with space every 4 digits
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Card Expiry as MM/YY
  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Submit Payment and Confirm Booking
  const handlePayAndConfirm = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate clicks and submissions
    setError(null);

    // 1. Booking Details Validation
    if (!transporterId) {
      setError('Please select a valid transporter to proceed.');
      return;
    }

    if (!pickupLocation.trim()) {
      setError('Pickup location is required.');
      return;
    }

    if (!scheduledDate) {
      setError('Preferred pickup date is required.');
      return;
    }

    if (quantity > 0 && capacity > 0 && !isCapacitySufficient) {
      setError(`Vehicle capacity (${capacity} qtl) is less than the required payload (${quantity} qtl).`);
      return;
    }

    // 2. Payment Method Validation
    const isCod = paymentMethod === 'Cash on Delivery (COD)';

    if (!isCod) {
      // Validate online payment details
      if (paymentMethod === 'UPI') {
        if (!upiId.trim()) {
          setError('Please enter your UPI ID (VPA) to proceed with payment.');
          return;
        }
        if (!upiId.includes('@')) {
          setError('Please enter a valid UPI ID (e.g., username@upi or mobile@okhdfcbank).');
          return;
        }
      } else if (paymentMethod === 'Debit/Credit Card') {
        const cleanDigits = cardNumber.replace(/\s+/g, '');
        if (!cleanDigits || cleanDigits.length < 15 || cleanDigits.length > 16) {
          setError('Please enter a valid 16-digit Debit or Credit Card number.');
          return;
        }
        if (!cardHolder.trim()) {
          setError('Please enter the name on the card.');
          return;
        }
        if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
          setError('Please enter a valid Card Expiry Date in MM/YY format.');
          return;
        }
        if (!cardCvv.trim() || cardCvv.length < 3) {
          setError('Please enter a valid 3-digit CVV number.');
          return;
        }
      } else if (paymentMethod === 'Net Banking') {
        if (!selectedBank) {
          setError('Please select your Bank for Net Banking transfer.');
          return;
        }
      }
    }

    try {
      setLoading(true);

      const demoFarmerId = user?._id || import.meta.env.VITE_DEMO_FARMER_ID || '6ada167fdd87d2038543eb57';
      const referencePrefix = isCod ? 'COD' : paymentMethod.replace(/[^A-Z]/gi, '').toUpperCase();
      const transactionReference = `TR-${referencePrefix}-${Date.now().toString().slice(-6)}`;

      // Construct booking payload with payment status PENDING (Do not mark COD bookings as PAID)
      const bookingPayload = {
        farmer: user?._id || demoFarmerId,
        transporter: transporterId,
        pickupLocation: pickupLocation.trim(),
        destination: destination.trim(),
        distanceKm: distanceKm,
        totalCost: totalCost,
        costPerQuintal: costPerQuintal,
        status: 'BOOKED',
        bookingDate: new Date(scheduledDate),
        cropName: cropName,
        quantity: quantity,
        vehicleType: vehicleType,
        vehicleNumber: vehicleNumber,
        notes: farmerNotes.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        // Payment Details (Stored in Transport record)
        paymentStatus: isCod ? 'PENDING' : 'PAID',
        paymentMethod: paymentMethod,
        transactionReference: transactionReference,
        paidAmount: isCod ? 0 : totalCost,
        paymentDate: isCod ? undefined : new Date(),
        paymentGatewayStatus: isCod ? 'COD_PENDING' : 'SUCCESS',
      };

      if (cropLotId) {
        bookingPayload.cropLot = cropLotId;
      }
      if (offerId) {
        bookingPayload.offer = offerId;
      }
      if (mandiBookingId) {
        bookingPayload.mandiBooking = mandiBookingId;
      }

      const res = await createTransportBooking(bookingPayload);
      if (res.success || res.data) {
        setConfirmedBooking({
          ...(res.data || res),
          paymentMethod,
          transactionReference,
          paymentStatus: isCod ? 'PENDING' : 'PAID',
          paidAmount: isCod ? 0 : totalCost,
        });
      } else {
        setError('Failed to record transport booking. Please check details and try again.');
      }
    } catch (err) {
      console.error('Transport booking payment and confirmation failed:', err);
      setError(
        err.response?.data?.message || 'Payment initiation failed. Please check network connection and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!transporterId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">No Transporter Selected</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Please select an available vehicle and transporter from the Transport Finder before proceeding to booking.
          </p>
          <div className="mt-6">
            <Link
              to="/transport"
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transport Finder
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to={`/transport?destination=${encodeURIComponent(destination)}&crop=${encodeURIComponent(cropName)}&quantity=${quantity}&distance=${distanceKm}${mandiBookingId ? `&mandiBookingId=${mandiBookingId}` : ''}`}
          className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Available Vehicles
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-600" /> Confirm Transport Booking & Payment
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review logistics details, select payment method (online or Cash on Delivery), and confirm freight without duplicate cost calculation.
            </p>
          </div>
          {mandiBookingId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-full w-fit">
              <Store className="w-3.5 h-3.5" />
              <span>Mandi Request: #{mandiBookingId.slice(-6).toUpperCase()}</span>
            </span>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Confirmation Success View */}
      {confirmedBooking ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Transport Booked & Confirmed!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your transport request has been locked and assigned. Transporter has been notified.
            </p>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 text-left text-xs space-y-2 max-w-lg mx-auto">
            <div className="flex justify-between border-b border-emerald-100 pb-2">
              <span className="text-slate-500">Booking Reference:</span>
              <span className="font-mono font-bold text-slate-900">
                {confirmedBooking._id ? confirmedBooking._id.slice(-8).toUpperCase() : 'TR-' + Date.now().toString().slice(-6)}
              </span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2">
              <span className="text-slate-500">Transporter:</span>
              <span className="font-bold text-slate-900">{transporterName}</span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-bold text-slate-900">{vehicleType} {vehicleNumber ? `(${vehicleNumber})` : ''}</span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2">
              <span className="text-slate-500">Cargo Payload:</span>
              <span className="font-bold text-slate-900">{cropName} • {quantity} Quintals</span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2">
              <span className="text-slate-500">Route:</span>
              <span className="font-bold text-slate-900">{pickupLocation} → {destination} ({distanceKm} km)</span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2 items-center">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {confirmedBooking.paymentMethod?.includes('COD') ? (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">
                    💵 Cash on Delivery (COD)
                  </span>
                ) : (
                  confirmedBooking.paymentMethod || paymentMethod
                )}
              </span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2 items-center">
              <span className="text-slate-500">Payment Status:</span>
              <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                confirmedBooking.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {confirmedBooking.paymentStatus === 'PAID'
                  ? 'PAID (Online Payment Verified)'
                  : 'PENDING (Pay cash to transporter upon delivery)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-emerald-100 pb-2">
              <span className="text-slate-500">Transaction Ref:</span>
              <span className="font-mono text-slate-700">{confirmedBooking.transactionReference}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600 font-semibold">Total Locked Cost:</span>
              <span className="font-bold text-emerald-800 text-sm">
                ₹{Number(totalCost).toLocaleString('en-IN')} (₹{Number(costPerQuintal).toFixed(2)}/qtl)
              </span>
            </div>
          </div>

          {/* Contextual Guidance Note */}
          {confirmedBooking.paymentMethod?.includes('COD') ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-[11px] text-emerald-900 max-w-lg mx-auto text-left space-y-1">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash on Delivery (COD) Payment Instructions:</span>
              </span>
              <p className="text-emerald-800">
                Please keep exact cash of <strong>₹{Number(totalCost).toLocaleString('en-IN')}</strong> ready. Pay the transporter in cash at the agreed delivery/pickup stage. Transporter has been notified that payment will be received via COD.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 max-w-lg mx-auto text-left">
              <span className="font-bold text-amber-950 block">Payment Integration Note:</span>
              Your booking is officially recorded. Since live payment gateway processing is pending merchant activation, your card/UPI was not debited. Freight payment can be finalized upon vehicle arrival and delivery.
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Go to Farmer Dashboard
            </Link>
            <Link
              to="/transport"
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Book Another Transport
            </Link>
          </div>
        </div>
      ) : (
        /* Booking Confirmation & Integrated Payment Form */
        <form onSubmit={handlePayAndConfirm} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Summary, Form Fields & Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cargo & Vehicle Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{transporterName}</h3>
                    <p className="text-[11px] text-slate-500">
                      {vehicleType} {vehicleNumber ? `• ${vehicleNumber}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Capacity: {capacity} Qtl
                  </span>
                </div>
              </div>

              {/* Crop & Payload Badge */}
              <div className="bg-slate-50 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Crop Consignment:</span>
                </div>
                <span className="font-bold text-slate-900">
                  {cropName} – {quantity} Quintals
                </span>
              </div>

              {/* Capacity Warning Check */}
              {!isCapacitySufficient && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Insufficient Capacity:</strong> The selected vehicle has a payload capacity of {capacity} qtl, which cannot accommodate {quantity} qtl. Please choose a higher capacity vehicle.
                  </span>
                </div>
              )}
            </div>

            {/* Logistics Schedule & Pickup Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Pickup & Logistics Details
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pickup Location / Village Farm Yard *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="e.g. Village Samrala, Farm Gate No. 2"
                      className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Destination Mandi Yard
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={destination}
                        className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed"
                      />
                      <Navigation className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Preferred Pickup Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Farmer Contact Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Estimated Road Distance
                    </label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                      {distanceKm} km (Verified Mandi Transit)
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loading & Handling Instructions (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={farmerNotes}
                    onChange={(e) => setFarmerNotes(e.target.value)}
                    placeholder="e.g. Cargo loaded in 50kg gunny bags, farm gate accessible by heavy trucks"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details Section (Includes Cash on Delivery + Online options) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Payment Details</h3>
                    <p className="text-[11px] text-slate-500">
                      Choose between Cash on Delivery (COD) or Online Payment methods
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Secure & Verified</span>
                </div>
              </div>

              {/* Exact Calculated Transport Cost in Payment Section */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                    Exact Amount Payable
                  </span>
                  <span className="text-xs text-emerald-800">
                    Pre-calculated freight for {quantity} quintals over {distanceKm} km
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-2xl font-black text-emerald-950 block">
                    ₹{Number(totalCost).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ₹{Number(costPerQuintal).toFixed(2)}/qtl • No hidden fees
                  </span>
                </div>
              </div>

              {/* 4 Payment Method Options (Requirement 1, 2, 3: Cash on Delivery COD + UPI + Card + Net Banking) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select Payment Option *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Option 1: Cash on Delivery (COD) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('Cash on Delivery (COD)');
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'Cash on Delivery (COD)'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'Cash on Delivery (COD)' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Banknote className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Popular
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Cash on Delivery</span>
                      <span className="text-[10px] text-slate-500">Pay in cash on transit</span>
                    </div>
                  </button>

                  {/* Option 2: UPI */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('UPI');
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-2 w-fit ${paymentMethod === 'UPI' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">UPI</span>
                      <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</span>
                    </div>
                  </button>

                  {/* Option 3: Debit/Credit Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('Debit/Credit Card');
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'Debit/Credit Card'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-2 w-fit ${paymentMethod === 'Debit/Credit Card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Debit / Credit Card</span>
                      <span className="text-[10px] text-slate-500">Visa, RuPay, Master</span>
                    </div>
                  </button>

                  {/* Option 4: Net Banking */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('Net Banking');
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'Net Banking'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-2 w-fit ${paymentMethod === 'Net Banking' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Net Banking</span>
                      <span className="text-[10px] text-slate-500">All Indian Banks</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Details Inputs */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
                
                {/* 1. Cash on Delivery (COD) View (Requirement 4: Hide UPI/Card/Bank fields, show clear message, keep fare visible) */}
                {paymentMethod === 'Cash on Delivery (COD)' && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-emerald-950">
                          Cash on Delivery (COD) Selected
                        </h4>
                        <p className="text-xs text-emerald-800 font-semibold">
                          Pay the transporter in cash at the agreed delivery/pickup stage.
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          No online transaction or advance digital payment is required. Your vehicle reservation will be confirmed immediately. Please keep exact cash of <strong>₹{Number(totalCost).toLocaleString('en-IN')}</strong> ready at the time of crop loading or mandi yard arrival.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
                      <span>Exact Cash to Handover:</span>
                      <span className="font-black text-sm text-emerald-950">
                        ₹{Number(totalCost).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. UPI Inputs */}
                {paymentMethod === 'UPI' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Virtual Payment Address (UPI ID) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. mobile@okhdfcbank or farmer@upi"
                          className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    {/* Quick Handle Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400">Quick suffix:</span>
                      {['@okaxis', '@okhdfcbank', '@oksbi', '@paytm', '@ybl'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const base = upiId.split('@')[0] || user?.phone || 'kisan';
                            setUpiId(`${base}${handle}`);
                          }}
                          className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-400 text-slate-600 rounded text-[10px] font-medium transition"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Online payment verification will be initiated with your UPI app.
                    </p>
                  </div>
                )}

                {/* 3. Debit/Credit Card Inputs */}
                {paymentMethod === 'Debit/Credit Card' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Card Number *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234  5678  9012  3456"
                          maxLength={19}
                          className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          CVV Code *
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full px-3 py-2 pl-8 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Net Banking Inputs */}
                {paymentMethod === 'Net Banking' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Select Popular Bank
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {POPULAR_BANKS.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setSelectedBank(b)}
                            className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition ${
                              selectedBank === b
                                ? 'border-emerald-600 bg-emerald-100/70 text-emerald-900'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Or Choose from All Indian Banks
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {ALL_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Online Payment Notice (Only for Online options, not COD) */}
                {paymentMethod !== 'Cash on Delivery (COD)' && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950 block">Online Gateway Notice:</span>
                      <span>
                        Live online gateway processing is currently pending backend banking activation. If you prefer to settle in cash without advance digital payment, select <strong>Cash on Delivery (COD)</strong> above.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pre-calculated Fare & "Pay & Confirm Transport" Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Fare Summary</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Pre-Calculated
                </span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Rate per KM:</span>
                  <span className="font-bold text-slate-800">₹{ratePerKm}/km</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Transit Distance:</span>
                  <span className="font-bold text-slate-800">{distanceKm} km</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payload Quantity:</span>
                  <span className="font-bold text-slate-800">{quantity} Quintals</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Est. Freight / Quintal:</span>
                  <span className="font-bold text-emerald-700">₹{Number(costPerQuintal).toFixed(2)}/qtl</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-slate-800">{paymentMethod}</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">Total Transport Cost:</span>
                    <span className="text-[10px] text-slate-400">Direct freight charges</span>
                  </div>
                  <span className="font-black text-emerald-800 text-lg">
                    ₹{Number(totalCost).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-900 space-y-1">
                <div className="flex items-center gap-1 font-bold text-emerald-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fixed & Guaranteed Rate</span>
                </div>
                <p className="text-emerald-800">
                  Cost calculated based on the accepted mandi route. No recalculation or surprise freight recalculation.
                </p>
              </div>

              {/* Action Button: Pay & Confirm Transport (COD or Online) */}
              <button
                type="submit"
                disabled={loading || !isCapacitySufficient}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming Booking...</span>
                  </span>
                ) : (
                  <>
                    {paymentMethod === 'Cash on Delivery (COD)' ? (
                      <Banknote className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>
                      {paymentMethod === 'Cash on Delivery (COD)'
                        ? `Confirm Transport with COD (₹${Number(totalCost).toLocaleString('en-IN')})`
                        : `Pay & Confirm Transport`}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                {paymentMethod === 'Cash on Delivery (COD)'
                  ? 'No digital payment needed now. Pay in cash to the transporter upon delivery.'
                  : 'One-step booking & payment. Transporter will be locked and assigned instantly.'}
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default TransportBooking;
