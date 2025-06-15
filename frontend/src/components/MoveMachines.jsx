// src/components/MoveMachines.jsx
import { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';

const MoveMachines = () => {
  const {
    machines,
    tcorvax,
    currentRoom,
    roomsUnlocked,
    machineTypes,
    formatResource,
    getMachinesInCurrentRoom,
    selectedMachineToMove,
    setSelectedMachineToMove,
    inMoveMode,
    setInMoveMode
  } = useContext(GameContext);

  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const moveCost = 50; // TCorvax cost to move a machine
  const canAffordMove = tcorvax >= moveCost;

  // Group machines by type for the selection list
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

  // Get a text description of the machine
  const getMachineDescription = (machine) => {
    const type = machineTypes[machine.type];
    return `${type?.name || machine.type} (Level ${machine.level})`;
  };

  return (
    <div className="machine-move-controls">
      {/* Instructions/Move state indicator */}
      {inMoveMode ? (
        <div className="move-active-indicator" style={{
          padding: '10px',
          marginBottom: '15px',
          background: 'rgba(255, 215, 0, 0.2)',
          border: '2px solid #FFD700',
          borderRadius: '8px',
          textAlign: 'center',
          animation: 'pulse 2s infinite ease-in-out'
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
        <div className="move-info" style={{ marginBottom: '15px' }}>
          <p>Select a machine to move. Cost: <strong>50 TCorvax</strong></p>
          <p className={canAffordMove ? '' : 'requirement-text critical'}>
            Your balance: {formatResource(tcorvax)} TCorvax
            {!canAffordMove && ' (Not enough!)'}
          </p>
        </div>
      )}

      {/* Move instructions popup - more visible */}
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
          maxWidth: '80%',
          animation: 'fadeInOut 5s forwards'
        }}>
          <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 10px 0' }}>
            Now click/tap on the game where you want to move the machine!
          </p>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Press ESC key to cancel the move.
          </p>
          
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; }
              10% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
            
            @keyframes pulse {
              0% { border-color: rgba(255, 215, 0, 0.5); }
              50% { border-color: rgba(255, 215, 0, 1); }
              100% { border-color: rgba(255, 215, 0, 0.5); }
            }
          `}</style>
        </div>
      )}

      <div className="machine-selection">
        {Object.keys(currentRoomMachinesByType).length === 0 ? (
          <p className="requirement-text">No machines in this room to move.</p>
        ) : (
          Object.entries(currentRoomMachinesByType).map(([type, machineList]) => {
            const machineInfo = machineTypes[type] || { baseColor: '#555', name: type };
            
            return (
              <div key={type} className="machine-group">
                <div className="machine-group-header">
                  <span className="machine-icon">{machineInfo.icon}</span>
                  <span className="machine-name">{machineInfo.name}</span>
                </div>
                
                {machineList.map((machine) => (
                  <div key={machine.id} className="machine-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>Level {machine.level}</div>
                      <button
                        className={`move-button ${selectedMachineToMove === machine.id ? 'selected' : ''}`}
                        style={{ 
                          backgroundColor: selectedMachineToMove === machine.id ? '#FFD700' : machineInfo.baseColor,
                          color: selectedMachineToMove === machine.id ? 'black' : 'white',
                          opacity: selectedMachineToMove === machine.id ? 1 : 0.8
                        }}
                        onClick={() => handleMachineSelect(machine)}
                        disabled={!canAffordMove}
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
          borderRadius: '8px'
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
  );
};

export default MoveMachines;
