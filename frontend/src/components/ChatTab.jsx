import { useState, useEffect } from 'react';
import api from '../services/api';
import ChatWindow from './ChatWindow';

const ChatTab = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  if (activeConv) {
    return (
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <ChatWindow
          conversation={activeConv}
          onBack={() => { setActiveConv(null); fetchConversations(); }}
        />
      </div>
    );
  }

  return (
    <div className="card">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '2px' }}>Messages</h2>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="btn btn-sm"
          style={{ background: '#ede9fe', color: '#5b21b6' }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
          <h3>No messages yet</h3>
          <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '13px' }}>
            Go to any property and click "Send Message to Owner" to start a conversation.
          </p>
        </div>
      ) : (
        <div>
          {conversations.map((conv) => (
            <div
              key={conv.user._id}
              onClick={() => setActiveConv(conv)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px', borderRadius: '10px', cursor: 'pointer',
                marginBottom: '6px',
                background: conv.unreadCount > 0 ? '#faf5ff' : '#f9fafb',
                border: conv.unreadCount > 0 ? '1px solid #ddd6fe' : '1px solid #f3f4f6',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4ff'}
              onMouseLeave={e => e.currentTarget.style.background = conv.unreadCount > 0 ? '#faf5ff' : '#f9fafb'}
            >
              {/* Avatar */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: '#7c3aed', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', fontWeight: '700',
                fontSize: '16px', flexShrink: 0
              }}>
                {conv.user.name?.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                    {conv.user.name}
                  </p>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {conv.property && (
                  <p style={{ fontSize: '11px', color: '#7c3aed', marginBottom: '2px' }}>
                    🏠 {conv.property.title}
                  </p>
                )}
                <p style={{
                  fontSize: '12px', color: '#6b7280',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {conv.lastMessage.message}
                </p>
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 ? (
                <div style={{
                  background: '#7c3aed', color: 'white', borderRadius: '50%',
                  width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0
                }}>
                  {conv.unreadCount}
                </div>
              ) : (
                <span style={{ fontSize: '18px', color: '#d1d5db' }}>›</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatTab;