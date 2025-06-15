// src/components/SidePanel.jsx
import { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';
import ViewCreaturesButton from './ViewCreaturesButton';
import CreaturesViewer from './CreaturesViewer';
import MoveMachines from './MoveMachines';
import FomoHitMinter from './FomoHitMinter';

const SidePanel = ({ isOpen }) => {
  const { 
    userName,
    tcorvax,
    catNips,
    energy,
    eggs,
    formatResource,
    isMobile,
    creatureNfts,
    setShowPvPMenu,
    setShowCreatureMinter,
    showBattleGame,
    setShowBattleGame,
    canBuildMachine,
    canAfford,
    calculateMachineCost,
    buildMachine,
    upgradeMachine,
    machineTypes,
    machines,
    player,
    setSelectedMachineToMove,
    getMachinesInCurrentRoom,
    selectedMachineToMove,
    setInMoveMode,
    inMoveMode,
    currentRoom,
    roomsUnlocked
  } = useContext(GameContext);
  
  const { connected } = useRadixConnect();
  
  // Add state for creatures viewer visibility
  const [showCreaturesViewer, setShowCreaturesViewer] = useState(false);
  
  // Machine Controls state
  const [activeSection, setActiveSection] = useState(null);
  const [showMinter, setShowMinter] = useState(false);
  const [selectedFomoHit, setSelectedFomoHit] = useState(null);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  
  // State for expanded panel
  const [expandedPanel, setExpandedPanel] = useState(false);

  // Update expanded panel state based on active section
  useEffect(() => {
    setExpandedPanel(activeSection !== null);
  }, [activeSection]);

  // Show instructions briefly when a machine is selected
  useEffect(() => {
    if (selectedMachineToMove) {
      setInstructionsVisible(true);
      const timer = setTimeout(() => {
        setInstructionsVisible(false);
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [selectedMachineToMove]);

  // Group machines by type for the upgrade section
  const machinesByType = machines.reduce((acc, machine) => {
    if (!acc[machine.type]) {
      acc[machine.type] = [];
    }
    acc[machine.type].push(machine);
    return acc;
  }, {});

  // Filter to show only machines in the current room for moving
  const currentRoomMachines = getMachinesInCurrentRoom();
  
  // Group current room machines by type
  const currentRoomMachinesByType = currentRoomMachines.reduce((acc, machine) => {
    if (!acc[machine.type]) {
      acc[machine.type] = [];
    }
    acc[machine.type].push(machine);
    return acc;
  }, {});

  // Toggle sections - only one section open at a time
  const toggleSection = (section) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  // Handle build machine
  const handleBuild = (type) => {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const buildX = playerCenterX + 20;
    const buildY = playerCenterY + 20;
    buildMachine(type, buildX, buildY);
  };

  // Handle upgrade machine
  const handleUpgrade = (machineId) => {
    upgradeMachine(machineId);
  };

  // Handle FOMO HIT NFT minting
  const handleFomoHitClick = (machine) => {
    if (machine.lastActivated === 0) {
      setSelectedFomoHit(machine);
      setShowMinter(true);
    }
  };
  
  // Handle Evolving Creatures minter
  const handleEvolvingCreaturesClick = () => {
    setShowCreatureMinter(true);
  };
  
  // Handle Battle game
  const handleBattleClick = () => {
    setShowBattleGame(true);
  };

  // Handle machine select for moving
  const handleMachineSelect = (machine) => {
    if (!machine || !machine.id) {
      console.error("Invalid machine object:", machine);
      return;
    }
    
    try {
      // If already in move mode with this machine, cancel the move
      if (selectedMachineToMove === machine.id && inMoveMode) {
        console.log("Canceling move for machine:", machine.id);
        setSelectedMachineToMove(null);
        setInMoveMode(false);
        return;
      }
      
      // Otherwise, start move mode with this machine
      console.log("Starting move mode for machine:", machine.id);
      setSelectedMachineToMove(machine.id);
      setInMoveMode(true);
      setInstructionsVisible(true);
    } catch (error) {
      console.error("Error in handleMachineSelect:", error);
    }
  };

  // Compact format for resource cost
  const formatCost = (cost) => {
    if (!cost) return "Free";
    
    return Object.entries(cost).map(([resource, amount]) => {
      const resourceIcon = resource === 'tcorvax' ? '💎' : 
                           resource === 'catNips' ? '🐱' : 
                           resource === 'energy' ? '⚡' : 
                           resource === 'eggs' ? '🥚' : '';
      return `${resourceIcon}${amount}`;
    }).join(' ');
  };

  // Get a text description of the machine
  const getMachineDescription = (machine) => {
    const type = machineTypes[machine.type];
    return `${type?.name || machine.type} (Level ${machine.level})`;
  };

  // Extremely compact resources display
  const CompactResources = () => (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      padding: '8px',
      background: 'rgba(0, 0, 0, 0.2)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        flex: '1 0 auto',
        minWidth: '70px',
        maxWidth: expandedPanel ? '120px' : '140px'
      }}>
        <span style={{marginRight: '5px'}}>💎</span>
        <span style={{fontWeight: 'bold'}}>{formatResource(tcorvax)}</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        flex: '1 0 auto',
        minWidth: '70px',
        maxWidth: expandedPanel ? '120px' : '140px'
      }}>
        <span style={{marginRight: '5px'}}>🐱</span>
        <span style={{fontWeight: 'bold'}}>{formatResource(catNips)}</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        flex: '1 0 auto',
        minWidth: '70px',
        maxWidth: expandedPanel ? '120px' : '140px'
      }}>
        <span style={{marginRight: '5px'}}>⚡</span>
        <span style={{fontWeight: 'bold'}}>{formatResource(energy)}</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        flex: '1 0 auto',
        minWidth: '70px',
        maxWidth: expandedPanel ? '120px' : '140px'
      }}>
        <span style={{marginRight: '5px'}}>🥚</span>
        <span style={{fontWeight: 'bold'}}>{formatResource(eggs)}</span>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`side-panel ${isOpen ? 'open' : ''}`}
        style={{
          position: isMobile ? 'fixed' : 'relative',
          width: isMobile ? '90vw' : expandedPanel ? '380px' : '300px', // Wider when expanded
          height: isMobile ? 'calc(100vh - 46px)' : '100vh',
          background: 'rgba(30, 30, 30, 0.95)',
          boxShadow: '0 0 15px rgba(76, 175, 80, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0 10px 10px 0',
          transition: 'all 0.3s ease',
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          zIndex: isMobile ? 9999 : 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          top: isMobile ? '46px' : 'auto',
          left: 0,
          padding: 0
        }}
      >
        {/* Compact header and resources */}
        <div style={{
          padding: expandedPanel ? '8px' : '10px',
          borderBottom: '2px solid rgba(76, 175, 80, 0.3)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: expandedPanel ? '5px' : '8px'
          }}>
            <h2 style={{
              color: '#4CAF50',
              fontSize: expandedPanel ? '1.2rem' : '1.5rem',
              margin: 0
            }}>Welcome, {userName}</h2>
          </div>
          
          {/* Ultra-compact resources */}
          <CompactResources />
        </div>

        {/* Only show creature buttons when no section is active on mobile */}
        {(!expandedPanel || !isMobile) && (
          <div style={{ 
            padding: '10px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleEvolvingCreaturesClick}
                style={{
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  flex: '1 0 auto',
                  maxWidth: '160px'
                }}
              >
                <span>🥚</span> Mint Creature
              </button>
              
              <button
                onClick={() => setShowCreaturesViewer(true)}
                style={{
                  backgroundColor: '#673AB7',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  flex: '1 0 auto',
                  maxWidth: '160px'
                }}
              >
                <span>👁️</span> View Creatures
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowPvPMenu(true)}
                disabled={!connected || !creatureNfts || creatureNfts.length === 0}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: connected && creatureNfts?.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  flex: '1 0 auto',
                  maxWidth: '160px',
                  opacity: connected && creatureNfts?.length > 0 ? 1 : 0.5
                }}
                title={!connected ? "Connect wallet first" : !creatureNfts?.length ? "You need creatures to battle" : "Start PvP Battle"}
              >
                <span>⚔️</span> PvP Battle
              </button>
              
              {creatureNfts && creatureNfts.length > 0 && (
                <button
                  onClick={handleBattleClick}
                  style={{
                    backgroundColor: '#FF5722',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    flex: '1 0 auto',
                    maxWidth: '160px'
                  }}
                >
                  <span>⚔️</span> Battle Arena
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* MACHINE CONTROLS */}
        <div style={{ 
          padding: expandedPanel ? '5px' : '10px', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: expandedPanel ? '5px' : '10px',
          overflowY: 'auto'
        }}>
          {!expandedPanel && (
            <h3 style={{
              color: '#4CAF50',
              fontSize: '16px',
              textAlign: 'center',
              marginBottom: '10px',
              borderBottom: '1px solid rgba(76, 175, 80, 0.3)',
              paddingBottom: '5px'
            }}>
              Machine Controls
            </h3>
          )}
          
          {/* BUILD MACHINES SECTION */}
          <div style={{
            marginBottom: '5px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: activeSection === 'build' ? '3px solid #4CAF50' : '2px solid #4CAF50',
            flex: activeSection === 'build' ? '1' : 'none',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: activeSection === 'build' ? '100%' : 'auto'
          }}>
            <button 
              onClick={() => toggleSection('build')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0 // Prevent button from shrinking
              }}
            >
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '20px'}}>🏭</span> Build Machines
              </span>
              <span>{activeSection === 'build' ? '▼' : '▶'}</span>
            </button>
            
            {activeSection === 'build' && (
              <div style={{
                padding: '15px',
                backgroundColor: '#1e1e1e',
                flex: 1,
                overflowY: 'auto', // Enable scrolling
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '0', // Important for flex containers to enable scrolling
                height: '100%' // Fill available space
              }}>
                {/* Back button for mobile */}
                {isMobile && (
                  <button
                    onClick={() => setActiveSection(null)}
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      flexShrink: 0 // Prevent from shrinking
                    }}
                  >
                    <span>◀</span> Back to Menu
                  </button>
                )}
                
                {Object.keys(machineTypes).map((type) => {
                  const cost = calculateMachineCost(type);
                  const canBuild = canBuildMachine(type);
                  const affordable = canAfford(cost);
                  const machineInfo = machineTypes[type];
                  const isThirdReactor = type === 'reactor' && (machines.filter(m => m.type === 'reactor').length === 2);
                  
                  return (
                    <div key={type} style={{
                      opacity: (!canBuild || !affordable) ? 0.6 : 1,
                      marginBottom: '10px',
                      flexShrink: 0 // Prevent items from shrinking
                    }}>
                      <button
                        onClick={() => handleBuild(type)}
                        disabled={!canBuild || !affordable}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: machineInfo.baseColor,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: (!canBuild || !affordable) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <span style={{fontSize: '20px'}}>{machineInfo.icon}</span>
                          <span>{machineInfo.name}</span>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {formatCost(cost)}
                        </div>
                      </button>
                      
                      {/* Requirements messages */}
                      {isThirdReactor && !canBuild && (
                        <div style={{
                          padding: '5px',
                          color: '#ff6b6b',
                          textAlign: 'center',
                          fontSize: '12px',
                          marginTop: '5px'
                        }}>
                          Requires Incubator & FOMO HIT
                        </div>
                      )}
                      
                      {!canBuild && !affordable && type === 'incubator' && (
                        <div style={{
                          padding: '5px',
                          color: '#ff6b6b',
                          textAlign: 'center',
                          fontSize: '12px',
                          marginTop: '5px'
                        }}>
                          Requires max level machines
                        </div>
                      )}
                      
                      {!canBuild && !affordable && type === 'fomoHit' && (
                        <div style={{
                          padding: '5px',
                          color: '#ff6b6b',
                          textAlign: 'center',
                          fontSize: '12px',
                          marginTop: '5px'
                        }}>
                          Build all other machines first
                        </div>
                      )}
                      
                      {!affordable && canBuild && (
                        <div style={{
                          padding: '5px',
                          color: '#ff6b6b',
                          textAlign: 'center',
                          fontSize: '12px',
                          marginTop: '5px'
                        }}>
                          Not enough resources
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* UPGRADE MACHINES SECTION */}
          <div style={{
            marginBottom: '5px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: activeSection === 'upgrade' ? '3px solid #2196F3' : '2px solid #2196F3',
            flex: activeSection === 'upgrade' ? '1' : 'none',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: activeSection === 'upgrade' ? '100%' : 'auto'
          }}>
            <button 
              onClick={() => toggleSection('upgrade')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0 // Prevent button from shrinking
              }}
            >
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '20px'}}>⚡</span> Upgrade Machines
              </span>
              <span>{activeSection === 'upgrade' ? '▼' : '▶'}</span>
            </button>
            
            {activeSection === 'upgrade' && (
              <div style={{
                padding: '15px',
                backgroundColor: '#1e1e1e',
                flex: 1,
                overflowY: 'auto', // Enable scrolling
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                minHeight: '0', // Important for flex containers to enable scrolling
                height: '100%' // Fill available space
              }}>
                {/* Back button for mobile */}
                {isMobile && (
                  <button
                    onClick={() => setActiveSection(null)}
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      flexShrink: 0 // Prevent from shrinking
                    }}
                  >
                    <span>◀</span> Back to Menu
                  </button>
                )}
                
                {Object.entries(machinesByType).map(([type, machineList]) => {
                  const machineInfo = machineTypes[type];
                  if (!machineInfo) {
                    return null;
                  }
                  
                  return (
                    <div key={type} style={{
                      backgroundColor: '#2a2a2a',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0 // Prevent from shrinking
                    }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        <span style={{fontSize: '18px'}}>{machineInfo.icon}</span>
                        <span>{machineInfo.name}</span>
                      </div>
                      
                      {machineList.map((machine) => {
                        // FOMO HIT doesn't have level upgrades, only NFT minting
                        if (type === 'fomoHit') {
                          return (
                            <div key={machine.id} style={{
                              padding: '10px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <button
                                onClick={() => handleFomoHitClick(machine)}
                                style={{ 
                                  width: '100%',
                                  padding: '10px',
                                  backgroundColor: '#FF3D00',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {machine.lastActivated === 0 ? '🔥 Mint NFT' : '✓ NFT Minted'}
                              </button>
                            </div>
                          );
                        }
                        
                        // Define maxLevel based on machine type
                        const maxLevel = type === 'amplifier' ? 5 : 
                                      type === 'incubator' ? 2 : 3;
                        const isMaxLevel = machine.level >= maxLevel;
                        
                        return (
                          <div key={machine.id} style={{
                            padding: '10px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: 'white'
                              }}>
                                Level {machine.level}
                              </div>
                              
                              {isMaxLevel && (
                                <div style={{
                                  padding: '3px 6px',
                                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                  color: '#4CAF50',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  MAX LEVEL
                                </div>
                              )}
                            </div>
                            
                            {!isMaxLevel && (
                              <button
                                onClick={() => handleUpgrade(machine.id)}
                                style={{ 
                                  width: '100%',
                                  padding: '10px',
                                  backgroundColor: machineInfo.baseColor,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                Level {machine.level} → {machine.level + 1}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* MOVE MACHINES SECTION */}
          <div style={{
            marginBottom: '5px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: activeSection === 'move' ? '3px solid #FF9800' : '2px solid #FF9800',
            flex: activeSection === 'move' ? '1' : 'none',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: activeSection === 'move' ? '100%' : 'auto'
          }}>
            <button 
              onClick={() => toggleSection('move')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0 // Prevent button from shrinking
              }}
            >
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '20px'}}>↔️</span> Move Machines
              </span>
              <span>{activeSection === 'move' ? '▼' : '▶'}</span>
            </button>
            
            {activeSection === 'move' && (
              <div style={{
                padding: '15px',
                backgroundColor: '#1e1e1e',
                flex: 1,
                overflowY: 'auto', // Enable scrolling
                display: 'flex',
                flexDirection: 'column',
                minHeight: '0', // Important for flex containers to enable scrolling
                height: '100%' // Fill available space
              }}>
                {/* Back button for mobile */}
                {isMobile && (
                  <button
                    onClick={() => setActiveSection(null)}
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      flexShrink: 0 // Prevent from shrinking
                    }}
                  >
                    <span>◀</span> Back to Menu
                  </button>
                )}
                
                {/* Custom Move Machines implementation */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  flex: 1,
                  overflowY: 'auto', // Enable scrolling for this container
                  minHeight: '0' // Important for flex containers to enable scrolling
                }}>
                  {/* Instructions/Move state indicator */}
                  {inMoveMode ? (
                    <div style={{
                      padding: '10px',
                      marginBottom: '15px',
                      background: 'rgba(255, 215, 0, 0.2)',
                      border: '2px solid #FFD700',
                      borderRadius: '8px',
                      textAlign: 'center',
                      flexShrink: 0 // Prevent from shrinking
                    }}>
                      <p style={{ fontWeight: 'bold', margin: '0', color: '#FFD700' }}>
                        MOVE MODE ACTIVE
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                        <strong>Click or tap</strong> on the game area to place the machine.
                        <br/>
                        Press <strong>ESC</strong> or select the same machine to cancel.
                      </p>
                    </div>
                  ) : (
                    <div style={{ 
                      marginBottom: '15px',
                      flexShrink: 0 // Prevent from shrinking
                    }}>
                      <p>Select a machine to move. Cost: <strong>50 TCorvax</strong></p>
                      <p style={{ color: tcorvax >= 50 ? 'inherit' : '#ff6b6b' }}>
                        Your balance: {formatResource(tcorvax)} TCorvax
                        {tcorvax < 50 && ' (Not enough!)'}
                      </p>
                    </div>
                  )}

                  {/* Move instructions popup */}
                  {instructionsVisible && selectedMachineToMove && (
                    <div style={{
                      position: 'fixed',
                      top: '30%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255, 215, 0, 0.9)',
                      color: '#000',
                      padding: '15px',
                      borderRadius: '8px',
                      zIndex: 1000,
                      textAlign: 'center',
                      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
                      maxWidth: '80%'
                    }}>
                      <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 10px 0' }}>
                        Now click/tap on the game where you want to move the machine!
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        Press ESC key to cancel the move.
                      </p>
                    </div>
                  )}

                  {/* Machine selection */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '15px',
                    overflowY: 'auto', // This is likely redundant but kept for safety
                    flexShrink: 0 // Prevent from shrinking as a whole
                  }}>
                    {Object.keys(currentRoomMachinesByType).length === 0 ? (
                      <p style={{ color: '#ff6b6b', textAlign: 'center' }}>No machines in this room to move.</p>
                    ) : (
                      Object.entries(currentRoomMachinesByType).map(([type, machineList]) => {
                        const machineInfo = machineTypes[type] || { baseColor: '#555', name: type };
                        
                        return (
                          <div key={type} style={{
                            backgroundColor: '#2a2a2a',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0 // Prevent items from shrinking
                          }}>
                            <div style={{
                              padding: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              color: 'white'
                            }}>
                              <span style={{fontSize: '18px'}}>{machineInfo.icon}</span>
                              <span>{machineInfo.name}</span>
                            </div>
                            
                            {machineList.map((machine) => (
                              <div key={machine.id} style={{
                                padding: '10px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div>Level {machine.level}</div>
                                  <button
                                    onClick={() => handleMachineSelect(machine)}
                                    disabled={tcorvax < 50}
                                    style={{ 
                                      backgroundColor: selectedMachineToMove === machine.id ? '#FFD700' : machineInfo.baseColor,
                                      color: selectedMachineToMove === machine.id ? 'black' : 'white',
                                      opacity: selectedMachineToMove === machine.id ? 1 : 0.8,
                                      padding: '8px 15px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: tcorvax >= 50 ? 'pointer' : 'not-allowed',
                                      fontSize: '13px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {selectedMachineToMove === machine.id ? 'Cancel' : 'Select'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {roomsUnlocked > 1 && (
                    <div style={{ 
                      marginTop: '20px',
                      padding: '15px',
                      background: 'rgba(33, 150, 243, 0.1)',
                      borderRadius: '8px',
                      flexShrink: 0 // Prevent from shrinking
                    }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                        Tip: You can move machines between rooms!
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        To move a machine to another room:
                        <ol style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                          <li>Select the machine you want to move</li>
                          <li>Use the room navigation arrows to switch rooms</li>
                          <li>Then click on the game area to place the machine</li>
                        </ol>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Render the CreaturesViewer when showCreaturesViewer is true */}
      {showCreaturesViewer && (
        <CreaturesViewer onClose={() => setShowCreaturesViewer(false)} />
      )}
      
      {/* FOMO HIT Minter Dialog */}
      {showMinter && selectedFomoHit && (
        <FomoHitMinter 
          machineId={selectedFomoHit.id} 
          onClose={() => setShowMinter(false)} 
        />
      )}
    </>
  );
};

export default SidePanel;
