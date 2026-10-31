import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import FarmerDashboard from './pages/FarmerDashboard';
import MandiPrices from './pages/MandiPrices';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyCrops from './pages/MyCrops';
import CreateCropLot from './pages/CreateCropLot';
import EditCropLot from './pages/EditCropLot';
import FindBuyers from './pages/FindBuyers';
import BuyerDetails from './pages/BuyerDetails';
import FindCrops from './pages/FindCrops';
import CropLotDetails from './pages/CropLotDetails';
import MakeOffer from './pages/MakeOffer';
import MyOffers from './pages/MyOffers';
import FarmerOffers from './pages/FarmerOffers';
import TransportFinder from './pages/TransportFinder';
import TransportBooking from './pages/TransportBooking';
import Transactions from './pages/Transactions';
import CreateTransaction from './pages/CreateTransaction';
import TransactionDetails from './pages/TransactionDetails';
import TransporterDashboard from './pages/TransporterDashboard';
import MyVehicles from './pages/MyVehicles';
import MandiDashboard from './pages/MandiDashboard';
import MandiOffers from './pages/MandiOffers';
import MandiDetails from './pages/MandiDetails';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import PaymentStatus from './pages/PaymentStatus';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="mandi-prices" element={<MandiPrices />} />
            <Route path="about" element={<About />} />
            <Route path="find-buyers" element={<FindBuyers />} />
            <Route path="buyer/:id" element={<BuyerDetails />} />
            <Route path="find-crops" element={<FindCrops />} />
            <Route path="crop-lot/:id" element={<CropLotDetails />} />
            <Route path="transport" element={<TransportFinder />} />
            <Route path="book-transport" element={<TransportBooking />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transaction/:id" element={<Navigate to="/transactions" replace />} />
            <Route path="mandi/:id" element={<MandiDetails />} />
            <Route path="mandis/:id" element={<MandiDetails />} />

            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email/:token" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />

            {/* User Profile (Protected: FARMER, BUYER, TRANSPORTER, ADMIN) */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Direct Messaging & Negotiation (Protected: All Authenticated Roles) */}
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* Payment & Refund Status Tracking (Protected) */}
            <Route
              path="payment-status"
              element={
                <ProtectedRoute>
                  <PaymentStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment-status/:id"
              element={
                <ProtectedRoute>
                  <PaymentStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute>
                  <PaymentStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments/:id"
              element={
                <ProtectedRoute>
                  <PaymentStatus />
                </ProtectedRoute>
              }
            />

            {/* Farmer Routes (Protected: FARMER, ADMIN) */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="farmer" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="my-crops"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <MyCrops />
                </ProtectedRoute>
              }
            />
            <Route
              path="create-crop-lot"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <CreateCropLot />
                </ProtectedRoute>
              }
            />
            <Route
              path="edit-crop-lot/:id"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <EditCropLot />
                </ProtectedRoute>
              }
            />
            <Route
              path="offers"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <FarmerOffers />
                </ProtectedRoute>
              }
            />

            {/* Buyer Routes (Protected: BUYER, ADMIN) */}
            <Route
              path="make-offer/:cropLotId"
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'ADMIN', 'FARMER']}>
                  <MakeOffer />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-offers"
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                  <MyOffers />
                </ProtectedRoute>
              }
            />
            <Route path="my-bids" element={<Navigate to="/my-offers" replace />} />
            <Route path="bids" element={<Navigate to="/my-offers" replace />} />
            <Route
              path="buyer-dashboard"
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                  <FindCrops />
                </ProtectedRoute>
              }
            />
            <Route path="buyers" element={<Navigate to="/buyer-dashboard" replace />} />
            <Route path="buyer" element={<Navigate to="/buyer-dashboard" replace />} />

            {/* Transaction Creation (Protected: BUYER, FARMER, ADMIN) */}
            <Route
              path="create-transaction/:offerId"
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'FARMER', 'ADMIN']}>
                  <CreateTransaction />
                </ProtectedRoute>
              }
            />

            {/* Transporter Fleet Dashboard & My Vehicles (Protected: TRANSPORTER, ADMIN) */}
            <Route
              path="transporter-dashboard"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORTER', 'ADMIN']}>
                  <TransporterDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="transporter" element={<Navigate to="/transporter-dashboard" replace />} />
            <Route
              path="my-vehicles"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORTER', 'ADMIN']}>
                  <MyVehicles />
                </ProtectedRoute>
              }
            />

            {/* Mandi Admin Dashboard (Protected: MANDI_ADMIN, ADMIN) */}
            <Route
              path="mandi-dashboard"
              element={
                <ProtectedRoute allowedRoles={['MANDI_ADMIN', 'ADMIN']}>
                  <MandiDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="mandi-offers"
              element={
                <ProtectedRoute allowedRoles={['MANDI_ADMIN', 'ADMIN', 'FARMER']}>
                  <MandiOffers />
                </ProtectedRoute>
              }
            />
            <Route path="admin-offers" element={<Navigate to="/mandi-offers" replace />} />

            {/* Super Admin Control Panel (Protected: ADMIN) */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
