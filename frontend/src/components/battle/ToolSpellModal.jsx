// src/components/battle/ToolSpellModal.jsx - FIXED INFINITE RENDERING
import React, { useState, useEffect, useMemo } from 'react';
import { getToolEffect, getSpellEffect } from '../../utils/itemEffects';

const ToolSpellModal = ({ items, type, onSelect, onClose, showTabs = false, casterStats = null }) => {
  // State to track active tab when in combined special mode
  const [activeTab, setActiveTab] = useState(type || 'tool');
  
  // Effect to ensure body has a class that helps with z-index stacking
  useEffect(() => {
    // Add class to body to help with z-index management
    document.body.classList.add('modal-open');
    
    // Force any player hands to lower z-index
    const playerHandElements = document.querySelectorAll('.player-hand, .hand-cards');
    playerHandElements.forEach(el => {
      el.style.zIndex = '50';
      el.classList.add('behind-modal');
    });
    
    return () => {
      // Clean up
      document.body.classList.remove('modal-open');
      playerHandElements.forEach(el => {
        el.style.removeProperty('z-index');
        el.classList.remove('behind-modal');
      });
    };
  }, []);
  
  // Get detailed item stats based on actual game mechanics
  const getDetailedItemStats = (item, itemType) => {
    if (itemType === 'tool') {
      const effect = getToolEffect(item);
      return {
        effect: effect,
        type: item.tool_type,
        effectName: item.tool_effect
      };
    } else {
      // For spells, we need caster's magic stat
      const casterMagic = casterStats?.magic || 5;
      const effect = getSpellEffect(item, casterMagic);
      return {
        effect: effect,
        type: item.spell_type,
        effectName: item.spell_effect,
        casterMagic: casterMagic
      };
    }
  };
  
  // Format stat changes for display
  const formatStatChanges = (statChanges) => {
    if (!statChanges || Object.keys(statChanges).length === 0) return null;
    
    return Object.entries(statChanges).map(([stat, value]) => {
      const statNames = {
        physicalAttack: 'Physical Attack',
        magicalAttack: 'Magical Attack',
        physicalDefense: 'Physical Defense',
        magicalDefense: 'Magical Defense',
        maxHealth: 'Max Health',
        initiative: 'Initiative',
        criticalChance: 'Critical Chance',
        dodgeChance: 'Dodge Chance',
        energyCost: 'Energy Cost'
      };
      
      const displayName = statNames[stat] || stat;
      const displayValue = value > 0 ? `+${value}` : `${value}`;
      const color = value > 0 ? '#4CAF50' : '#F44336';
      
      return { name: displayName, value: displayValue, color };
    });
  };
  
  // Get effect icon based on effect type
  const getEffectIcon = (effectName) => {
    const icons = {
      'Surge': '⚡',
      'Shield': '🛡️',
      'Echo': '🔊',
      'Drain': '🩸',
      'Charge': '🔋'
    };
    return icons[effectName] || '✨';
  };
  
  // Get type icon based on stat type
  const getTypeIcon = (typeName) => {
    const icons = {
      'energy': '⚡',
      'strength': '💪',
      'magic': '✨',
      'stamina': '❤️',
      'speed': '💨'
    };
    return icons[typeName] || '⭐';
  };
  
  // Get enhanced description with exact mechanics
  const getEnhancedDescription = (item, itemType, detailedStats) => {
    const { effect, type, effectName } = detailedStats;
    const descriptions = [];
    
    if (itemType === 'tool') {
      // Tool descriptions based on actual effects
      switch (effectName) {
        case 'Surge':
          if (type === 'energy') {
            descriptions.push('Reduces energy costs and provides energy regeneration');
            descriptions.push(`Energy Cost: ${effect.statChanges?.energyCost || 0} per action`);
            descriptions.push(`Energy Gain: +${effect.energyGain || 0} per turn`);
          } else if (type === 'strength') {
            descriptions.push('Massively boosts physical power temporarily');
            descriptions.push(`Physical Attack: +${effect.statChanges?.physicalAttack || 0}`);
            descriptions.push(`Physical Defense: +${effect.statChanges?.physicalDefense || 0}`);
          } else if (type === 'magic') {
            descriptions.push('Enhances all defensive capabilities and restores health');
            if (effect.healthChange) descriptions.push(`Instant Heal: +${effect.healthChange} HP`);
          } else if (type === 'stamina') {
            descriptions.push('Provides healing and builds defensive power over time');
            if (effect.healthChange) descriptions.push(`Instant Heal: +${effect.healthChange} HP`);
            if (effect.chargeEffect) {
              descriptions.push(`Charge Bonus: +${effect.chargeEffect.perTurnBonus} defense per turn`);
              descriptions.push(`Final Burst: +${effect.chargeEffect.finalBurst} HP after ${effect.chargeEffect.maxTurns} turns`);
            }
          } else if (type === 'speed') {
            descriptions.push('Trades defense for increased offensive power');
            descriptions.push('Warning: Reduces defensive stats!');
          }
          break;
          
        case 'Shield':
          descriptions.push('Grants defensive protection against attacks');
          descriptions.push('Increases resistance to all damage types');
          break;
          
        case 'Echo':
          descriptions.push('Creates effects that persist over multiple turns');
          descriptions.push('Perfect for sustained combat advantages');
          break;
          
        case 'Drain':
          descriptions.push('Converts defensive power into offensive might');
          descriptions.push('Ideal for aggressive strategies');
          break;
          
        case 'Charge':
          descriptions.push('Accumulates power over time for maximum impact');
          descriptions.push('Requires patience but delivers powerful results');
          break;
      }
      
      if (effect.duration) {
        descriptions.push(`Duration: ${effect.duration} turn${effect.duration > 1 ? 's' : ''}`);
      }
      
    } else {
      // Spell descriptions based on actual effects
      const magicPower = detailedStats.casterMagic;
      
      switch (effectName) {
        case 'Surge':
          if (type === 'energy') {
            descriptions.push('Babylon Burst - Devastating energy attack');
            descriptions.push(`Base Damage: ${Math.round(20 * (1 + magicPower * 0.15))}`);
            descriptions.push('Special: Armor piercing, 15% critical chance');
          } else if (type === 'strength') {
            descriptions.push('Scrypto Surge - Drains enemy power while healing');
            descriptions.push(`Base Damage: ${Math.round(18 * (1 + magicPower * 0.15))}`);
            descriptions.push(`Self Heal: ${Math.round(10 * (1 + magicPower * 0.15))}`);
            descriptions.push('Drains -3 Physical/Magical Attack from target');
          } else if (type === 'magic') {
            descriptions.push('Shardstorm - Charges up for massive area damage');
            descriptions.push('Requires 1 turn to charge');
            descriptions.push(`Charged Damage: ${Math.round(35 * (1 + magicPower * 0.15))}`);
            descriptions.push('20% chance to stun on impact');
          } else if (type === 'stamina') {
            descriptions.push('Cerberus Chain - Powerful defensive enhancement');
            descriptions.push(`Instant Heal: ${Math.round(15 * (1 + magicPower * 0.15))}`);
            descriptions.push('Grants +8 Physical/Magical Defense, +15 Max Health');
            descriptions.push('15% damage reduction for 3 turns');
          } else if (type === 'speed') {
            descriptions.push('Engine Overclock - Boosts speed and regeneration');
            descriptions.push('Grants +5 Initiative, +3 Dodge/Critical Chance');
            descriptions.push(`Regeneration: +3 HP per turn`);
          }
          break;
          
        case 'Shield':
          descriptions.push('Creates a protective magical barrier');
          descriptions.push('Absorbs damage and provides healing');
          break;
          
        case 'Echo':
          descriptions.push('Applies lingering magical effects');
          descriptions.push('Effects repeat each turn for the duration');
          break;
          
        case 'Drain':
          descriptions.push('Steals life force from the target');
          descriptions.push('Damages enemy while healing the caster');
          break;
          
        case 'Charge':
          descriptions.push('Requires preparation for devastating effect');
          descriptions.push('Delayed but extremely powerful impact');
          break;
      }
      
      // Add damage/healing info
      if (effect.damage) {
        descriptions.push(`Total Damage: ${effect.damage}`);
      }
      if (effect.healing) {
        descriptions.push(`Total Healing: ${effect.healing}`);
      }
      if (effect.selfHeal) {
        descriptions.push(`Self Healing: ${effect.selfHeal}`);
      }
      if (effect.healthOverTime) {
        descriptions.push(`Health per Turn: ${effect.healthOverTime > 0 ? '+' : ''}${effect.healthOverTime}`);
      }
      
      if (effect.duration && effect.duration > 0) {
        descriptions.push(`Duration: ${effect.duration} turn${effect.duration > 1 ? 's' : ''}`);
      }
      
      if (effect.prepareEffect) {
        descriptions.push(`Charge Time: ${effect.prepareEffect.turns} turn${effect.prepareEffect.turns > 1 ? 's' : ''}`);
      }
    }
    
    return descriptions;
  };
  
  // Function to handle item selection
  const handleItemSelect = (item) => {
    onSelect(item);
  };
  
  // CRITICAL FIX: Memoize all item calculations to prevent re-renders
  const processedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    return items.map(item => {
      const detailedStats = getDetailedItemStats(item, type);
      const statChanges = formatStatChanges(detailedStats.effect.statChanges);
      const descriptions = getEnhancedDescription(item, type, detailedStats);
      
      return {
        ...item,
        _processed: {
          detailedStats,
          statChanges,
          descriptions
        }
      };
    });
  }, [items, type, casterStats]); // Only recalculate when these change
  
  // If there's no items or the array is empty, show a message
  if (!items || items.length === 0) {
    return (
      <div className="tool-spell-modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
        <div className="tool-spell-modal" onClick={(e) => e.stopPropagation()} style={{ zIndex: 100000 }}>
          <div className="modal-header">
            <h3>No {type}s Available</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-content">
            <p>You don't have any {type}s to use right now.</p>
            <button className="action-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }
  
  // If using the special mode with tabs, filter items by active tab
  let displayedItems = processedItems;
  
  // Standard single-type modal
  return (
    <div className="tool-spell-modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="tool-spell-modal enhanced" onClick={(e) => e.stopPropagation()} style={{ zIndex: 100000 }}>
        <div className="modal-header">
          <h3>Select a {type === 'tool' ? 'Tool' : 'Spell'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="items-grid enhanced">
            {displayedItems.map(item => {
              // Use pre-calculated values
              const { detailedStats, statChanges, descriptions } = item._processed;
              
              return (
                <div 
                  key={item.id}
                  className="item-card enhanced"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="item-header">
                    <img 
                      src={item.image_url || `/assets/${type}_default.png`}
                      alt={item.name}
                      className="item-image"
                    />
                    <div className="item-title">
                      <div className="item-name">{item.name}</div>
                      <div className="item-type-effect">
                        <span className="type-icon">{getTypeIcon(item[`${type}_type`])}</span>
                        <span className="effect-icon">{getEffectIcon(item[`${type}_effect`])}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="item-details enhanced">
                    <div className="item-properties">
                      <div className="property-row">
                        <span className="property-label">Type:</span>
                        <span className="property-value">{item[`${type}_type`]}</span>
                      </div>
                      <div className="property-row">
                        <span className="property-label">Effect:</span>
                        <span className="property-value">{item[`${type}_effect`]}</span>
                      </div>
                    </div>
                    
                    {/* Stat Changes Section */}
                    {statChanges && statChanges.length > 0 && (
                      <div className="stat-changes">
                        <div className="stat-changes-header">Stat Changes:</div>
                        {statChanges.map((stat, index) => (
                          <div key={index} className="stat-change-row">
                            <span className="stat-name">{stat.name}:</span>
                            <span className="stat-value" style={{ color: stat.color }}>
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Detailed Description */}
                    <div className="item-description enhanced">
                      {descriptions.map((desc, index) => (
                        <div key={index} className="description-line">
                          {desc}
                        </div>
                      ))}
                    </div>
                    
                    {/* Energy Cost for Spells */}
                    {type === 'spell' && (
                      <div className="energy-cost">
                        <span className="cost-icon">⚡</span>
                        <span className="cost-value">4 Energy</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="item-footer">
                    <button className="select-button">
                      Use {type === 'tool' ? 'Tool' : 'Spell'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolSpellModal;
