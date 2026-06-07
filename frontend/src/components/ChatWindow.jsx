import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChatWindow = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages for the conversation
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${conversation.user._id}`);
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };
// Fetch messages on mount and when conversation changes, with polling for new messages
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [conversation.user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
// Prevent multiple sends
    setSending(true);
    try {
      await api.post('/messages', {
        receiverId: conversation.user._id,
        message: newMessage.trim(),
        propertyId: conversation.property?._id || null,
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };
// Mark messages as read when opening the conversation
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>

      {/* Chat Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb', borderRadius: '10px 10px 0 0'
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6b7280', fontSize: '18px', padding: '0 4px'
        }}>←</button>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#7c3aed', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px'
        }}>
          {conversation.user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
            {conversation.user.name}
          </p>
          {conversation.property && (
            <p style={{ fontSize: '11px', color: '#6b7280' }}>
              Re: {conversation.property.title}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: '#f8fafc'
      }}>
        {/* Show loading state, empty state, or messages */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : messages.map((msg) => {
          const isMine = msg.sender._id === user.id || msg.sender._id === user._id;
          return (
            <div key={msg._id} style={{
              display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMine ? '#7c3aed' : 'white',
                color: isMine ? 'white' : '#111827',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: isMine ? 'none' : '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '13px', lineHeight: '1.5' }}>{msg.message}</p>
                <p style={{
                  fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right'
                }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        {/* div to scroll into view for new messages */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} style={{
        display: 'flex', gap: '8px', padding: '12px 16px',
        borderTop: '1px solid #e5e7eb', background: 'white',
        borderRadius: '0 0 10px 10px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px',
            border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none'
          }}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}
          style={{
            background: '#7c3aed', border: 'none', color: 'white',
            width: '40px', height: '40px', borderRadius: '50%',
            cursor: 'pointer', fontSize: '16px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            opacity: sending || !newMessage.trim() ? 0.5 : 1
          }}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;