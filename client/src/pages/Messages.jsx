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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getConversationMessages,
  getOrCreateConversation,
  sendMessage,
} from '../services/api';
import Avatar from '../components/Avatar';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-emerald-600" /> Messages & Negotiations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time communication between Farmers and Buyers for crop procurement.
          </p>
        </div>
        <button
          onClick={() => fetchConversations()}
          className="inline-flex items-center text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </button>
      </div>

      {/* Main Inbox Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[720px] max-h-[80vh]">
        {/* Left Pane: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search box */}
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No conversations yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connect with buyers from Find Buyers or farmers from crop listings.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = activeConversation?._id === conv._id;
                const unread = conv.unreadCount || 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-emerald-50/60 ${
                      isSelected ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'bg-white'
                    }`}
                  >
                    <Avatar
                      src={other?.avatar}
                      name={getOtherName(other)}
                      role={other?.role}
                      size="md"
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {getOtherName(other)}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {conv.lastMessage?.createdAt
                            ? new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Role & Crop lot badge */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {other?.role && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {other.role}
                          </span>
                        )}
                        {conv.cropLot && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 truncate max-w-[120px]">
                            {conv.cropLot.crop}
                          </span>
                        )}
                      </div>

                      {/* Last message preview */}
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <p className="truncate text-[11px] sm:text-xs">
                          {conv.lastMessage?.text || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="ml-2 bg-emerald-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
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
          className={`flex-1 flex flex-col bg-slate-50/40 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Active Header */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg mr-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <Avatar
                    src={activeOther?.avatar}
                    name={getOtherName(activeOther)}
                    role={activeOther?.role}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm sm:text-base text-slate-900 truncate flex items-center gap-2">
                      {getOtherName(activeOther)}
                      {activeOther?.role && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {activeOther.role}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                      {activeOther?.location?.district && (
                        <span>
                          {activeOther.location.district}, {activeOther.location.state}
                        </span>
                      )}
                      {activeOther?.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" /> {activeOther.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right side context action */}
                <div className="flex items-center space-x-2">
                  {activeConversation.offer && (
                    <Link
                      to={user?.role === 'FARMER' ? '/offers' : '/my-offers'}
                      className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition hidden sm:inline-flex items-center"
                    >
                      View Offer
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  )}
                  {activeConversation.cropLot && (
                    <Link
                      to={`/crop-lot/${activeConversation.cropLot._id}`}
                      className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition hidden sm:inline-flex items-center"
                    >
                      Crop Details
                    </Link>
                  )}
                </div>
              </div>

              {/* Context bar if crop lot attached */}
              {activeConversation.cropLot && (
                <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center space-x-2">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>
                      Discussing: <strong>{activeConversation.cropLot.crop}</strong> (
                      {activeConversation.cropLot.qualityGrade || 'Standard'} grade) •{' '}
                      {activeConversation.cropLot.quantity} quintals available
                    </span>
                  </div>
                  {activeConversation.offer && (
                    <span className="font-semibold text-emerald-700">
                      Offer: ₹{activeConversation.offer.offeredPrice}/qtl
                    </span>
                  )}
                </div>
              )}

              {/* Messages Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                    <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send a message to begin discussing crop details, pricing, and fulfillment.
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
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            isMine
                              ? 'bg-emerald-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                              isMine ? 'text-emerald-100' : 'text-slate-400'
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

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write your message...`}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl transition shadow-sm flex items-center justify-center shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Your Conversations</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Select a conversation from the left to start negotiating, chatting, or finalizing crop deals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
