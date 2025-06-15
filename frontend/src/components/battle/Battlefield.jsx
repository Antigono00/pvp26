// src/components/battle/Battlefield.jsx - Enhanced with Animation Support and Status Effects
import React, { useEffect, useRef, useState } from 'react';
import CreatureCard from './CreatureCard';
import BattleLog from './BattleLog';
import ActionPanel from './ActionPanel';
import { isCreatureStunned } from '../../utils/statusEffects';

// Helper function to get max field size based on difficulty
const getMaxFieldSize = (difficulty) => {
  switch (difficulty) {
    case 'easy': return 3;
    case 'medium': return 4;
    case 'hard': return 5;
    case 'expert': return 6;
    default: return 3;
  }
};

// Get browser info for targeted fixes
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = "unknown";
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "firefox";
  } else if (userAgent.match(/safari/i) && !userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "safari";
  }
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  return {
    browser: browserName,
    isMobile: isMobile
  };
};

const Battlefield = ({ 
  playerField = [], 
  enemyField = [], 
  activePlayer,
  difficulty = 'easy',
  onCreatureSelect,
  selectedCreature,
  targetCreature,
  isDesktop = false,
  // Animation-related props
  animatingCreatureId = null,
  animationType = null,
  // Props passed through from BattleGame for desktop sidebars
  battleLog,
  availableActions,
  onAction,
  disabled,
  availableTools,
  availableSpells,
  playerEnergy = 0
}) => {
  // Track active animation for visual highlights
  const [animationState, setAnimationState] = useState({
    activeCreatureId: null,
    targetCreatureId: null,
    animationType: null
  });

  // Use dynamic max field size based on difficulty
  const maxEnemyFieldSize = getMaxFieldSize(difficulty);
  const maxPlayerFieldSize = 3; // Player is always limited to 3 for balance
  
  // Determine if we should apply the large-field class based on enemy field size
  const enemyFieldClass = maxEnemyFieldSize > 3 ? 'battlefield-enemy large-field' : 'battlefield-enemy';
  
  // Mobile optimization - use simplified card view on small screens or large fields
  const useSimplifiedCards = !isDesktop || maxEnemyFieldSize > 4;
  
  // Reference for enemy field container only
  const enemyFieldRef = useRef(null);
  
  // Reference for player field
  const playerFieldRef = useRef(null);
  
  // Enhanced creature select handler that checks stun status
  const handleCreatureSelect = (creature, isEnemy) => {
    // Check if creature is stunned before allowing selection
    if (!isCreatureStunned(creature)) {
      onCreatureSelect(creature, isEnemy);
    }
  };
  
  // Reflect animation state when props change
  useEffect(() => {
    if (animatingCreatureId && animationType) {
      setAnimationState({
        activeCreatureId: animatingCreatureId,
        targetCreatureId: targetCreature?.id || null,
        animationType: animationType
      });
      
      // Clear animation state after appropriate delay
      const timeout = setTimeout(() => {
        setAnimationState({
          activeCreatureId: null,
          targetCreatureId: null,
          animationType: null
        });
      }, 1000); // Animation clear delay
      
      return () => clearTimeout(timeout);
    }
  }, [animatingCreatureId, animationType, targetCreature]);
  
  // Apply mobile browser fixes on mount - TARGETING ENEMY FIELD ONLY
  useEffect(() => {
    if (!isDesktop) {
      const { browser, isMobile } = getBrowserInfo();
      
      if (isMobile && (browser === 'chrome' || browser === 'firefox')) {
        console.log(`Applying mobile ${browser} battlefield fixes (enemy field only)`);
        
        // Apply browser-specific fixes to enemy field container only
        const applyEnemyFieldFixes = () => {
          if (enemyFieldRef.current) {
            // Make enemy field scrollable
            enemyFieldRef.current.style.width = '100%';
            enemyFieldRef.current.style.maxWidth = '100vw';
            enemyFieldRef.current.style.overflowX = 'auto';
            enemyFieldRef.current.style.justifyContent = 'flex-start';
            enemyFieldRef.current.style.padding = '5px 0';
            
            // Add scroll indicators when needed
            if (maxEnemyFieldSize > 3) {
              const scrollIndicator = document.createElement('div');
              scrollIndicator.className = 'enemy-field-scroll-indicator';
              scrollIndicator.style.position = 'absolute';
              scrollIndicator.style.top = '0';
              scrollIndicator.style.right = '0';
              scrollIndicator.style.width = '20px';
              scrollIndicator.style.height = '100%';
              scrollIndicator.style.background = 'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.3))';
              scrollIndicator.style.pointerEvents = 'none';
              scrollIndicator.style.opacity = '0.7';
              scrollIndicator.style.zIndex = '10';
              
              // Only add if not already there
              if (!enemyFieldRef.current.querySelector('.enemy-field-scroll-indicator')) {
                enemyFieldRef.current.appendChild(scrollIndicator);
              }
            }
          }
          
          // Ensure hand cards can overflow properly
          const handCards = document.querySelectorAll('.hand-card-wrapper');
          handCards.forEach(card => {
            card.style.overflow = 'visible';
            const creatureCard = card.querySelector('.creature-card');
            if (creatureCard) {
              creatureCard.style.overflow = 'visible';
              creatureCard.style.visibility = 'visible';
            }
          });
          
          // Firefox-specific fixes
          if (browser === 'firefox') {
            document.body.classList.add('firefox-mobile');
            
            if (enemyFieldRef.current) {
              enemyFieldRef.current.style.scrollSnapType = 'x mandatory';
            }
          }
          
          // Chrome-specific fixes
          if (browser === 'chrome') {
            document.body.classList.add('chrome-mobile');
            
            // Chrome needs extra help with overflow containment
            document.querySelector('.battle-game-overlay')?.style.setProperty('overflow-x', 'hidden', 'important');
            document.querySelector('.battle-game')?.style.setProperty('overflow-x', 'hidden', 'important');
            document.querySelector('.battlefield-container')?.style.setProperty('overflow-x', 'hidden', 'important');
            document.querySelector('.battlefield')?.style.setProperty('overflow-x', 'hidden', 'important');
            
            // Make sure player field and other components are NOT scrollable
            document.querySelector('.battlefield-player')?.style.setProperty('overflow-x', 'hidden', 'important');
            document.querySelector('.battle-log.mobile')?.style.setProperty('overflow-x', 'hidden', 'important');
            document.querySelector('.action-panel')?.style.setProperty('overflow-x', 'hidden', 'important');
          }
        };
        
        // Apply fixes and re-apply on resize
        applyEnemyFieldFixes();
        
        const handleResize = () => {
          setTimeout(applyEnemyFieldFixes, 100);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          document.body.classList.remove('firefox-mobile', 'chrome-mobile');
          // Remove any added elements
          document.querySelectorAll('.enemy-field-scroll-indicator').forEach(el => el.remove());
        };
      }
    }
  }, [isDesktop, maxEnemyFieldSize]);
  
  // Create player field status text based on active player
  const getStatusText = () => {
    if (activePlayer === 'player') {
      return "👉 Your turn - select a creature to act";
    } else {
      // Better AI thinking indication
      if (animationState.animationType === 'thinking') {
        return "🧠 Enemy is planning next move...";
      } else if (animationState.animationType === 'attack' || 
                animationState.animationType === 'spell' ||
                animationState.animationType === 'tool') {
        return "⚔️ Enemy is attacking...";
      } else if (animationState.animationType === 'defend') {
        return "🛡️ Enemy is defending...";
      } else {
        return "Enemy is taking their turn...";
      }
    }
  };
  
  return (
    <div className="battlefield">
      {/* Enemy field (top) - SCROLLABLE */}
      <div 
        ref={enemyFieldRef}
        className={enemyFieldClass} 
        data-slots={maxEnemyFieldSize}
      >
        {enemyField.map((creature) => {
          const stunned = isCreatureStunned(creature);
          return (
            <CreatureCard 
              key={creature.id}
              creature={creature}
              isEnemy={true}
              isSelected={selectedCreature && selectedCreature.id === creature.id}
              isTarget={targetCreature && targetCreature.id === creature.id}
              isAnimating={animationState.activeCreatureId === creature.id}
              isTargetOfAnimation={animationState.targetCreatureId === creature.id}
              animationType={animationState.animationType}
              onClick={() => handleCreatureSelect(creature, true)}
              simplified={useSimplifiedCards}
              dataPower={creature.dataPower}
              dataDefense={creature.dataDefense}
              isStunned={stunned}
              showStatusIndicator={stunned}
            />
          );
        })}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxEnemyFieldSize - enemyField.length) }).map((_, index) => (
          <div key={`empty-enemy-${index}`} className="creature-slot empty" style={{ flexShrink: 0 }} />
        ))}
      </div>
      
      {/* Center divider with game information */}
      <div className="battlefield-center-container">
        <div className="battlefield-center">
          {getStatusText()}
        </div>
      </div>
      
      {/* Player field section with sidebars on desktop */}
      {isDesktop ? (
        <div className="battlefield-player-section">
          {/* Left sidebar - Battle Log - Note we wrap in a container div to control dimensions */}
          <div className="battle-log-sidebar">
            <BattleLog log={battleLog} />
          </div>
          
          {/* Player field (center) - FIXED, NOT SCROLLABLE */}
          <div 
            ref={playerFieldRef}
            className="battlefield-player" 
            data-slots={maxPlayerFieldSize}
          >
            {playerField.map((creature) => {
              const stunned = isCreatureStunned(creature);
              return (
                <CreatureCard 
                  key={creature.id}
                  creature={creature}
                  isEnemy={false}
                  isSelected={selectedCreature && selectedCreature.id === creature.id}
                  isTarget={false}
                  isAnimating={animationState.activeCreatureId === creature.id}
                  isTargetOfAnimation={animationState.targetCreatureId === creature.id}
                  animationType={animationState.animationType}
                  onClick={() => handleCreatureSelect(creature, false)}
                  simplified={useSimplifiedCards}
                  dataPower={creature.dataPower}
                  dataDefense={creature.dataDefense}
                  isStunned={stunned}
                  showStatusIndicator={stunned}
                />
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, maxPlayerFieldSize - playerField.length) }).map((_, index) => (
              <div key={`empty-player-${index}`} className="creature-slot empty" />
            ))}
          </div>
          
          {/* Right sidebar - Action Panel - Note we wrap in a container div to control dimensions */}
          <div className="action-panel-sidebar">
            <ActionPanel 
              selectedCreature={selectedCreature}
              targetCreature={targetCreature}
              availableActions={availableActions}
              onAction={onAction}
              disabled={disabled}
              availableTools={availableTools}
              availableSpells={availableSpells}
              playerEnergy={playerEnergy}
            />
          </div>
        </div>
      ) : (
        // Mobile layout - just player field - FIXED, NOT SCROLLABLE
        <div 
          ref={playerFieldRef}
          className="battlefield-player" 
          data-slots={maxPlayerFieldSize}
          style={{ width: '100%', overflowX: 'hidden', justifyContent: 'center' }}
        >
          {playerField.map((creature) => {
            const stunned = isCreatureStunned(creature);
            return (
              <CreatureCard 
                key={creature.id}
                creature={creature}
                isEnemy={false}
                isSelected={selectedCreature && selectedCreature.id === creature.id}
                isTarget={false}
                isAnimating={animationState.activeCreatureId === creature.id}
                isTargetOfAnimation={animationState.targetCreatureId === creature.id}
                animationType={animationState.animationType}
                onClick={() => handleCreatureSelect(creature, false)}
                simplified={useSimplifiedCards}
                dataPower={creature.dataPower}
                dataDefense={creature.dataDefense}
                isStunned={stunned}
                showStatusIndicator={stunned}
              />
            );
          })}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, maxPlayerFieldSize - playerField.length) }).map((_, index) => (
            <div key={`empty-player-${index}`} className="creature-slot empty" />
          ))}
        </div>
      )}
    </div>
  );
};

export default Battlefield;
