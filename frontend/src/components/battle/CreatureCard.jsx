// src/components/battle/CreatureCard.jsx - Enhanced with Status Effects and Tooltips
import React, { useState, useEffect } from 'react';
import { getRarityColor } from '../../utils/uiHelpers';
import { getPlaceholderForForm } from '../../utils/enemyPlaceholders';

// Helper function to get effect icons
const getEffectIcon = (effect) => {
  const icons = {
    'Surge': '⚡',
    'Shield': '🛡️',
    'Echo': '🔊',
    'Drain': '🩸',
    'Charge': '🔋',
    'buff': '↑',
    'debuff': '↓',
    'legendary_blessing': '👑',
    'energy_burst': '⚡',
    'epic_blessing': '💜',
    'defensive': '🛡️',
    'defense': '🛡️',
    'charge': '🔋'
  };
  return icons[effect.effectType] || icons[effect.type] || '✨';
};

// Helper function to format stat modifications
const formatStatMod = (stat, value) => {
  const statAbbreviations = {
    physicalAttack: 'ATK',
    magicalAttack: 'MATK',
    physicalDefense: 'DEF',
    magicalDefense: 'MDEF',
    initiative: 'SPD',
    criticalChance: 'CRIT',
    dodgeChance: 'DODGE',
    maxHealth: 'HP',
    energyCost: 'COST'
  };
  
  const abbreviation = statAbbreviations[stat] || stat.substring(0, 3).toUpperCase();
  const sign = value > 0 ? '+' : '';
  return `${abbreviation} ${sign}${value}`;
};

