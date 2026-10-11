import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getConversationHistory,
  sendChatMessage,
  markMessagesAsRead,
  deleteChatMessage,
} from '../services/chatService';

export default function PrivateChatModal({ peer, isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch conversation history
  const fetchMessages = async (isInitial = false) => {
    if (!peer?.userId) return;
    if (isInitial) setLoading(true);

    try {
      const history = await getConversationHistory(peer.userId);
      setMessages(history || []);
      if (isInitial) {
        // Mark as read when first opening
        markMessagesAsRead(peer.userId).catch(() => {});
        setTimeout(() => scrollToBottom('auto'), 150);
      } else {
        scrollToBottom('smooth');
      }
      setErrorBanner('');
    } catch (err) {
      if (isInitial) {
        setErrorBanner(
          err.response?.data?.message || 'Failed to load conversation history.'
        );
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // On open or peer change: fetch and setup polling
  useEffect(() => {
    if (isOpen && peer?.userId) {
      setMessages([]);
      setNewMessage('');
      setErrorBanner('');
      fetchMessages(true);

      // Poll every 3.5s for real-time updates
      pollTimerRef.current = setInterval(() => {
        fetchMessages(false);
      }, 3500);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isOpen, peer?.userId]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !peer?.userId || sending) return;

    setSending(true);
    setErrorBanner('');

    try {
      const sentDto = await sendChatMessage(peer.userId, content);
      setMessages((prev) => [...prev, sentDto]);
      setNewMessage('');
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (err) {
      setErrorBanner(
        err.response?.data?.message || 'Failed to send message. Please ensure you are connected.'
      );
    } finally {
      setSending(false);
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!messageId || deletingMessageId) return;
    setDeletingMessageId(messageId);
    try {
      await deleteChatMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setErrorBanner(
        err.response?.data?.message || 'Failed to delete message.'
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  if (!isOpen || !peer) return null;

  const initials = peer.name
    ? peer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const d = new Date(timeString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="modal-backdrop private-chat-modal-backdrop"
      onClick={onClose}
      id="private-chat-modal-backdrop"
    >
      <div
        className="modal-container private-chat-modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-peer-name"
        id="private-chat-modal"
      >
        {/* Header */}
        <div className="private-chat-header">
          <div className="chat-peer-info-cluster">
            <div className="chat-peer-avatar-circle">
              {peer.profilePictureUrl ? (
                <img
                  src={peer.profilePictureUrl}
                  alt={peer.name}
                  className="chat-peer-avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="chat-avatar-fallback"
                style={{ display: peer.profilePictureUrl ? 'none' : 'flex' }}
              >
                {initials}
              </div>
              <span className="online-status-dot" title="Connected Peer"></span>
            </div>

            <div className="chat-peer-text-meta">
              <h3 id="chat-peer-name" className="chat-peer-title">
                {peer.name}
              </h3>
              <div className="chat-peer-sub">
                <span className="badge-connected-status">🟢 Connected Peer</span>
                {peer.email && <span className="peer-email-sub">{peer.email}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-chat-modal-close"
            aria-label="Close conversation"
            id="close-chat-modal-btn"
          >
            ✕
          </button>
        </div>

        {/* Error notification banner if any */}
        {errorBanner && (
          <div className="chat-error-banner" role="alert">
            ⚠️ {errorBanner}
          </div>
        )}

        {/* Messages Body */}
        <div className="private-chat-messages-container" id="private-chat-messages-body">
          {loading ? (
            <div className="chat-loading-state">
              <span className="spinner-sm"></span> Loading your conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-conversation">
              <div className="empty-chat-icon">💬</div>
              <h4>Direct Skill Swap Chat with {peer.name}</h4>
              <p>
                You are now connected! Say hello, coordinate skill exchanges, or start working on
                projects together.
              </p>
            </div>
          ) : (
            <div className="chat-messages-flow">
              {messages.map((msg, index) => {
                // Determine if this message was sent by the logged-in user
                const isMine =
                  (user?.id && msg.senderId === user.id) ||
                  (user?.email && msg.senderName === user.name);

                return (
                  <div
                    key={msg.id || index}
                    className={`private-message-wrapper ${isMine ? 'mine' : 'theirs'}`}
                  >
                    <div className="private-message-bubble">
                      <div className="bubble-content">{msg.content}</div>
                      <div className="bubble-meta">
                        <span className="bubble-timestamp">{formatTime(msg.sentAt)}</span>
                        {isMine && msg.readStatus === 'READ' && (
                          <span className="read-receipt" title="Read">✓✓</span>
                        )}
                        {isMine && msg.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            disabled={deletingMessageId === msg.id}
                            className="btn-delete-msg"
                            title="Delete this message"
                            aria-label="Delete message"
                          >
                            {deletingMessageId === msg.id ? '…' : '🗑️'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="private-chat-input-bar">
          <input
            type="text"
            placeholder={`Message ${peer.name || 'connected student'}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading || sending}
            className="private-chat-input-field"
            id="private-chat-text-input"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || loading}
            className="btn-private-chat-send"
            id="private-chat-send-btn"
          >
            {sending ? (
              <span className="spinner-sm"></span>
            ) : (
              <>
                <span>Send</span>
                <span className="send-arrow">➔</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
