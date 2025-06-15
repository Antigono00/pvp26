// src/components/battle/ToolSpellModal.jsx - ACCURATE EFFECT DISPLAY
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
      'surge': '⚡',
      'shield': '🛡️',
      'echo': '🔊',
      'drain': '🩸',
      'charge': '🔋',
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
  
  // Get precise effect description from the actual effect data
  const getPreciseEffectDescription = (item, itemType, detailedStats) => {
    const { effect, type, effectName } = detailedStats;
    const descriptions = [];
    
    if (itemType === 'tool') {
      // Tools - read from the actual effect data
      const toolName = item.name;
      
      switch (toolName) {
        case 'Babylon Keystone':
          descriptions.push('Energy efficiency that echoes with decaying power');
          descriptions.push(`Duration: ${effect.duration} turns`);
          descriptions.push('Echo Effect: 100% → 70% → 49% → 34% power');
          descriptions.push('Per Turn Benefits:');
          descriptions.push('• Energy cost reduction (starts at -1)');
          descriptions.push('• Energy gain per turn (starts at 2)');
          descriptions.push('• Healing per turn (starts at 2 HP)');
          break;
          
        case 'Hyperscale Capacitor':
          descriptions.push('Massive strength surge for quick bursts');
          descriptions.push(`Duration: ${effect.duration} turns`);
          descriptions.push('Stat Bonuses:');
          descriptions.push('• Physical Attack: +15');
          descriptions.push('• Physical Defense: +8');
          descriptions.push('• Healing: +5 HP per turn');
          break;
          
        case 'Ledger Lens':
          descriptions.push('Magical shield with strong defensive properties');
          descriptions.push(`Duration: ${effect.duration} turns`);
          descriptions.push('Initial Effects:');
          descriptions.push('• Max Health: +20 (first turn only)');
          descriptions.push('• Barrier: 20 damage absorption');
          descriptions.push('Ongoing Effects:');
          descriptions.push('• Physical Defense: +12');
          descriptions.push('• Magical Defense: +12');
          descriptions.push('• Healing: +8 HP per turn');
          break;
          
        case 'Olympia Emblem':
          descriptions.push('Charges up power over time');
          descriptions.push(`Duration: ${effect.duration} turns`);
          descriptions.push('Charge Progression:');
          descriptions.push('• Turn 1: +5 Defense, +13 HP');
          descriptions.push('• Turn 2: +10 Defense, +16 HP');
          descriptions.push('• Turn 3: +15 Defense, +19 HP');
          descriptions.push('• Turn 4: +20 Defense, +47 HP (Final Burst!)');
          descriptions.push('Defense boost applies to both Physical and Magical (50%)');
          break;
          
        case 'Validator Core':
          descriptions.push('Drains defense to boost offensive power');
          descriptions.push(`Duration: ${effect.duration} turns`);
          descriptions.push('Trade-off Effects:');
          descriptions.push('• Physical Attack: +10');
          descriptions.push('• Magical Attack: +10');
          descriptions.push('• Physical Defense: -3');
          descriptions.push('• Magical Defense: -3');
          descriptions.push('• Healing: +7 HP per turn');
          break;
          
        default:
          // Fallback for unknown tools
          if (effect.statChanges) {
            descriptions.push('Stat Changes:');
            Object.entries(effect.statChanges).forEach(([stat, value]) => {
              descriptions.push(`• ${stat}: ${value > 0 ? '+' : ''}${value}`);
            });
          }
          if (effect.healthOverTime) {
            descriptions.push(`Healing: +${effect.healthOverTime} HP per turn`);
          }
          if (effect.duration) {
            descriptions.push(`Duration: ${effect.duration} turns`);
          }
      }
      
    } else {
      // Spells - read from the actual effect data
      const spellName = item.name;
      const magicPower = 1 + (detailedStats.casterMagic * 0.15);
      
      switch (spellName) {
        case 'Babylon Burst':
          const burstDamage = Math.round(30 * magicPower);
          descriptions.push('Instant massive energy damage');
          descriptions.push(`Base Damage: ${burstDamage}`);
          descriptions.push('• 20% critical hit chance (1.5x damage)');
          descriptions.push('• Armor piercing (ignores defense)');
          descriptions.push('• Energy Cost: 4');
          break;
          
        case 'Scrypto Surge':
          const surgeDamage = Math.round(12 * magicPower);
          const surgeHeal = Math.round(10 * magicPower);
          descriptions.push('Drains power from enemy while healing');
          descriptions.push(`Duration: 3 turns`);
          descriptions.push('Per Turn Effects:');
          descriptions.push(`• Damage: ${surgeDamage} HP`);
          descriptions.push(`• Self Healing: ${surgeHeal} HP`);
          descriptions.push('First Turn Only:');
          descriptions.push('• Steal 4 Physical/Magical Attack from target');
          descriptions.push('• Gain 3 Physical/Magical Attack');
          descriptions.push('• Energy Cost: 4');
          break;
          
        case 'Shardstorm':
          const shardDamage = Math.round(35 * magicPower);
          descriptions.push('Charges up for devastating area damage');
          descriptions.push('• Requires 1 turn to charge');
          descriptions.push(`• Damage After Charge: ${shardDamage}`);
          descriptions.push('• Area Effect (hits all enemies)');
          descriptions.push('• 20% chance to stun target');
          descriptions.push('• Energy Cost: 4');
          break;
          
        case 'Cerberus Chain':
          const chainHeal = Math.round(15 * magicPower);
          const chainRegen = Math.round(5 * magicPower);
          descriptions.push('Powerful defensive enhancement with healing');
          descriptions.push(`Instant Heal: ${chainHeal} HP`);
          descriptions.push(`Duration: 3 turns`);
          descriptions.push('Defensive Buffs:');
          descriptions.push('• Physical Defense: +8');
          descriptions.push('• Magical Defense: +8');
          descriptions.push('• Max Health: +15');
          descriptions.push('• Damage Reduction: 15%');
          descriptions.push(`• Regeneration: ${chainRegen} HP per turn`);
          descriptions.push('• Energy Cost: 4');
          break;
          
        case 'Engine Overclock':
          descriptions.push('Speed boost that echoes with decreasing power');
          descriptions.push(`Duration: 4 turns`);
          descriptions.push('Echo Progression (100% → 70% → 49% → 34%):');
          descriptions.push('Turn 1: +10 Initiative, +3 Dodge/Crit, +3 HP');
          descriptions.push('Turn 2: +7 Initiative, +2 Dodge/Crit, +2 HP');
          descriptions.push('Turn 3: +5 Initiative, +1 Dodge/Crit, +1 HP');
          descriptions.push('Turn 4: +3 Initiative, +1 Dodge/Crit, +1 HP');
          descriptions.push('• Energy Cost: 4');
          break;
          
        default:
          // Fallback for unknown spells
          if (effect.damage) {
            descriptions.push(`Damage: ${effect.damage}`);
          }
          if (effect.healing) {
            descriptions.push(`Healing: ${effect.healing}`);
          }
          if (effect.duration && effect.duration > 0) {
            descriptions.push(`Duration: ${effect.duration} turns`);
          }
          descriptions.push('• Energy Cost: 4');
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
      const descriptions = getPreciseEffectDescription(item, type, detailedStats);
      
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
                        <span className="property-value capitalize">{item[`${type}_type`]}</span>
                      </div>
                      <div className="property-row">
                        <span className="property-label">Effect:</span>
                        <span className="property-value capitalize">{item[`${type}_effect`]}</span>
                      </div>
                    </div>
                    
                    {/* Detailed Description with Precise Values */}
                    <div className="item-description enhanced precise">
                      {descriptions.map((desc, index) => (
                        <div key={index} className={`description-line ${desc.startsWith('•') ? 'indent' : ''} ${desc.includes(':') && !desc.startsWith('•') ? 'section-header' : ''}`}>
                          {desc}
                        </div>
                      ))}
                    </div>
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
      
      <style jsx>{`
        .item-description.precise {
          margin-top: 12px;
          font-size: 0.9em;
          line-height: 1.5;
        }
        
        .description-line {
          margin-bottom: 4px;
          color: #e0e0e0;
        }
        
        .description-line.indent {
          margin-left: 15px;
          color: #b0b0b0;
        }
        
        .description-line.section-header {
          font-weight: 600;
          color: #ffffff;
          margin-top: 8px;
          margin-bottom: 6px;
        }
        
        .property-value.capitalize {
          text-transform: capitalize;
        }
        
        .item-card.enhanced {
          cursor: pointer;
          transition: all 0.3s ease;
          max-height: 600px;
          overflow-y: auto;
        }
        
        .item-card.enhanced:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }
        
        .items-grid.enhanced {
          gap: 20px;
          padding: 10px;
        }
      `}</style>
    </div>
  );
};

export default ToolSpellModal;
