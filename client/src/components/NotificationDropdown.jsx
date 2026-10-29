import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageSquare,
  Receipt,
  Clock,
  ChevronRight,
  Truck,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const NotificationDropdown = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const dropdownRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Fetch unread count periodically
  const fetchCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getUnreadNotificationCount();
      if (res.success) {
        const count = typeof res.data?.unreadCount === 'number' ? res.data.unreadCount : res.unreadCount;
        if (typeof count === 'number') {
          setUnreadCount(count);
        }
      }
    } catch (err) {
      // silent
    }
  };

  // Fetch list when opened
  const fetchNotificationsList = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCount();
      pollTimerRef.current = setInterval(fetchCount, 15000);

      const handleNotificationsUpdated = () => {
        fetchCount();
      };
      window.addEventListener('notifications-updated', handleNotificationsUpdated);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        window.removeEventListener('notifications-updated', handleNotificationsUpdated);
      };
    }
  }, [isAuthenticated]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setExpandedId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotificationsList();
    } else {
      setExpandedId(null);
    }
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notif) => {
    // 1. Toggle expansion: if already expanded, collapse it; otherwise expand it
    setExpandedId((prev) => (prev === notif._id ? null : notif._id));

    // 2. Mark as read if not already read
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'OFFER_RECEIVED':
      case 'OFFER_NEW':
      case 'OFFER_COUNTERED':
      case 'OFFER_COUNTER':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'OFFER_ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'OFFER_REJECTED':
      case 'OFFER_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'DEAL_CONFIRMED':
        return <Receipt className="w-4 h-4 text-blue-600" />;
      case 'TRANSPORT_BOOKING':
      case 'TRANSPORT_UPDATE':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'TRANSPORT_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'TRANSPORT_REFUND':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        title="View Notifications"
        className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  We will notify you here when offers or messages arrive.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isExpanded = expandedId === notif._id;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition flex items-start space-x-3 text-left ${
                      !notif.isRead ? 'bg-emerald-50/40' : ''
                    } ${isExpanded ? 'bg-slate-50/80 shadow-inner' : ''}`}
                  >
                    <div className="p-2 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <p
                          className={`text-xs ${
                            isExpanded ? 'whitespace-normal break-words' : 'truncate'
                          } ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1.5">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>

                      {isExpanded ? (
                        <>
                          <p className="text-[11px] text-slate-700 whitespace-normal break-words leading-relaxed mt-1">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            Click to collapse
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center shrink-0 space-y-1 mt-1">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-emerald-600' : ''
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
