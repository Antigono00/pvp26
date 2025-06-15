// src/components/PetBuyPrompt.jsx
import React from 'react';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const PetBuyPrompt = ({ onClose, catLair }) => {
  const { buyPet, formatResource, catNips } = useContext(GameContext);
  
  const handleBuyPet = async () => {
    // Position the pet next to the Cat's Lair
    const petX = catLair.x + 100; // Offset to position next to the lair
    const petY = catLair.y + 20;
    
    // Buy the pet (will be handled in GameContext)
    await buyPet('cat', petX, petY, catLair.room, catLair.id);
    onClose();
  };
  
  return (
    <div className="pet-buy-prompt">
      <h2>Adopt a Cat</h2>
      <div className="pet-image-container">
        <img src="/assets/Cat.png" alt="Cat" className="pet-preview" />
      </div>
      <p>This cute cat would like to join your lab!</p>
      <p>It can help you with your energy needs!</p>
      <div className="pet-cost">
        <p>Cost: <span className="resource-value">{formatResource(1500)} Cat Nips</span></p>
        <p>Your Cat Nips: <span className="resource-value">{formatResource(catNips)}</span></p>
      </div>
      <div className="pet-buy-actions">
        <button 
          onClick={onClose}
          style={{ backgroundColor: '#333' }}
        >
          No Thanks
        </button>
        <button 
          onClick={handleBuyPet}
          style={{ 
            backgroundColor: catNips >= 1500 ? '#4CAF50' : '#888',
            cursor: catNips >= 1500 ? 'pointer' : 'not-allowed'
          }}
          disabled={catNips < 1500}
        >
          {catNips >= 1500 ? 'Adopt Cat' : 'Not Enough Cat Nips'}
        </button>
      </div>
    </div>
  );
};

export default PetBuyPrompt;
