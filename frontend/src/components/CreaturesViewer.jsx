// src/components/CreaturesViewer.jsx
import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';
import UpgradeStatsModal from './UpgradeStatsModal';
import EvolveModal from './EvolveModal';
import ItemsViewer from './ItemsViewer';

const CreaturesViewer = ({ onClose }) => {
  // Game context
  const {
    isMobile,
    formatResource,
    addNotification
  } = useContext(GameContext);

  // From the RadixConnect context
  const {
    connected,
    accounts,
    updateAccountSharing
  } = useRadixConnect();

  // Component states
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [creatures, setCreatures] = useState([]);
  const [selectedCreatureId, setSelectedCreatureId] = useState(null);
  const [error, setError] = useState(null);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [loadingCount, setLoadingCount] = useState(0);
  const [lastSuccessfulCreatures, setLastSuccessfulCreatures] = useState([]);
  const loadLockRef = useRef(false);
  
  // Stats details modal state
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [detailedCreature, setDetailedCreature] = useState(null);

  // Upgrade modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [creatureToUpgrade, setCreatureToUpgrade] = useState(null);

  // Evolution modal states
  const [showEvolveModal, setShowEvolveModal] = useState(false);
  const [creatureToEvolve, setCreatureToEvolve] = useState(null);
  
  // Items viewer modal state
  const [showItemsViewer, setShowItemsViewer] = useState(false);

  // Load creatures from the API
  const loadCreatures = useCallback(async (force = false) => {
    if (!connected || !accounts || accounts.length === 0) return;
    
    // Implement a lock to prevent concurrent loads
    if (loadLockRef.current && !force) {
      console.log("Load creatures locked - skipping duplicate request");
      return;
    }
    
    // Add rate limiting - prevent loading more than once every 3 seconds
    const now = Date.now();
    if (!force && now - lastLoadTime < 3000 && creatures.length > 0) {
      console.log("Rate limiting creatures load - too soon since last load");
      return;
    }
    
    // Activate lock
    loadLockRef.current = true;
    
    // Increment loading count so UI knows we're making a request
    setLoadingCount(prev => prev + 1);
    setIsLoading(true);
    setError(null);
    setLastLoadTime(now);
    
    try {
      const accountAddress = accounts[0].address;
      
      // Try to get cached creatures first if we have empty results
      const cachedCreatures = localStorage.getItem(`creatures_${accountAddress}`);
      let parsedCache = null;
      
      if (cachedCreatures) {
        try {
          parsedCache = JSON.parse(cachedCreatures);
          // Check if cache is fresh (less than 5 minutes old)
          const cacheAge = now - (parsedCache.timestamp || 0);
          if (cacheAge > 5 * 60 * 1000) {
            console.log("Cache expired, fetching fresh data");
            parsedCache = null;
          }
        } catch (e) {
          console.error("Error parsing cached creatures:", e);
        }
      }
      
      // Use our API endpoint to get all user creatures
      const response = await fetch('/api/getUserCreatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accountAddress
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Creatures data:", data);
      
      if (data.creatures && Array.isArray(data.creatures) && data.creatures.length > 0) {
        // Update cache with fresh data
        localStorage.setItem(`creatures_${accountAddress}`, JSON.stringify({
          creatures: data.creatures,
          timestamp: Date.now()
        }));
        
        setCreatures(data.creatures);
        setLastSuccessfulCreatures(data.creatures);
        
        // If we have creatures, select the first one by default if none selected
        if (data.creatures.length > 0 && !selectedCreatureId) {
          setSelectedCreatureId(data.creatures[0].id);
        }
      } else if (data.creatures && Array.isArray(data.creatures) && data.creatures.length === 0) {
        // Empty array returned
        if (creatures.length > 0) {
          console.log("Received empty creatures array but keeping existing data");
        } else if (parsedCache && parsedCache.creatures && parsedCache.creatures.length > 0) {
          // Use cached data as fallback
          console.log("Using cached creatures data as fallback");
          setCreatures(parsedCache.creatures);
          if (!selectedCreatureId && parsedCache.creatures.length > 0) {
            setSelectedCreatureId(parsedCache.creatures[0].id);
          }
        } else {
          // No existing data, no cache, empty response
          setCreatures([]);
        }
      }
      
      // Show refresh button after first load
      setShowRefreshButton(true);
    } catch (error) {
      console.error("Error loading creatures:", error);
      setError(`Failed to load creatures: ${error.message}`);
      
      // Try to use cached data on error
      try {
        const accountAddress = accounts[0].address;
        const cachedCreatures = localStorage.getItem(`creatures_${accountAddress}`);
        if (cachedCreatures) {
          const parsedCache = JSON.parse(cachedCreatures);
          if (parsedCache.creatures && parsedCache.creatures.length > 0) {
            console.log("Using cached creatures data on API error");
            if (creatures.length === 0) {
              setCreatures(parsedCache.creatures);
              if (!selectedCreatureId && parsedCache.creatures.length > 0) {
                setSelectedCreatureId(parsedCache.creatures[0].id);
              }
            }
          }
        } else if (lastSuccessfulCreatures.length > 0) {
          // Fallback to the last successful load
          setCreatures(lastSuccessfulCreatures);
        }
      } catch (cacheError) {
        console.error("Error using cached creatures:", cacheError);
      }
    } finally {
      setIsLoading(false);
      setLoadingCount(prev => prev - 1);
      // Release lock after a short delay to prevent immediate subsequent requests
      setTimeout(() => {
        loadLockRef.current = false;
      }, 500);
    }
  }, [connected, accounts, lastLoadTime, creatures, selectedCreatureId, lastSuccessfulCreatures]);

  // Check connection status
  useEffect(() => {
    if (!connected) {
      setConnectionStatus('disconnected');
      setIsLoading(false);
    } else if (!accounts || accounts.length === 0) {
      setConnectionStatus('connected-no-accounts');
      setIsLoading(false);
    } else {
      setConnectionStatus('ready');
      // Only load creatures if we have an account
      loadCreatures();
    }
  }, [connected, accounts, loadCreatures]);

  // Function to open the upgrade modal with the selected creature
  const handleUpgradeStats = (creature) => {
    setCreatureToUpgrade(creature);
    setShowUpgradeModal(true);
  };

  // Function to handle successful upgrades
  const handleUpgradeSuccess = useCallback((updatedCreature) => {
    // Prevent duplicate notifications by checking timing
    const now = Date.now();
    const lastNotificationTime = parseInt(localStorage.getItem('last_upgrade_notification') || '0');
    
    if (now - lastNotificationTime > 2000) {
      // Store the notification time
      localStorage.setItem('last_upgrade_notification', now.toString());
      
      // Show success notification with unique ID to prevent duplicates
      const notificationId = "upgrade-success-" + now;
      addNotification?.('Creature upgraded successfully!', 400, 300, '#4CAF50', notificationId);
    }
    
    // If we have an updated creature directly, use it
    if (updatedCreature) {
      // Update the creature in the local state instead of reloading everything
      setCreatures(prevCreatures => {
        const newCreatures = prevCreatures.map(c => 
          c.id === updatedCreature.id ? updatedCreature : c
        );
        
        // Also update cache
        if (accounts && accounts.length > 0) {
          const accountAddress = accounts[0].address;
          localStorage.setItem(`creatures_${accountAddress}`, JSON.stringify({
            creatures: newCreatures,
            timestamp: Date.now()
          }));
        }
        
        return newCreatures;
      });
    } else {
      // If no direct creature data, reload immediately
      // MODIFIED: Changed from delayed reload to immediate reload for consistency
      console.log("No updated creature data - forcing immediate reload");
      loadCreatures(true); // Force reload
    }
  }, [accounts, addNotification, loadCreatures]);

  // Function to handle evolution
  const handleEvolveCreature = (creature) => {
    setCreatureToEvolve(creature);
    setShowEvolveModal(true);
  };

  // Function to handle successful evolution
  const handleEvolveSuccess = useCallback((updatedCreature) => {
    // Prevent duplicate notifications by checking timing
    const now = Date.now();
    const lastNotificationTime = parseInt(localStorage.getItem('last_evolve_notification') || '0');
    
    if (now - lastNotificationTime > 2000) {
      // Store the notification time
      localStorage.setItem('last_evolve_notification', now.toString());
      
      // Show success notification with unique ID to prevent duplicates
      const notificationId = "evolve-success-" + now;
      addNotification?.('Creature evolved successfully!', 400, 300, '#FF9800', notificationId);
    }
    
    // If we have an updated creature directly, use it
    if (updatedCreature) {
      // Update the creature in the local state instead of reloading everything
      setCreatures(prevCreatures => {
        const newCreatures = prevCreatures.map(c => 
          c.id === updatedCreature.id ? updatedCreature : c
        );
        
        // Also update cache
        if (accounts && accounts.length > 0) {
          const accountAddress = accounts[0].address;
          localStorage.setItem(`creatures_${accountAddress}`, JSON.stringify({
            creatures: newCreatures,
            timestamp: Date.now()
          }));
        }
        
        return newCreatures;
      });
    } else {
      // No direct creature data - IMMEDIATELY reload creatures
      console.log("No updated creature data - forcing immediate reload");
      loadCreatures(true); // Force reload
    }
  }, [accounts, addNotification, loadCreatures]);

  // Use useEffect to setup periodic refresh attempts after failed loads
  useEffect(() => {
    // If we have an error and no creatures, try to reload periodically
    if (error && creatures.length === 0 && connected && accounts?.length > 0) {
      console.log("Setting up recovery reload timer");
      const recoveryTimeout = setTimeout(() => {
        console.log("Attempting recovery reload");
        loadCreatures();
      }, 8000); // Try every 8 seconds
      
      return () => clearTimeout(recoveryTimeout);
    }
  }, [error, creatures, connected, accounts, loadCreatures]);

  // Cancel any pending timeouts when unmounting
  useEffect(() => {
    return () => {
      if (window._lastUpgradeTimeout) {
        clearTimeout(window._lastUpgradeTimeout);
      }
      if (window._lastEvolveTimeout) {
        clearTimeout(window._lastEvolveTimeout);
      }
    };
  }, []);

  // Handler for viewing detailed stats
  const handleViewStatsDetail = (creature) => {
    setDetailedCreature(creature);
    setShowStatsDetail(true);
  };

  // Handler for closing stats detail modal
  const handleCloseStatsDetail = () => {
    setShowStatsDetail(false);
    setDetailedCreature(null);
  };

  // Toggle connection details panel
  const toggleConnectionDetails = () => {
    setShowConnectionDetails(prev => !prev);
  };

  // Get selected creature data
  const selectedCreature = creatures.find(c => c.id === selectedCreatureId) || null;

  // Get rarity color for display
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Legendary':
        return '#FFD700'; // Gold
      case 'Epic':
        return '#9C27B0'; // Purple
      case 'Rare':
        return '#2196F3'; // Blue
      default:
        return '#4CAF50'; // Green for Common
    }
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
  
  // Determine if evolution is possible based on stat upgrades
  const canEvolve = (creature) => {
    if (!creature || !creature.evolution_progress) return false;
    if (creature.form >= 3) return false; // Can't evolve past form 3
    
    // Need 3 stat upgrades to evolve
    return creature.evolution_progress.stat_upgrades_completed >= 3;
  };
  
  // Determine if stats can be upgraded
  const canUpgradeStats = (creature) => {
    if (!creature) return false;
    
    // For form 3 creatures, check final_form_upgrades
    if (creature.form === 3) {
      return creature.final_form_upgrades < 3;
    }
    
    // For other forms, check if we've done fewer than 3 upgrades
    if (creature.evolution_progress) {
      return creature.evolution_progress.stat_upgrades_completed < 3;
    }
    
    return false;
  };
  
  // Function to generate stats display for a creature
  const renderStatsTable = (creature) => {
    if (!creature || !creature.stats) return null;
    
    const stats = creature.stats;
    const specialtyStats = creature.specialty_stats || [];
    
    // Format for display
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        margin: '10px 0'
      }}>
        {Object.entries(stats).map(([stat, value]) => (
          <div 
            key={stat} 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '5px 10px',
              backgroundColor: specialtyStats.includes(stat) ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.2)',
              borderRadius: '5px',
              fontWeight: specialtyStats.includes(stat) ? 'bold' : 'normal'
            }}
          >
            <span style={{ textTransform: 'capitalize' }}>{stat}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    );
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
          maxWidth: '900px',
          width: isMobile ? '95%' : '90%',
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
          <h2 style={{ margin: 0, color: '#4CAF50' }}>Your Evolving Creatures</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Button to view tools and spells */}
            <button
              onClick={() => setShowItemsViewer(true)}
              style={{
                backgroundColor: '#9C27B0',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span role="img" aria-label="magic">✨</span> View Tools & Spells
            </button>
            
            {/* Refresh button */}
            {showRefreshButton && (
              <button
                onClick={() => loadCreatures(true)} // Force refresh
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#555' : '#2196F3',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: 'none',
                  color: '#fff',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
                {isLoading && (
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid #fff',
                      borderTop: '2px solid transparent',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                )}
              </button>
            )}
            
            {/* Close button */}
            <button 
              onClick={onClose}
              style={{
                backgroundColor: '#333',
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Close
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
              <p>Please connect your Radix wallet using the top-right button to view your creatures.</p>
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
              <p>Please share an account to view your Evolving Creatures.</p>
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

          {/* C) Loading state */}
          {isLoading && connectionStatus === 'ready' && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              padding: '40px',
              gap: '20px'
            }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '4px solid #4CAF50',
                  borderTop: '4px solid transparent',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <p>Loading your Evolving Creatures...</p>
              
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* D) Error state */}
          {error && !isLoading && (
            <div style={{
              background: 'rgba(244, 67, 54, 0.2)',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              color: '#F44336'
            }}>
              <p><strong>Error loading creatures</strong></p>
              <p>{error}</p>
              <button
                onClick={() => loadCreatures(true)} // Force refresh on error
                style={{
                  backgroundColor: '#F44336',
                  color: 'white',
                  marginTop: '10px'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* E) No creatures found */}
          {!isLoading && !error && connectionStatus === 'ready' && creatures.length === 0 && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.2)',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#FFC107', marginBottom: '15px' }}>No Creatures Found</h3>
              <p>You don't have any Evolving Creatures NFTs in your account yet.</p>
              <button
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  marginTop: '20px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onClose();
                  // This should trigger the evolving creature minter
                  document.querySelector('.creature-mint-button')?.click();
                }}
              >
                Mint Your First Creature
              </button>
            </div>
          )}

          {/* F) Creatures list and details view */}
          {!isLoading && !error && connectionStatus === 'ready' && creatures.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '20px'
            }}>
              {/* Left panel - Creature thumbnails */}
              <div style={{
                width: isMobile ? '100%' : '30%',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '15px',
                overflowY: 'auto',
                maxHeight: isMobile ? '150px' : '500px',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                gap: '10px',
                flexWrap: isMobile ? 'nowrap' : 'normal',
                overflow: isMobile ? 'auto hidden' : 'auto'
              }}>
                {creatures.map(creature => (
                  <div
                    key={creature.id}
                    style={{
                      backgroundColor: selectedCreatureId === creature.id ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: `1px solid ${selectedCreatureId === creature.id ? '#4CAF50' : 'transparent'}`,
                      minWidth: isMobile ? '150px' : 'auto'
                    }}
                    onClick={() => setSelectedCreatureId(creature.id)}
                  >
                    <img
                      src={creature.image_url || 'https://cvxlab.net/assets/evolving_creatures/bullx_egg.png'}
                      alt={creature.species_name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <p style={{ 
                        margin: '0 0 4px 0', 
                        fontWeight: 'bold',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px'
                      }}>
                        {creature.species_name}
                      </p>
                      <div style={{ 
                        display: 'flex',
                        gap: '5px',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          backgroundColor: getRarityColor(creature.rarity),
                          padding: '2px 6px',
                          borderRadius: '3px',
                          color: '#000',
                          fontWeight: 'bold'
                        }}>
                          {creature.rarity}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          color: '#fff'
                        }}>
                          {getFormDescription(creature.form)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Right panel - Selected creature details */}
              <div style={{
                width: isMobile ? '100%' : '70%',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '15px'
              }}>
                {selectedCreature ? (
                  <div>
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '20px',
                      alignItems: isMobile ? 'center' : 'flex-start'
                    }}>
                      {/* Creature image */}
                      <div style={{
                        position: 'relative',
                        width: isMobile ? '180px' : '220px',
                        height: isMobile ? '180px' : '220px'
                      }}>
                        <img
                          src={selectedCreature.image_url || 'https://cvxlab.net/assets/evolving_creatures/bullx_egg.png'}
                          alt={selectedCreature.species_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `2px solid ${getRarityColor(selectedCreature.rarity)}`
                          }}
                        />
                        
                        {/* Form badge */}
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {getFormDescription(selectedCreature.form)}
                        </div>
                        
                        {/* Rarity badge */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: getRarityColor(selectedCreature.rarity),
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#000'
                        }}>
                          {selectedCreature.rarity}
                        </div>
                        
                        {/* Combination level badge - if applicable */}
                        {selectedCreature.combination_level > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#FF5722',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            Fusion {selectedCreature.combination_level}
                          </div>
                        )}
                      </div>
                      
                      {/* Creature info */}
                      <div style={{
                        flex: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        alignItems: isMobile ? 'center' : 'flex-start',
                        textAlign: isMobile ? 'center' : 'left'
                      }}>
                        <h3 style={{ 
                          margin: '0', 
                          color: getRarityColor(selectedCreature.rarity)
                        }}>
                          {selectedCreature.species_name}
                        </h3>
                        
                        {/* Evolution progress - for forms 0-2 */}
                        {selectedCreature.form < 3 && selectedCreature.evolution_progress && (
                          <div style={{
                            width: '100%',
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
                              <span>
                                {selectedCreature.evolution_progress.stat_upgrades_completed}/3
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
                                width: `${(selectedCreature.evolution_progress.stat_upgrades_completed / 3) * 100}%`,
                                height: '100%',
                                backgroundColor: '#4CAF50',
                                borderRadius: '5px'
                              }} />
                            </div>
                            
                            {canEvolve(selectedCreature) && (
                              <div style={{
                                marginTop: '10px',
                                color: '#4CAF50',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}>
                                Ready to evolve!
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Final form upgrades - for form 3 */}
                        {selectedCreature.form === 3 && (
                          <div style={{
                            width: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            padding: '10px',
                            borderRadius: '5px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '5px'
                            }}>
                              <span>Level-up Progress:</span>
                              <span>
                                {selectedCreature.final_form_upgrades}/3
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
                                width: `${(selectedCreature.final_form_upgrades / 3) * 100}%`,
                                height: '100%',
                                backgroundColor: '#FF9800',
                                borderRadius: '5px'
                              }} />
                            </div>
                            
                            {selectedCreature.final_form_upgrades >= 3 && (
                              <div style={{
                                marginTop: '10px',
                                color: '#FFD700',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}>
                                Maximum level reached!
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '10px',
                          marginTop: '10px',
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          width: '100%'
                        }}>
                          {/* View Stats button */}
                          <button
                            onClick={() => handleViewStatsDetail(selectedCreature)}
                            style={{
                              backgroundColor: '#2196F3',
                              color: 'white',
                              padding: '8px 15px',
                              borderRadius: '5px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span role="img" aria-label="stats">📊</span>
                            View Stats
                          </button>
                          
                          {/* Upgrade Stats button - if applicable */}
                          {canUpgradeStats(selectedCreature) && (
                            <button
                              style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                padding: '8px 15px',
                                borderRadius: '5px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onClick={() => handleUpgradeStats(selectedCreature)}
                            >
                              <span role="img" aria-label="upgrade">⬆️</span>
                              Upgrade Stats
                            </button>
                          )}
                          
                          {/* Evolve button - if ready */}
                          {canEvolve(selectedCreature) && (
                            <button
                              style={{
                                backgroundColor: '#FF9800',
                                color: 'white',
                                padding: '8px 15px',
                                borderRadius: '5px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onClick={() => handleEvolveCreature(selectedCreature)}
                            >
                              <span role="img" aria-label="evolve">✨</span>
                              Evolve
                            </button>
                          )}
                        </div>
                        
                        {/* Preferred token payment info */}
                        {selectedCreature.preferred_token && (
                          <div style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            marginTop: '5px',
                            display: 'inline-block'
                          }}>
                            Preferred token: <strong>{selectedCreature.preferred_token}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats preview */}
                    <div style={{
                      marginTop: '20px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '15px',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ margin: '0 0 10px 0' }}>Stats Summary</h3>
                      {renderStatsTable(selectedCreature)}
                      
                      <div style={{
                        marginTop: '10px',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => handleViewStatsDetail(selectedCreature)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#2196F3',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          View Detailed Stats
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px'
                  }}>
                    <p>No creature selected. Please select a creature from the list.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Detail Modal */}
      {showStatsDetail && detailedCreature && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(5px)',
              zIndex: 10000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={handleCloseStatsDetail}
          />
          
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#222',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 5px 25px rgba(0, 0, 0, 0.7)',
              zIndex: 10001,
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #444',
              paddingBottom: '10px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: getRarityColor(detailedCreature.rarity)
              }}>
                {detailedCreature.species_name} Stats
              </h3>
              
              <button
                onClick={handleCloseStatsDetail}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {/* Creature image thumbnail */}
              <img
                src={detailedCreature.image_url}
                alt={detailedCreature.species_name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '5px',
                  objectFit: 'cover',
                  border: `2px solid ${getRarityColor(detailedCreature.rarity)}`
                }}
              />
              
              <div>
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: getRarityColor(detailedCreature.rarity),
                    padding: '3px 8px',
                    borderRadius: '3px',
                    color: '#000',
                    fontWeight: 'bold'
                  }}>
                    {detailedCreature.rarity}
                  </span>
                  
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '3px'
                  }}>
                    {getFormDescription(detailedCreature.form)}
                  </span>
                  
                  {detailedCreature.combination_level > 0 && (
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#FF5722',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontWeight: 'bold'
                    }}>
                      Fusion {detailedCreature.combination_level}
                    </span>
                  )}
                </div>
                
                <p style={{ 
                  margin: '5px 0 0 0',
                  fontSize: '12px',
                  opacity: 0.7 
                }}>
                  ID: {detailedCreature.id.slice(0, 8)}...{detailedCreature.id.slice(-8)}
                </p>
              </div>
            </div>
            
            {/* Basic Stats */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Base Stats</h4>
              
              {detailedCreature.stats && Object.entries(detailedCreature.stats).map(([stat, value]) => {
                const isSpecialty = detailedCreature.specialty_stats?.includes(stat);
                return (
                  <div 
                    key={stat}
                    style={{
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px'
                    }}>
                      <span style={{ 
                        textTransform: 'capitalize',
                        fontWeight: isSpecialty ? 'bold' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {stat}
                        {isSpecialty && (
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
                      </span>
                      <span>{value}</span>
                    </div>
                    
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(value / 25) * 100}%`, // Assuming 25 is max possible stat value
                        height: '100%',
                        backgroundColor: isSpecialty ? '#FFD700' : '#2196F3',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Evolution Progress */}
            {detailedCreature.form < 3 && detailedCreature.evolution_progress && (
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Evolution Progress</h4>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span>Stat Upgrades:</span>
                  <span>{detailedCreature.evolution_progress.stat_upgrades_completed}/3</span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: `${(detailedCreature.evolution_progress.stat_upgrades_completed / 3) * 100}%`,
                    height: '100%',
                    backgroundColor: '#4CAF50',
                    borderRadius: '5px'
                  }} />
                </div>
                
                <h5 style={{ margin: '0 0 5px 0' }}>Points Allocated:</h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '5px'
                }}>
                  {Object.entries(detailedCreature.evolution_progress)
                    .filter(([key]) => key.includes('_allocated') && key !== 'total_points_allocated')
                    .map(([key, value]) => (
                      <div 
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '5px 10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '5px'
                        }}
                      >
                        <span style={{ textTransform: 'capitalize' }}>
                          {key.replace('_allocated', '')}:
                        </span>
                        <span>{value}</span>
                      </div>
                    ))
                  }
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '5px',
                  marginTop: '5px',
                  fontWeight: 'bold'
                }}>
                  <span>Total Points:</span>
                  <span>{detailedCreature.evolution_progress.total_points_allocated}</span>
                </div>
                
                {canEvolve(detailedCreature) && (
                  <div style={{
                    marginTop: '15px',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    padding: '10px',
                    borderRadius: '5px',
                    textAlign: 'center',
                    color: '#4CAF50',
                    fontWeight: 'bold'
                  }}>
                    This creature is ready to evolve to {getFormDescription(detailedCreature.form + 1)}!
                  </div>
                )}
              </div>
            )}
            
            {/* Final Form Upgrades */}
            {detailedCreature.form === 3 && (
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Final Form Level-Ups</h4>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span>Level-Up Progress:</span>
                  <span>{detailedCreature.final_form_upgrades}/3</span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(detailedCreature.final_form_upgrades / 3) * 100}%`,
                    height: '100%',
                    backgroundColor: '#FF9800',
                    borderRadius: '5px'
                  }} />
                </div>
                
                {detailedCreature.final_form_upgrades >= 3 ? (
                  <div style={{
                    marginTop: '15px',
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    padding: '10px',
                    borderRadius: '5px',
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 'bold'
                  }}>
                    This creature has reached maximum level!
                  </div>
                ) : (
                  <div style={{
                    marginTop: '15px',
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    padding: '10px',
                    borderRadius: '5px',
                    textAlign: 'center'
                  }}>
                    {3 - detailedCreature.final_form_upgrades} level-ups remaining
                  </div>
                )}
              </div>
            )}
            
            {/* Bonus Stats */}
            {detailedCreature.bonus_stats && Object.keys(detailedCreature.bonus_stats).length > 0 && (
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Bonus Stats from Fusion</h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  {Object.entries(detailedCreature.bonus_stats).map(([stat, value]) => (
                    <div 
                      key={stat}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 10px',
                        backgroundColor: 'rgba(255, 87, 34, 0.2)',
                        borderRadius: '5px',
                        fontWeight: 'bold'
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{stat}:</span>
                      <span>+{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              justifyContent: 'center'
            }}>
              {canUpgradeStats(detailedCreature) && (
                <button
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onClick={() => {
                    handleCloseStatsDetail();
                    handleUpgradeStats(detailedCreature);
                  }}
                >
                  <span role="img" aria-label="upgrade">⬆️</span>
                  Upgrade Stats
                </button>
              )}
              
              {canEvolve(detailedCreature) && (
                <button
                  style={{
                    backgroundColor: '#FF9800',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onClick={() => {
                    handleCloseStatsDetail();
                    handleEvolveCreature(detailedCreature);
                  }}
                >
                  <span role="img" aria-label="evolve">✨</span>
                  Evolve
                </button>
              )}
              
              <button
                onClick={handleCloseStatsDetail}
                style={{
                  backgroundColor: '#333',
                  color: 'white',
                  padding: '8px 15px',
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
      )}
      
      {/* Upgrade Stats Modal */}
      {showUpgradeModal && creatureToUpgrade && (
        <UpgradeStatsModal 
          creature={creatureToUpgrade}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}
      
      {/* Evolution Modal */}
      {showEvolveModal && creatureToEvolve && (
        <EvolveModal 
          creature={creatureToEvolve}
          onClose={() => setShowEvolveModal(false)}
          onSuccess={handleEvolveSuccess}
        />
      )}
      
      {/* Items Viewer Modal */}
      {showItemsViewer && (
        <ItemsViewer onClose={() => setShowItemsViewer(false)} />
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default CreaturesViewer;
