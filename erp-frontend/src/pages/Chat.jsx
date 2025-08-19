import { useEffect, useRef, useState } from 'react';
import useChatStore from '@/stores/chatStore';
import { Card } from '@/components/ui/card';

const Chat = () => {
  const {
    roles,
    selectedRole,
    setSelectedRole,
    fetchUsers,
    users,
    openChatWith,
    activeUser,
    messages,
    sendMessage,
    deleteMessage,
    connectWebSocket
  } = useChatStore();

  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  // Auto-open first user if exists and no activeUser yet (to load history immediately)
  useEffect(() => {
    if (!activeUser && users.length > 0) {
      openChatWith(users[0]);
    }
  }, [users]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeUser]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input.trim());
    setInput('');
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(messageId);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-12 gap-4">
      {/* First Column - Roles */}
      <Card className="col-span-3 overflow-hidden flex flex-col">
        <div className="p-4 border-b text-white" style={{ backgroundColor: '#1e2251' }}>
          <h2 className="font-semibold text-lg">Roles</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="space-y-1 p-2">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                  selectedRole === role 
                    ? 'text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                style={selectedRole === role ? { backgroundColor: '#1e2251' } : {}}
              >
                <div className="font-medium text-sm">{role}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Second Column - User List */}
      <Card className="col-span-3 overflow-hidden flex flex-col">
        <div className="p-4 border-b text-white" style={{ backgroundColor: '#1e2251' }}>
          <h2 className="font-semibold text-lg">{selectedRole} List</h2>
          <div className="text-xs opacity-90 mt-1">{users.length} users</div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="space-y-1 p-2">
            {users.map((user) => (
              <button
                key={user._id}
                onClick={() => openChatWith(user)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                  activeUser?._id === user._id 
                    ? 'bg-indigo-100 border border-indigo-300' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-gray-500">{user.position?.title || 'No Position'}</div>
              </button>
            ))}
            {users.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">No users found</div>
                <div className="text-xs">for this role</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Third Column - Chat */}
      <Card className="col-span-6 flex flex-col">
        {!activeUser ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-lg font-medium mb-2">Select a user to start chatting</div>
            <div className="text-sm">Choose someone from the user list to begin a conversation</div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-white">
              <div className="font-semibold text-lg">{activeUser.firstName} {activeUser.lastName}</div>
              <div className="text-sm text-gray-600">{activeUser.position?.title || 'No Position'} • {activeUser.role}</div>
              <div className="text-xs text-gray-500">{activeUser.email}</div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
              {(messages[activeUser._id] || []).map((m) => (
                <div key={m._id} className={`flex ${m.sender === activeUser._id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] ${m.sender === activeUser._id ? 'self-start' : 'self-end'}`}>
                    <div className={`rounded-lg px-3 py-2 text-sm relative group ${
                      m.sender === activeUser._id 
                        ? 'bg-white border shadow-sm' 
                        : 'text-white'
                    }`}
                    style={m.sender === activeUser._id ? {} : { backgroundColor: '#1e2251' }}
                    >
                      {m.content}
                      {/* Delete button for user's own messages */}
                      {m.sender !== activeUser._id && (
                        <button
                          onClick={() => handleDeleteMessage(m._id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Delete message"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 text-center">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={onSend} className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  type="submit"
                  className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: '#1e2251' }}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Chat;


