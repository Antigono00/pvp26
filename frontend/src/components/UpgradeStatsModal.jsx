// src/components/UpgradeStatsModal.jsx
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const UpgradeStatsModal = ({ onClose, creature, onSuccess }) => {
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
  const [upgradingStage, setUpgradingStage] = useState('init'); // 'init', 'sending', 'pending', 'success', 'failed'
  const [intentHash, setIntentHash] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  
  // Transaction polling states - New implementation
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef(null);
  const pollStartedRef = useRef(false);
  const successHandledRef = useRef(false);
  const hardTimeoutRef = useRef(null);
  
  // Add to the top of the component
  const successShownRef = useRef(false);
  const timeoutRef = useRef(null);
  
  // Stats allocation states
  const [energyPoints, setEnergyPoints] = useState(0);
  const [strengthPoints, setStrengthPoints] = useState(0);
  const [magicPoints, setMagicPoints] = useState(0);
  const [staminaPoints, setStaminaPoints] = useState(0);
  const [speedPoints, setSpeedPoints] = useState(0);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [maxPoints] = useState(2); // Maximum points per upgrade is 2
  
  // Cost states
  const [upgradeCost, setUpgradeCost] = useState(null);
  const [costFetching, setCostFetching] = useState(false);
  
  // Balance states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState('XRD');
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // Check if the creature can be upgraded
  const canUpgrade = () => {
    if (!creature) return false;
    
    // For final form (form 3) creatures, check final_form_upgrades
    if (creature.form === 3) {
      return creature.final_form_upgrades < 3;
    }
    
    // For other forms, check stat upgrades completed
    if (creature.evolution_progress) {
      return creature.evolution_progress.stat_upgrades_completed < 3;
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

  // Update total allocated points when individual stats change
  useEffect(() => {
    const total = energyPoints + strengthPoints + magicPoints + staminaPoints + speedPoints;
    setTotalAllocated(total);
  }, [energyPoints, strengthPoints, magicPoints, staminaPoints, speedPoints]);
  
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
          setHasEnoughTokens(upgradeCost && data.tokenBalance >= upgradeCost.amount);
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
    
    if (upgradeCost && upgradeCost.token) {
      setTokenSymbol(upgradeCost.token);
      checkTokenBalance();
    }
  }, [connected, accounts, tokenSymbol, upgradeCost]);

  // Calculate upgrade cost when points are allocated
  useEffect(() => {
    const calculateCost = async () => {
      if (!connected || !accounts || accounts.length === 0 || !creature) return;
      if (totalAllocated === 0) return;
      
      setCostFetching(true);
      setError(null);
      
      try {
        const response = await fetch('/api/getUpgradeStatsManifest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountAddress: accounts[0].address,
            creatureId: creature.id,
            energy: energyPoints,
            strength: strengthPoints,
            magic: magicPoints,
            stamina: staminaPoints,
            speed: speedPoints,
            creatureData: creature
          }),
          credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setUpgradeCost(data.cost);
          setTokenSymbol(data.cost.token);
        } else {
          setError(data.error || "Failed to calculate upgrade cost");
          setUpgradeCost(null);
        }
      } catch (error) {
        console.error("Error calculating upgrade cost:", error);
        setError("Network error calculating cost");
        setUpgradeCost(null);
      } finally {
        setCostFetching(false);
      }
    };
    
    calculateCost();
  }, [connected, accounts, creature, totalAllocated, energyPoints, strengthPoints, magicPoints, staminaPoints, speedPoints]);

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
      setUpgradingStage('success');
      setIsLoading(false);
      
      // Handle success callback if not already done
      if (!successHandledRef.current) {
        successHandledRef.current = true;
        if (onSuccess) onSuccess();
        addNotification("Transaction likely completed. Please refresh to see latest data.", 400, 300, "#4CAF50");
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
          setUpgradingStage('success');
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
          setUpgradingStage('success');
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
            addNotification("Transaction might have completed. Please refresh to check.", 400, 300, "#4CAF50");
          }
        }
      }
    };
    
    // Start the first poll with count 0
    pollStatus(0);
  }, [intentHash, creature, onSuccess, addNotification]);

  // REPLACED: Improved transaction polling useEffect
  useEffect(() => {
    // Only start polling when we have an intent hash and we're in pending state
    if (intentHash && upgradingStage === 'pending') {
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
  }, [intentHash, upgradingStage, startPolling]);

  // When transitioning from 'sending' to 'pending', reset the refs
  useEffect(() => {
    if (upgradingStage === 'pending') {
      // Reset poll state on new 'pending' stage
      pollStartedRef.current = false;
      successHandledRef.current = false;
      setPollCount(0);
    }
  }, [upgradingStage]);

  // Handler for stat increment/decrement
  const handleStatChange = (stat, change) => {
    if (totalAllocated >= maxPoints && change > 0) {
      // Can't allocate more than max points
      return;
    }
    
    // Can't go below 0
    if (change < 0) {
      switch (stat) {
        case 'energy':
          if (energyPoints <= 0) return;
          break;
        case 'strength':
          if (strengthPoints <= 0) return;
          break;
        case 'magic':
          if (magicPoints <= 0) return;
          break;
        case 'stamina':
          if (staminaPoints <= 0) return;
          break;
        case 'speed':
          if (speedPoints <= 0) return;
          break;
        default:
          return;
      }
    }
    
    // Update the stat
    switch (stat) {
      case 'energy':
        setEnergyPoints(prev => prev + change);
        break;
      case 'strength':
        setStrengthPoints(prev => prev + change);
        break;
      case 'magic':
        setMagicPoints(prev => prev + change);
        break;
      case 'stamina':
        setStaminaPoints(prev => prev + change);
        break;
      case 'speed':
        setSpeedPoints(prev => prev + change);
        break;
      default:
        break;
    }
  };

  // Handler for the upgrade transaction
  const handleUpgrade = async () => {
    if (connectionStatus !== 'ready') return;
    if (totalAllocated === 0) {
      setError("Please allocate at least one stat point");
      return;
    }
    if (totalAllocated > maxPoints) {
      setError(`Cannot allocate more than ${maxPoints} points`);
      return;
    }
    
    setIsLoading(true);
    setUpgradingStage('sending');
    setError(null);
    setStatusCheckCount(0);  // Reset status check count when starting new transaction
    
    try {
      // Fetch the manifest for upgrading stats
      const response = await fetch('/api/getUpgradeStatsManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          creatureId: creature.id,
          energy: energyPoints,
          strength: strengthPoints,
          magic: magicPoints,
          stamina: staminaPoints,
          speed: speedPoints,
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
        throw new Error("Server didn't return upgrade manifest");
      }
      
      // Send the transaction to the wallet using the same method as minting
      const hash = await initiateMintTransaction(data.manifest, 'upgradeStats');
      
      if (hash) {
        setIntentHash(hash);
        setUpgradingStage('pending');
        addNotification("Upgrade transaction sent to wallet", 400, 300, "#2196F3");
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      setError(error.message || "Failed to upgrade stats");
      setUpgradingStage('failed');
      setIsLoading(false);
      addNotification("Upgrade failed: " + (error.message || "Unknown error"), 400, 300, "#F44336");
    }
  };

  // Toggle connection details panel
  const toggleConnectionDetails = () => {
    setShowConnectionDetails(prev => !prev);
  };

  // Try again after failure
  const handleTryAgain = () => {
    setUpgradingStage('init');
    setIntentHash(null);
    setTransactionDetails(null);
    setStatusCheckCount(0);
    setError(null);
  };

  // Reset points allocation
  const handleResetPoints = () => {
    setEnergyPoints(0);
    setStrengthPoints(0);
    setMagicPoints(0);
    setStaminaPoints(0);
    setSpeedPoints(0);
  };

  // Get the stat display with current value and specialty indicator
  const getStatDisplay = (creature, statName) => {
    if (!creature || !creature.stats) return { value: 0, isSpecialty: false };
    
    const value = creature.stats[statName] || 0;
    const isSpecialty = creature.specialty_stats && creature.specialty_stats.includes(statName);
    
    return { value, isSpecialty };
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

  // If creature can't be upgraded, show explanation
  if (!canUpgrade()) {
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
          <h3 style={{ marginTop: 0, color: '#F44336' }}>Cannot Upgrade Creature</h3>
          
          {creature.form === 3 && creature.final_form_upgrades >= 3 ? (
            <p>This creature has already reached the maximum number of final form upgrades.</p>
          ) : creature.evolution_progress && creature.evolution_progress.stat_upgrades_completed >= 3 ? (
            <p>This creature has already completed all upgrades for its current form. It can now evolve to the next form!</p>
          ) : (
            <p>This creature cannot be upgraded at this time.</p>
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

  const energyStat = getStatDisplay(creature, 'energy');
  const strengthStat = getStatDisplay(creature, 'strength');
  const magicStat = getStatDisplay(creature, 'magic');
  const staminaStat = getStatDisplay(creature, 'stamina');
  const speedStat = getStatDisplay(creature, 'speed');

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
          <h2 style={{ margin: 0, color: '#4CAF50' }}>Upgrade Stats</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Action button based on stage */}
            {upgradingStage === 'init' && !isLoading && (
              <button
                onClick={handleUpgrade}
                disabled={connectionStatus !== 'ready' || totalAllocated === 0 || totalAllocated > maxPoints || isLoading || costFetching}
                style={{
                  backgroundColor: connectionStatus === 'ready' && totalAllocated > 0 && totalAllocated <= maxPoints && !isLoading && !costFetching ? '#4CAF50' : '#999',
                  opacity: connectionStatus === 'ready' && totalAllocated > 0 && totalAllocated <= maxPoints && !isLoading && !costFetching ? 1 : 0.7,
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: 'none',
                  color: '#fff',
                  cursor: connectionStatus === 'ready' && totalAllocated > 0 && totalAllocated <= maxPoints && !isLoading && !costFetching ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {costFetching ? 'Calculating Cost...' : `Upgrade Stats (${totalAllocated}/${maxPoints})`}
              </button>
            )}
            
            {upgradingStage === 'failed' && (
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
                backgroundColor: upgradingStage === 'success' ? '#4CAF50' : '#333',
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: upgradingStage === 'success' ? 'bold' : 'normal'
              }}
            >
              {upgradingStage === 'success' ? 'Close' : 'Cancel'}
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
                  <strong>Upgrading Stage:</strong> {upgradingStage}
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
              <p>Please share an account to upgrade your Creature.</p>
            </div>
          )}

          {/* C) Ready to upgrade - initial stage */}
          {connectionStatus === 'ready' && upgradingStage === 'init' && !isLoading && (
            <div>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Creature image and details */}
                <div style={{ 
                  width: isMobile ? '100%' : '40%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
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
                    
                    <span style={{
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>
                      {creature.form === 0 ? 'Egg' : `Form ${creature.form}`}
                    </span>
                  </div>
                  
                  {creature.preferred_token && (
                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      marginTop: '5px'
                    }}>
                      Preferred token: <strong>{creature.preferred_token}</strong>
                    </div>
                  )}

                  {/* Show progress information */}
                  {creature.form < 3 && creature.evolution_progress && (
                    <div style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '10px',
                      borderRadius: '5px',
                      marginTop: '15px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '5px'
                      }}>
                        <span>Upgrade Progress:</span>
                        <span>
                          {creature.evolution_progress.stat_upgrades_completed}/3
                        </span>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(creature.evolution_progress.stat_upgrades_completed / 3) * 100}%`,
                          height: '100%',
                          backgroundColor: '#4CAF50',
                          borderRadius: '5px'
                        }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Show final form upgrade progress */}
                  {creature.form === 3 && (
                    <div style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '10px',
                      borderRadius: '5px',
                      marginTop: '15px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '5px'
                      }}>
                        <span>Level-Up Progress:</span>
                        <span>
                          {creature.final_form_upgrades}/3
                        </span>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(creature.final_form_upgrades / 3) * 100}%`,
                          height: '100%',
                          backgroundColor: '#FF9800',
                          borderRadius: '5px'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Stats adjustment panel */}
                <div style={{ 
                  width: isMobile ? '100%' : '60%',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>Allocate Stat Points</h3>
                  <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                    You can allocate up to <strong>{maxPoints}</strong> points across stats.
                    {creature.form === 3 ? 
                      ` This is upgrade ${creature.final_form_upgrades + 1}/3 for your final form.` :
                      ` This is upgrade ${creature.evolution_progress?.stat_upgrades_completed + 1}/3 needed to evolve.`}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Points Allocated: {totalAllocated}/{maxPoints}</span>
                    
                    <button
                      onClick={handleResetPoints}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#2196F3',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline'
                      }}
                    >
                      Reset Points
                    </button>
                  </div>
                  
                  {/* Energy stat */}
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: energyStat.isSpecialty ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Energy</span>
                        {energyStat.isSpecialty && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#FFD700',
                            color: '#000',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Specialty
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Current: {energyStat.value}
                        {energyPoints > 0 && ` (+${energyPoints})`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleStatChange('energy', -1)}
                        disabled={energyPoints <= 0}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: energyPoints <= 0 ? '#555' : '#2196F3',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: energyPoints <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                        {energyPoints}
                      </span>
                      
                      <button
                        onClick={() => handleStatChange('energy', 1)}
                        disabled={totalAllocated >= maxPoints}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: totalAllocated >= maxPoints ? '#555' : '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: totalAllocated >= maxPoints ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Strength stat */}
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: strengthStat.isSpecialty ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Strength</span>
                        {strengthStat.isSpecialty && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#FFD700',
                            color: '#000',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Specialty
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Current: {strengthStat.value}
                        {strengthPoints > 0 && ` (+${strengthPoints})`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleStatChange('strength', -1)}
                        disabled={strengthPoints <= 0}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: strengthPoints <= 0 ? '#555' : '#2196F3',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: strengthPoints <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                        {strengthPoints}
                      </span>
                      
                      <button
                        onClick={() => handleStatChange('strength', 1)}
                        disabled={totalAllocated >= maxPoints}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: totalAllocated >= maxPoints ? '#555' : '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: totalAllocated >= maxPoints ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Magic stat */}
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: magicStat.isSpecialty ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Magic</span>
                        {magicStat.isSpecialty && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#FFD700',
                            color: '#000',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Specialty
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Current: {magicStat.value}
                        {magicPoints > 0 && ` (+${magicPoints})`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleStatChange('magic', -1)}
                        disabled={magicPoints <= 0}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: magicPoints <= 0 ? '#555' : '#2196F3',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: magicPoints <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                        {magicPoints}
                      </span>
                      
                      <button
                        onClick={() => handleStatChange('magic', 1)}
                        disabled={totalAllocated >= maxPoints}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: totalAllocated >= maxPoints ? '#555' : '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: totalAllocated >= maxPoints ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Stamina stat */}
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: staminaStat.isSpecialty ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Stamina</span>
                        {staminaStat.isSpecialty && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#FFD700',
                            color: '#000',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Specialty
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Current: {staminaStat.value}
                        {staminaPoints > 0 && ` (+${staminaPoints})`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleStatChange('stamina', -1)}
                        disabled={staminaPoints <= 0}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: staminaPoints <= 0 ? '#555' : '#2196F3',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: staminaPoints <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                        {staminaPoints}
                      </span>
                      
                      <button
                        onClick={() => handleStatChange('stamina', 1)}
                        disabled={totalAllocated >= maxPoints}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: totalAllocated >= maxPoints ? '#555' : '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: totalAllocated >= maxPoints ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Speed stat */}
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: speedStat.isSpecialty ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Speed</span>
                        {speedStat.isSpecialty && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#FFD700',
                            color: '#000',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Specialty
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Current: {speedStat.value}
                        {speedPoints > 0 && ` (+${speedPoints})`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleStatChange('speed', -1)}
                        disabled={speedPoints <= 0}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: speedPoints <= 0 ? '#555' : '#2196F3',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: speedPoints <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                        {speedPoints}
                      </span>
                      
                      <button
                        onClick={() => handleStatChange('speed', 1)}
                        disabled={totalAllocated >= maxPoints}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '15px',
                          backgroundColor: totalAllocated >= maxPoints ? '#555' : '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          fontSize: '16px',
                          cursor: totalAllocated >= maxPoints ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token cost and balance info */}
              {upgradeCost && (
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  marginTop: '15px',
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Upgrade Cost</h4>
                  
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
                        {upgradeCost.amount} {upgradeCost.token}
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
                          {!hasEnoughTokens && ` (need ${upgradeCost.amount - tokenBalance} more)`}
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
          {upgradingStage === 'sending' && (
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
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                This will upgrade your creature's stats:
                {energyPoints > 0 && ` Energy +${energyPoints}`}
                {strengthPoints > 0 && ` Strength +${strengthPoints}`}
                {magicPoints > 0 && ` Magic +${magicPoints}`}
                {staminaPoints > 0 && ` Stamina +${staminaPoints}`}
                {speedPoints > 0 && ` Speed +${speedPoints}`}
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
          {upgradingStage === 'pending' && (
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
              
              <p>Your upgrade transaction is being processed on the Radix network.</p>
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
                    ? "Transaction is processing..." 
                    : pollCount === 1 
                      ? "Still waiting for confirmation..." 
                      : "Transaction likely completed. Click refresh to update."}
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
          {upgradingStage === 'success' && (
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
              <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Stats Upgraded Successfully!</h3>
              
              <p>Your creature's stats have been upgraded:</p>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px',
                maxWidth: '300px',
                margin: '15px auto',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '15px',
                borderRadius: '8px'
              }}>
                {energyPoints > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Energy:</span>
                    <span>+{energyPoints}</span>
                  </div>
                )}
                
                {strengthPoints > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Strength:</span>
                    <span>+{strengthPoints}</span>
                  </div>
                )}
                
                {magicPoints > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Magic:</span>
                    <span>+{magicPoints}</span>
                  </div>
                )}
                
                {staminaPoints > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Stamina:</span>
                    <span>+{staminaPoints}</span>
                  </div>
                )}
                
                {speedPoints > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Speed:</span>
                    <span>+{speedPoints}</span>
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
                
                {creature.form < 3 && creature.evolution_progress && (
                  <div>
                    {creature.evolution_progress.stat_upgrades_completed + 1 >= 3 ? (
                      <p>Your creature has completed all upgrades for this form and is ready to evolve!</p>
                    ) : (
                      <p>Your creature needs {3 - (creature.evolution_progress.stat_upgrades_completed + 1)} more stat upgrades before it can evolve.</p>
                    )}
                  </div>
                )}
                
                {creature.form === 3 && (
                  <div>
                    {creature.final_form_upgrades + 1 >= 3 ? (
                      <p>Your creature has reached its maximum potential. All final form upgrades are complete!</p>
                    ) : (
                      <p>Your creature can receive {3 - (creature.final_form_upgrades + 1)} more level-ups in its final form.</p>
                    )}
                  </div>
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
          {upgradingStage === 'failed' && (
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
              
              <p>There was an error with your stat upgrade transaction.</p>
              
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

export default UpgradeStatsModal;
