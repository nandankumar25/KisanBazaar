import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Sprout,
  Package,
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Phone,
  Building2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getConversationMessages,
  getOrCreateConversation,
  sendMessage,
} from '../services/api';
import Avatar from '../components/Avatar';

const getCropEmoji = (cropName) => {
  const map = {
    wheat: '🌾',
    rice: '🍚',
    paddy: '🌾',
    maize: '🌽',
    corn: '🌽',
    potato: '🥔',
    mustard: '🟡',
    cotton: '☁️',
    sugarcane: '🎋',
    soybean: '🫘',
    onion: '🧅',
    tomato: '🍅',
    chilli: '🌶️',
  };
  return map[cropName?.toLowerCase()] || '🌱';
};

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Mobile view state: 'list' or 'chat'
  const [mobileView, setMobileView] = useState('list');

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const res = await getConversations();
      if (res.success) {
        setConversations(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // 2. Initial load and handling URL params
  const convParam = searchParams.get('conversation');
  const userParam = searchParams.get('user');

  useEffect(() => {
    fetchConversations();

    // Auto refresh conversation list every 10s
    pollTimerRef.current = setInterval(() => {
      fetchConversations(true);
    }, 10000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (convParam) {
      selectConversationById(convParam);
    } else if (userParam) {
      handleUserParam(userParam);
    }
  }, [convParam, userParam]);

  const handleUserParam = async (userId) => {
    try {
      const res = await getOrCreateConversation({ otherUserId: userId });
      if (res.success && res.data) {
        setActiveConversation(res.data);
        setMobileView('chat');
        loadMessages(res.data._id);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Error starting conversation with user:', err);
    }
  };

  const selectConversationById = async (convId) => {
    try {
      const found = conversations.find((c) => c._id === convId);
      if (found) {
        setActiveConversation(found);
        setMobileView('chat');
        loadMessages(found._id);
      } else {
        const msgRes = await getConversationMessages(convId);
        if (msgRes.success && msgRes.conversation) {
          setActiveConversation(msgRes.conversation);
          setMobileView('chat');
          setMessages(msgRes.data || []);
          fetchConversations(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Load messages for active conversation
  const loadMessages = async (convId, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await getConversationMessages(convId);
      if (res.success) {
        setMessages(res.data || []);
        window.dispatchEvent(new Event('messages-updated'));
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Message polling for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    loadMessages(activeConversation._id);

    const activePoll = setInterval(() => {
      loadMessages(activeConversation._id, true);
    }, 4000);

    return () => clearInterval(activePoll);
  }, [activeConversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileView('chat');
    setSearchParams({ conversation: conv._id });
    loadMessages(conv._id);
    setConversations((prev) =>
      prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !activeConversation) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const otherUser = getOtherParticipant(activeConversation);
      const recipientId =
        otherUser?._id ||
        (typeof otherUser === 'string' ? otherUser : null) ||
        activeConversation.participants?.find((p) => {
          const pId = (p?._id || p)?.toString();
          return pId && pId !== user?._id?.toString();
        });

      const payload = {
        recipientId: typeof recipientId === 'object' ? recipientId?._id : recipientId,
        conversationId: activeConversation._id,
        text: textToSend,
        cropLotId: activeConversation.cropLot?._id || activeConversation.cropLot,
        offerId: activeConversation.offer?._id || activeConversation.offer,
      };

      const res = await sendMessage(payload);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        fetchConversations(true);
        window.dispatchEvent(new Event('messages-updated'));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    const currentUserId = user?._id?.toString();
    if (Array.isArray(conv.participants) && conv.participants.length > 0) {
      const match = conv.participants.find((p) => {
        const pId = (p?._id || p)?.toString();
        return pId && pId !== currentUserId;
      });
      if (match) return typeof match === 'object' ? match : { _id: match };
    }
    if (conv.otherUser) return conv.otherUser;
    if (conv.farmer && (conv.farmer._id || conv.farmer)?.toString() !== currentUserId) {
      return conv.farmer;
    }
    if (conv.buyer && (conv.buyer._id || conv.buyer)?.toString() !== currentUserId) {
      return conv.buyer;
    }
    return null;
  };

  const getOtherName = (other) => {
    if (!other) return 'User';
    if (other.role === 'BUYER' && other.buyerProfile?.businessName) {
      return other.buyerProfile.businessName;
    }
    return other.name || 'User';
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    const name = getOtherName(other).toLowerCase();
    const crop = conv.cropLot?.crop?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || crop.includes(searchTerm.toLowerCase());
  });

  const activeOther = getOtherParticipant(activeConversation);
  const activeCropEmoji = getCropEmoji(activeConversation?.cropLot?.crop);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Signature Hero Header Banner */}
      <div className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 overflow-hidden border border-emerald-800/40 shadow-xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Status Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-400/30 backdrop-blur-md shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>DIRECT TRADE NEGOTIATIONS & CHAT</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Messages & Negotiations</span>
              <span className="text-2xl sm:text-3xl">💬</span>
            </h1>

            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Connect directly with verified farmers and buyers to negotiate rates, arrange haulage slots, and finalize crop transactions in real time.
            </p>
          </div>

          {/* Right Action / Status Controls */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-2xl text-xs text-emerald-200 backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Encrypted & Live Synced</span>
            </div>

            <button
              onClick={() => fetchConversations()}
              disabled={loadingConversations}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingConversations ? 'animate-spin' : ''}`} />
              <span>Refresh Inbox</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Inbox Workspace */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden flex h-[720px] max-h-[82vh]">
        {/* Left Pane: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/40 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search box & header */}
          <div className="p-4 border-b border-slate-200/80 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Inbox Conversations
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                {conversations.length} Threads
              </span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or crop..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <span>Syncing message threads...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl">
                  💬
                </div>
                <p className="text-xs font-bold text-slate-700">No conversations found</p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Start a negotiation chat directly from Find Buyers, Crop Details, or Offers page.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = activeConversation?._id === conv._id;
                const unread = conv.unreadCount || 0;
                const convCropEmoji = getCropEmoji(conv.cropLot?.crop);

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-start gap-3 ${
                      isSelected 
                        ? 'bg-emerald-50/90 border border-emerald-200/90 shadow-2xs' 
                        : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={other?.avatar}
                        name={getOtherName(other)}
                        role={other?.role}
                        size="md"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        other?.role === 'BUYER' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`font-extrabold text-xs sm:text-sm truncate ${
                          isSelected ? 'text-emerald-950' : 'text-slate-900'
                        }`}>
                          {getOtherName(other)}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1 font-medium">
                          {conv.lastMessage?.createdAt
                            ? new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Role & Crop Lot pill */}
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {other?.role && (
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                            other.role === 'BUYER' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {other.role}
                          </span>
                        )}
                        {conv.cropLot && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 truncate max-w-[130px] flex items-center gap-1">
                            <span>{convCropEmoji}</span>
                            <span className="truncate">{conv.cropLot.crop}</span>
                          </span>
                        )}
                      </div>

                      {/* Last message preview & unread badge */}
                      <div className="flex justify-between items-center text-xs">
                        <p className={`truncate text-[11px] sm:text-xs ${
                          unread > 0 ? 'font-bold text-slate-900' : 'text-slate-500'
                        }`}>
                          {conv.lastMessage?.text || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="ml-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/50 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Active Conversation Top Header */}
              <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200/90 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl mr-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar
                      src={activeOther?.avatar}
                      name={getOtherName(activeOther)}
                      role={activeOther?.role}
                      size="md"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 truncate flex items-center gap-2">
                      <span className="truncate">{getOtherName(activeOther)}</span>
                      {activeOther?.role && (
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          activeOther.role === 'BUYER' 
                            ? 'bg-blue-50 text-blue-800 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {activeOther.role}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                      {activeOther?.location?.district && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span>{activeOther.location.district}, {activeOther.location.state || ''}</span>
                        </span>
                      )}
                      {activeOther?.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span>{activeOther.phone}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Context Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  {activeConversation.offer && (
                    <Link
                      to={user?.role === 'FARMER' ? '/offers' : '/my-offers'}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition hidden sm:inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>View Offer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {activeConversation.cropLot && (
                    <Link
                      to={`/crop-lot/${activeConversation.cropLot._id}`}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition hidden sm:inline-flex items-center shadow-2xs"
                    >
                      <span>Crop Details</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Context Bar: Crop Lot & Deal Parameters */}
              {activeConversation.cropLot && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 px-4 py-2.5 border-b border-emerald-100/80 flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center space-x-2 truncate mr-2">
                    <span className="text-base shrink-0">{activeCropEmoji}</span>
                    <span className="truncate">
                      Negotiating: <strong className="font-extrabold text-slate-900">{activeConversation.cropLot.crop}</strong> (
                      {activeConversation.cropLot.qualityGrade || 'A'} Grade) •{' '}
                      <strong>{activeConversation.cropLot.quantity}</strong> quintals
                    </span>
                  </div>
                  {activeConversation.offer && (
                    <span className="font-black text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-mono shrink-0 shadow-2xs">
                      ₹{activeConversation.offer.offeredPrice}/qtl
                    </span>
                  )}
                </div>
              )}

              {/* Messages Thread Container */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/50">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-xl shadow-xs">
                      ✉️
                    </div>
                    <p className="text-sm font-bold text-slate-800">No messages in this thread</p>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      Send a message below to start discussing crop specifications, price bids, or delivery schedules.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = (msg.sender?._id || msg.sender)?.toString() === user?._id?.toString();

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                            isMine
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed font-medium">
                            {msg.text}
                          </p>
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                              isMine ? 'text-emerald-100 font-medium' : 'text-slate-400 font-medium'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMine && (
                              <span>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-200 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-white border-t border-slate-200/90 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message or negotiate price..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none transition"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition shadow-xs flex items-center justify-center shrink-0 font-bold gap-1.5 text-xs"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-inner">
                💬
              </div>
              <h3 className="text-lg font-black text-slate-900">Your Trade Conversations</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Select a message thread from the left to start negotiating, chatting, or confirming crop procurement terms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
