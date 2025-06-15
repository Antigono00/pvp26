// src/components/EvolvingCreatureMinter.jsx
import { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const EvolvingCreatureMinter = ({ onClose }) => {
  // Game context
  const {
    initiateMintTransaction,
    pollTransactionStatus,
    formatResource,
    isMobile
  } = useContext(GameContext);

  // From the RadixConnect context
  const {
    connected,
    accounts,
    updateAccountSharing
  } = useRadixConnect();

  // Component states
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [mintingStage, setMintingStage] = useState('init'); // 'init', 'sending', 'pending', 'success', 'failed'
  const [intentHash, setIntentHash] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [mintedCreature, setMintedCreature] = useState(null);
  const [mintedItem, setMintedItem] = useState(null);

  // Balance checking states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [xrdBalance, setXrdBalance] = useState(null);
  const [balanceErrorMessage, setBalanceErrorMessage] = useState("");
  const [hasSuccessfullyMintedBefore, setHasSuccessfullyMintedBefore] = useState(false);

  // Constants
  const MINT_PRICE = 250; // XRD cost for minting a creature egg
  
  // We're getting isMobile from GameContext, so no need to check here
  // This removes the code that was causing the setIsMobile error

  // Check connection status
  useEffect(() => {
    if (!connected) {
      setConnectionStatus('disconnected');
    } else if (!accounts || accounts.length === 0) {
      setConnectionStatus('connected-no-accounts');
    } else {
      setConnectionStatus('ready');
    }
    setIsLoading(false);
  }, [connected, accounts]);

  // Simplified XRD balance check - just informational, doesn't block minting
  useEffect(() => {
    const checkXrdBalance = async () => {
      if (!connected || !accounts || accounts.length === 0) return;
      
      setIsLoadingBalance(true);
      
      try {
        // Use our backend endpoint to check XRD balance
        const response = await fetch('/api/checkXrdBalance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountAddress: accounts[0].address
          }),
          credentials: 'same-origin'
        });
        
        const data = await response.json();
        console.log("XRD balance check:", data);
        
        if (response.ok) {
          // Just store the balance for display - don't block the mint button
          setXrdBalance(data.xrdBalance);
          
          // Store any status message, but don't block minting
          if (data.statusMessage) {
            setBalanceErrorMessage(data.statusMessage);
          } else {
            setBalanceErrorMessage("");
          }
        } else {
          console.error("XRD balance check failed:", data.error || "Unknown error");
          // Store the error message
          setBalanceErrorMessage(data.statusMessage || "Failed to check XRD balance");
        }
      } catch (error) {
        console.error("Error checking XRD balance:", error);
        setBalanceErrorMessage("Network error checking balance");
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    checkXrdBalance();
  }, [connected, accounts]);

  // Add this function to refresh the balance manually
  const refreshBalance = async () => {
    if (!connected || !accounts || accounts.length === 0) return;
    
    setIsLoadingBalance(true);
    
    try {
      const response = await fetch('/api/checkXrdBalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          forceRefresh: true // Add this flag to indicate a refresh request
        }),
        credentials: 'same-origin'
      });
      
      const data = await response.json();
      console.log("XRD balance refresh:", data);
      
      setXrdBalance(data.xrdBalance);
      
      if (data.xrdBalance > 0) {
        setBalanceErrorMessage("");
      } else {
        setBalanceErrorMessage(data.statusMessage || "Balance still shows as zero");
      }
    } catch (error) {
      console.error("Error refreshing XRD balance:", error);
      setBalanceErrorMessage("Error refreshing balance");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Add this to update the successful mint tracking
  useEffect(() => {
    // When a mint is successful, update our state
    if (mintingStage === 'success') {
      setHasSuccessfullyMintedBefore(true);
      
      // Save this in localStorage to persist across sessions
      try {
        localStorage.setItem('hasMintedBefore', 'true');
      } catch (e) {
        console.error("Could not save mint status to localStorage:", e);
      }
    }
  }, [mintingStage]);

  // Check for past successful mints on component mount
  useEffect(() => {
    try {
      const hasMinted = localStorage.getItem('hasMintedBefore') === 'true';
      setHasSuccessfullyMintedBefore(hasMinted);
    } catch (e) {
      console.error("Could not read mint status from localStorage:", e);
    }
  }, []);

  // Poll transaction status if we have an intent hash
  useEffect(() => {
    if (intentHash && mintingStage === 'pending') {
      const maxStatusChecks = 30; // Limit how many times we check
      
      const checkStatus = async () => {
        try {
          const response = await fetch('/api/checkCreatureMintStatus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              intentHash
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
            
            // If the transaction was successful and we have NFT details, set them
            if (data.creatureNft) {
              setMintedCreature(data.creatureNft);
            }
            if (data.bonusItem) {
              setMintedItem(data.bonusItem);
            }
            
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
  }, [intentHash, mintingStage, statusCheckCount]);

  // Handle the minting process
  const handleMint = async () => {
    if (connectionStatus !== 'ready') return;
    
    setIsLoading(true);
    setMintingStage('sending');
    
    try {
      // Generate the manifest for minting a creature egg
      const response = await fetch('/api/getCreatureMintManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.manifest) {
        throw new Error("Server didn't return minting manifest");
      }
      
      // Send the transaction to the wallet
      const hash = await initiateMintTransaction(data.manifest, 'evolvingCreature');
      
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

  // Try again after failure
  const handleTryAgain = () => {
    setMintingStage('init');
    setIntentHash(null);
    setTransactionDetails(null);
    setStatusCheckCount(0);
    setMintedCreature(null);
    setMintedItem(null);
  };

  return (
    <>
      {/* Overlay background */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div 
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '800px',
          width: isMobile ? '95%' : '80%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#222',
          borderRadius: '10px',
          boxShadow: '0 5px 25px rgba(0, 0, 0, 0.5)',
          overflowY: 'auto',
          touchAction: 'pan-y'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and buttons */}
        <div style={{ 
          position: 'sticky',
          top: 0,
          backgroundColor: '#222',
          padding: '15px',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #444',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ margin: 0, color: '#2196F3' }}>Evolving Creatures</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Action button based on stage */}
            {mintingStage === 'init' && (
              <button
                onClick={handleMint}
                disabled={isLoading || connectionStatus !== 'ready'}
                style={{
                  backgroundColor: connectionStatus === 'ready' ? '#2196F3' : '#999',
                  opacity: connectionStatus === 'ready' ? 1 : 0.7,
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: 'none',
                  color: '#fff',
                  cursor: connectionStatus === 'ready' ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Mint Egg (250 XRD)
              </button>
            )}
            
            {mintingStage === 'failed' && (
              <button
                onClick={handleTryAgain}
                style={{
                  backgroundColor: '#F44336',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Try Again
              </button>
            )}
            
            {/* Close button for all stages */}
            <button 
              onClick={onClose}
              style={{
                backgroundColor: mintingStage === 'success' ? '#4CAF50' : '#333',
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: mintingStage === 'success' ? 'bold' : 'normal'
              }}
            >
              {mintingStage === 'success' ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ 
          overflowY: 'auto',
          padding: '15px',
          flex: '1',
          '-webkit-overflow-scrolling': 'touch' // Better scrolling on iOS
        }}>
          {/* Connection status indicator */}
          <div 
            style={{ 
              display: 'inline-block',
              padding: '5px 10px',
              marginBottom: '15px',
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

          {/* Connection details panel */}
          {showConnectionDetails && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
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
                  <strong>Account Address:</strong> {accounts[0]?.address || 'N/A'}
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
              <p>Please share an account to mint your Creature NFT.</p>
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
            <div>
              <p>
                Connected to account:{' '}
                <strong>
                  {accounts[0]?.label ||
                    (accounts[0]?.address
                      ? accounts[0].address.slice(0, 10) + '...'
                      : 'N/A')}
                </strong>
              </p>
              
              <div style={{ 
                background: 'rgba(33, 150, 243, 0.1)', 
                padding: '20px', 
                borderRadius: '10px',
                margin: '15px 0',
                textAlign: 'center'
              }}>
                <h2 style={{ color: '#2196F3', margin: '0 0 15px 0' }}>Mint an Evolving Creature Egg!</h2>
                <p>Each creature starts as an egg and can evolve through multiple forms.</p>
                <p>You'll also receive a bonus item (tool or spell) with every mint!</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <img src="https://cvxlab.net/assets/evolving_creatures/bullx_egg.png" alt="Creature Egg" style={{ width: '100px', height: '100px', borderRadius: '10px' }} />
                    <p>Creature Egg</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <img src="https://cvxlab.net/assets/tools/babylon_keystone.png" alt="Bonus Item" style={{ width: '100px', height: '100px', borderRadius: '10px' }} />
                    <p>Bonus Item</p>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '15px 0',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', margin: '0 0 5px 0', opacity: 0.7 }}>Mint Price:</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#2196F3' }}>
                    250 XRD
                  </p>
                  
                  {/* Balance display - purely informational */}
                  {isLoadingBalance ? (
                    <p style={{ fontSize: '14px', margin: '10px 0 0 0', color: '#FFD700' }}>
                      Checking balance...
                    </p>
                  ) : xrdBalance !== null ? (
                    <p style={{ 
                      fontSize: '14px', 
                      margin: '10px 0 0 0', 
                      color: xrdBalance >= 250 ? '#4CAF50' : '#FF9800'  // Yellow warning instead of red for low balance
                    }}>
                      Your Balance: {xrdBalance.toFixed(2)} XRD
                      
                      {/* Show refresh button if needed */}
                      {xrdBalance === 0 && (
                        <button 
                          onClick={refreshBalance}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#2196F3',
                            cursor: 'pointer',
                            marginLeft: '10px',
                            textDecoration: 'underline',
                            fontSize: '12px',
                            padding: '0'
                          }}
                        >
                          Refresh
                        </button>
                      )}
                    </p>
                  ) : (
                    <p style={{ fontSize: '14px', margin: '10px 0 0 0', color: '#FFD700' }}>
                      Couldn't verify balance
                    </p>
                  )}
                  
                  {/* Show balance error message if present */}
                  {balanceErrorMessage && (
                    <p style={{ 
                      fontSize: '12px', 
                      margin: '5px 0 0 0', 
                      color: '#FF9800',
                      fontStyle: 'italic'
                    }}>
                      Note: {balanceErrorMessage}
                    </p>
                  )}
                  
                  {/* Optional note for low balance */}
                  {xrdBalance !== null && xrdBalance < 250 && (
                    <p style={{ 
                      fontSize: '12px', 
                      margin: '5px 0 0 0', 
                      color: '#FF9800'
                    }}>
                      Note: Transaction may fail if XRD is insufficient
                    </p>
                  )}
                  
                  <p style={{ fontSize: '14px', margin: '10px 0 0 0', opacity: 0.7 }}>
                    Your NFTs will be sent to: <span style={{ fontWeight: 'bold' }}>{accounts[0]?.address.slice(0, 10) + '...' + accounts[0]?.address.slice(-10)}</span>
                  </p>
                </div>
              </div>
              
              {/* Remove the manual override section completely */}
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
                    border: '3px solid #2196F3',
                    borderTop: '3px solid transparent',
                    animation: 'spin 1s linear infinite',
                    marginRight: '15px'
                  }}
                />
                <h3 style={{ margin: 0, color: '#2196F3' }}>Sending Transaction to Wallet</h3>
              </div>
              
              <p>Please confirm the transaction in your Radix wallet.</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>This will mint your Creature Egg NFT and bonus item directly to your account.</p>
              
              <style>{`
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
                    border: '3px solid #2196F3',
                    borderTop: '3px solid transparent',
                    animation: 'spin 1s linear infinite',
                    marginRight: '15px'
                  }}
                />
                <h3 style={{ margin: 0, color: '#2196F3' }}>Transaction Pending</h3>
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
              
              <style>{`
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
              <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>NFTs Minted Successfully!</h3>
              
              <p>Your Creature Egg and Bonus Item have been minted and sent to your account.</p>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '20px', 
                margin: '20px 0',
                flexWrap: 'wrap'
              }}>
                {mintedCreature && (
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    padding: '15px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    maxWidth: '200px'
                  }}>
                    <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>Your Creature Egg</h4>
                    <img 
                      src={mintedCreature.image_url} 
                      alt={mintedCreature.species_name} 
                      style={{ width: '120px', height: '120px', borderRadius: '8px', marginBottom: '10px' }}
                    />
                    <p style={{ fontWeight: 'bold', margin: '0' }}>{mintedCreature.species_name}</p>
                    <p style={{ opacity: 0.8, margin: '5px 0' }}>Rarity: {mintedCreature.rarity}</p>
                    <p style={{ opacity: 0.8, margin: '5px 0' }}>ID: {mintedCreature.id.slice(0, 8)}</p>
                  </div>
                )}
                
                {mintedItem && (
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    padding: '15px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    maxWidth: '200px'
                  }}>
                    <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>Your Bonus Item</h4>
                    <img 
                      src={mintedItem.image_url} 
                      alt={mintedItem.name} 
                      style={{ width: '120px', height: '120px', borderRadius: '8px', marginBottom: '10px' }}
                    />
                    <p style={{ fontWeight: 'bold', margin: '0' }}>{mintedItem.name}</p>
                    <p style={{ opacity: 0.8, margin: '5px 0' }}>Type: {mintedItem.type === 'tool' ? 'Tool' : 'Spell'}</p>
                    <p style={{ opacity: 0.8, margin: '5px 0' }}>ID: {mintedItem.id.slice(0, 8)}</p>
                  </div>
                )}
              </div>
              
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                padding: '15px', 
                borderRadius: '8px',
                margin: '20px 0',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>What's Next:</h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ margin: '5px 0' }}>You can upgrade your creature stats</li>
                  <li style={{ margin: '5px 0' }}>Evolve your creature when it's ready</li>
                  <li style={{ margin: '5px 0' }}>
                    Visit <a href="https://t.me/CorvaxXRD" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>t.me/CorvaxXRD</a> to earn some TCorvax!
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
        </div>
      </div>
    </>
  );
};

export default EvolvingCreatureMinter;
