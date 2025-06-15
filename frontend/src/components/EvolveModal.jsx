// src/components/EvolveModal.jsx
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const EvolveModal = ({ onClose, creature, onSuccess }) => {
  // Context access
  const {
    initiateMintTransaction,
    pollTransactionStatus,
    formatResource,
    isMobile,
    addNotification,
  } = useContext(GameContext);

  // From the RadixConnect context
  const {
    connected,
    accounts,
  } = useRadixConnect();

  // Component states
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [evolvingStage, setEvolvingStage] = useState('init'); // 'init', 'sending', 'pending', 'success', 'failed'
  const [intentHash, setIntentHash] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  
  // New polling states and refs
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef(null);
  const pollStartedRef = useRef(false);
  const successHandledRef = useRef(false);
  const hardTimeoutRef = useRef(null);
  
  // Evolution cost states
  const [evolveCost, setEvolveCost] = useState(null);
  const [costFetching, setCostFetching] = useState(true);
  
  // Balance states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState('XRD');
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // Check if the creature can evolve
  const canEvolve = () => {
    if (!creature) return false;
    
    // Can't evolve past form 3
    if (creature.form >= 3) return false;
    
    // Need 3 stat upgrades to evolve
    if (creature.evolution_progress) {
      return creature.evolution_progress.stat_upgrades_completed >= 3;
    }
    
    return false;
  };

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

  // Fetch evolution cost when component mounts
  useEffect(() => {
    const fetchEvolutionCost = async () => {
      if (!connected || !accounts || accounts.length === 0 || !creature) return;
      
      setCostFetching(true);
      setError(null);
      
      try {
        const response = await fetch('/api/getEvolveManifest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountAddress: accounts[0].address,
            creatureId: creature.id,
            creatureData: creature
          }),
          credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setEvolveCost(data.cost);
          setTokenSymbol(data.cost.token);
        } else {
          setError(data.error || "Failed to calculate evolution cost");
          setEvolveCost(null);
        }
      } catch (error) {
        console.error("Error calculating evolution cost:", error);
        setError("Network error calculating cost");
        setEvolveCost(null);
      } finally {
        setCostFetching(false);
      }
    };
    
    fetchEvolutionCost();
  }, [connected, accounts, creature]);
  
  // Fetch token balance when ready and when token symbol changes
  useEffect(() => {
    const checkTokenBalance = async () => {
      if (!connected || !accounts || accounts.length === 0 || !tokenSymbol) return;
      
      setIsLoadingBalance(true);
      
      try {
        // Use our backend endpoint to check token balance
        const response = await fetch('/api/checkTokenBalance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountAddress: accounts[0].address,
            tokenSymbol: tokenSymbol
          }),
          credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setTokenBalance(data.tokenBalance || 0);
          setHasEnoughTokens(evolveCost && data.tokenBalance >= evolveCost.amount);
        } else {
          console.error("Token balance check failed:", data.error || "Unknown error");
          setTokenBalance(0);
          setHasEnoughTokens(false);
        }
      } catch (error) {
        console.error("Error checking token balance:", error);
        setTokenBalance(0);
        setHasEnoughTokens(false);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    if (evolveCost && evolveCost.token) {
      setTokenSymbol(evolveCost.token);
      checkTokenBalance();
    }
  }, [connected, accounts, tokenSymbol, evolveCost]);

  // This function will be called just once to start polling
  const startPolling = useCallback(() => {
    // If polling already started, don't start again
    if (pollStartedRef.current) return;
    pollStartedRef.current = true;
    
    console.log("[CRITICAL] Starting new polling sequence");
    
    // Set a hard timeout to force success after 60 seconds regardless
    hardTimeoutRef.current = setTimeout(() => {
      console.log("[CRITICAL] Hard timeout reached - forcing success");
      // Force success state and cleanup
      setEvolvingStage('success');
      setIsLoading(false);
      
      // Handle success callback if not already done
      if (!successHandledRef.current) {
        successHandledRef.current = true;
        if (onSuccess) onSuccess();
        addNotification("Evolution likely completed. Please refresh to see latest data.", 400, 300, "#4CAF50");
      }
      
      // Clear any pending timers
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }, 60000);
    
    // Function that does the actual polling
    const pollStatus = async (currentCount) => {
      console.log(`[CRITICAL] Polling attempt ${currentCount}`);
      
      try {
        const response = await fetch('/api/checkUpgradeStatus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intentHash,
            creatureId: creature?.id,
            checkCount: currentCount
          }),
          credentials: 'same-origin'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[CRITICAL] Poll response (count=${currentCount}):`, data);
        
        // Update the UI with new count
        setPollCount(currentCount);
        
        // Extract status information
        const txSuccessful = data.forceSuccess === true || 
                            (data.transactionStatus && data.transactionStatus.status === "CommittedSuccess");
        
        // If success or server says stop retrying
        if (txSuccessful || data.shouldRetry === false) {
          console.log("[CRITICAL] Success condition reached");
          
          // Transition to success state and stop loading
          setEvolvingStage('success');
          setIsLoading(false);
          
          // Clear timers
          if (hardTimeoutRef.current) {
            clearTimeout(hardTimeoutRef.current);
            hardTimeoutRef.current = null;
          }
          
          // Handle success callback (only once)
          if (!successHandledRef.current) {
            successHandledRef.current = true;
            if (onSuccess) onSuccess();
          }
          
          return; // Exit polling loop
        }
        
        // Continue polling with next count
        const nextCount = currentCount + 1;
        
        // Schedule next poll
        pollTimerRef.current = setTimeout(() => {
          pollStatus(nextCount);
        }, 5000); // Fixed 5 second wait time
        
      } catch (error) {
        console.error("[CRITICAL] Polling error:", error);
        
        // On error, increment count and try again (up to 3 times)
        const nextCount = currentCount + 1;
        setPollCount(nextCount);
        
        if (nextCount < 3) {
          // Retry with slightly longer delay
          pollTimerRef.current = setTimeout(() => {
            pollStatus(nextCount);
          }, 7000);
        } else {
          // Too many errors, force success after 3 attempts
          console.log("[CRITICAL] Too many errors, forcing success");
          setEvolvingStage('success');
          setIsLoading(false);
          
          // Clear hard timeout
          if (hardTimeoutRef.current) {
            clearTimeout(hardTimeoutRef.current);
            hardTimeoutRef.current = null;
          }
          
          // Handle success callback
          if (!successHandledRef.current) {
            successHandledRef.current = true;
            if (onSuccess) onSuccess();
            addNotification("Evolution might have completed. Please refresh to check.", 400, 300, "#4CAF50");
          }
        }
      }
    };
    
    // Start the first poll with count 0
    pollStatus(0);
  }, [intentHash, creature, onSuccess, addNotification]);

  // REPLACE existing useEffect with this one for transaction polling
  useEffect(() => {
    // Only start polling when we have an intent hash and we're in pending state
    if (intentHash && evolvingStage === 'pending') {
      // Start polling sequence (will only start once)
      startPolling();
    }
    
    // Cleanup function
    return () => {
      // Clear all timers on unmount
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      
      if (hardTimeoutRef.current) {
        clearTimeout(hardTimeoutRef.current);
        hardTimeoutRef.current = null;
      }
    };
  }, [intentHash, evolvingStage, startPolling]);

  // When transitioning from 'sending' to 'pending', reset the refs
  useEffect(() => {
    if (evolvingStage === 'pending') {
      // Reset poll state on new 'pending' stage
      pollStartedRef.current = false;
      successHandledRef.current = false;
      setPollCount(0);
    }
  }, [evolvingStage]);

  // Handler for the evolve transaction
  const handleEvolve = async () => {
    if (connectionStatus !== 'ready') return;
    if (!canEvolve()) {
      setError("This creature cannot evolve yet");
      return;
    }
    
    setIsLoading(true);
    setEvolvingStage('sending');
    setError(null);
    setStatusCheckCount(0);  // Reset status check count when starting new transaction
    
    try {
      // Fetch the manifest for evolving
      const response = await fetch('/api/getEvolveManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          creatureId: creature.id,
          creatureData: creature
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.manifest) {
        throw new Error("Server didn't return evolution manifest");
      }
      
      // Send the transaction to the wallet using the same method as minting
      const hash = await initiateMintTransaction(data.manifest, 'evolveCreature');
      
      if (hash) {
        setIntentHash(hash);
        setEvolvingStage('pending');
        addNotification("Evolution transaction sent to wallet", 400, 300, "#2196F3");
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error) {
      console.error("Evolution error:", error);
      setError(error.message || "Failed to evolve creature");
      setEvolvingStage('failed');
      setIsLoading(false);
      addNotification("Evolution failed: " + (error.message || "Unknown error"), 400, 300, "#F44336");
    }
  };

  // Toggle connection details panel
  const toggleConnectionDetails = () => {
    setShowConnectionDetails(prev => !prev);
  };

  // Try again after failure
  const handleTryAgain = () => {
    setEvolvingStage('init');
    setIntentHash(null);
    setTransactionDetails(null);
    setStatusCheckCount(0);
    setError(null);
  };

  // Get form description display
  const getFormDescription = (form) => {
    switch (form) {
      case 0:
        return "Egg";
      case 1:
        return "Form 1";
      case 2:
        return "Form 2";
      case 3:
        return "Form 3 (Final)";
      default:
        return `Form ${form}`;
    }
  };

  // If no creature is provided, show an error
  if (!creature) {
    return (
      <div>
        <h3>Error: No creature selected</h3>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  // If creature can't evolve, explain why
  if (!canEvolve()) {
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
            maxWidth: '500px',
            width: isMobile ? '95%' : '80%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#222',
            borderRadius: '10px',
            boxShadow: '0 5px 25px rgba(0, 0, 0, 0.5)',
            overflowY: 'auto',
            padding: '20px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0, color: '#F44336' }}>Cannot Evolve Creature</h3>
          
          {creature.form >= 3 ? (
            <p>This creature is already at its final form and cannot evolve further.</p>
          ) : creature.evolution_progress && creature.evolution_progress.stat_upgrades_completed < 3 ? (
            <p>This creature needs {3 - (creature.evolution_progress.stat_upgrades_completed)} more stat upgrades before it can evolve.</p>
          ) : (
            <p>This creature cannot evolve at this time.</p>
          )}
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={onClose}
              style={{
                backgroundColor: '#555',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

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
          maxWidth: '600px',
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
          <h2 style={{ margin: 0, color: '#FF9800' }}> Evolve Creature </h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Action button based on stage */}
            {evolvingStage === 'init' && !isLoading && (
              <button
                onClick={handleEvolve}
                disabled={connectionStatus !== 'ready' || isLoading || costFetching || !hasEnoughTokens}
                style={{
                  backgroundColor: connectionStatus === 'ready' && !isLoading && !costFetching && hasEnoughTokens ? '#FF9800' : '#999',
                  opacity: connectionStatus === 'ready' && !isLoading && !costFetching && hasEnoughTokens ? 1 : 0.7,
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: 'none',
                  color: '#fff',
                  cursor: connectionStatus === 'ready' && !isLoading && !costFetching && hasEnoughTokens ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {costFetching ? 'Calculating Cost...' : `Evolve Creature`}
              </button>
            )}
            
            {evolvingStage === 'failed' && (
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
                backgroundColor: evolvingStage === 'success' ? '#4CAF50' : '#333',
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: evolvingStage === 'success' ? 'bold' : 'normal'
              }}
            >
              {evolvingStage === 'success' ? 'Close' : 'Cancel'}
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
                  <strong>Account Address:</strong> {accounts?.[0]?.address || 'N/A'}
                </p>
                <p style={{ fontSize: '11px', margin: '2px 0' }}>
                  <strong>Evolving Stage:</strong> {evolvingStage}
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
              <p>Please share an account to evolve your Creature.</p>
            </div>
          )}

          {/* C) Ready to evolve - initial stage */}
          {connectionStatus === 'ready' && evolvingStage === 'init' && !isLoading && (
            <div>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Current creature image and details */}
                <div style={{ 
                  width: isMobile ? '100%' : '40%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={creature.image_url} 
                      alt={creature.species_name} 
                      style={{ 
                        width: '100%',
                        maxWidth: '180px',
                        borderRadius: '8px',
                        border: `2px solid ${
                          creature.rarity === 'Legendary' ? '#FFD700' :
                          creature.rarity === 'Epic' ? '#9C27B0' :
                          creature.rarity === 'Rare' ? '#2196F3' : '#4CAF50'
                        }`
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '0',
                      right: '0',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '5px',
                      textAlign: 'center'
                    }}>
                      {getFormDescription(creature.form)}
                    </div>
                  </div>
                  
                  <h3 style={{ margin: '10px 0 5px 0' }}>{creature.species_name}</h3>
                  
                  <div style={{ 
                    display: 'flex',
                    gap: '5px',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      backgroundColor: creature.rarity === 'Legendary' ? '#FFD700' :
                                      creature.rarity === 'Epic' ? '#9C27B0' :
                                      creature.rarity === 'Rare' ? '#2196F3' : '#4CAF50',
                      color: creature.rarity === 'Legendary' ? '#000' : '#fff',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      fontWeight: 'bold'
                    }}>
                      {creature.rarity}
                    </span>
                  </div>
                </div>
                
                {/* Evolution details panel */}
                <div style={{ 
                  width: isMobile ? '100%' : '60%',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>Evolution Details</h3>
                  
                  <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                    Your {creature.species_name} is ready to evolve from {getFormDescription(creature.form)} to {getFormDescription(creature.form + 1)}.
                  </p>
                  
                  {/* Evolution progress bar */}
                  <div style={{
                    marginBottom: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '10px',
                    borderRadius: '5px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px'
                    }}>
                      <span>Evolution Progress:</span>
                      <span>Ready to Evolve</span>
                    </div>
                    
                    <div style={{
                      width: '100%',
                      height: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#FF9800',
                        borderRadius: '5px'
                      }} />
                    </div>
                  </div>
                  
                  {/* Evolution benefits - UPDATED SECTION */}
                  <div style={{
                    marginBottom: '20px',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    padding: '15px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>Evolution Benefits</h4>
                    
                    <p>When evolving to {getFormDescription(creature.form + 1)}, your creature will gain:</p>
                    
                    <div style={{ paddingLeft: '20px', marginTop: '10px' }}>
                      {/* Form 0 evolution benefits - using loose equality and string check for safety */}
                      {(creature.form == 0 || creature.form === '0' || creature.form === 'Egg') && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>+1 to all stats</strong> (Energy, Strength, Magic, Stamina, and Speed)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>New appearance</strong> - Your creature will hatch from its egg with a unique form</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>Enhanced abilities</strong> - Unlocks new potential for your creature</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Form 1 evolution benefits */}
                      {(creature.form == 1 || creature.form === '1') && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>+1 to all stats</strong> (Energy, Strength, Magic, Stamina, and Speed)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span>
                              <strong>+1 additional point</strong> to specialty stats
                              {creature.specialty_stats && creature.specialty_stats.length > 0 && (
                                <>: <strong>{creature.specialty_stats.map(stat => 
                                  stat.charAt(0).toUpperCase() + stat.slice(1)
                                ).join(', ')}</strong></>
                              )}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>More powerful appearance</strong> - Your creature evolves with enhanced visual features</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Form 2 evolution benefits */}
                      {(creature.form == 2 || creature.form === '2') && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>+2 to all stats</strong> (Energy, Strength, Magic, Stamina, and Speed)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>Final form appearance</strong> - Maximum visual evolution with impressive features</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#FF9800', 
                              marginRight: '10px' 
                            }}></div>
                            <span><strong>Final form powers</strong> - Ability to level up stats 3 more times</span>
                          </div>
                        </div>
                      )}
                      
                      {/* If no form matches, provide a fallback */}
                      {!([0, '0', 'Egg', 1, '1', 2, '2'].includes(creature.form)) && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: '#FF9800', 
                            marginRight: '10px' 
                          }}></div>
                          <span><strong>Enhanced stats and appearance</strong> - Your creature will evolve to a more powerful form</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Note about specialty stats for Form 1 evolution */}
                    {(creature.form == 1 || creature.form === '1') && (
                      <div style={{
                        marginTop: '10px',
                        fontSize: '13px',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: '8px',
                        borderRadius: '5px'
                      }}>
                        <p style={{ margin: '0' }}>
                          <strong>Note:</strong> Specialty stats receive boosted improvements. 
                          {creature.specialty_stats && creature.specialty_stats.length === 1 
                            ? ' This stat gets a 100% boost' 
                            : ' These stats get a 50% boost'} compared to regular stats.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Token cost and balance info */}
              {evolveCost && (
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  marginTop: '15px',
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Evolution Cost</h4>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                        {evolveCost.amount} {evolveCost.token}
                      </p>
                      
                      {isLoadingBalance ? (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>
                          Checking balance...
                        </p>
                      ) : tokenBalance !== null ? (
                        <p style={{ 
                          margin: '5px 0 0 0', 
                          fontSize: '12px', 
                          color: hasEnoughTokens ? '#4CAF50' : '#FF9800'
                        }}>
                          Your balance: {tokenBalance} {tokenSymbol}
                          {!hasEnoughTokens && ` (need ${evolveCost.amount - tokenBalance} more)`}
                        </p>
                      ) : (
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>
                          Couldn't verify balance
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div style={{
                  padding: '10px',
                  marginTop: '15px',
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  borderRadius: '5px',
                  color: '#F44336'
                }}>
                  <p style={{ margin: 0 }}>{error}</p>
                </div>
              )}
            </div>
          )}

          {/* D) Sending transaction */}
          {evolvingStage === 'sending' && (
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
                    border: '3px solid #FF9800',
                    borderTop: '3px solid transparent',
                    animation: 'spin 1s linear infinite',
                    marginRight: '15px'
                  }}
                />
                <h3 style={{ margin: 0, color: '#FF9800' }}>Sending Transaction to Wallet</h3>
              </div>
              
              <p>Please confirm the transaction in your Radix wallet.</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                This will evolve your {creature.species_name} from {getFormDescription(creature.form)} to {getFormDescription(creature.form + 1)}.
              </p>
              
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* E) Transaction pending - UPDATED */}
          {evolvingStage === 'pending' && (
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
                    border: '3px solid #FF9800',
                    borderTop: '3px solid transparent',
                    animation: 'spin 1s linear infinite',
                    marginRight: '15px'
                  }}
                />
                <h3 style={{ margin: 0, color: '#FF9800' }}>Evolution in Progress</h3>
              </div>
              
              <p>Your evolution transaction is being processed on the Radix network.</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>This may take 30-60 seconds to complete.</p>
              
              {/* Manual refresh option */}
              <div style={{
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                padding: '10px',
                borderRadius: '5px',
                marginTop: '15px'
              }}>
                <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  {pollCount === 0 
                    ? "Evolution is processing..." 
                    : pollCount === 1 
                      ? "Still waiting for confirmation..." 
                      : "Evolution likely completed. Click refresh to update."}
                </p>
                {pollCount > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        if (onSuccess) onSuccess();
                      }, 100);
                    }}
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    Refresh Now
                  </button>
                )}
              </div>
              
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
          {evolvingStage === 'success' && (
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
              <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Evolution Successful!</h3>
              
              <p>Your {creature.species_name} has evolved from {getFormDescription(creature.form)} to {getFormDescription(creature.form + 1)}!</p>
              
              <div style={{ 
                marginTop: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                padding: '15px', 
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>What's Next:</h4>
                
                {creature.form < 2 ? (
                  <p>Continue to upgrade your creature's stats to prepare for the next evolution.</p>
                ) : (
                  <p>Your creature has reached its final form! You can now level up its stats up to 3 times.</p>
                )}
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
          {evolvingStage === 'failed' && (
            <div
              style={{
                background: 'rgba(244, 67, 54, 0.2)',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <h3 style={{ color: '#F44336', margin: '0 0 15px 0' }}>Evolution Failed</h3>
              
              <p>There was an error with your evolution transaction.</p>
              
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
              
              {error && (
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  padding: '10px', 
                  borderRadius: '8px',
                  margin: '15px 0',
                  fontSize: '14px',
                  wordBreak: 'break-all'
                }}>
                  <p style={{ margin: 0 }}>{error}</p>
                </div>
              )}
              
              <p style={{ fontSize: '14px', margin: '15px 0 0 0' }}>
                You can try again or close this window and retry later.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default EvolveModal;