const CreatureCard = ({ 
  creature, 
  isEnemy = false, 
  onClick, 
  isSelected = false, 
  isTarget = false,
  disabled = false,
  simplified = false,
  // Animation-related props
  isAnimating = false,
  isTargetOfAnimation = false,
  animationType = null,
  // Data attributes for DOM targeting
  dataPower,
  dataDefense
}) => {
  const [imageError, setImageError] = useState(false);
  const [showAttackType, setShowAttackType] = useState(false);
  const [hoveredEffect, setHoveredEffect] = useState(null);
  const [showStatChanges, setShowStatChanges] = useState(false);
  
  if (!creature) return null;
  
  // Reset image error when creature changes
  useEffect(() => {
    setImageError(false);
  }, [creature.id, creature.image_url]);
  
  // Show attack type indicator briefly when hovering or during animations
  useEffect(() => {
    if (isAnimating || isTargetOfAnimation || isSelected || isTarget) {
      setShowAttackType(true);
      
      // Hide after a delay unless still selected
      const timeout = setTimeout(() => {
        if (!isSelected && !isTarget) {
          setShowAttackType(false);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isAnimating, isTargetOfAnimation, isSelected, isTarget]);
  
  const handleImageError = () => {
    console.log(`Image failed to load for ${creature.species_name}, using placeholder`);
    setImageError(true);
  };
  
  const getImageSrc = () => {
    if (imageError || !creature.image_url) {
      return getPlaceholderForForm(creature.form || 0);
    }
    return creature.image_url;
  };
  
  const healthPercentage = creature.battleStats 
    ? (creature.currentHealth / creature.battleStats.maxHealth) * 100 
    : 100;
    
  const healthStatus = healthPercentage <= 25 ? 'critical' : healthPercentage <= 50 ? 'low' : 'normal';
  
  // Determine primary attack type for visual indicators
  const primaryAttackType = creature.battleStats?.physicalAttack > creature.battleStats?.magicalAttack 
    ? 'physical' 
    : 'magical';
  
  // Get specialty stats for highlighting
  const specialtyStats = creature.specialty_stats || [];
  
  // Check if creature has defense effect
  const hasDefenseEffect = creature.activeEffects?.some(effect => 
    effect.type === 'defense' || effect.name === 'Defensive Stance'
  );
  
  // Get the defense effect with duration
  const defenseEffect = creature.activeEffects?.find(effect => 
    effect.type === 'defense' || effect.name === 'Defensive Stance'
  );
  
  // Calculate total stat modifications from effects
  const totalStatMods = {};
  if (creature.activeEffects) {
    creature.activeEffects.forEach(effect => {
      if (effect.statModifications) {
        Object.entries(effect.statModifications).forEach(([stat, value]) => {
          totalStatMods[stat] = (totalStatMods[stat] || 0) + value;
        });
      }
    });
  }
  
  // Build CSS classes including animation states
  const cardClasses = [
    'creature-card',
    isEnemy && 'enemy',
    isSelected && 'selected',
    isTarget && 'target',
    creature.isDefending && 'defending',
    hasDefenseEffect && 'has-defense-effect',
    disabled && 'disabled',
    // Animation classes
    isAnimating && 'animating',
    isAnimating && animationType && `animating-${animationType}`,
    isTargetOfAnimation && 'animation-target',
    isTargetOfAnimation && animationType && `animation-target-${animationType}`,
    // Attack type indicator
    primaryAttackType === 'physical' && 'physical-attacker',
    primaryAttackType === 'magical' && 'magical-attacker',
    showAttackType && 'show-attack-type',
    // Enhanced features
    showStatChanges && 'show-stat-changes'
  ].filter(Boolean).join(' ');
  
  const handleClick = (e) => {
    if (!disabled && onClick) {
      e.stopPropagation();
      onClick(creature, isEnemy);
    }
  };
  
  const handleMouseEnter = () => {
    if (Object.keys(totalStatMods).length > 0) {
      setShowStatChanges(true);
    }
  };
  
  const handleMouseLeave = () => {
    setShowStatChanges(false);
    setHoveredEffect(null);
  };
  
  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-rarity={creature.rarity}
      data-id={creature.id}
      data-power={dataPower || Math.max(
        creature.battleStats?.physicalAttack || 0,
        creature.battleStats?.magicalAttack || 0
      )}
      data-defense={dataDefense || Math.max(
        creature.battleStats?.physicalDefense || 0,
        creature.battleStats?.magicalDefense || 0
      )}
      data-attack-type={primaryAttackType}
      data-health-status={healthStatus}
    >
      {/* Header WITHOUT synergy info */}
      <div className="creature-card-header">
        <span className="creature-name">{creature.species_name}</span>
        <div className="header-right">
          {/* REMOVED: Synergy level display */}
          <span className="creature-form">F{creature.form || 0}</span>
        </div>
      </div>
      
      {/* Image */}
      <div className="creature-image-container">
        <img 
          src={getImageSrc()}
          alt={creature.species_name}
          className={`creature-image ${imageError ? 'image-fallback' : ''}`}
          onError={handleImageError}
        />
        
        {/* Attack Type Indicator - Repositioned to bottom-right of image */}
        <div className={`attack-type-indicator ${primaryAttackType}`}>
          <span className="attack-icon">
            {primaryAttackType === 'physical' ? '⚔️' : '✨'}
          </span>
        </div>
        
        {/* Single Defense Effect Indicator with duration */}
        {defenseEffect && (
          <div className="defense-effect-indicator">
            <span className="defense-icon">🛡️</span>
            <span className="defense-duration">{defenseEffect.duration}</span>
          </div>
        )}
        
        {/* Stat Changes Overlay */}
        {showStatChanges && Object.keys(totalStatMods).length > 0 && (
          <div className="stat-changes-overlay">
            {Object.entries(totalStatMods).map(([stat, value]) => (
              <div 
                key={stat} 
                className={`stat-change ${value > 0 ? 'positive' : 'negative'}`}
              >
                {formatStatMod(stat, value)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer with health and stats - ALWAYS showing stats regardless of simplified prop */}
      <div 
        className="creature-card-footer"
        data-power={dataPower}
        data-defense={dataDefense}
      >
        {/* Health Bar - Always visible */}
        <div className="health-bar-container">
          <div 
            className="health-bar" 
            style={{ width: `${healthPercentage}%` }}
            data-health={healthStatus}
          />
          <span className="health-text">
            {creature.currentHealth}/{creature.battleStats?.maxHealth || 0}
          </span>
        </div>
        
        {/* Stats Grid - Show total values only (base + modifications) */}
        {creature.battleStats && (
          <div className="mini-stats">
            <div className={`mini-stat ${specialtyStats.includes('strength') ? 'primary' : ''} ${primaryAttackType === 'physical' ? 'highlight' : ''}`}>
              <span className="stat-icon">⚔️</span>
              <span className="stat-value">
                {creature.battleStats.physicalAttack + (totalStatMods.physicalAttack || 0)}
              </span>
            </div>
            <div className={`mini-stat ${specialtyStats.includes('magic') ? 'primary' : ''} ${primaryAttackType === 'magical' ? 'highlight' : ''}`}>
              <span className="stat-icon">✨</span>
              <span className="stat-value">
                {creature.battleStats.magicalAttack + (totalStatMods.magicalAttack || 0)}
              </span>
            </div>
            <div className={`mini-stat ${specialtyStats.includes('agility') ? 'primary' : ''}`}>
              <span className="stat-icon">⚡</span>
              <span className="stat-value">
                {creature.battleStats.initiative + (totalStatMods.initiative || 0)}
              </span>
            </div>
            <div className={`mini-stat ${specialtyStats.includes('defense') ? 'primary' : ''}`}>
              <span className="stat-icon">🛡️</span>
              <span className="stat-value">
                {creature.battleStats.physicalDefense + (totalStatMods.physicalDefense || 0)}
              </span>
            </div>
            <div className={`mini-stat ${specialtyStats.includes('energy') ? 'primary' : ''}`}>
              <span className="stat-icon">🔮</span>
              <span className="stat-value">
                {creature.battleStats.magicalDefense + (totalStatMods.magicalDefense || 0)}
              </span>
            </div>
            <div className="mini-stat special-slot">
              {creature.rarity === 'Legendary' && <span className="rarity-indicator">★</span>}
              {creature.rarity === 'Epic' && <span className="rarity-indicator">◆</span>}
              {creature.rarity === 'Rare' && <span className="rarity-indicator">♦</span>}
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Status Effects - Filtered to avoid duplicate defense icons */}
      {creature.activeEffects && creature.activeEffects.length > 0 && (
        <div className="status-effects">
          {creature.activeEffects
            .filter(effect => effect.type !== 'defense' && effect.name !== 'Defensive Stance')
            .map((effect, index) => (
            <div 
              key={effect.id || index} 
              className={`status-effect ${effect.type}`}
              onMouseEnter={() => setHoveredEffect(effect)}
              onMouseLeave={() => setHoveredEffect(null)}
            >
              <div className="effect-icon">{getEffectIcon(effect)}</div>
              
              {/* Duration Timer */}
              <div className="effect-duration">{effect.duration}</div>
              
              {/* Charge Progress Bar */}
              {effect.chargeProgress !== undefined && (
                <div className="charge-progress-bar">
                  <div 
                    className="charge-fill" 
                    style={{ width: `${effect.chargeProgress}%` }}
                  />
                  {effect.isReady && <span className="ready-indicator">READY!</span>}
                </div>
              )}
              
              {/* Echo/Pulse Indicator */}
              {effect.effectType === 'Echo' && (
                <div className="echo-pulse-indicator">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                </div>
              )}
              
              {/* Stack Counter */}
              {effect.stacks && effect.stacks > 1 && (
                <div className="effect-stack-counter">{effect.stacks}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Effect Tooltip */}
      {hoveredEffect && (
        <div className="effect-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-title">{hoveredEffect.name || hoveredEffect.effectType}</span>
            <span className="tooltip-type">{hoveredEffect.type}</span>
          </div>
          <div className="tooltip-body">
            {hoveredEffect.description && (
              <p className="tooltip-description">{hoveredEffect.description}</p>
            )}
            {hoveredEffect.statModifications && (
              <div className="tooltip-stats">
                {Object.entries(hoveredEffect.statModifications).map(([stat, value]) => (
                  <div key={stat} className={`tooltip-stat ${value > 0 ? 'positive' : 'negative'}`}>
                    {formatStatMod(stat, value)}
                  </div>
                ))}
              </div>
            )}
            {hoveredEffect.duration && (
              <div className="tooltip-duration">Duration: {hoveredEffect.duration} turns</div>
            )}
          </div>
        </div>
      )}
      
      {/* Buff/Debuff Icons - Simplified view */}
      {simplified && creature.buffs && creature.buffs.length > 0 && (
        <div className="buff-icons">
          {creature.buffs.map((buff, index) => (
            <span key={index} className="buff-icon" title={buff.name}>
              {buff.type === 'buff' ? '↑' : '↓'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatureCard;
