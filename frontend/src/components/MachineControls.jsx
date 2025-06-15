// src/components/MachineControls.jsx
import { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import FomoHitMinter from './FomoHitMinter';
import MoveMachines from './MoveMachines';

function MachineControls() {
  const {
    canBuildMachine,
    canAfford,
    calculateMachineCost,
    buildMachine,
    upgradeMachine,
    machineTypes,
    machines,
    formatResource,
    player,
    isMobile,
    setSelectedMachineToMove,
    setShowCreatureMinter,
    creatureNfts,
    showBattleGame,
    setShowBattleGame
  } = useContext(GameContext);

  // State for accordion - starts with "build" section open
  const [activeSection, setActiveSection] = useState("build");

  // State for NFT minting
  const [showMinter, setShowMinter] = useState(false);
  const [selectedFomoHit, setSelectedFomoHit] = useState(null);

  // Group machines by type for the upgrade section
  const machinesByType = machines.reduce((acc, machine) => {
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

  // The key fix: Use completely inline styles with no classes or external CSS dependencies
  return (
    <div style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto',
      flex: 1
    }}>
      <div style={{
        fontSize: '20px',
        color: '#4CAF50',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #4CAF50'
      }}>
        Machine Controls
      </div>
        
      {/* BUILD MACHINES SECTION */}
      <div style={{
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <div 
          onClick={() => toggleSection('build')}
          style={{
            cursor: 'pointer',
            padding: '15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            🏭 Build Machines
          </div>
          <div>{activeSection === 'build' ? '▼' : '▶'}</div>
        </div>
        
        {activeSection === 'build' && (
          <div style={{
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: '#1e1e1e'
          }}>
            {Object.keys(machineTypes).map((type) => {
              const cost = calculateMachineCost(type);
              const canBuild = canBuildMachine(type);
              const affordable = canAfford(cost);
              const machineInfo = machineTypes[type];
              const isThirdReactor = type === 'reactor' && (machines.filter(m => m.type === 'reactor').length === 2);
              
              return (
                <div key={type} style={{
                  opacity: (!canBuild || !affordable) ? 0.6 : 1,
                  marginBottom: '10px'
                }}>
                  <button
                    onClick={() => handleBuild(type)}
                    disabled={!canBuild || !affordable}
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: machineInfo.baseColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: (!canBuild || !affordable) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <span style={{fontSize: '24px'}}>{machineInfo.icon}</span>
                      <span>{machineInfo.name}</span>
                    </div>
                    <div style={{
                      padding: '5px 8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '4px'
                    }}>
                      {formatCost(cost)}
                    </div>
                  </button>
                  
                  {/* Requirements messages */}
                  {isThirdReactor && !canBuild && (
                    <div style={{
                      padding: '8px',
                      color: '#ff6b6b',
                      textAlign: 'center',
                      marginTop: '5px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px'
                    }}>
                      Requires Incubator & FOMO HIT
                    </div>
                  )}
                  
                  {!canBuild && !affordable && type === 'incubator' && (
                    <div style={{
                      padding: '8px',
                      color: '#ff6b6b',
                      textAlign: 'center',
                      marginTop: '5px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px'
                    }}>
                      Requires max level machines
                    </div>
                  )}
                  
                  {!canBuild && !affordable && type === 'fomoHit' && (
                    <div style={{
                      padding: '8px',
                      color: '#ff6b6b',
                      textAlign: 'center',
                      marginTop: '5px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px'
                    }}>
                      Build all other machines first
                    </div>
                  )}
                  
                  {!affordable && canBuild && (
                    <div style={{
                      padding: '8px',
                      color: '#ff6b6b',
                      textAlign: 'center',
                      marginTop: '5px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px'
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
        border: '2px solid #2196F3',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <div 
          onClick={() => toggleSection('upgrade')}
          style={{
            cursor: 'pointer',
            padding: '15px',
            backgroundColor: '#2196F3',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            ⚡ Upgrade Machines
          </div>
          <div>{activeSection === 'upgrade' ? '▼' : '▶'}</div>
        </div>
        
        {activeSection === 'upgrade' && (
          <div style={{
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            backgroundColor: '#1e1e1e'
          }}>
            {Object.entries(machinesByType).map(([type, machineList]) => {
              const machineInfo = machineTypes[type];
              if (!machineInfo) {
                return null;
              }
              
              return (
                <div key={type} style={{
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#2a2a2a'
                }}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: 'white'
                  }}>
                    <span style={{fontSize: '22px'}}>{machineInfo.icon}</span>
                    <span>{machineInfo.name}</span>
                  </div>
                  
                  {machineList.map((machine) => {
                    // FOMO HIT doesn't have level upgrades, only NFT minting
                    if (type === 'fomoHit') {
                      return (
                        <div key={machine.id} style={{
                          padding: '12px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <button
                            onClick={() => handleFomoHitClick(machine)}
                            style={{ 
                              width: '100%',
                              padding: '12px',
                              backgroundColor: '#FF3D00',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '16px',
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
                        padding: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: 'white'
                          }}>
                            Level {machine.level}
                          </div>
                          
                          {isMaxLevel && (
                            <div style={{
                              padding: '4px 8px',
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
                              padding: '12px',
                              backgroundColor: machineInfo.baseColor,
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '16px',
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
        border: '2px solid #FF9800',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <div 
          onClick={() => toggleSection('move')}
          style={{
            cursor: 'pointer',
            padding: '15px',
            backgroundColor: '#FF9800',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            ↔️ Move Machines
          </div>
          <div>{activeSection === 'move' ? '▼' : '▶'}</div>
        </div>
        
        {activeSection === 'move' && (
          <div style={{
            padding: '15px',
            backgroundColor: '#1e1e1e'
          }}>
            <MoveMachines />
          </div>
        )}
      </div>
      
      {/* FOMO HIT Minter Dialog */}
      {showMinter && selectedFomoHit && (
        <FomoHitMinter 
          machineId={selectedFomoHit.id} 
          onClose={() => setShowMinter(false)} 
        />
      )}
    </div>
  );
}

export default MachineControls;
