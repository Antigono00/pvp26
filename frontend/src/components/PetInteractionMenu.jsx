// src/components/PetInteractionMenu.jsx
import React, { useState } from 'react';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const PetInteractionMenu = ({ pet, onClose }) => {
  const {
    movePet,
    setSelectedPetToMove,
    setInPetMoveMode,
    initiateBuyEnergy,
    addNotification,
    formatResource
  } = useContext(GameContext);

  const {
    connected: isRadixConnected,
    accounts: radixAccounts,
    updateAccountSharing
  } = useRadixConnect();

  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [cvxCost, setCvxCost] = useState(200); // Default to 200 CVX

  const handleMoveSelect = () => {
    // Start pet move mode
    setSelectedPetToMove(pet.id);
    setInPetMoveMode(true);
    onClose();
  };

  const handleBuyEnergy = async () => {
    // Check if wallet is connected
    if (!isRadixConnected || !radixAccounts || radixAccounts.length === 0) {
      addNotification("Connect Radix wallet and share account!", 400, 300, "`#FF3D00`");
      updateAccountSharing();
      return;
    }

    setPurchaseInProgress(true);

    try {
      // Get account address
      const accountAddress = radixAccounts[0].address;

      // Initiate energy purchase
      const success = await initiateBuyEnergy(accountAddress);

      if (success) {
        // Transaction sent successfully
        addNotification("Energy purchase initiated!", 400, 300, "`#4CAF50`");
      } else {
        // Transaction failed
        addNotification("Failed to initiate energy purchase", 400, 300, "`#FF3D00`");
      }
    } catch (error) {
      console.error("Error buying energy:", error);
      addNotification("Error buying energy", 400, 300, "`#FF3D00`");
    } finally {
      setPurchaseInProgress(false);
      onClose();
    }
  };

  return (
    <div className="pet-interaction-menu">
      <h2>Cat Options</h2>

      <div className="pet-interaction-content">
        <div className="pet-image-container">
          <img src="/assets/Cat.png" alt="Cat" className="pet-preview" />
        </div>

        <div className="pet-action-buttons">
          <button
            onClick={handleMoveSelect}
            style={{ backgroundColor: '`#2196F3`' }}
          >
            <span className="icon">⟷</span> Move Cat
          </button>

          <button
            onClick={handleBuyEnergy}
            disabled={purchaseInProgress}
            style={{
              backgroundColor: '`#FF9800`',
              opacity: purchaseInProgress ? 0.7 : 1
            }}
          >
            <span className="icon">⚡</span>
            Buy 500 Energy for {cvxCost} CVX
            {purchaseInProgress && <span className="spinner"></span>}
          </button>

          <button
            onClick={onClose}
            style={{ backgroundColor: '#333' }}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="wallet-status">
        {!isRadixConnected && (
          <p className="wallet-warning">Connect Radix wallet to buy energy</p>
        )}
      </div>
    </div>
  );
};

export default PetInteractionMenu;
