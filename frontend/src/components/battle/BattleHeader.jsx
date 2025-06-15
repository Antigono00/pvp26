// src/components/battle/BattleHeader.jsx
import React, { useState, useEffect } from 'react';

const BattleHeader = ({ 
  turn, 
  playerEnergy, 
  enemyEnergy,
  difficulty,
  activePlayer,
  playerActiveSynergies = [],
  enemyActiveSynergies = []
}) => {
  // Mobile detection
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = windowWidth <= 768;
  
  // Helper to format synergy icons
  const getSynergyIcon = (synergy) => {
    const synergyIcons = {
      'species': '👥',
      'legendary_presence': '⭐',
      'stat_synergy': '💪',
      'form_protection': '🛡️',
      'balanced_team': '⚖️',
      'full_field': '🔥',
      'fortress_formation': '🏰',
      'arcane_resonance': '✨',
      'blitz_assault': '⚡',
      'enduring_will': '🔋',
      'swift_casting': '🌟'
    };
    
    return synergy.icon || synergyIcons[synergy.type] || '🎯';
  };
  
  // Calculate total synergy bonus
  const calculateTotalBonus = (synergies) => {
    if (!synergies || synergies.length === 0) return 0;
    return synergies.reduce((total, syn) => total + (syn.bonus || 0), 0);
  };
  
  const playerTotalBonus = calculateTotalBonus(playerActiveSynergies);
  const enemyTotalBonus = calculateTotalBonus(enemyActiveSynergies);
  
  const getDifficultyColor = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#FF9800';
      case 'expert': return '#FF5722';
      default: return '#4CAF50';
    }
  };
  
  // Mobile layout
  if (isMobile) {
    return (
      <div className="battle-header">
        {/* Left: Turn and difficulty */}
        <div className="battle-info">
          <div className="turn-counter">
            <span className="turn-label">T</span>
            <span className="turn-number">{turn}</span>
          </div>
          
          <div className="difficulty-indicator" 
            style={{ backgroundColor: getDifficultyColor(difficulty) }}>
            {difficulty.charAt(0).toUpperCase()}
          </div>
          
          <div className={`active-player-indicator ${activePlayer === 'enemy' ? 'enemy-active' : 'player-active'}`}>
            {activePlayer === 'player' ? '👤' : '🤖'}
          </div>
        </div>
        
        {/* Right: Energy with synergy bonuses */}
        <div className="energy-displays">
          <div 
            className="player-energy"
            data-synergy={playerTotalBonus > 0 ? `+${Math.round(playerTotalBonus * 100)}%` : ''}
          >
            <div className="energy-value">{playerEnergy}</div>
          </div>
          
          <div 
            className="enemy-energy"
            data-synergy={enemyTotalBonus > 0 ? `+${Math.round(enemyTotalBonus * 100)}%` : ''}
          >
            <div className="energy-value">{enemyEnergy}</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop layout
  return (
    <div className="battle-header">
      {/* Left: Turn and difficulty */}
      <div className="battle-info">
        <div className="turn-counter">
          <span className="turn-label">TURN</span>
          <span className="turn-number">{turn}</span>
        </div>
        
        <div className="difficulty-indicator" 
          style={{ backgroundColor: getDifficultyColor(difficulty) }}>
          {difficulty.toUpperCase()}
        </div>
        
        <div className={`active-player-indicator ${activePlayer === 'enemy' ? 'enemy-active' : 'player-active'}`}>
          {activePlayer === 'player' ? 'YOUR TURN' : 'ENEMY TURN'}
        </div>
      </div>
      
      {/* Center: Synergy displays with hover */}
      <div className="field-synergies">
        {playerActiveSynergies.length > 0 && (
          <div className="synergy-display">
            <span className="synergy-label">YOUR SYNERGY</span>
            <span className="synergy-total">+{Math.round(playerTotalBonus * 100)}%</span>
            
            {/* Hover details */}
            <div className="synergy-details">
              <div className="synergy-details-title">Synergy Breakdown</div>
              {playerActiveSynergies.map((synergy, index) => (
                <div key={index} className="synergy-item">
                  <div className="synergy-item-name">
                    <span className="synergy-item-icon">{getSynergyIcon(synergy)}</span>
                    <span>{synergy.name || synergy.type}</span>
                  </div>
                  <span className="synergy-item-value">+{Math.round(synergy.bonus * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {enemyActiveSynergies.length > 0 && (
          <div className="synergy-display enemy">
            <span className="synergy-label">ENEMY SYNERGY</span>
            <span className="synergy-total">+{Math.round(enemyTotalBonus * 100)}%</span>
            
            {/* Hover details */}
            <div className="synergy-details">
              <div className="synergy-details-title">Synergy Breakdown</div>
              {enemyActiveSynergies.map((synergy, index) => (
                <div key={index} className="synergy-item">
                  <div className="synergy-item-name">
                    <span className="synergy-item-icon">{getSynergyIcon(synergy)}</span>
                    <span>{synergy.name || synergy.type}</span>
                  </div>
                  <span className="synergy-item-value">+{Math.round(synergy.bonus * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Right: Energy displays */}
      <div className="energy-displays">
        <div className="player-energy">
          <div className="energy-label">YOUR ENERGY</div>
          <div className="energy-value">{playerEnergy}</div>
        </div>
        
        <div className="enemy-energy">
          <div className="energy-label">ENEMY ENERGY</div>
          <div className="energy-value">{enemyEnergy}</div>
        </div>
      </div>
    </div>
  );
};

export default BattleHeader;
