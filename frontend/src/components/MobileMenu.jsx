// src/components/MobileMenu.jsx
import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../context/GameContext';

const MobileMenu = ({ isOpen, setIsOpen }) => {
  const { tcorvax, catNips, energy, eggs, formatResource, isMobile, gameMode } = useContext(GameContext);
  const [hiddenDuringBattle, setHiddenDuringBattle] = useState(false);
  
  // Update visibility based on game mode
  useEffect(() => {
    // Hide menu button during battle mode
    setHiddenDuringBattle(gameMode === 'battle');
  }, [gameMode]);

  // Don't show the mobile menu button on desktop or during battle
  if (!isMobile || hiddenDuringBattle) {
    return null;
  }

  return (
    <>
      {/* Mobile burger menu button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: '45px',
          height: '45px',
          backgroundColor: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '8px',
          border: '2px solid rgba(76, 175, 80, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10001,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          opacity: hiddenDuringBattle ? 0 : 1,
          pointerEvents: hiddenDuringBattle ? 'none' : 'auto'
        }}
      >
        <span style={{ 
          width: '22px', 
          height: '3px', 
          background: 'white',
          margin: '2px 0',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
        }}></span>
        <span style={{ 
          width: '22px', 
          height: '3px', 
          background: 'white',
          margin: '2px 0',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: isOpen ? 0 : 1
        }}></span>
        <span style={{ 
          width: '22px', 
          height: '3px', 
          background: 'white',
          margin: '2px 0',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
        }}></span>
      </button>
      
      {/* Mobile mini-HUD - hide when menu is open or during battle */}
      {!isOpen && !hiddenDuringBattle && (
        <div className="mobile-hud" style={{
          display: 'flex',
          flexWrap: 'wrap',
          position: 'fixed',
          top: '60px',
          left: '10px',
          right: '10px',
          height: 'auto',
          minHeight: '40px',
          zIndex: 8000,
          padding: '10px',
          background: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '10px',
          margin: 0,
          border: '1px solid rgba(76, 175, 80, 0.3)',
          boxShadow: '0 5px 10px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="mobile-resource" style={{
            flex: '1 0 auto',
            padding: '8px 12px',
            margin: '5px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            💎 <span id="mobile-tcorvax">{formatResource(tcorvax)}</span>
          </div>
          <div className="mobile-resource" style={{
            flex: '1 0 auto',
            padding: '8px 12px',
            margin: '5px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            🐱 <span id="mobile-catnips">{formatResource(catNips)}</span>
          </div>
          <div className="mobile-resource" style={{
            flex: '1 0 auto',
            padding: '8px 12px',
            margin: '5px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            ⚡ <span id="mobile-energy">{formatResource(energy)}</span>
          </div>
          <div className="mobile-resource" style={{
            flex: '1 0 auto',
            padding: '8px 12px',
            margin: '5px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            🥚 <span id="mobile-eggs">{formatResource(eggs)}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
