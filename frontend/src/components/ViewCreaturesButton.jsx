// src/components/ViewCreaturesButton.jsx
import React from 'react';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

/**
 * Button component to view the user's creatures
 * @param {Object} props
 * @param {Function} props.onClick - Click handler function
 */
const ViewCreaturesButton = ({ onClick }) => {
  const { isMobile, creatureNfts } = useContext(GameContext);
  
  // Count creatures to display in button
  const creatureCount = creatureNfts ? creatureNfts.length : 0;
  
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#9C27B0',
        color: 'white',
        padding: '8px 15px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: isMobile ? '100%' : 'auto'
      }}
    >
      {/* Show count in badge if there are creatures */}
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        🧬 View Creatures
        {creatureCount > 0 && (
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {creatureCount}
          </span>
        )}
      </span>
    </button>
  );
};

export default ViewCreaturesButton;
