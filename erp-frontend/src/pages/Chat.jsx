import { useEffect, useRef, useState } from 'react';
import useChatStore from '@/stores/chatStore';
import { Card } from '@/components/ui/card';
import api from '@/api/api';

const DeleteConfirmationPopup = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Delete Message</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this message? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Chat = () => {
  const {
    roles,
    selectedRole,
    setSelectedRole,
    fetchUsers,
    users,
    conversations,
    fetchConversations,
    openChatWith,
    activeUser,
    messages,
    sendMessage,
    deleteMessage,
    connectSocket,
    emitTyping,
    typingByUserId,
    isSocketConnected,
    cleanup,
    refreshMessages
  } = useChatStore();

  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [deletePopup, setDeletePopup] = useState({ isOpen: false, messageId: null });
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket and conversations
  useEffect(() => {
    console.log('Chat component mounted, connecting socket...');
    connectSocket();
    fetchConversations();
    
    return () => {
      console.log('Chat component unmounting, cleaning up...');
      cleanup();
    };
  }, []);

  // Fetch users when role changes
  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  // Auto-select first user
  useEffect(() => {
    if (!activeUser && users.length > 0) {
      console.log('Auto-selecting first user:', users[0]);
      openChatWith(users[0]);
    }
  }, [users, activeUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeUser]);

  // Debug logging
  useEffect(() => {
    if (activeUser) {
      console.log('Active user:', activeUser._id);
      console.log('Messages for active user:', messages[activeUser._id]?.length || 0);
    }
  }, [activeUser, messages]);

  // Periodic refresh to ensure messages are up-to-date
  useEffect(() => {
    if (!activeUser) return;
    
    const interval = setInterval(() => {
      console.log('Periodic refresh of messages for:', activeUser._id);
      refreshMessages(activeUser._id);
    }, 3000); // Refresh every 3 seconds
    
    return () => clearInterval(interval);
  }, [activeUser, refreshMessages]);

  // Periodic refresh of conversations for unread counts
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic refresh of conversations');
      fetchConversations();
    }, 5000); // Refresh conversations every 5 seconds
    
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Cleanup file preview
  useEffect(() => {
    return () => {
      if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    };
  }, [filePreview]);

  // Handle typing with debounce
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      emitTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitTyping(false);
      }, 1000);
    } else {
      emitTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, emitTyping]);

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let i = 0;
    while (value >= 1024 && i < sizes.length - 1) {
      value /= 1024;
      i += 1;
    }
    const precision = value < 10 && i > 0 ? 1 : 0;
    return `${value.toFixed(precision)} ${sizes[i]}`;
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setFilePreview({ url, isImage: f.type?.startsWith('image/'), name: f.name, size: f.size });
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFile(null);
    setFilePreview(null);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }
  };

  const onSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    
    console.log('Sending message...');
    setIsTyping(false);
    await sendMessage(input.trim(), file);
    setInput('');
    clearSelectedFile();
  };

  const handleDeleteMessage = (messageId) => {
    setDeletePopup({ isOpen: true, messageId });
  };

  const confirmDelete = async () => {
    if (deletePopup.messageId) {
      await deleteMessage(deletePopup.messageId);
      setDeletePopup({ isOpen: false, messageId: null });
    }
  };

  const closeDeletePopup = () => {
    setDeletePopup({ isOpen: false, messageId: null });
  };

  return (
    <>
      <div className="h-[calc(100vh-7rem)] grid grid-cols-12 gap-4">
        {/* Roles Column */}
        <Card className="col-span-3 overflow-hidden flex flex-col">
          <div className="p-4 border-b text-white" style={{ backgroundColor: '#0e0ed1ff' }}>
            <h2 className="font-semibold text-lg">Roles</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="space-y-1 p-2">
              {roles.map((role) => {
                const unreadByRole = (conversations || []).reduce((sum, c) => {
                  return c.user?.role === role ? sum + (c.unreadCount || 0) : sum;
                }, 0);
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full px-3 py-3 rounded-lg transition-colors flex items-center justify-between ${
                      selectedRole === role 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm text-left">{role}</div>
                    {unreadByRole > 0 && (
                      <span className={`${selectedRole === role ? 'bg-white text-blue-600' : 'bg-red-500 text-white'} ml-2 inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-2 py-0.5`}>
                        {unreadByRole}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Users Column */}
        <Card className="col-span-3 overflow-hidden flex flex-col">
          <div className="p-4 border-b text-white" style={{ backgroundColor: '#0e0ed1ff' }}>
            <h2 className="font-semibold text-lg">{selectedRole} List</h2>
            <div className="text-xs opacity-90 mt-1 flex items-center gap-2">
              <span>{users.length} users</span>
              <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isSocketConnected ? 'Connected' : 'Disconnected'}></div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="space-y-1 p-2">
              {users.map((user) => {
                const unreadForUser = (conversations || []).find(c => c.user?._id === user._id)?.unreadCount || 0;
                const isUserTyping = typingByUserId[user._id];
                return (
                  <button
                    key={user._id}
                    onClick={() => openChatWith(user)}
                    className={`w-full px-3 py-3 rounded-lg transition-colors flex items-center justify-between ${
                      activeUser?._id === user._id 
                        ? 'bg-indigo-100 border border-indigo-300' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-gray-500">{user.position?.title || 'No Position'}</div>
                      {isUserTyping && (
                        <div className="text-xs text-blue-600 italic">typing...</div>
                      )}
                    </div>
                    {unreadForUser > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-2 py-0.5 bg-red-500 text-white">
                        {unreadForUser}
                      </span>
                    )}
                  </button>
                );
              })}
              {users.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-sm">No users found</div>
                  <div className="text-xs">for this role</div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-6 overflow-hidden flex flex-col">
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
            <div className="flex flex-col h-full min-h-0">
              {/* Chat Header */}
              <div className="p-4 border-b bg-white">
                <div>
                  <div className="font-semibold text-lg">{activeUser.firstName} {activeUser.lastName}</div>
                  <div className="text-sm text-gray-600">{activeUser.position?.title || 'No Position'} • {activeUser.role}</div>
                  <div className="text-xs text-gray-500">{activeUser.email}</div>
                  {typingByUserId[activeUser._id] && (
                    <div className="text-xs text-blue-600 italic mt-1">typing...</div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4 text-xs">
                    <div className="font-semibold text-yellow-800">Debug Info:</div>
                    <div>Active User: {activeUser._id}</div>
                    <div>Messages Count: {messages[activeUser._id]?.length || 0}</div>
                    <div>Socket Connected: {isSocketConnected ? 'Yes' : 'No'}</div>
                    <div>Total Messages: {Object.keys(messages).length}</div>
                  </div>
                )}
                
                {(messages[activeUser._id] || []).map((m) => (
                  <div key={m._id} className={`flex ${m.sender === activeUser._id ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] ${m.sender === activeUser._id ? 'self-start' : 'self-end'}`}>
                      <div className={`relative group text-sm ${
                        m.attachmentType === 'image'
                          ? 'p-0 bg-transparent'
                          : (m.sender === activeUser._id ? 'bg-white shadow-sm px-3 py-2' : 'bg-blue-500 text-white px-3 py-2')
                      }`}>
                        {/* Attachment rendering */}
                        {m.attachmentUrl && (
                          <div className="mb-1">
                            {m.attachmentType === 'image' ? (
                              <a href={`${new URL(api.defaults.baseURL).origin}${m.attachmentUrl}`} target="_blank" rel="noopener noreferrer">
                                <img src={`${new URL(api.defaults.baseURL).origin}${m.attachmentUrl}`} alt={m.attachmentName || 'attachment'} className="max-w-full h-auto rounded" />
                              </a>
                            ) : (
                              <a href={`${new URL(api.defaults.baseURL).origin}${m.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.414a4 4 0 10-5.656-5.657L5.757 10.343" />
                                </svg>
                                <span className="text-xs break-all">{m.attachmentName || 'Download attachment'}</span>
                              </a>
                            )}
                          </div>
                        )}
                        {m.content}
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

              {/* Message Input */}
              <form onSubmit={onSend} className="p-3 border-t bg-white">
                {filePreview && (
                  <div className="mb-2 p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {filePreview.isImage ? (
                        <img src={filePreview.url} alt={filePreview.name} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7h10M7 7l2-2h6l2 2" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate max-w-[16rem]">{filePreview.name}</div>
                        <div className="text-xs text-gray-500">{formatBytes(filePreview.size)}</div>
                      </div>
                    </div>
                    <button type="button" onClick={clearSelectedFile} className="text-gray-500 hover:text-red-600 text-sm ml-3">Clear</button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center justify-center w-9 h-9 rounded-md border cursor-pointer ${filePreview ? 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100' : 'border-gray-300 hover:bg-gray-50'}`} title="Upload file">
                    <input type="file" className="hidden" onChange={onFileChange} accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.414a4 4 0 10-5.656-5.657L5.757 10.343" />
                    </svg>
                  </label>
                  <input
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Type a message..."
                    value={input}
                    onChange={handleInputChange}
                  />
                  <button 
                    type="submit"
                    className="w-9 h-9 rounded-md flex items-center justify-center text-white hover:opacity-90 transition-opacity bg-blue-500 disabled:opacity-50"
                    title="Send"
                    disabled={!input.trim() && !file}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l14-7-7 14-2-5-5-2z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>

      <DeleteConfirmationPopup
        isOpen={deletePopup.isOpen}
        onClose={closeDeletePopup}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this message?"
      />
    </>
  );
};

export default Chat;



