// src/components/RadixWalletDebugger.jsx
import { useState, useEffect } from 'react';
import { useRadixConnect } from '../context/RadixConnectContext';

const RadixWalletDebugger = ({ onClose }) => {
  // Pull states from new context
  const {
    rdt,
    connected,
    accounts,
    selectedAccount,
    setSelectedAccount,
    updateAccountSharing
  } = useRadixConnect();

  const [activeTab, setActiveTab] = useState('status');
  const [lastAction, setLastAction] = useState(null);
  const [lastActionResult, setLastActionResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Add a log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  // Effect to log status changes
  useEffect(() => {
    addLog(`Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
    addLog(`Has accounts: ${accounts.length > 0 ? 'Yes' : 'No'}`);
  }, [connected, accounts]);

  // Request account sharing
  const handleRequestAccounts = () => {
    setLastAction('Request Accounts');
    try {
      updateAccountSharing();
      setLastActionResult('Request sent');
      addLog('Requested account sharing: Success', 'success');
    } catch (err) {
      setLastActionResult(`Error: ${err.message}`);
      addLog(`Error requesting accounts: ${err.message}`, 'error');
    }
  };

  // Force reconnect logic (optional)
  const handleReconnect = () => {
    setLastAction('Reconnect Wallet');
    try {
      if (rdt) {
        // The Dapp Toolkit doesn't have a direct "connect()" method at time of writing,
        // but we can attempt to manually request data or do any forced logic you want.
        // We can also simulate a "disconnect" event by clearing state, though it won't necessarily
        // cause the wallet to physically disconnect from the extension/desktop wallet.
        // For now, let's just re-issue the request:
        rdt.walletApi.sendRequest().then((result) => {
          if (result.isErr()) {
            setLastActionResult(`Error reconnecting: ${result.error}`);
            addLog(`Error reconnecting: ${result.error}`, 'error');
          } else {
            setLastActionResult('Reconnect initiated');
            addLog('Reconnect initiated', 'success');
          }
        });
      } else {
        setLastActionResult('RDT not available');
        addLog('RDT not available for reconnect', 'error');
      }
    } catch (err) {
      setLastActionResult(`Error: ${err.message}`);
      addLog(`Error reconnecting: ${err.message}`, 'error');
    }
  };

  // Check Radix environment
  const checkRadixEnvironment = () => {
    setLastAction('Check Environment');
    try {
      const results = [];
      
      // Check if Radix is in window
      if (window.radixDappToolkit) {
        results.push('window.radixDappToolkit: Available');
      } else {
        results.push('window.radixDappToolkit: NOT FOUND');
      }
      
      // Check if the custom element is defined
      if (customElements.get('radix-connect-button')) {
        results.push('radix-connect-button: Registered');
      } else {
        results.push('radix-connect-button: NOT REGISTERED');
      }
      
      // Check RDT in context
      results.push(`RDT in context: ${rdt ? 'Available' : 'NOT AVAILABLE'}`);
      
      const resultText = results.join('\n');
      setLastActionResult(resultText);
      addLog('Environment check completed', 'info');
      results.forEach(r =>
        addLog(r, r.includes('NOT') ? 'warning' : 'success')
      );
    } catch (err) {
      setLastActionResult(`Error: ${err.message}`);
      addLog(`Error checking environment: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: '600px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ marginTop: 0, color: '#4CAF50' }}>Radix Wallet Debugger</h2>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setActiveTab('status')}
          style={{ 
            flex: 1,
            backgroundColor: activeTab === 'status' ? '#4CAF50' : '#333',
            color: 'white'
          }}
        >
          Status
        </button>
        <button 
          onClick={() => setActiveTab('actions')}
          style={{ 
            flex: 1,
            backgroundColor: activeTab === 'actions' ? '#4CAF50' : '#333',
            color: 'white'
          }}
        >
          Actions
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ 
            flex: 1,
            backgroundColor: activeTab === 'logs' ? '#4CAF50' : '#333',
            color: 'white'
          }}
        >
          Logs
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
        {activeTab === 'status' && (
          <div>
            <h3>Connection Status</h3>
            <div style={{ 
              padding: '10px', 
              backgroundColor: connected
                ? 'rgba(76, 175, 80, 0.2)'
                : 'rgba(255, 0, 0, 0.2)',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <p><strong>Connected:</strong> {connected ? 'Yes' : 'No'}</p>
              <p><strong>Accounts shared:</strong> {accounts.length > 0 ? 'Yes' : 'No'}</p>
              {accounts.length > 0 && (
                <p><strong>First account:</strong> {accounts[0].address}</p>
              )}
            </div>
            
            <h3>Technical Details</h3>
            <pre style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '10px',
              borderRadius: '5px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: '12px'
            }}>
              {JSON.stringify({ connected, accounts, selectedAccount }, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
              <button 
                onClick={handleRequestAccounts}
                style={{ backgroundColor: '#2196F3' }}
              >
                Request Account Sharing
              </button>
              
              <button 
                onClick={handleReconnect}
                style={{ backgroundColor: '#FF9800' }}
              >
                Reconnect Wallet
              </button>
              
              <button 
                onClick={checkRadixEnvironment}
                style={{ backgroundColor: '#9C27B0' }}
              >
                Check Environment
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#F44336' }}
              >
                Reload Page
              </button>
            </div>
            
            {lastAction && (
              <div style={{ marginTop: '20px' }}>
                <h3>Last Action: {lastAction}</h3>
                <pre style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px',
                  borderRadius: '5px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: '12px'
                }}>
                  {lastActionResult || 'No result'}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <h3 style={{ margin: 0 }}>Debug Logs</h3>
              <button 
                onClick={() => setLogs([])}
                style={{ 
                  backgroundColor: '#F44336',
                  padding: '2px 8px',
                  fontSize: '12px'
                }}
              >
                Clear
              </button>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '10px',
              borderRadius: '5px',
              height: '250px',
              overflowY: 'auto'
            }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '5px',
                  color:
                    log.type === 'error'
                      ? '#F44336'
                      : log.type === 'warning'
                      ? '#FFC107'
                      : log.type === 'success'
                      ? '#4CAF50'
                      : '#fff'
                }}>
                  <span style={{ opacity: 0.7, fontSize: '12px' }}>{log.timestamp}: </span>
                  <span>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && <div style={{ opacity: 0.5 }}>No logs yet</div>}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RadixWalletDebugger;
