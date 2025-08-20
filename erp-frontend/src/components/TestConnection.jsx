import { useEffect, useState } from 'react';
import useChatStore from '@/stores/chatStore';
import api from '@/api/api';

const TestConnection = () => {
  const [apiStatus, setApiStatus] = useState('Testing...');
  const [socketStatus, setSocketStatus] = useState('Testing...');
  const [testResults, setTestResults] = useState([]);
  const { connectSocket, isSocketConnected, socket, activeUser, messages, testSocket, addTestMessage, refreshMessages } = useChatStore();

  useEffect(() => {
    // Test API connection
    const testApi = async () => {
      try {
        const response = await api.get('/health');
        setApiStatus(`✅ API Connected: ${response.status}`);
      } catch (error) {
        setApiStatus(`❌ API Error: ${error.message}`);
      }
    };

    // Test Socket.IO connection
    const testSocket = async () => {
      try {
        const socket = connectSocket();
        if (socket) {
          setSocketStatus('🔄 Socket.IO Connecting...');
          
          socket.on('connect', () => {
            setSocketStatus('✅ Socket.IO Connected');
            addTestResult('Socket connected successfully');
          });
          
          socket.on('connect_error', (error) => {
            setSocketStatus(`❌ Socket.IO Error: ${error.message}`);
            addTestResult(`Socket connection error: ${error.message}`);
          });
          
          socket.on('disconnect', (reason) => {
            setSocketStatus(`🔌 Socket.IO Disconnected: ${reason}`);
            addTestResult(`Socket disconnected: ${reason}`);
          });

          socket.on('test_response', (data) => {
            addTestResult(`Test response: ${data.message}`);
          });

          socket.on('pong', (data) => {
            addTestResult(`Pong received: ${data.timestamp}`);
          });

          socket.on('chat_response', (data) => {
            addTestResult(`Chat response: ${data.message}`);
          });
        } else {
          setSocketStatus('❌ Socket.IO: No token found');
          addTestResult('No token found for socket connection');
        }
      } catch (error) {
        setSocketStatus(`❌ Socket.IO Error: ${error.message}`);
        addTestResult(`Socket error: ${error.message}`);
      }
    };

    testApi();
    testSocket();
  }, [connectSocket]);

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSocketEmit = () => {
    if (socket && socket.connected) {
      socket.emit('test', { message: 'Hello from frontend!' });
      addTestResult('Test message sent');
    } else {
      addTestResult('Socket not connected!');
    }
  };

  const testPing = () => {
    if (socket && socket.connected) {
      socket.emit('ping');
      addTestResult('Ping sent');
    } else {
      addTestResult('Socket not connected for ping!');
    }
  };

  const testChatMessage = () => {
    if (socket && socket.connected) {
      // Simulate a chat message
      const testMsg = {
        _id: 'test-' + Date.now(),
        sender: 'test-sender',
        recipient: 'test-recipient',
        content: 'Test message from frontend',
        createdAt: new Date().toISOString()
      };
      
      // Emit a test chat message
      socket.emit('chat', testMsg);
      addTestResult('Test chat message sent');
    } else {
      addTestResult('Socket not connected for chat test!');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl">
      <h2 className="text-xl font-bold mb-4">Connection Test & Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">API Status:</h3>
            <p className="text-sm">{apiStatus}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Socket.IO Status:</h3>
            <p className="text-sm">{socketStatus}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Socket Details:</h3>
            <p className="text-sm">
              Connected: {isSocketConnected ? '✅ Yes' : '❌ No'}<br/>
              Socket ID: {socket?.id || 'N/A'}<br/>
              User ID: {socket?.userId || 'N/A'}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold">API Base URL:</h3>
            <p className="text-sm font-mono">{api.defaults.baseURL}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Chat State:</h3>
            <p className="text-sm">
              Active User: {activeUser?._id || 'None'}<br/>
              Messages Count: {Object.keys(messages).length}<br/>
              Active User Messages: {activeUser ? (messages[activeUser._id]?.length || 0) : 0}
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Test Controls:</h3>
            <div className="space-y-2 mt-2">
              <button
                onClick={testSocketEmit}
                disabled={!isSocketConnected}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                Test Socket Emit
              </button>
              
              <button
                onClick={testPing}
                disabled={!isSocketConnected}
                className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                Test Ping/Pong
              </button>
              
              <button
                onClick={testChatMessage}
                disabled={!isSocketConnected}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                Test Chat Message
              </button>
              
              <button
                onClick={() => {
                  const result = testSocket();
                  addTestResult(`Chat store test: ${result ? 'Success' : 'Failed'}`);
                }}
                disabled={!isSocketConnected}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                Test Chat Store
              </button>
              
              <button
                onClick={() => {
                  if (activeUser) {
                    const testMsg = addTestMessage(activeUser._id);
                    addTestResult(`Test message added: ${testMsg.content}`);
                  } else {
                    addTestResult('No active user to add test message to');
                  }
                }}
                disabled={!activeUser}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded disabled:bg-gray-300 text-sm"
              >
                Add Test Message
              </button>
              
              <button
                onClick={clearResults}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded text-sm"
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-sm">No test results yet...</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-xs font-mono mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
