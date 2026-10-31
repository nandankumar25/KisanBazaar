import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  const recipientId = recipient?._id || recipient?.id || (typeof recipient === 'string' ? recipient : null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Lock background scrolling and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Fetch or initialize conversation
  const loadConversation = async (silent = false) => {
    if (!recipientId) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await getOrCreateConversation({
        otherUserId: recipientId,
        cropLotId: cropLot?._id || undefined,
        offerId: offer?._id || undefined,
      });

      if (res.success && res.data) {
        setConversation(res.data);
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

  // Lightweight poll for new messages only (no re-creating conversation)
  const pollMessages = async (convId) => {
    if (!convId) return;
    try {
      const msgRes = await getConversationMessages(convId);
      if (msgRes.success && msgRes.data) {
        setMessages(msgRes.data);
      }
    } catch (err) {
      // silent fail during poll
    }
  };

  useEffect(() => {
    if (isOpen && recipientId) {
      loadConversation();
    } else {
      setConversation(null);
      setMessages([]);
      setInputText('');
      setError(null);
    }
  }, [isOpen, recipientId, cropLot?._id, offer?._id]);

  // Background message polling while modal is open
  useEffect(() => {
    if (isOpen && conversation?._id) {
      pollIntervalRef.current = setInterval(() => {
        pollMessages(conversation._id);
      }, 4000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !recipientId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const payload = {
        recipientId,
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
    } else if (recipientId) {
      navigate(`/messages?user=${recipientId}`);
    }
  };

  const recipientName =
    recipient?.name ||
    recipient?.buyerProfile?.businessName ||
    'Trade Partner';

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg flex flex-col h-[600px] max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-emerald-800/40 shadow-sm shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar 
              src={recipient?.avatar} 
              name={recipientName} 
              role={recipient?.role} 
              size="md"
              className="ring-2 ring-emerald-400/30 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-black text-base truncate flex items-center gap-2">
                <span className="truncate">{recipientName}</span>
                {recipient?.role && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full shrink-0">
                    {recipient.role}
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-200/80 truncate font-medium mt-0.5">
                {recipient?.location?.district 
                  ? `${recipient.location.district}, ${recipient.location.state || ''}`
                  : recipient?.phone || 'Verified Platform Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleOpenFullInbox}
              title="Open in full inbox"
              className="p-2 hover:bg-white/10 rounded-xl transition text-emerald-200 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close chat"
              className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Context bar (cropLot or offer) */}
        {(cropLot || offer) && (
          <div className="bg-emerald-50/90 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 shrink-0">
            <div className="flex items-center space-x-2 truncate font-semibold">
              {cropLot && (
                <span className="flex items-center truncate">
                  <Sprout className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  Lot: <strong className="ml-1 text-slate-900">{cropLot.crop}</strong> ({cropLot.qualityGrade || 'Standard'})
                </span>
              )}
              {offer && (
                <span className="flex items-center truncate">
                  <Package className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  Offer: ₹{Number(offer.offeredPrice || offer.counterPrice || 0).toLocaleString()}/qtl ({offer.quantity} qtl)
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
              Linked Context
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between font-medium shrink-0">
            <span className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </span>
            <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-xs font-bold text-slate-500">Connecting to secure chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="text-sm font-black text-slate-800">Start the conversation</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
                Send a direct message regarding crop availability, quality check, pricing, or collection logistics.
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
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                      isMine
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed font-medium">{msg.text}</p>
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
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${recipientName}...`}
            className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none transition font-medium"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl transition shadow-sm flex items-center justify-center shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ChatModal;
