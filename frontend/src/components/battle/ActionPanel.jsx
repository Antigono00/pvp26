// src/components/battle/ActionPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ToolSpellModal from './ToolSpellModal';
import { canCreatureAct } from '../../utils/statusEffects';

const ActionPanel = ({ 
  selectedCreature, 
  targetCreature,
  playerEnergy,
  enemyField,
  availableActions,
  availableTools,
  availableSpells,
  onAction,
  disabled = false,
  animationInProgress = false,
  animationQueue = [],
  className = '' // Add className prop
}) => {
  const [showToolModal, setShowToolModal] = useState(false);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [recentAction, setRecentAction] = useState(null);
  
  // Check if selected creature can act
  const { canAct, reason } = selectedCreature ? 
    canCreatureAct(selectedCreature) : 
    { canAct: true, reason: null };
  
  // Handle button click with animation feedback - MUST be before any returns
  const handleActionClick = useCallback((actionType, additionalData = {}) => {
    if (disabled || !selectedCreature) return;
    
    // Check if creature can act (except for ending turn)
    if (!canAct && actionType !== 'endTurn') {
      // Optionally show a message or animation
      return;
    }
    
    // Set recent action for animation feedback
    setRecentAction(actionType);
    
    // Clear after animation
    setTimeout(() => setRecentAction(null), 500);
    
    switch (actionType) {
      case 'deploy':
        onAction({ type: 'deploy' }, null, selectedCreature);
        break;
        
      case 'attack':
        if (targetCreature) {
          onAction({ type: 'attack' }, targetCreature, selectedCreature);
        }
        break;
        
      case 'useTool':
        // Show tool modal
        setShowToolModal(true);
        break;
        
      case 'useSpell':
        // Show spell modal
        setShowSpellModal(true);
        break;
        
      case 'defend':
        onAction({ type: 'defend' }, null, selectedCreature);
        break;
        
      case 'endTurn':
        onAction({ type: 'endTurn' });
        break;
        
      default:
        console.log('Unknown action type:', actionType);
    }
  }, [onAction, disabled, targetCreature, selectedCreature, canAct]);
  
  // Handle tool selection from modal
  const handleToolSelect = useCallback((tool) => {
    if (!selectedCreature) return;
    setShowToolModal(false);
    onAction({ type: 'useTool', tool }, null, selectedCreature);
  }, [onAction, selectedCreature]);
  
  // Handle spell selection from modal
  const handleSpellSelect = useCallback((spell) => {
    if (!selectedCreature) return;
    setShowSpellModal(false);
    onAction({ type: 'useSpell', spell }, targetCreature, selectedCreature);
  }, [onAction, targetCreature, selectedCreature]);
  
  // Button animation class
  const getButtonAnimationClass = (actionType) => {
    const isRecentAction = recentAction === actionType;
    const isAnimatingThisCreature = animationInProgress && 
      animationQueue.some(anim => 
        anim.attackerId === selectedCreature?.id || 
        anim.defenderId === selectedCreature?.id ||
        anim.targetId === selectedCreature?.id
      );
    const isAnimating = isAnimatingThisCreature && availableActions.includes(actionType);
    return isRecentAction || isAnimating ? 'action-btn-animate' : '';
  };
  
  return (
    <div className={`action-panel ${className} ${!canAct ? 'creature-stunned' : ''}`}>
      {/* Show reason if creature can't act */}
      {!canAct && reason && (
        <div className="action-disabled-reason">
          <span className="status-icon">💫</span>
          <span className="reason-text">{reason}</span>
        </div>
      )}
      
      {selectedCreature ? (
        <>
          {/* Simplified creature info for mobile */}
          <div className="selected-info">
            <span className="selected-creature-name">
              {selectedCreature.species_name} {targetCreature && `→ ${targetCreature.species_name}`}
            </span>
            <span className="selected-creature-health">
              {selectedCreature.currentHealth}/{selectedCreature.battleStats?.maxHealth || 0} HP
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="action-buttons">
            {/* Deploy button (hand only) */}
            {availableActions.includes('deploy') && (
              <button 
                className={`action-btn deploy ${getButtonAnimationClass('deploy')}`}
                onClick={() => handleActionClick('deploy')}
                disabled={disabled || !canAct || playerEnergy < (selectedCreature.battleStats?.energyCost || 5)}
              >
                <span className="btn-icon">🌟</span> 
                <span className="btn-text">
                  Deploy ({selectedCreature.battleStats?.energyCost || 5} ⚡)
                </span>
              </button>
            )}
            
            {/* Attack button (field only, needs target) */}
            {availableActions.includes('attack') && (
              <button 
                className={`action-btn attack ${getButtonAnimationClass('attack')}`}
                onClick={() => handleActionClick('attack')}
                disabled={disabled || !targetCreature || !canAct || playerEnergy < 2}
              >
                <span className="btn-icon">⚔️</span> 
                <span className="btn-text">Attack (2 ⚡)</span>
                {!targetCreature && (
                  <span className="btn-subtitle">Select target</span>
                )}
              </button>
            )}
            
            {/* Tool button (field only) */}
            {availableActions.includes('useTool') && (
              <button 
                className={`action-btn special ${getButtonAnimationClass('useTool')}`}
                onClick={() => handleActionClick('useTool')}
                disabled={disabled || availableTools.length === 0 || !canAct}
              >
                <span className="btn-icon">🔧</span> 
                <span className="btn-text">Use Tool ({availableTools.length})</span>
                <span className="efficiency-free">FREE</span>
              </button>
            )}
            
            {/* Spell button (field only) */}
            {availableActions.includes('useSpell') && (
              <button 
                className={`action-btn special ${getButtonAnimationClass('useSpell')}`}
                onClick={() => handleActionClick('useSpell')}
                disabled={disabled || availableSpells.length === 0 || !canAct || playerEnergy < 4}
              >
                <span className="btn-icon">✨</span> 
                <span className="btn-text">Cast Spell ({availableSpells.length}) (4 ⚡)</span>
              </button>
            )}
            
            {/* Defend button (field only) */}
            {availableActions.includes('defend') && (
              <button 
                className={`action-btn defend ${getButtonAnimationClass('defend')}`}
                onClick={() => handleActionClick('defend')}
                disabled={disabled || !canAct || playerEnergy < 1 || selectedCreature.isDefending}
              >
                <span className="btn-icon">🛡️</span> 
                <span className="btn-text">
                  {selectedCreature.isDefending ? 'Defending' : 'Defend (1 ⚡)'}
                </span>
                {selectedCreature.isDefending && (
                  <span className="btn-subtitle">+50% DEF</span>
                )}
              </button>
            )}
            
            {/* End Turn button (always available even when stunned) */}
            <button 
              className={`action-btn end-turn ${getButtonAnimationClass('endTurn')}`}
              onClick={() => handleActionClick('endTurn')}
              disabled={disabled}
            >
              <span className="btn-icon">⏭️</span> 
              <span className="btn-text">End Turn</span>
            </button>
          </div>
        </>
      ) : (
        <div className="action-info">
          {disabled ? "Waiting for enemy turn..." : "Select a creature to act"}
        </div>
      )}
      
      {/* Tool Modal */}
      {showToolModal && (
        <ToolSpellModal
          items={availableTools}
          type="tool"
          onSelect={handleToolSelect}
          onClose={() => setShowToolModal(false)}
          selectedCreature={selectedCreature}
        />
      )}
      
      {/* Spell Modal */}
      {showSpellModal && (
        <ToolSpellModal
          items={availableSpells}
          type="spell"
          onSelect={handleSpellSelect}
          onClose={() => setShowSpellModal(false)}
          selectedCreature={selectedCreature}
          targetCreature={targetCreature}
        />
      )}
    </div>
  );
};

export default ActionPanel;
