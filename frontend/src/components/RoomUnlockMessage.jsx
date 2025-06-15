// src/components/RoomUnlockMessage.jsx
import React from 'react';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const RoomUnlockMessage = () => {
  const { 
    showRoomUnlockMessage, 
    dismissRoomUnlock,
    setCurrentRoom
  } = useContext(GameContext);

  if (!showRoomUnlockMessage) {
    return null;
  }

  // This will navigate to room 2 and dismiss the message permanently
  const handleGoToRoom = () => {
    setCurrentRoom(2);
    dismissRoomUnlock();
  };

  // This will stay in room 1 but still dismiss the message permanently
  const handleStayInRoom = () => {
    dismissRoomUnlock();
  };

  return (
    <div className="welcome-message room-unlock-message">
      <h2>New Room Unlocked! 🎉</h2>
      
      <p>
        Congratulations! You've unlocked Room 2 by building:
      </p>
      
      <ul>
        <li>2x Cat's Lair</li>
        <li>2x Reactor</li>
        <li>1x Amplifier</li>
      </ul>
      
      <p>
        You can now expand your lab operation into a second room. 
        Use the arrow on the right side of the screen to navigate between rooms.
      </p>
      
      <div style={{ 
        padding: '15px', 
        margin: '15px 0', 
        backgroundColor: 'rgba(76, 175, 80, 0.2)', 
        borderRadius: '8px' 
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Pro Tip:</strong> Use Room 2 to organize your machines by type or function.
        </p>
        <p style={{ margin: '0' }}>
          All resources are shared between rooms, but each room has its own space for machines.
        </p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button onClick={handleStayInRoom} style={{ backgroundColor: '#333' }}>
          Stay in Room 1
        </button>
        <button onClick={handleGoToRoom} style={{ backgroundColor: '#4CAF50' }}>
          Go to Room 2
        </button>
      </div>
    </div>
  );
};

export default RoomUnlockMessage;
