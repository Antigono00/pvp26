// src/components/WelcomeMessage.jsx
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const WelcomeMessage = () => {
  const { setShowWelcomeMessage, isMobile } = useContext(GameContext);
  
  // Function to close the welcome message
  const handleClose = () => setShowWelcomeMessage(false);
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(30, 30, 30, 0.95))',
      border: '2px solid rgba(76, 175, 80, 0.5)',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      zIndex: 10000,
      width: isMobile ? '90vw' : '600px', // WIDER for both mobile and desktop
      maxWidth: isMobile ? '90vw' : '80vw',
      maxHeight: '90vh',
      overflowY: 'auto',
      textAlign: 'center'
    }}>
      <h1 style={{
        color: '#4CAF50',
        marginBottom: '20px',
        fontSize: isMobile ? '1.8rem' : '2.2rem',
        background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Welcome to Corvax Lab!
      </h1>
      
      {/* Mobile-only sticky top button */}
      {isMobile && (
        <div style={{
          position: 'sticky',
          top: '10px',
          zIndex: 5,
          textAlign: 'center',
          marginBottom: '15px'
        }}>
          <button 
            onClick={handleClose}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '12px 25px',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              width: '80%',
              maxWidth: '250px'
            }}
          >
            Start Playing
          </button>
        </div>
      )}
      
      {/* New section about Evolving Creatures */}
      <div style={{ 
        padding: '20px', 
        marginBottom: '20px', 
        background: 'rgba(33, 150, 243, 0.15)', 
        borderRadius: '8px',
        border: '1px solid rgba(33, 150, 243, 0.3)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2196F3', fontSize: '1.3rem' }}>🥚 Evolving Creatures</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#e0e0e0', lineHeight: '1.5' }}>
          Start your adventure by minting your own unique creature:
        </p>
        
        <ul style={{ 
          margin: '0', 
          paddingLeft: '25px',
          textAlign: 'left',
          color: '#e0e0e0'
        }}>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>Mint a creature egg and receive a bonus item</li>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>Each creature is inspired by a Radix project</li>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>To upgrade stats and evolve, feed your creature with the token of its associated Radix project</li>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>Collect rare species with different abilities and specialty stats</li>
          <li style={{ lineHeight: '1.4' }}>No TCorvax needed - start minting right away!</li>
        </ul>
      </div>
      
      <div style={{ 
        padding: '20px', 
        marginBottom: '20px', 
        background: 'rgba(76, 175, 80, 0.1)', 
        borderRadius: '8px',
        border: '1px solid rgba(76, 175, 80, 0.3)'
      }}>
        <p style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#e0e0e0', lineHeight: '1.5' }}>
          Build your lab, produce resources, and create a thriving economy!
        </p>
        
        <ul style={{ 
          margin: '0', 
          paddingLeft: '25px',
          textAlign: 'left',
          color: '#e0e0e0'
        }}>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>Start with a <strong style={{ color: '#4CAF50' }}>Cat's Lair</strong> to produce Cat Nips</li>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>Build a <strong style={{ color: '#2196F3' }}>Reactor</strong> to convert Cat Nips into TCorvax and Energy</li>
          <li style={{ marginBottom: '10px', lineHeight: '1.4' }}>Add an <strong style={{ color: '#9C27B0' }}>Amplifier</strong> to boost your production</li>
          <li style={{ lineHeight: '1.4' }}>Unlock more advanced machines as you progress!</li>
        </ul>
      </div>
      
      <div style={{ 
        display: 'flex',
        gap: '20px',
        margin: '20px 0',
        textAlign: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{ 
          flex: '1',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          minWidth: isMobile ? '100%' : '180px',
          border: '1px solid rgba(76, 175, 80, 0.2)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Desktop Controls</h3>
          <p style={{ margin: '0', color: '#e0e0e0' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#7e57c2',
              borderRadius: '4px',
              color: 'white',
              margin: '0 3px'
            }}>↑</span>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#7e57c2',
              borderRadius: '4px',
              color: 'white',
              margin: '0 3px'
            }}>↓</span>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#7e57c2',
              borderRadius: '4px',
              color: 'white',
              margin: '0 3px'
            }}>←</span>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#7e57c2',
              borderRadius: '4px',
              color: 'white',
              margin: '0 3px'
            }}>→</span> 
            to move
          </p>
          <p style={{ margin: '10px 0 0 0', color: '#e0e0e0' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#7e57c2',
              borderRadius: '4px',
              color: 'white',
              margin: '0 3px'
            }}>Space</span> to activate
          </p>
        </div>
        
        <div style={{ 
          flex: '1',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          minWidth: isMobile ? '100%' : '180px',
          border: '1px solid rgba(76, 175, 80, 0.2)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Mobile Controls</h3>
          <p style={{ margin: '0', color: '#e0e0e0' }}>
            <strong>Tap</strong> to move
          </p>
          <p style={{ margin: '10px 0 0 0', color: '#e0e0e0' }}>
            <strong>Tap Machine</strong> to activate
          </p>
        </div>
      </div>
      
      <div style={{ 
        padding: '15px', 
        background: 'rgba(0, 0, 0, 0.3)', 
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        border: '1px solid rgba(126, 87, 194, 0.3)'
      }}>
        <p style={{ margin: '0', color: '#e0e0e0' }}>
          Click the <strong style={{ color: '#7e57c2' }}>?</strong> help button anytime for detailed instructions.
        </p>
      </div>
      
      {/* Only show the bottom button for desktop users */}
      {!isMobile && (
        <button 
          onClick={handleClose}
          style={{
            background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
            marginTop: '10px'
          }}
        >
          Start Playing
        </button>
      )}
    </div>
  );
};

export default WelcomeMessage;
