import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Send, 
  MessageSquare, 
  User, 
  Sprout, 
  Package, 
  ExternalLink,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation, getConversationMessages, sendMessage } from '../services/api';
import Avatar from './Avatar';

const ChatModal = ({
  isOpen,
  onClose,
  recipient,
  cropLot,
  offer,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch or initialize conversation
  const loadConversation = async (silent = false) => {
    if (!recipient?._id) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await getOrCreateConversation({
        otherUserId: recipient._id,
        cropLotId: cropLot?._id || undefined,
        offerId: offer?._id || undefined,
      });

      if (res.success && res.data) {
        setConversation(res.data);
        // Load messages for this conversation
        const msgRes = await getConversationMessages(res.data._id);
        if (msgRes.success) {
          setMessages(msgRes.data || []);
        }
      }
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Unable to open conversation.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recipient?._id) {
      loadConversation();

      // Poll every 4 seconds while modal is open for new incoming messages
      pollIntervalRef.current = setInterval(() => {
        loadConversation(true);
      }, 4000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, recipient?._id, cropLot?._id, offer?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const payload = {
        recipientId: recipient._id,
        text: textToSend,
        conversationId: conversation?._id,
        cropLotId: cropLot?._id,
        offerId: offer?._id,
      };

      const res = await sendMessage(payload);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        if (!conversation && (res.data.conversation || res.conversationId)) {
          setConversation({ _id: res.data.conversation || res.conversationId });
        }
        window.dispatchEvent(new Event('messages-updated'));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenFullInbox = () => {
    onClose();
    if (conversation?._id) {
      navigate(`/messages?conversation=${conversation._id}`);
    } else {
      navigate(`/messages?user=${recipient._id}`);
    }
  };

  const recipientName =
    recipient?.name ||
    recipient?.buyerProfile?.businessName ||
    'User';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg flex flex-col h-[600px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar 
              src={recipient?.avatar} 
              name={recipientName} 
              role={recipient?.role} 
              size="md"
              className="ring-2 ring-white/30"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate flex items-center gap-1.5">
                {recipientName}
                {recipient?.role && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    {recipient.role}
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-100 truncate">
                {recipient?.location?.district 
                  ? `${recipient.location.district}, ${recipient.location.state || ''}`
                  : recipient?.phone || 'Direct Marketplace Contact'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleOpenFullInbox}
              title="Open in full inbox"
              className="p-2 hover:bg-white/10 rounded-xl transition text-emerald-100 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close chat"
              className="p-2 hover:bg-white/10 rounded-xl transition text-emerald-100 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Context bar (cropLot or offer) */}
        {(cropLot || offer) && (
          <div className="bg-emerald-50/80 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center space-x-2 truncate">
              {cropLot && (
                <span className="flex items-center font-medium truncate">
                  <Sprout className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  Lot: <strong className="ml-1">{cropLot.crop}</strong> ({cropLot.qualityGrade || 'Standard'})
                </span>
              )}
              {offer && (
                <span className="flex items-center font-medium truncate">
                  <Package className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  Offer: ₹{offer.offeredPrice}/qtl ({offer.quantity} qtl)
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Linked Context
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs flex items-center justify-between">
            <span className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <span className="text-xs">Loading conversation...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Start the conversation</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Send a direct message regarding crop availability, pricing, or collection logistics.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                (msg.sender?._id || msg.sender)?.toString() === user?._id?.toString();

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
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
                            <CheckCheck className="w-3 h-3 text-emerald-200 inline" />
                          ) : (
                            <Check className="w-3 h-3 text-emerald-200 inline" />
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

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${recipientName}...`}
            className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl transition shadow-sm flex items-center justify-center shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
