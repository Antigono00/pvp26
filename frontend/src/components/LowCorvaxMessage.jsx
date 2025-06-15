import { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';

const LowCorvaxMessage = () => {
  const { showLowCorvaxMessage, setShowLowCorvaxMessage } = useContext(GameContext);
  
  // Close button handler
  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLowCorvaxMessage(false);
  };
  
  return (
    <div className="low-corvax-message" style={{ 
      display: showLowCorvaxMessage ? 'block' : 'none',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(5px)',
      padding: '20px',
      borderRadius: '10px',
      maxWidth: '90%',
      width: '350px',
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Close button in the top right */}
      <button 
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'transparent',
          border: 'none',
          color: '#aaa',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '5px',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ✕
      </button>
      
      <h3 style={{ marginTop: '0', color: '#FF9800' }}>Low TCorvax Alert</h3>
      
      <p>You don't have enough TCorvax to build machines. You need at least 10 TCorvax for a <strong>Cat's Lair</strong> and 10 more (plus Cat Nips) for a <strong>Reactor</strong>.</p>
      
      <div style={{
        padding: '10px',
        marginTop: '15px',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderRadius: '8px'
      }}>
        <p style={{ margin: '0', fontWeight: 'bold', color: '#2196F3' }}>
          Good News! 🥚 You can still mint Evolving Creatures with XRD!
        </p>
        <p style={{ marginTop: '5px', marginBottom: '0', fontSize: '14px' }}>
          No TCorvax required for minting creatures. Find the "Mint Creature" button in the side panel.
        </p>
      </div>
      
      <p style={{ marginTop: '15px' }}>Please visit 
        <a 
          href="https://t.me/CorvaxXRD" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#2196F3',
            textDecoration: 'none',
            marginLeft: '5px'
          }}
        >
          t.me/CorvaxXRD
        </a> 
        to earn some TCorvax for building machines!
      </p>
      
      <button 
        onClick={handleClose}
        style={{
          display: 'block',
          margin: '15px auto 0',
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Got it!
      </button>
    </div>
  );
};

export default LowCorvaxMessage;
