// src/components/FomoHitMinter.jsx
import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const FomoHitMinter = ({ machineId, onClose }) => {
  // Game context
  const {
    machines,
    activateMachine,
    initiateMintTransaction,
    pollTransactionStatus
  } = useContext(GameContext);

  // Radix Connect context
  const {
    connected,
    accounts,
    selectedAccount,
    updateAccountSharing
  } = useRadixConnect();

  // Find the FOMO HIT machine instance
  const machine = machines.find((m) => m.id === machineId);

  // Component states
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [mintingStage, setMintingStage] = useState('init'); // 'init', 'sending', 'pending', 'success', 'failed'
  const [intentHash, setIntentHash] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);

  // Check connection status
  useEffect(() => {
    if (!connected) {
      setConnectionStatus('disconnected');
    } else if (!accounts || accounts.length === 0) {
      setConnectionStatus('connected-no-accounts');
    } else {
      setConnectionStatus('ready');
    }
  }, [connected, accounts]);

  // Poll transaction status if we have an intent hash
  useEffect(() => {
    if (intentHash && mintingStage === 'pending') {
      const maxStatusChecks = 30; // Limit how many times we check
      
      const checkStatus = async () => {
        try {
          const response = await fetch('/api/checkMintStatus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              intentHash,
              machineId
            }),
            credentials: 'same-origin'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Transaction status:", data);
          setTransactionDetails(data.transactionStatus);
          
          const txStatus = data.transactionStatus?.status;
          
          if (txStatus === "CommittedSuccess") {
            setMintingStage('success');
            setIsLoading(false);
            return;
          } else if (txStatus === "Failed" || txStatus === "Rejected") {
            setMintingStage('failed');
            setIsLoading(false);
            return;
          }
          
          setStatusCheckCount(prev => prev + 1);
          
          // If we're still pending and haven't reached max checks
          if (statusCheckCount < maxStatusChecks) {
            setTimeout(checkStatus, 3000);
          } else {
            // Max checks reached, but not failed - tell user to check later
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error checking transaction status:", error);
          setIsLoading(false);
          setMintingStage('failed');
        }
      };
      
      setTimeout(checkStatus, 3000);
    }
  }, [intentHash, mintingStage, machineId, statusCheckCount]);

  // Handle the minting process
  const handleMint = async () => {
    if (!machine || connectionStatus !== 'ready') return;
    
    setIsLoading(true);
    setMintingStage('sending');
    
    try {
      // First, activate the machine which will return a manifest
      const response = await fetch('/api/activateMachine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machine.id,
          accountAddress: accounts[0].address
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.requiresMint || !data.manifest) {
        throw new Error("Server didn't return minting manifest");
      }
      
      // Send the transaction to the wallet
      const hash = await initiateMintTransaction(data.manifest, machine.id);
      
      if (hash) {
        setIntentHash(hash);
        setMintingStage('pending');
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error) {
      console.error("Minting error:", error);
      setMintingStage('failed');
      setIsLoading(false);
    }
  };

  // Toggle connection details panel
  const toggleConnectionDetails = () => {
    setShowConnectionDetails(prev => !prev);
  };

  // Handle close after success
  const handleCloseAfterSuccess = () => {
    onClose();
  };

  // Try again after failure
  const handleTryAgain = () => {
    setMintingStage('init');
    setIntentHash(null);
    setTransactionDetails(null);
    setStatusCheckCount(0);
  };

  // If machine not found, return nothing
  if (!machine) return null;

  return (
    <div className="welcome-message" style={{ maxWidth: '800px' }}>
      <h1>FOMO HIT NFT Minter</h1>

      {/* Connection status indicator */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px',
          padding: '5px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: connectionStatus === 'ready' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
          color: connectionStatus === 'ready' ? '#4CAF50' : '#FF9800',
          cursor: 'pointer'
        }}
        onClick={toggleConnectionDetails}
      >
        {connectionStatus === 'ready' ? 'Connected' : 'Connection Issues'} {showConnectionDetails ? '▲' : '▼'}
      </div>

      {/* A) Wallet is disconnected */}
      {connectionStatus === 'disconnected' && (
        <div
          style={{
            background: 'rgba(255, 87, 34, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            color: '#FF5722'
          }}
        >
          <p><strong>Your Radix wallet is not connected</strong></p>
          <p>Please connect your Radix wallet using the top-right button.</p>
        </div>
      )}

      {/* B) Wallet is connected but no account shared */}
      {connectionStatus === 'connected-no-accounts' && (
        <div
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            color: '#FFC107'
          }}
        >
          <p><strong>Wallet connected but no account shared</strong></p>
          <p>Please share an account to mint your NFT.</p>
          <button
            onClick={updateAccountSharing}
            style={{
              backgroundColor: '#FFC107',
              color: 'black',
              marginTop: '10px'
            }}
          >
            Share an account
          </button>
        </div>
      )}

      {/* C) Ready to mint - initial stage */}
      {connectionStatus === 'ready' && mintingStage === 'init' && !isLoading && (
        <div
          style={{
            background: 'rgba(255, 61, 0, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}
        >
          <p>
            Connected to account:{' '}
            <strong>
              {selectedAccount?.label ||
                (selectedAccount?.address
                  ? selectedAccount.address.slice(0, 10) + '...'
                  : accounts[0]?.address
                  ? accounts[0].address.slice(0, 10) + '...'
                  : 'N/A')}
            </strong>
          </p>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '20px', 
            borderRadius: '10px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#FF3D00', margin: '0 0 15px 0' }}>You're about to mint your FOMO HIT NFT!</h2>
            <p>This is a limited edition NFT that proves you were an early FOMO HIT builder.</p>
            <p>Each player can only mint one NFT from The FOMO HIT machine.</p>
            <p style={{ fontWeight: 'bold', marginTop: '15px' }}>After minting, your machine will produce 5 TCorvax with each activation.</p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '20px 0',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', margin: '0 0 5px 0', opacity: 0.7 }}>Your NFT will be sent to:</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: '#FF3D00' }}>
                {accounts[0]?.address || 'Unknown address'}
              </p>
            </div>
          </div>
          
          <p style={{ fontSize: '12px', margin: '15px 0 0 0', opacity: 0.7, textAlign: 'center' }}>
            You can view your NFT on <a href="https://addix.meme" target="_blank" rel="noopener noreferrer" style={{ color: '#FF3D00' }}>addix.meme</a> after minting.
          </p>
        </div>
      )}

      {/* D) Sending transaction */}
      {mintingStage === 'sending' && (
        <div
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '3px solid #FF3D00',
                borderTop: '3px solid transparent',
                animation: 'spin 1s linear infinite',
                marginRight: '15px'
              }}
            />
            <h3 style={{ margin: 0, color: '#FF3D00' }}>Sending Transaction to Wallet</h3>
          </div>
          
          <p>Please confirm the transaction in your Radix wallet.</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>This will mint your FOMO HIT NFT directly to your account.</p>
          
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* E) Transaction pending */}
      {mintingStage === 'pending' && (
        <div
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '3px solid #FF3D00',
                borderTop: '3px solid transparent',
                animation: 'spin 1s linear infinite',
                marginRight: '15px'
              }}
            />
            <h3 style={{ margin: 0, color: '#FF3D00' }}>Transaction Pending</h3>
          </div>
          
          <p>Your NFT mint transaction is being processed on the Radix network.</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>This may take 30-60 seconds to complete.</p>
          
          {intentHash && (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '10px', 
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '12px',
              wordBreak: 'break-all'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Transaction Hash:</p>
              <p style={{ margin: 0 }}>{intentHash}</p>
            </div>
          )}
          
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* F) Transaction success */}
      {mintingStage === 'success' && (
        <div
          style={{
            background: 'rgba(76, 175, 80, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
          <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>NFT Minted Successfully!</h3>
          
          <p>Your FOMO HIT NFT has been minted and sent to your account.</p>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '15px', 
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>What's Next:</h4>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ margin: '5px 0' }}>Your FOMO HIT machine is now fully operational</li>
              <li style={{ margin: '5px 0' }}>Each activation will now produce 5 TCorvax</li>
              <li style={{ margin: '5px 0' }}>
                Visit <a href="https://addix.meme" target="_blank" rel="noopener noreferrer" style={{ color: '#FF3D00' }}>addix.meme</a> to view your NFT
              </li>
            </ol>
          </div>
          
          {intentHash && (
            <div style={{ 
              fontSize: '12px', 
              margin: '15px 0 0 0', 
              opacity: 0.7,
              wordBreak: 'break-all'
            }}>
              Transaction Hash: {intentHash}
            </div>
          )}
        </div>
      )}

      {/* G) Transaction failed */}
      {mintingStage === 'failed' && (
        <div
          style={{
            background: 'rgba(244, 67, 54, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <h3 style={{ color: '#F44336', margin: '0 0 15px 0' }}>Transaction Failed</h3>
          
          <p>There was an error with your NFT minting transaction.</p>
          
          {transactionDetails?.error_message && (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '10px', 
              borderRadius: '8px',
              margin: '15px 0',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Error Details:</p>
              <p style={{ margin: 0 }}>{transactionDetails.error_message}</p>
            </div>
          )}
          
          <p style={{ fontSize: '14px', margin: '15px 0 0 0' }}>
            You can try again or close this window and retry later.
          </p>
        </div>
      )}

      {/* Connection details panel */}
      {showConnectionDetails && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            fontSize: '0.8em',
            color: '#EEE'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>Connection Details</h4>
          
          <div>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Radix Connected:</strong> {connected ? 'Yes' : 'No'}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Accounts Shared:</strong> {accounts?.length > 0 ? 'Yes' : 'No'}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Account Address:</strong> {selectedAccount?.address || accounts[0]?.address || 'N/A'}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Minting Stage:</strong> {mintingStage}
            </p>
            {intentHash && (
              <p style={{ fontSize: '11px', margin: '2px 0', wordBreak: 'break-all' }}>
                <strong>Intent Hash:</strong> {intentHash}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {/* Close button for all stages */}
        <button 
          onClick={onClose}
          style={{
            backgroundColor: '#333',
            width: mintingStage === 'success' ? '100%' : 'auto'
          }}
        >
          {mintingStage === 'success' ? 'Close' : 'Cancel'}
        </button>
        
        {/* Action button based on stage */}
        {mintingStage === 'init' && (
          <button
            onClick={handleMint}
            disabled={isLoading || connectionStatus !== 'ready'}
            style={{
              backgroundColor: connectionStatus === 'ready' ? '#FF3D00' : '#999',
              opacity: connectionStatus === 'ready' ? 1 : 0.7
            }}
          >
            Mint FOMO HIT NFT
          </button>
        )}
        
        {mintingStage === 'failed' && (
          <button
            onClick={handleTryAgain}
            style={{
              backgroundColor: '#F44336'
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default FomoHitMinter;
