// src/components/battle/PlayerHand.jsx - Improved Hand Component with Better Card Layout
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const PlayerHand = ({ 
  hand, 
  onSelectCard, 
  disabled, 
  selectedCreature, 
  selectedCardId, 
  hasFieldSelection, 
  hasHandSelection,
  className = '' // Add className prop
}) => {
  const [isHandExpanded, setIsHandExpanded] = useState(false);

  const handleCardClick = (creature) => {
    if (disabled) return;
    onSelectCard(creature);
  };

  // Clear expanded state when disabled
  useEffect(() => {
    if (disabled) {
      // Keep hand visible but not expanded on desktop
      if (window.innerWidth >= 769) {
        setIsHandExpanded(false);
      }
    }
  }, [disabled]);

  // Keep hand expanded when a hand card is selected on desktop
  useEffect(() => {
    if (hasHandSelection && window.innerWidth >= 769) {
      setIsHandExpanded(true);
    }
  }, [hasHandSelection]);

  if (!hand || hand.length === 0) {
    return (
      <div className={`player-hand ${disabled ? 'disabled' : ''} ${className}`}>
        <div className="empty-hand">No cards in hand</div>
      </div>
    );
  }

  const isTouchDevice = 'ontouchstart' in window;
  const isDesktop = window.innerWidth >= 769;

  return (
    <div 
      className={`player-hand ${disabled ? 'disabled' : ''} ${isHandExpanded ? 'expanded' : ''} ${hasFieldSelection ? 'field-selected' : ''} ${hasHandSelection ? 'hand-selected' : ''} ${className}`}
      onMouseEnter={() => isDesktop && !isTouchDevice && !hasFieldSelection && setIsHandExpanded(true)}
      onMouseLeave={() => isDesktop && !isTouchDevice && !hasHandSelection && setIsHandExpanded(false)}
      style={{ overflow: 'visible' }} /* Force visibility */
    >
      <div className="hand-cards" style={{ overflow: 'visible' }}>
        {hand.map((creature, index) => (
          <div
            key={creature.id}
            className={`hand-card-wrapper ${
              selectedCardId === creature.id ? 'selected' : ''
            }`}
            onClick={() => handleCardClick(creature)}
            style={{ 
              zIndex: selectedCardId === creature.id ? 1002 : (index + 100),
              position: 'relative'
            }}
          >
            {/* Creature Card */}
            <div 
              className={`creature-card ${
                creature.rarity ? creature.rarity.toLowerCase() : ''
              }`}
              data-rarity={creature.rarity || 'Common'}
              style={{ 
                transform: selectedCardId === creature.id ? 'translateY(-50px) scale(1.2)' : 'none',
                position: 'relative',
                zIndex: selectedCardId === creature.id ? 1002 : 100
              }}
            >
              {/* Card Header - Shows rarity color */}
              <div className="creature-card-header">
                <span className="creature-name" title={creature.species_name}>
                  {creature.species_name}
                </span>
                <span className="creature-form">
                  {creature.form === 0 ? 'Egg' : `F${creature.form}`}
                </span>
              </div>

              {/* Card Image */}
              <div className="creature-image-container">
                <img 
                  src={creature.image_url || '/assets/placeholder-creature.png'} 
                  alt={creature.species_name}
                  className="creature-image"
                  onError={(e) => {
                    e.target.src = '/assets/placeholder-creature.png';
                    e.target.classList.add('image-fallback');
                  }}
                />
              </div>

              {/* Card Footer with Stats */}
              <div className="creature-card-footer">
                {/* Health Bar */}
                <div className="health-bar-container">
                  <div 
                    className="health-bar"
                    style={{ 
                      width: `${(creature.currentHealth / creature.battleStats.maxHealth) * 100}%` 
                    }}
                    data-health={
                      creature.currentHealth <= creature.battleStats.maxHealth * 0.25 ? 'critical' :
                      creature.currentHealth <= creature.battleStats.maxHealth * 0.5 ? 'low' : 'normal'
                    }
                  />
                  <span className="health-text">
                    {creature.currentHealth}/{creature.battleStats.maxHealth}
                  </span>
                </div>

                {/* Stats Grid - Always visible on all devices */}
                <div className="mini-stats">
                  <div className="mini-stat" title="Physical Attack">
                    <span className="stat-icon">⚔️</span>
                    <span className="stat-value">{creature.battleStats.physicalAttack}</span>
                  </div>
                  
                  <div className="mini-stat" title="Magical Attack">
                    <span className="stat-icon">✨</span>
                    <span className="stat-value">{creature.battleStats.magicalAttack}</span>
                  </div>
                  
                  <div className="mini-stat" title="Initiative">
                    <span className="stat-icon">⚡</span>
                    <span className="stat-value">{creature.battleStats.initiative}</span>
                  </div>
                  
                  <div className="mini-stat" title="Physical Defense">
                    <span className="stat-icon">🛡️</span>
                    <span className="stat-value">{creature.battleStats.physicalDefense}</span>
                  </div>
                  
                  <div className="mini-stat" title="Magical Defense">
                    <span className="stat-icon">🔮</span>
                    <span className="stat-value">{creature.battleStats.magicalDefense}</span>
                  </div>
                  
                  <div className="mini-stat special-slot" title="Energy Cost">
                    <span className="stat-icon">💎</span>
                    <span className="stat-value">{creature.battleStats.energyCost || 3}</span>
                  </div>
                </div>
              </div>

              {/* Status Effects (if any) */}
              {creature.activeEffects && creature.activeEffects.length > 0 && (
                <div className="status-effects">
                  {creature.activeEffects.map((effect, idx) => (
                    <div 
                      key={idx} 
                      className={`status-icon ${effect.type}`}
                      title={effect.name}
                    >
                      {effect.icon || '✦'}
                    </div>
                  ))}
                </div>
              )}

              {/* Defending Shield (if defending) */}
              {creature.isDefending && (
                <div className="defending-shield" title="Defending">🛡️</div>
              )}
            </div>
          </div>
        ))}
        
        {/* Indicator for scrollable content - only show when hand has more than 5 cards */}
        {hand.length > 5 && (
          <div className="more-cards-indicator">
            <span className="scroll-arrow">←</span>
            <span className="scroll-text">Scroll</span>
            <span className="scroll-arrow">→</span>
          </div>
        )}
      </div>
    </div>
  );
};

PlayerHand.propTypes = {
  hand: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    species_name: PropTypes.string.isRequired,
    form: PropTypes.number,
    rarity: PropTypes.string,
    image_url: PropTypes.string,
    currentHealth: PropTypes.number.isRequired,
    battleStats: PropTypes.shape({
      maxHealth: PropTypes.number.isRequired,
      physicalAttack: PropTypes.number.isRequired,
      magicalAttack: PropTypes.number.isRequired,
      physicalDefense: PropTypes.number.isRequired,
      magicalDefense: PropTypes.number.isRequired,
      initiative: PropTypes.number.isRequired,
      energyCost: PropTypes.number
    }).isRequired,
    activeEffects: PropTypes.array,
    isDefending: PropTypes.bool
  })).isRequired,
  onSelectCard: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  selectedCreature: PropTypes.object,
  selectedCardId: PropTypes.string,
  hasFieldSelection: PropTypes.bool,
  hasHandSelection: PropTypes.bool,
  className: PropTypes.string
};

PlayerHand.defaultProps = {
  disabled: false,
  selectedCreature: null,
  selectedCardId: null,
  hasFieldSelection: false,
  hasHandSelection: false,
  className: ''
};

export default PlayerHand;
