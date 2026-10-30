import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  Sprout as SproutIcon,
  Users,
  Truck,
  Receipt,
  CreditCard,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Info,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationDropdown from './NotificationDropdown';
import { getUnreadMessageCount } from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const userMenuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  // Close user dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setIsOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  // Close menus when route changes
  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Fetch unread messages count periodically
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessagesCount(0);
      return;
    }

    const fetchMsgCount = async () => {
      try {
        const res = await getUnreadMessageCount();
        if (res.success) {
          const count = typeof res.data?.unreadCount === 'number' ? res.data.unreadCount : res.unreadCount;
          if (typeof count === 'number') {
            setUnreadMessagesCount(count);
          }
        }
      } catch (err) {
        // silent
      }
    };

    fetchMsgCount();
    const interval = setInterval(fetchMsgCount, 15000);

    const handleMessagesUpdated = () => {
      fetchMsgCount();
    };
    window.addEventListener('messages-updated', handleMessagesUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-updated', handleMessagesUpdated);
    };
  }, [isAuthenticated, location.pathname]);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BUYER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TRANSPORTER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MANDI_ADMIN':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  // Logo destination: Farmer -> /dashboard; Buyer -> /buyer-dashboard; Transporter -> /transporter-dashboard; Mandi -> /mandi-dashboard; others -> /
  const getLogoDestination = () => {
    if (isAuthenticated && user?.role === 'FARMER') {
      return '/dashboard';
    }
    if (isAuthenticated && user?.role === 'BUYER') {
      return '/buyer-dashboard';
    }
    if (isAuthenticated && user?.role === 'TRANSPORTER') {
      return '/transporter-dashboard';
    }
    if (isAuthenticated && user?.role === 'MANDI_ADMIN') {
      return '/mandi-dashboard';
    }
    return '/';
  };

  const getLogoTitle = () => {
    if (isAuthenticated && user?.role === 'FARMER') return 'KisanBazaar - Farmer Dashboard';
    if (isAuthenticated && user?.role === 'BUYER') return 'KisanBazaar - Buyer Dashboard';
    if (isAuthenticated && user?.role === 'TRANSPORTER') return 'KisanBazaar - Transporter Dashboard';
    if (isAuthenticated && user?.role === 'MANDI_ADMIN') return 'KisanBazaar - Mandi Dashboard';
    return 'KisanBazaar - Home';
  };

  const navLinkClass = (path) =>
    `px-2.5 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition text-xs xl:text-sm whitespace-nowrap ${
      isActive(path)
        ? 'text-emerald-700 font-bold bg-emerald-50'
        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
    }`;

  const mobileNavLinkClass = (path) =>
    `block px-3 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive(path)
        ? 'text-emerald-700 font-bold bg-emerald-50'
        : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* 1. KisanBazaar Logo */}
          <Link
            to={getLogoDestination()}
            title={getLogoTitle()}
            className="flex items-center space-x-2 text-emerald-700 font-bold text-xl tracking-tight hover:opacity-90 transition shrink-0"
          >
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="whitespace-nowrap">
              Kisan<span className="text-emerald-900">Bazaar</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center text-sm">
            {!isAuthenticated ? (
              /* Public Navbar: 2. Mandi Prices, 3. About Us, 4. Sign In, 5. Join Free */
              <div className="flex items-center space-x-1 xl:space-x-2 text-sm">
                <Link to="/mandi-prices" className={navLinkClass('/mandi-prices')}>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Mandi Prices</span>
                </Link>

                <Link to="/about" className={navLinkClass('/about')}>
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>About Us</span>
                </Link>

                <div className="flex items-center space-x-2 pl-3 ml-2 border-l border-slate-200">
                  <Link
                    to="/login"
                    className={`font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap text-xs xl:text-sm ${
                      isActive('/login')
                        ? 'text-emerald-700 font-bold bg-emerald-50'
                        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition active:scale-95 text-xs xl:text-sm whitespace-nowrap"
                  >
                    Join Free
                  </Link>
                </div>
              </div>
            ) : (
              /* Authenticated Navbars (Farmer, Buyer, Transporter, Admin) */
              <div className="flex items-center space-x-1 xl:space-x-2 2xl:space-x-3 text-sm">
                {/* Admin Home */}
                {user?.role === 'ADMIN' && (
                  <Link to="/" className={navLinkClass('/')}>
                    Home
                  </Link>
                )}

                {/* Authenticated Farmer Dashboard: Ordered first for Farmer */}
                {user?.role === 'FARMER' && (
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* Authenticated Buyer Dashboard: Ordered first for Buyer */}
                {user?.role === 'BUYER' && (
                  <Link to="/buyer-dashboard" className={navLinkClass('/buyer-dashboard')}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* Authenticated Transporter Dashboard: Ordered first for Transporter */}
                {user?.role === 'TRANSPORTER' && (
                  <Link to="/transporter-dashboard" className={navLinkClass('/transporter-dashboard')}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* Authenticated Mandi Admin Dashboard */}
                {(user?.role === 'MANDI_ADMIN' || user?.role === 'ADMIN') && (
                  <Link to="/mandi-dashboard" className={navLinkClass('/mandi-dashboard')}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Mandi Console</span>
                  </Link>
                )}

                {/* Transporter: My Vehicles */}
                {user?.role === 'TRANSPORTER' && (
                  <Link to="/my-vehicles" className={navLinkClass('/my-vehicles')}>
                    <Truck className="w-4 h-4" />
                    <span>My Vehicles</span>
                  </Link>
                )}

                {/* Mandi Prices: Hidden for Transporter, shown for Farmer, Buyer, Admin */}
                {user?.role !== 'TRANSPORTER' && (
                  <Link to="/mandi-prices" className={navLinkClass('/mandi-prices')}>
                    <TrendingUp className="w-4 h-4" />
                    <span>Mandi Prices</span>
                  </Link>
                )}

                {/* Farmer Dashboard for Admin */}
                {user?.role === 'ADMIN' && (
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* Farmer specific: My Crops, Offers, & Payments */}
                {(user?.role === 'FARMER' || user?.role === 'ADMIN') && (
                  <>
                    <Link to="/my-crops" className={navLinkClass('/my-crops')}>
                      <SproutIcon className="w-4 h-4" />
                      <span>My Crops</span>
                    </Link>
                    <Link to="/offers" className={navLinkClass('/offers')}>
                      <span>Offers</span>
                    </Link>
                    <Link
                      to="/payments"
                      className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition text-xs xl:text-sm whitespace-nowrap ${
                        isActive('/payments') || isActive('/payment-status')
                          ? 'text-emerald-700 font-bold bg-emerald-50'
                          : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Payments</span>
                    </Link>
                  </>
                )}

                {/* Buyer Links: Find Crops & My Bids */}
                {(user?.role === 'BUYER' || user?.role === 'ADMIN') && (
                  <>
                    <Link to="/find-crops" className={navLinkClass('/find-crops')}>
                      <span>Find Crops</span>
                    </Link>
                    <Link to="/my-offers" className={navLinkClass('/my-offers')}>
                      <span>My Bids</span>
                    </Link>
                  </>
                )}

                {/* Admin: My Fleet */}
                {user?.role === 'ADMIN' && (
                  <Link to="/transporter-dashboard" className={navLinkClass('/transporter-dashboard')}>
                    <Truck className="w-4 h-4" />
                    <span>My Fleet</span>
                  </Link>
                )}

                {/* Tools Links */}
                <Link to="/transactions" className={navLinkClass('/transactions')}>
                  <Receipt className="w-4 h-4" />
                  <span>Deals</span>
                </Link>

                {/* Admin Link */}
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`font-bold flex items-center space-x-1.5 text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200 transition ${
                      isActive('/admin') ? 'ring-2 ring-purple-400' : ''
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Messages Link with Badge */}
                <Link
                  to="/messages"
                  title="Messages & Negotiations"
                  className={`relative p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition ${
                    isActive('/messages') ? 'text-emerald-700 bg-emerald-50' : ''
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* Notifications Bell Dropdown */}
                <NotificationDropdown />

                {/* Auth / Compact User Menu Actions */}
                <div className="relative pl-1 border-l border-slate-200 shrink-0" ref={userMenuRef}>
                  {/* Compact User Menu Trigger */}
                  <button
                    type="button"
                    id="user-menu-button"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    title="User Menu (Profile & Logout)"
                    className={`flex items-center space-x-2 p-1.5 pl-2 pr-2.5 rounded-xl border transition group ${
                      userMenuOpen || isActive('/profile')
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Avatar
                      src={user?.avatar}
                      name={user?.name}
                      role={user?.role}
                      size="sm"
                      className="ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition"
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-xs text-slate-800 leading-tight group-hover:text-emerald-700 transition">
                        {user?.name?.split(' ')[0] || 'User'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border w-fit ${getRoleBadgeClass(
                          user?.role
                        )}`}
                      >
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Card Header */}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 border-b border-slate-100 hover:bg-emerald-50/50 transition group"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar src={user?.avatar} name={user?.name} role={user?.role} size="md" />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                              <span className="truncate">{user?.name}</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-1.5 py-0.5 rounded ml-1 shrink-0">
                                Edit ✏️
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
                          </div>
                        </div>
                      </Link>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                            isActive('/profile')
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                          }`}
                        >
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>My Profile</span>
                        </Link>

                        {user?.role === 'FARMER' && (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                                isActive('/dashboard')
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                              }`}
                            >
                              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                              <span>Farmer Dashboard</span>
                            </Link>

                            <Link
                              to="/payments"
                              onClick={() => setUserMenuOpen(false)}
                              className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                                isActive('/payments') || isActive('/payment-status')
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                              }`}
                            >
                              <CreditCard className="w-4 h-4 text-emerald-600" />
                              <span>Payments & Refunds</span>
                            </Link>
                          </>
                        )}

                        {user?.role === 'BUYER' && (
                          <Link
                            to="/buyer-dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                              isActive('/buyer-dashboard')
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            <span>Buyer Dashboard</span>
                          </Link>
                        )}

                        {user?.role === 'MANDI_ADMIN' && (
                          <Link
                            to="/mandi-dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                              isActive('/mandi-dashboard')
                                ? 'bg-amber-50 text-amber-900'
                                : 'text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-600" />
                            <span>Mandi Dashboard</span>
                          </Link>
                        )}

                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                              isActive('/admin')
                                ? 'bg-purple-50 text-purple-800'
                                : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span>Admin Console</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout Button */}
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button & quick alerts */}
          <div className="flex lg:hidden items-center space-x-1 sm:space-x-2">
            {isAuthenticated && (
              <>
                <Link
                  to="/messages"
                  title="Messages"
                  className={`relative p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition ${
                    isActive('/messages') ? 'text-emerald-700 bg-emerald-50' : ''
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-3.5 min-w-[14px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white ring-1 ring-white">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
                <NotificationDropdown />
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 p-1 rounded-lg hover:bg-slate-50 transition"
                  title="View Profile"
                >
                  <Avatar src={user?.avatar} name={user?.name} role={user?.role} size="xs" />
                </Link>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 focus:outline-none transition"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-emerald-100 bg-white px-4 pt-3 pb-5 space-y-1.5 max-h-[85vh] overflow-y-auto shadow-inner">
          {!isAuthenticated ? (
            /* Public Mobile Nav: Mandi Prices, About Us, Sign In, Join Free */
            <div className="space-y-1.5 pt-1">
              <Link
                to="/mandi-prices"
                onClick={() => setIsOpen(false)}
                className={`${mobileNavLinkClass('/mandi-prices')} flex items-center space-x-2.5`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Mandi Prices</span>
              </Link>

              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className={`${mobileNavLinkClass('/about')} flex items-center space-x-2.5`}
              >
                <Info className="w-4 h-4 text-emerald-600" />
                <span>About Us</span>
              </Link>

              <div className="pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="py-2.5 text-center rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="py-2.5 text-center rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
                  >
                    Join Free
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated Mobile Nav */
            <>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="p-3 mb-2 bg-slate-50 hover:bg-emerald-50/70 rounded-xl flex items-center justify-between border border-slate-200 hover:border-emerald-300 transition group block"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={user?.avatar}
                    name={user?.name}
                    role={user?.role}
                    size="md"
                    className="ring-2 ring-emerald-500/20"
                  />
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-1.5">
                      <span>{user?.name}</span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Edit Profile
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[180px]">{user?.email}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeClass(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
              </Link>

              {/* Admin Home */}
              {user?.role === 'ADMIN' && (
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/')}
                >
                  Home
                </Link>
              )}

              {/* Authenticated Farmer Dashboard */}
              {user?.role === 'FARMER' && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/dashboard')}
                >
                  Farmer Dashboard
                </Link>
              )}

              {/* Authenticated Buyer Dashboard */}
              {user?.role === 'BUYER' && (
                <Link
                  to="/buyer-dashboard"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/buyer-dashboard')}
                >
                  Buyer Dashboard
                </Link>
              )}

              {/* Authenticated Transporter Dashboard */}
              {user?.role === 'TRANSPORTER' && (
                <Link
                  to="/transporter-dashboard"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/transporter-dashboard')}
                >
                  Dashboard
                </Link>
              )}

              {/* Authenticated Mandi Admin Dashboard */}
              {user?.role === 'MANDI_ADMIN' && (
                <Link
                  to="/mandi-dashboard"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/mandi-dashboard')}
                >
                  Mandi Dashboard
                </Link>
              )}

              {/* Authenticated Transporter: My Vehicles */}
              {user?.role === 'TRANSPORTER' && (
                <Link
                  to="/my-vehicles"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/my-vehicles')}
                >
                  My Vehicles
                </Link>
              )}

              {/* Mandi Prices: Hidden for Transporter, shown for Farmer, Buyer, Admin */}
              {user?.role !== 'TRANSPORTER' && (
                <Link
                  to="/mandi-prices"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/mandi-prices')}
                >
                  Mandi Prices
                </Link>
              )}

              {/* Farmer Dashboard for Admin */}
              {user?.role === 'ADMIN' && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/dashboard')}
                >
                  Farmer Dashboard
                </Link>
              )}

              {/* Farmer Links: My Crops, Offers, & Payments */}
              {(user?.role === 'FARMER' || user?.role === 'ADMIN') && (
                <>
                  <Link
                    to="/my-crops"
                    onClick={() => setIsOpen(false)}
                    className={mobileNavLinkClass('/my-crops')}
                  >
                    My Crops
                  </Link>
                  <Link
                    to="/offers"
                    onClick={() => setIsOpen(false)}
                    className={mobileNavLinkClass('/offers')}
                  >
                    Offers
                  </Link>
                  <Link
                    to="/payments"
                    onClick={() => setIsOpen(false)}
                    className={`${mobileNavLinkClass('/payments')} flex items-center space-x-2`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Payments & Refunds</span>
                  </Link>
                </>
              )}

              {/* Buyer Links: Find Crops & My Bids */}
              {(user?.role === 'BUYER' || user?.role === 'ADMIN') && (
                <>
                  <Link
                    to="/find-crops"
                    onClick={() => setIsOpen(false)}
                    className={mobileNavLinkClass('/find-crops')}
                  >
                    Find Crops
                  </Link>
                  <Link
                    to="/my-offers"
                    onClick={() => setIsOpen(false)}
                    className={mobileNavLinkClass('/my-offers')}
                  >
                    My Bids
                  </Link>
                </>
              )}

              {/* Admin: My Fleet */}
              {user?.role === 'ADMIN' && (
                <Link
                  to="/transporter-dashboard"
                  onClick={() => setIsOpen(false)}
                  className={mobileNavLinkClass('/transporter-dashboard')}
                >
                  Transporter Fleet Dashboard
                </Link>
              )}

              {/* Tools Links */}
              <Link
                to="/transactions"
                onClick={() => setIsOpen(false)}
                className={mobileNavLinkClass('/transactions')}
              >
                Deals
              </Link>

              <Link
                to="/messages"
                onClick={() => setIsOpen(false)}
                className={`${mobileNavLinkClass('/messages')} flex items-center justify-between`}
              >
                <span className="flex items-center space-x-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Messages & Chat</span>
                </span>
                {unreadMessagesCount > 0 && (
                  <span className="bg-emerald-600 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100"
                >
                  🛡️ Admin Dashboard
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                  isActive('/profile')
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>My Profile & Settings</span>
                </span>
                <span className="text-xs text-emerald-600 font-medium">Edit →</span>
              </Link>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
