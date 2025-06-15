// src/components/RoomNavigation.jsx - Minimal changes
import React from 'react';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const RoomNavigation = () => {
  const { 
    currentRoom,
    roomsUnlocked, 
    setCurrentRoom,
    addNotification,
    isPanelOpen,
    isMobile
  } = useContext(GameContext);

  // Don't show navigation if there's only one room unlocked
  if (roomsUnlocked <= 1) {
    return null;
  }

  const handleRoomChange = (newRoom) => {
    // Only navigate if the room is different and unlocked
    if (newRoom !== currentRoom && newRoom <= roomsUnlocked) {
      setCurrentRoom(newRoom);
      addNotification(`Entered Room ${newRoom}`, 400, 300, "#4CAF50");
    }
  };

  return (
    <div 
      className="room-navigation" 
      style={{
        position: 'absolute',
        right: isMobile ? '10px' : '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
        pointerEvents: 'none', // This is the key fix - container doesn't capture events
        width: 'auto', // Don't set explicit width
      }}
    >
      {/* Show left arrow when in room 2 */}
      {currentRoom === 2 && (
        <button 
          className="room-nav-button prev"
          onClick={() => handleRoomChange(1)}
          aria-label="Go to previous room"
          style={{
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            backgroundColor: '#FF5722',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto', // Button captures events
          }}
        >
          ←
        </button>
      )}

      {/* Room indicator */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '10px',
        fontSize: '12px',
        fontFamily: "Orbitron, sans-serif",
        textAlign: 'center',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        pointerEvents: 'none', // This doesn't need to capture events
      }}>
        {currentRoom}/{roomsUnlocked}
      </div>

      {/* Show right arrow when in room 1 */}
      {currentRoom === 1 && (
        <button 
          className="room-nav-button next"
          onClick={() => handleRoomChange(2)}
          aria-label="Go to next room"
          style={{
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            backgroundColor: '#2196F3',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto', // Button captures events
          }}
        >
          →
        </button>
      )}
    </div>
  );
};

export default RoomNavigation;
