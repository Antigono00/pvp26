// src/App.jsx
import { useContext, useEffect } from 'react';
import { GameContext } from './context/GameContext';
import TelegramLogin from './components/TelegramLogin';
import GameCanvas from './components/GameCanvas';
import SidePanel from './components/SidePanel';
import MobileMenu from './components/MobileMenu';
import WelcomeMessage from './components/WelcomeMessage';
import LowCorvaxMessage from './components/LowCorvaxMessage';
import HelpButton from './components/HelpButton';
import MobileRadixWrapper from './components/MobileRadixWrapper';
import RoomUnlockMessage from './components/RoomUnlockMessage';
import BattleGame from './components/BattleGame';
import PvPMenu from './components/pvp/PvPMenu';

// Import the Radix Connect Provider & Button
import { RadixConnectProvider } from './context/RadixConnectContext';
import RadixConnectButton from './context/RadixConnectButton';

// The same dApp address you had before
const dAppDefinitionAddress =
  'account_rdx129994zq674n4mturvkqz7cz9t7gmtn5sjspxv7py2ahqnpdvxjsqum';

function App() {
  const {
    isLoggedIn,
    showWelcomeMessage,
    isPanelOpen,
    setIsPanelOpen,
    loadGameFromServer,
    setAssetsLoaded,
    isMobile,
    showRoomUnlockMessage,
    showBattleGame,
    setShowBattleGame,
    showPvPMenu,
    setShowPvPMenu
  } = useContext(GameContext);

  // Preload images
  useEffect(() => {
    const imagePaths = [
      '/assets/Background.png',
      '/assets/Background2.png',
      '/assets/Player.png',
      '/assets/CatsLair.png',
      '/assets/Reactor.png',
      '/assets/Amplifier.png',
      '/assets/Incubator.png',
      '/assets/FomoHit.png',
      '/assets/Cat.png'
    ];
    console.log('Starting to load assets...');

    const preloadImages = async () => {
      try {
        for (const src of imagePaths) {
          console.log(`Loading image from ${src}...`);
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              console.log(`Successfully loaded image: ${src}`);
              resolve(true);
            };
            img.onerror = () => {
              console.warn(`Failed to load image: ${src}`);
              resolve(true);
            };
            img.src = src;
          });
        }
        console.log('All images have been attempted to load.');
      } catch (err) {
        console.error('Preloading error:', err);
      }
      setAssetsLoaded(true);
    };
    preloadImages();
  }, [setAssetsLoaded]);

  // Load game data once user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadGameFromServer();
    }
  }, [isLoggedIn, loadGameFromServer]);

  return (
    <RadixConnectProvider dAppDefinitionAddress={dAppDefinitionAddress}>
      <style jsx>{`
        /* Global styles */
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #1a1a1a;
          font-family: 'Orbitron', sans-serif;
        }
        
        /* App container */
        .app-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        
        /* Game container */
        .game-container {
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex: 1;
          overflow: hidden;
        }
        
        /* Z-index hierarchy */
        .mobile-menu-btn {
          z-index: 10001 !important;
        }
        
        .low-corvax-message {
          z-index: 10010 !important;
        }
        
        .welcome-message {
          z-index: 10000 !important;
        }
        
        .room-unlock-message {
          z-index: 10000 !important;
        }
        
        .side-panel {
          z-index: 9999 !important;
        }
        
        .mobile-hud {
          z-index: 8000 !important;
        }
        
        /* FIXED: Separate z-index for PvP menu and battle game */
        .pvp-menu-overlay {
          z-index: 10002 !important;
        }
        
        .battle-game {
          z-index: 10005 !important;
          position: relative;
          overflow: visible !important;
        }
        
        /* TelegramLogin */
        .telegram-login {
          z-index: 10000 !important;
        }
        
        /* Button styles for PvP */
        .pvp-button-sidebar {
          background: linear-gradient(45deg, #f44336, #ff5722) !important;
          transition: all 0.3s ease !important;
        }
        
        .pvp-button-sidebar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.5) !important;
          background: linear-gradient(45deg, #ff5722, #f44336) !important;
        }
        
        .pvp-button-sidebar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #666 !important;
        }
        
        /* Modal stacking context management */
        body.modal-open .player-hand {
          z-index: 50 !important;
          overflow: visible !important;
          
        }
        
        body.modal-open .hand-card-wrapper,
        body.modal-open .creature-card {
          z-index: 50 !important;
          overflow: visible !important;
        }
        
        body.modal-open .tool-spell-modal-overlay {
          z-index: 99999 !important;
        }
        
        body.modal-open .tool-spell-modal {
          z-index: 100000 !important;
        }
        
        /* Additional fix for mobile */
        @media (max-width: 768px) {
          .behind-modal {
            visibility: hidden !important;
          }
        }
        
        /* Fix for z-index inheritance issues */
        .battle-game {
          isolation: isolate;
          position: relative;
        }
        
        .battle-content-wrapper {
          isolation: isolate;
          position: relative;
        }
        
        /* Tool/Spell modal z-index fix */
        .tool-spell-modal-overlay {
          z-index: 99999 !important;
          isolation: isolate;
          transform: translateZ(0);
        }
        
        .tool-spell-modal {
          z-index: 100000 !important;
          position: relative;
        }
        
        /* Force hand cards behind modal */
        .hand-cards-behind-modal .hand-card-wrapper:hover,
        .hand-cards-behind-modal .hand-card-wrapper.selected {
          z-index: 50 !important;
        }
        
        /* Mobile optimization */
        @media (max-width: 768px) {
          .game-container.mobile {
            flex-direction: column;
            height: calc(100vh - 46px);
          }
          
          .game-container.mobile .side-panel {
            position: fixed;
            top: 46px;
            left: 0;
            transform: translateX(-100%);
            height: calc(100vh - 46px);
            overflow-y: auto;
          }
          
          .game-container.mobile .side-panel.open {
            transform: translateX(0);
          }
          
          /* Ensure battle and PvP modals are over everything on mobile */
          .pvp-menu-overlay, .battle-game {
            z-index: 20000 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
          }
          
          /* Fix for mobile player hand */
          .player-hand {
            z-index: 50 !important;
          }
        }
        
        /* Additional styles for battle game and PvP menu */
        .battle-game, .pvp-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(5px);
        }
        
        /* Make sure Radix connect button stays below battle modals */
        .radix-connect-wrapper {
          z-index: 2000 !important;
        }
        
        .mobile-radix-wrapper {
          z-index: 9998 !important; /* Below modals but above most UI */
        }
      `}</style>

      <div className="app-container">
        {!isLoggedIn && <TelegramLogin />}

        {isLoggedIn && !isMobile && (
          <div
            className="radix-connect-wrapper"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              padding: '10px',
              borderRadius: '10px',
              boxShadow: '0 0 15px rgba(76, 175, 80, 0.3)',
              backdropFilter: 'blur(5px)'
            }}
          >
            <RadixConnectButton />
          </div>
        )}
        
        {/* Mobile Radix wrapper */}
        {isLoggedIn && <MobileRadixWrapper />}

        <MobileMenu isOpen={isPanelOpen} setIsOpen={setIsPanelOpen} />

        <div className={`game-container ${isMobile ? 'mobile' : ''}`}>
          <SidePanel isOpen={isPanelOpen || !isMobile} />
          <GameCanvas />
        </div>

        {showWelcomeMessage && <WelcomeMessage />}
        <LowCorvaxMessage />
        
        {showRoomUnlockMessage && <RoomUnlockMessage />}
        
        {isLoggedIn && <HelpButton />}
        
        {/* Battle Game overlay */}
        {showBattleGame && (
          <div className="battle-game">
            <BattleGame onClose={() => setShowBattleGame(false)} />
          </div>
        )}
        
        {/* PvP Menu overlay */}
        {showPvPMenu && (
          <div className="pvp-menu-overlay">
            <PvPMenu onClose={() => setShowPvPMenu(false)} />
          </div>
        )}
      </div>
    </RadixConnectProvider>
  );
}

export default App;
