// src/components/MobileRadixWrapper.jsx - Updated version with battle mode hiding
import React, { useState, useEffect, useContext } from 'react';
import { useRadixConnect } from '../context/RadixConnectContext';
import { GameContext } from '../context/GameContext';
import UpdateAccountButton from './UpdateAccountButton'; // Import standalone button

/**
 * Custom wrapper for Radix Connect on mobile
 * This version uses a standalone update button that doesn't require context changes
 * Now with battle mode awareness to hide during gameplay
 */
const MobileRadixWrapper = () => {
  const {
    connected,
    accounts,
    selectedAccount,
    rdt
  } = useRadixConnect();
  
  const { gameMode } = useContext(GameContext);

  const [showDialog, setShowDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hiddenDuringBattle, setHiddenDuringBattle] = useState(false);
  // Keep a reference to the original Radix button
  const [originalButton, setOriginalButton] = useState(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Update visibility based on game mode
  useEffect(() => {
    // Hide during battle mode
    setHiddenDuringBattle(gameMode === 'battle');
  }, [gameMode]);

  // Find and store the original Radix button
  useEffect(() => {
    if (isMobile) {
      const button = document.querySelector('radix-connect-button');
      if (button) {
        setOriginalButton(button);
        button.style.position = 'absolute';
        button.style.left = '-9999px';
        button.style.opacity = '0.01';
        button.style.pointerEvents = 'none';
      }
    }
  }, [isMobile]);

  // Toggle our custom dialog
  const toggleDialog = () => {
    setShowDialog(!showDialog);
  };

  // Connect wallet
  const handleConnectWallet = async () => {
    setShowDialog(false);
    
    if (originalButton) {
      originalButton.style.pointerEvents = 'auto';
      
      const shadowButton = originalButton.shadowRoot?.querySelector('button[data-connect]') || 
                           originalButton.shadowRoot?.querySelector('button:not([data-disconnect])');
      
      if (shadowButton) {
        shadowButton.click();
      } else {
        originalButton.click();
      }
      
      setTimeout(() => {
        originalButton.style.pointerEvents = 'none';
      }, 100);
    } else if (rdt) {
      try {
        await rdt.walletApi.sendRequest();
      } catch (error) {
        console.error("Error connecting to Radix wallet:", error);
      }
    }
  };

  // Disconnect the wallet
  const handleDisconnect = async () => {
    setShowDialog(false);
    
    if (rdt) {
      try {
        await rdt.disconnect();
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
        
        if (originalButton) {
          originalButton.style.pointerEvents = 'auto';
          const disconnectButton = originalButton.shadowRoot?.querySelector('button[data-disconnect]');
          if (disconnectButton) {
            disconnectButton.click();
          }
          setTimeout(() => {
            originalButton.style.pointerEvents = 'none';
          }, 100);
        }
      }
    }
  };

  // Only render on mobile and not during battle
  if (!isMobile || hiddenDuringBattle) return null;

  return (
    <>
      {/* Connect button */}
      <button 
        onClick={toggleDialog}
        style={{
          position: 'fixed',
          top: '10px',
          right: '60px',
          zIndex: 10000,
          backgroundColor: connected ? 'rgba(76, 175, 80, 0.8)' : 'rgba(25, 118, 210, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          width: 'auto',
          minWidth: 'auto',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: hiddenDuringBattle ? 0 : 1,
          pointerEvents: hiddenDuringBattle ? 'none' : 'auto',
          transform: hiddenDuringBattle ? 'translateY(-50px)' : 'translateY(0)'
        }}
      >
        {connected ? (
          <>
            <span style={{ marginRight: '6px', fontSize: '10px', color: '#4CAF50' }}>●</span>
            {accounts && accounts.length > 0 ? 'Connected' : 'Connect Account'}
          </>
        ) : (
          'Connect'
        )}
      </button>

      {/* Dialog */}
      {showDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowDialog(false)}
        >
          <div 
            style={{
              backgroundColor: '#1a1a1a',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              maxWidth: '90%',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '2px solid rgba(76, 175, 80, 0.5)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50', textAlign: 'center' }}>
              {connected ? 'Radix Wallet Connected' : 'Connect Radix Wallet'}
            </h3>
            
            {connected && accounts && accounts.length > 0 ? (
              <div>
                <p style={{ textAlign: 'center', margin: '0 0 15px 0' }}>
                  Connected to:
                </p>
                
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  padding: '10px', 
                  borderRadius: '8px',
                  marginBottom: '15px' 
                }}>
                  <p style={{ 
                    margin: '0', 
                    wordBreak: 'break-all', 
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {selectedAccount?.label || accounts[0]?.label || 'Account'}
                  </p>
                  <p style={{ 
                    margin: '5px 0 0 0', 
                    wordBreak: 'break-all', 
                    fontSize: '12px',
                    opacity: 0.7,
                    textAlign: 'center'
                  }}>
                    {selectedAccount?.address || accounts[0]?.address || ''}
                  </p>
                </div>
                
                {/* Button group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Using the standalone UpdateAccountButton component that doesn't require context changes */}
                  <UpdateAccountButton />
                  
                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    style={{
                      backgroundColor: '#F44336',
                      padding: '10px',
                      borderRadius: '8px',
                      color: 'white',
                      width: '100%',
                      textAlign: 'center',
                      border: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Disconnect Wallet
                  </button>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setShowDialog(false)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '10px',
                      borderRadius: '8px',
                      color: 'white',
                      width: '100%',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
                  {connected ? 
                    'Please share an account to use the application features.' : 
                    'Connect your Radix wallet to use the application features.'}
                </p>
                
                <button
                  onClick={handleConnectWallet}
                  style={{
                    backgroundColor: '#4CAF50',
                    padding: '10px',
                    borderRadius: '8px',
                    color: 'white',
                    width: '100%',
                    textAlign: 'center',
                    border: 'none',
                    fontWeight: 'bold',
                    marginBottom: '10px'
                  }}
                >
                  {connected ? 'Share Account' : 'Connect Wallet'}
                </button>
                
                <button
                  onClick={() => setShowDialog(false)}
                  style={{
                    backgroundColor: 'transparent',
                    padding: '10px',
                    borderRadius: '8px',
                    color: 'white',
                    width: '100%',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileRadixWrapper;
