// src/utils/battleAnimations.js - Enhanced Animation System with All Effects - FIXED SYNERGY COLORS & SPELL DAMAGE
import { createRoot } from 'react-dom/client';

// Animation constants for timing - DOUBLED DAMAGE NUMBER DURATION
export const ANIMATION_DURATIONS = {
  ATTACK: 800,           // Base attack animation duration
  ATTACK_CRITICAL: 1200, // Critical attack animation duration
  DEFEND: 600,           // Defend animation duration
  SPELL: 1200,           // Spell animation duration
  TOOL: 900,             // Tool animation duration
  DAMAGE_NUMBER: 3000,   // DOUBLED: How long damage numbers show (was 1500)
  TURN_TRANSITION: 600,  // Turn change animation
  COMBO_INDICATOR: 1000, // Combo effect duration
  BLOCK_EFFECT: 800,     // Block effect duration
  AI_THINKING: {
    NORMAL: 800,        // Normal AI thinking time
    COMPLEX: 1500       // Complex decision AI thinking time
  }
};

// Constants for animation classes
export const ANIMATION_CLASSES = {
  ATTACK: {
    PHYSICAL: 'battle-animation-physical-attack',
    MAGICAL: 'battle-animation-magical-attack',
    CRITICAL: 'battle-animation-critical'
  },
  DEFEND: 'battle-animation-defend',
  SPELL: {
    FIRE: 'battle-animation-spell-fire',
    ICE: 'battle-animation-spell-ice', 
    LIGHTNING: 'battle-animation-spell-lightning',
    DARK: 'battle-animation-spell-dark',
    HEAL: 'battle-animation-spell-heal',
    BUFF: 'battle-animation-spell-buff',
    DEFAULT: 'battle-animation-spell-default'
  },
  TOOL: {
    DAMAGE: 'battle-animation-tool-damage',
    HEALING: 'battle-animation-tool-healing',
    BUFF: 'battle-animation-tool-buff',
    SHIELD: 'battle-animation-tool-shield',
    DEFAULT: 'battle-animation-tool-default'
  },
  STATUS: {
    BUFF: 'battle-animation-status-buff',
    DEBUFF: 'battle-animation-status-debuff'
  },
  DAMAGE_TEXT: {
    PHYSICAL: 'battle-animation-damage-physical',
    MAGICAL: 'battle-animation-damage-magical',
    CRITICAL: 'battle-animation-damage-critical',
    HEAL: 'battle-animation-damage-heal',
    BLOCKED: 'battle-animation-damage-blocked',
    MISS: 'battle-animation-damage-miss'
  },
  AI: {
    THINKING: 'battle-animation-ai-thinking'
  },
  COMBO: {
    INDICATOR: 'battle-animation-combo-indicator',
    BURST: 'battle-animation-combo-burst'
  }
};

/**
 * Helper to ensure element exists before animation
 */
export const waitForElement = (selector, timeout = 1000) => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

/**
 * Creates and animates an attack effect between two card elements
 * Enhanced with better damage feedback
 */
export const animateAttack = (
  attackerElement, 
  targetElement, 
  attackType = 'physical', 
  isCritical = false, 
  damage = 0,
  isBlocked = false,
  damageType = 'normal', // NEW: Add damage type parameter
  onComplete = () => {}
) => {
  if (!attackerElement || !targetElement) {
    console.error('Cannot animate attack: Missing attacker or target element');
    onComplete();
    return;
  }

  try {
    // 1. Add attack preparation class to attacker
    attackerElement.classList.add('battle-animation-attack-prepare');
    
    // Get bounding rectangles for position calculation
    const attackerRect = attackerElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // 2. Create attack effect container
    const effectContainer = document.createElement('div');
    effectContainer.className = 'battle-animation-container';
    document.body.appendChild(effectContainer);
    
    // 3. Position the container properly in viewport
    effectContainer.style.position = 'fixed';
    effectContainer.style.top = '0';
    effectContainer.style.left = '0';
    effectContainer.style.width = '100%';
    effectContainer.style.height = '100%';
    effectContainer.style.pointerEvents = 'none';
    effectContainer.style.zIndex = '9997';
    
    // 4. Create attack effect element
    const attackEffect = document.createElement('div');
    
    // Apply the correct attack class based on type and critical
    if (attackType === 'magical') {
      attackEffect.className = `battle-animation-effect ${ANIMATION_CLASSES.ATTACK.MAGICAL}`;
    } else {
      attackEffect.className = `battle-animation-effect ${ANIMATION_CLASSES.ATTACK.PHYSICAL}`;
    }
    
    if (isCritical) {
      attackEffect.classList.add(ANIMATION_CLASSES.ATTACK.CRITICAL);
    }
    
    // 5. Position the effect to start from attacker
    attackEffect.style.position = 'absolute';
    attackEffect.style.top = `${attackerRect.top + (attackerRect.height / 2)}px`;
    attackEffect.style.left = `${attackerRect.left + (attackerRect.width / 2)}px`;
    
    // Add effect to container
    effectContainer.appendChild(attackEffect);
    
    // 6. Calculate target position and set properties for animation
    const targetX = targetRect.left + (targetRect.width / 2);
    const targetY = targetRect.top + (targetRect.height / 2);
    
    // Set animation destination via CSS variables
    attackEffect.style.setProperty('--target-x', `${targetX}px`);
    attackEffect.style.setProperty('--target-y', `${targetY}px`);
    
    // Calculate distance for attack scaling
    const dx = targetX - (attackerRect.left + (attackerRect.width / 2));
    const dy = targetY - (attackerRect.top + (attackerRect.height / 2));
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Set distance for animation scaling
    attackEffect.style.setProperty('--distance', `${distance}px`);
    
    // Calculate angle for proper orientation
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    attackEffect.style.setProperty('--angle', `${angle}deg`);
    
    // 7. Prepare timing variables
    const duration = isCritical ? 
      ANIMATION_DURATIONS.ATTACK_CRITICAL : 
      ANIMATION_DURATIONS.ATTACK;
    
    // 8. Apply animation timing class
    attackEffect.classList.add('animate');
    
    // 9. Make the attacker "lunge" toward target
    attackerElement.style.transition = 'transform 150ms ease-out';
    const lungeDistance = Math.min(30, distance * 0.15);
    const lungeX = (dx / distance) * lungeDistance;
    const lungeY = (dy / distance) * lungeDistance;
    attackerElement.style.transform = `translate(${lungeX}px, ${lungeY}px)`;
    
    // 10. Reset attacker position after small delay
    setTimeout(() => {
      attackerElement.style.transition = 'transform 300ms ease-out';
      attackerElement.style.transform = '';
    }, 150);
    
    // 11. Play impact effect at halfway point
    setTimeout(() => {
      // Make target flash and shake
      targetElement.classList.add('battle-animation-hit');
      
      // Add blocked effect if damage was blocked
      if (isBlocked) {
        targetElement.classList.add('battle-animation-blocked');
        showBlockEffect(targetElement);
      }
      
      // Add impact effect at target position
      const impactEffect = document.createElement('div');
      impactEffect.className = `battle-animation-impact ${attackType === 'magical' ? 'magical' : 'physical'}`;
      if (isCritical) impactEffect.classList.add('critical');
      
      impactEffect.style.position = 'absolute';
      impactEffect.style.top = `${targetY}px`;
      impactEffect.style.left = `${targetX}px`;
      effectContainer.appendChild(impactEffect);
      
      // ALWAYS show damage number with damage type
      console.log('About to show damage number with value:', damage, 'isBlocked:', isBlocked, 'damageType:', damageType);
      showDamageNumber(targetElement, damage, attackType, isCritical, isBlocked, damageType);
      
      // Remove impact after animation completes
      setTimeout(() => {
        if (impactEffect && impactEffect.parentNode) {
          impactEffect.remove();
        }
      }, 600);
    }, duration / 2);
    
    // 12. Cleanup and callback after animation completes
    setTimeout(() => {
      if (effectContainer && effectContainer.parentNode) {
        effectContainer.remove();
      }
      attackerElement.classList.remove('battle-animation-attack-prepare');
      targetElement.classList.remove('battle-animation-hit');
      targetElement.classList.remove('battle-animation-blocked');
      onComplete();
    }, duration);
  } catch (error) {
    console.error('Error in animateAttack:', error);
    onComplete();
  }
};

/**
 * COMPLETE FIX: Enhanced damage number display that never shows "MISS" for spells
 */
export const showDamageNumber = (
  targetElement, 
  amount,
  type = 'physical',
  isCritical = false,
  isBlocked = false,
  damageType = 'normal'
) => {
  if (!targetElement) {
    console.error('showDamageNumber: No target element');
    return;
  }
  
  try {
    // Parse damage amount
    let damageAmount = 0;
    
    if (typeof amount === 'number') {
      damageAmount = amount;
    } else if (typeof amount === 'string' && !isNaN(parseFloat(amount))) {
      damageAmount = parseFloat(amount);
    } else if (amount && typeof amount === 'object') {
      damageAmount = amount.damage ?? amount.finalDamage ?? amount.totalDamage ?? amount.value ?? 0;
    }
    
    damageAmount = Math.round(damageAmount);
    
    console.log('showDamageNumber:', {
      originalAmount: amount,
      parsedAmount: damageAmount,
      type,
      isCritical,
      isBlocked,
      damageType
    });
    
    // CRITICAL: Don't show anything for 0 damage spells
    if (damageAmount === 0 && type === 'magical') {
      console.log('Skipping damage number display for 0 damage spell');
      return;
    }
    
    const targetRect = targetElement.getBoundingClientRect();
    
    // Create damage number element
    const damageElement = document.createElement('div');
    
    // Determine display text and styling
    let className = '';
    let displayText = '';
    
    if (damageAmount === 0 && type === 'physical') {
      // Only physical attacks can miss
      if (isBlocked) {
        className = ANIMATION_CLASSES.DAMAGE_TEXT.BLOCKED;
        displayText = 'BLOCKED!';
      } else {
        className = ANIMATION_CLASSES.DAMAGE_TEXT.MISS;
        displayText = 'MISS!';
      }
    } else if (damageType === 'heal' || damageAmount < 0) {
      // Healing
      className = ANIMATION_CLASSES.DAMAGE_TEXT.HEAL;
      displayText = `+${Math.abs(damageAmount)}`;
    } else if (damageAmount > 0) {
      // Damage
      className = type === 'magical' ? 
        ANIMATION_CLASSES.DAMAGE_TEXT.MAGICAL : 
        ANIMATION_CLASSES.DAMAGE_TEXT.PHYSICAL;
      
      displayText = `-${damageAmount}`;
      
      if (isCritical) {
        className += ` ${ANIMATION_CLASSES.DAMAGE_TEXT.CRITICAL}`;
      }
      
      // Add special damage type styling
      if (damageType && damageType !== 'normal' && damageType !== 'damage') {
        className += ` damage-type-${damageType}`;
      }
    }
    
    damageElement.className = `battle-animation-damage-text ${className}`;
    damageElement.textContent = displayText;
    
    // Add damage type label for special damage types
    if (damageAmount > 0 && damageType && !['normal', 'damage', 'heal'].includes(damageType)) {
      const typeLabel = document.createElement('div');
      typeLabel.className = `damage-type-label ${damageType}`;
      typeLabel.textContent = damageType.toUpperCase();
      damageElement.appendChild(typeLabel);
    }
    
    // Position the damage number
    const xOffset = (Math.random() * 40) - 20;
    
    damageElement.style.position = 'fixed';
    damageElement.style.top = `${targetRect.top - 20}px`;
    damageElement.style.left = `${targetRect.left + (targetRect.width / 2) + xOffset}px`;
    damageElement.style.transform = 'translate(-50%, -50%)';
    damageElement.style.zIndex = '99999';
    
    document.body.appendChild(damageElement);
    
    // Add visual effects based on damage amount and type
    if (type === 'magical' && damageAmount > 25) {
      // Large spell damage effects
      generateParticles(targetElement, 'magic', Math.min(30, damageAmount / 2));
      
      if (damageAmount > 40) {
        screenFlash('rgba(138, 43, 226, 0.3)', 400, 0.4);
      }
    }
    
    if (damageType === 'devastating' && damageAmount > 0) {
      screenFlash('rgba(255, 100, 0, 0.4)', 500, 0.6);
      shakeScreen(8, 600);
      generateParticles(targetElement, 'explosion', 30);
    } else if (damageType === 'powerful' && damageAmount > 0) {
      shakeScreen(5, 400);
      generateParticles(targetElement, 'impact', 20);
    }
    
    // Critical hit label
    if (isCritical && damageAmount > 0) {
      const criticalLabel = document.createElement('div');
      criticalLabel.className = 'battle-animation-critical-label';
      criticalLabel.textContent = 'CRITICAL!';
      criticalLabel.style.position = 'fixed';
      criticalLabel.style.top = `${targetRect.top - 40}px`;
      criticalLabel.style.left = `${targetRect.left + (targetRect.width / 2)}px`;
      criticalLabel.style.transform = 'translate(-50%, -50%)';
      criticalLabel.style.zIndex = '99999';
      
      document.body.appendChild(criticalLabel);
      
      shakeScreen(3, 300);
      
      setTimeout(() => {
        if (criticalLabel && criticalLabel.parentNode) {
          criticalLabel.remove();
        }
      }, ANIMATION_DURATIONS.DAMAGE_NUMBER);
    }
    
    // Remove damage number after animation
    setTimeout(() => {
      if (damageElement && damageElement.parentNode) {
        damageElement.remove();
      }
    }, ANIMATION_DURATIONS.DAMAGE_NUMBER);
    
  } catch (error) {
    console.error('Error in showDamageNumber:', error);
  }
};

/**
 * Shows a block effect shield when damage is blocked
 */
export const showBlockEffect = (targetElement) => {
  if (!targetElement) return;
  
  try {
    const rect = targetElement.getBoundingClientRect();
    
    // Create block shield effect
    const blockEffect = document.createElement('div');
    blockEffect.className = 'battle-animation-block-shield';
    
    blockEffect.style.position = 'fixed';
    blockEffect.style.top = `${rect.top + (rect.height / 2)}px`;
    blockEffect.style.left = `${rect.left + (rect.width / 2)}px`;
    blockEffect.style.transform = 'translate(-50%, -50%)';
    blockEffect.style.zIndex = '9997';
    
    document.body.appendChild(blockEffect);
    
    // Remove after animation
    setTimeout(() => {
      if (blockEffect && blockEffect.parentNode) {
        blockEffect.remove();
      }
    }, ANIMATION_DURATIONS.BLOCK_EFFECT);
  } catch (error) {
    console.error('Error in showBlockEffect:', error);
  }
};

/**
 * Shows combo indicator effect
 */
export const showComboIndicator = (comboLevel, isPlayer = true) => {
  try {
    // Create combo indicator
    const comboIndicator = document.createElement('div');
    comboIndicator.className = `${ANIMATION_CLASSES.COMBO.INDICATOR} ${isPlayer ? 'player' : 'enemy'}`;
    
    comboIndicator.innerHTML = `
      <div class="combo-text">COMBO x${comboLevel}!</div>
      <div class="combo-burst"></div>
    `;
    
    // Position at top center of screen
    comboIndicator.style.position = 'fixed';
    comboIndicator.style.top = '100px';
    comboIndicator.style.left = '50%';
    comboIndicator.style.transform = 'translateX(-50%)';
    comboIndicator.style.zIndex = '9999';
    
    document.body.appendChild(comboIndicator);
    
    // Add burst effect for high combos
    if (comboLevel >= 3) {
      screenFlash(isPlayer ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)', 400, 0.4);
      
      // Add particle burst at center
      const centerX = window.innerWidth / 2;
      const centerY = 150;
      generateComboBurst(centerX, centerY, isPlayer ? 'combo-player' : 'combo-enemy');
    }
    
    // Remove after animation
    setTimeout(() => {
      if (comboIndicator && comboIndicator.parentNode) {
        comboIndicator.remove();
      }
    }, ANIMATION_DURATIONS.COMBO_INDICATOR);
  } catch (error) {
    console.error('Error in showComboIndicator:', error);
  }
};

/**
 * Generates a burst of particles for combo effects
 */
export const generateComboBurst = (x, y, particleClass = 'combo-player') => {
  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9995';
    
    document.body.appendChild(container);
    
    // Generate burst particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = `battle-animation-particle ${particleClass}`;
      
      // Randomize burst properties
      const angle = (Math.PI * 2 * i) / 20;
      const distance = Math.random() * 100 + 50;
      const size = Math.random() * 10 + 5;
      const duration = Math.random() * 1000 + 500;
      
      // Set initial position
      particle.style.position = 'absolute';
      particle.style.top = `${y}px`;
      particle.style.left = `${x}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Set animation properties for burst
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;
      
      particle.style.setProperty('--end-x', `${endX}px`);
      particle.style.setProperty('--end-y', `${endY}px`);
      particle.style.setProperty('--duration', `${duration}ms`);
      
      // Add to container
      container.appendChild(particle);
      
      // Add burst animation class
      particle.classList.add('burst');
      
      // Remove after animation
      setTimeout(() => {
        if (particle && particle.parentNode) {
          particle.remove();
        }
      }, duration);
    }
    
    // Clean up container after all particles are gone
    setTimeout(() => {
      if (container && container.parentNode) {
        container.remove();
      }
    }, 2000);
  } catch (error) {
    console.error('Error in generateComboBurst:', error);
  }
};

/**
 * Animates a defend action with enhanced visuals
 */
export const animateDefend = (defenderElement, onComplete = () => {}) => {
  if (!defenderElement) {
    console.error('Cannot animate defend: Missing defender element');
    onComplete();
    return;
  }
  
  try {
    // Add defend animation class
    defenderElement.classList.add('battle-animation-defending');
    
    // Create shield effect element
    const shieldEffect = document.createElement('div');
    shieldEffect.className = 'battle-animation-shield';
    
    // Position the shield effect relative to the defender
    const rect = defenderElement.getBoundingClientRect();
    shieldEffect.style.position = 'fixed';
    shieldEffect.style.top = `${rect.top + (rect.height / 2)}px`;
    shieldEffect.style.left = `${rect.left + (rect.width / 2)}px`;
    shieldEffect.style.transform = 'translate(-50%, -50%)';
    shieldEffect.style.zIndex = '9998';
    
    // Add shield to body
    document.body.appendChild(shieldEffect);
    
    // Add shield particles
    generateParticles(defenderElement, 'shield', 8);
    
    // Clean up after animation completes
    setTimeout(() => {
      if (shieldEffect && shieldEffect.parentNode) {
        shieldEffect.remove();
      }
      defenderElement.classList.remove('battle-animation-defending');
      onComplete();
    }, ANIMATION_DURATIONS.DEFEND);
  } catch (error) {
    console.error('Error in animateDefend:', error);
    onComplete();
  }
};

/**
 * Animates a spell cast between caster and target with FIXED damage validation
 * @param {HTMLElement} casterElement The spellcaster element
 * @param {HTMLElement} targetElement The spell target element
 * @param {Object} spell The spell object being cast
 * @param {number} damage The amount of damage/healing
 * @param {Function} onComplete Callback when animation completes
 */
export const animateSpell = (
  casterElement,
  targetElement,
  spell,
  damage = 0,
  onComplete = () => {}
) => {
  if (!casterElement || !targetElement) {
    console.error('Cannot animate spell: Missing caster or target element');
    onComplete();
    return;
  }
  
  try {
    // VALIDATION: Ensure damage is a number
    const spellDamage = typeof damage === 'number' ? damage : 0;
    
    // 1. Determine spell type from spell object
    let spellVisualType = ANIMATION_CLASSES.SPELL.DEFAULT;
    
    // Analyze spell properties to determine visual type
    if (spell) {
      const spellName = (spell.name || '').toLowerCase();
      const spellEffect = (spell.spell_effect || '').toLowerCase();
      const spellTypeProperty = (spell.spell_type || '').toLowerCase();
      
      if (spellEffect === 'heal' || spellName.includes('heal') || 
          spellTypeProperty === 'heal' || spellDamage < 0) {
        spellVisualType = ANIMATION_CLASSES.SPELL.HEAL;
      } 
      else if (spellName.includes('fire') || spellName.includes('flame') ||
               spellName.includes('burn') || spellEffect === 'surge') {
        spellVisualType = ANIMATION_CLASSES.SPELL.FIRE;
      }
      else if (spellName.includes('ice') || spellName.includes('frost') ||
               spellName.includes('freez')) {
        spellVisualType = ANIMATION_CLASSES.SPELL.ICE;
      }
      else if (spellName.includes('lightning') || spellName.includes('thunder') ||
               spellName.includes('shock') || spellName.includes('bolt')) {
        spellVisualType = ANIMATION_CLASSES.SPELL.LIGHTNING;
      }
      else if (spellName.includes('dark') || spellName.includes('shadow') || 
               spellName.includes('void') || spellName.includes('death')) {
        spellVisualType = ANIMATION_CLASSES.SPELL.DARK;
      }
      else if (spellEffect === 'buff' || spellName.includes('buff') || 
               spellName.includes('boost') || spellName.includes('enhance')) {
        spellVisualType = ANIMATION_CLASSES.SPELL.BUFF;
      }
    }
    
    // 2. Add casting animation to caster
    casterElement.classList.add('battle-animation-casting');
    
    // 3. Create casting circle effect around caster
    const castingCircle = document.createElement('div');
    castingCircle.className = `battle-animation-casting-circle ${spellVisualType}`;
    
    // Position casting circle
    const casterRect = casterElement.getBoundingClientRect();
    castingCircle.style.position = 'fixed';
    castingCircle.style.top = `${casterRect.top + (casterRect.height / 2)}px`;
    castingCircle.style.left = `${casterRect.left + (casterRect.width / 2)}px`;
    castingCircle.style.transform = 'translate(-50%, -50%)';
    castingCircle.style.zIndex = '9997';
    
    // Add to body
    document.body.appendChild(castingCircle);
    
    // 4. Create projectile after brief casting time
    setTimeout(() => {
      // Hide casting circle
      castingCircle.classList.add('fade-out');
      
      // Create spell projectile
      const projectile = document.createElement('div');
      projectile.className = `battle-animation-spell-projectile ${spellVisualType}`;
      
      // Get caster and target positions
      const casterCurrentRect = casterElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      // Position the projectile to start from caster
      projectile.style.position = 'fixed';
      projectile.style.top = `${casterCurrentRect.top + (casterCurrentRect.height / 2)}px`;
      projectile.style.left = `${casterCurrentRect.left + (casterCurrentRect.width / 2)}px`;
      projectile.style.zIndex = '9998';
      
      // Calculate target position
      const targetX = targetRect.left + (targetRect.width / 2);
      const targetY = targetRect.top + (targetRect.height / 2);
      
      // Calculate distance and angle
      const dx = targetX - (casterCurrentRect.left + (casterCurrentRect.width / 2));
      const dy = targetY - (casterCurrentRect.top + (casterCurrentRect.height / 2));
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Set animation properties
      projectile.style.setProperty('--target-x', `${targetX}px`);
      projectile.style.setProperty('--target-y', `${targetY}px`);
      projectile.style.setProperty('--distance', `${distance}px`);
      projectile.style.setProperty('--angle', `${angle}deg`);
      
      // Add to body
      document.body.appendChild(projectile);
      
      // Add animation class
      projectile.classList.add('animate');
      
      // 5. Play impact effect after projectile reaches target
      setTimeout(() => {
        // Create impact effect
        const impact = document.createElement('div');
        impact.className = `battle-animation-spell-impact ${spellVisualType}`;
        
        // Position impact
        impact.style.position = 'fixed';
        impact.style.top = `${targetY}px`;
        impact.style.left = `${targetX}px`;
        impact.style.transform = 'translate(-50%, -50%)';
        impact.style.zIndex = '9998';
        
        // Add to body
        document.body.appendChild(impact);
        
        // Add hit effect to target
        targetElement.classList.add('battle-animation-spell-hit');
        
        // Show damage/heal number ONLY if there's damage
        if (spellDamage !== 0) {
          showDamageNumber(
            targetElement, 
            spellDamage, 
            'magical', 
            false,
            false,
            spellDamage < 0 ? 'heal' : 'normal'
          );
        }
        
        // Clean up impact after animation
        setTimeout(() => {
          if (impact && impact.parentNode) {
            impact.remove();
          }
          targetElement.classList.remove('battle-animation-spell-hit');
        }, 500);
      }, 400); // Time for projectile to reach target
      
      // 6. Clean up projectile
      setTimeout(() => {
        if (projectile && projectile.parentNode) {
          projectile.remove();
        }
      }, 500); // Time for projectile animation
    }, 400); // Initial casting time
    
    // 7. Clean up and callback
    setTimeout(() => {
      if (castingCircle && castingCircle.parentNode) {
        castingCircle.remove();
      }
      casterElement.classList.remove('battle-animation-casting');
      onComplete();
    }, ANIMATION_DURATIONS.SPELL);
  } catch (error) {
    console.error('Error in animateSpell:', error);
    onComplete();
  }
};

/**
 * Animates tool usage from user to target
 * @param {HTMLElement} userElement The tool user element
 * @param {HTMLElement} targetElement The tool target element
 * @param {Object} tool The tool object being used
 * @param {Function} onComplete Callback when animation completes
 */
export const animateTool = (
  userElement, 
  targetElement, 
  tool, 
  onComplete = () => {}
) => {
  if (!userElement || !targetElement) {
    console.error('Cannot animate tool: Missing user or target element');
    onComplete();
    return;
  }
  
  try {
    // 1. Determine tool type based on properties
    let toolVisualType = ANIMATION_CLASSES.TOOL.DEFAULT;
    
    if (tool) {
      const toolName = (tool.name || '').toLowerCase();
      const toolEffect = (tool.tool_effect || '').toLowerCase();
      const toolTypeProperty = (tool.tool_type || '').toLowerCase();
      
      if (toolEffect === 'Shield' || toolName.includes('shield') || 
          toolName.includes('protect') || toolName.includes('armor')) {
        toolVisualType = ANIMATION_CLASSES.TOOL.SHIELD;
      }
      else if (toolEffect === 'Surge' || toolName.includes('damage') || 
               toolName.includes('attack') || toolName.includes('sword')) {
        toolVisualType = ANIMATION_CLASSES.TOOL.DAMAGE;
      }
      else if (toolTypeProperty === 'stamina' || toolName.includes('heal') || 
               toolName.includes('regen') || toolName.includes('potion')) {
        toolVisualType = ANIMATION_CLASSES.TOOL.HEALING;
      }
      else if (toolName.includes('buff') || toolName.includes('boost') || 
               toolName.includes('enhance')) {
        toolVisualType = ANIMATION_CLASSES.TOOL.BUFF;
      }
    }
    
    // 2. Create tool icon element
    const toolIcon = document.createElement('div');
    toolIcon.className = `battle-animation-tool-icon ${toolVisualType}`;
    
    // 3. Position at user
    const userRect = userElement.getBoundingClientRect();
    toolIcon.style.position = 'fixed';
    toolIcon.style.top = `${userRect.top + 20}px`;
    toolIcon.style.left = `${userRect.left + (userRect.width / 2)}px`;
    toolIcon.style.transform = 'translate(-50%, -50%) scale(0)';
    toolIcon.style.zIndex = '9998';
    
    // 4. Add to body
    document.body.appendChild(toolIcon);
    
    // 5. Animation sequence
    
    // First, scale up the icon
    setTimeout(() => {
      toolIcon.style.transition = 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      toolIcon.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);
    
    // Then float icon to target
    setTimeout(() => {
      const targetRect = targetElement.getBoundingClientRect();
      toolIcon.style.transition = 'all 500ms cubic-bezier(0.22, 1, 0.36, 1)';
      toolIcon.style.top = `${targetRect.top + 20}px`;
      toolIcon.style.left = `${targetRect.left + (targetRect.width / 2)}px`;
    }, 400);
    
    // Scale down and apply effect
    setTimeout(() => {
      // Add effect to target
      targetElement.classList.add(`battle-animation-tool-${toolVisualType}-target`);
      
      // Scale down icon
      toolIcon.style.transition = 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      toolIcon.style.transform = 'translate(-50%, -50%) scale(0)';
      toolIcon.style.opacity = '0';
      
      // Create effect aura
      const effectAura = document.createElement('div');
      effectAura.className = `battle-animation-tool-effect ${toolVisualType}`;
      
      const targetRect = targetElement.getBoundingClientRect();
      effectAura.style.position = 'fixed';
      effectAura.style.top = `${targetRect.top + (targetRect.height / 2)}px`;
      effectAura.style.left = `${targetRect.left + (targetRect.width / 2)}px`;
      effectAura.style.transform = 'translate(-50%, -50%)';
      effectAura.style.zIndex = '9997';
      
      document.body.appendChild(effectAura);
      
      // Remove effect after animation
      setTimeout(() => {
        if (effectAura && effectAura.parentNode) {
          effectAura.remove();
        }
        targetElement.classList.remove(`battle-animation-tool-${toolVisualType}-target`);
      }, 500);
    }, 900);
    
    // 6. Clean up and callback
    setTimeout(() => {
      if (toolIcon && toolIcon.parentNode) {
        toolIcon.remove();
      }
      onComplete();
    }, ANIMATION_DURATIONS.TOOL);
  } catch (error) {
    console.error('Error in animateTool:', error);
    onComplete();
  }
};

/**
 * Animates a turn transition
 * @param {string} activePlayer The new active player ('player' or 'enemy')
 * @param {number} turn The new turn number
 */
export const animateTurnTransition = (activePlayer, turn) => {
  try {
    // Create transition element
    const transition = document.createElement('div');
    transition.className = `battle-animation-turn-transition ${activePlayer}`;
    
    // Add turn indicator
    transition.innerHTML = `
      <div class="battle-animation-turn-number">Turn ${turn}</div>
      <div class="battle-animation-turn-player">${activePlayer === 'player' ? 'Your Turn' : 'Enemy Turn'}</div>
    `;
    
    // Add to body
    transition.style.position = 'fixed';
    transition.style.top = '0';
    transition.style.left = '0';
    transition.style.width = '100%';
    transition.style.height = '100%';
    transition.style.display = 'flex';
    transition.style.flexDirection = 'column';
    transition.style.justifyContent = 'center';
    transition.style.alignItems = 'center';
    transition.style.pointerEvents = 'none';
    transition.style.zIndex = '9999';
    
    document.body.appendChild(transition);
    
    // Remove after animation
    setTimeout(() => {
      transition.classList.add('fade-out');
      setTimeout(() => {
        if (transition && transition.parentNode) {
          transition.remove();
        }
      }, 300);
    }, ANIMATION_DURATIONS.TURN_TRANSITION - 300);
  } catch (error) {
    console.error('Error in animateTurnTransition:', error);
  }
};

/**
 * Shows AI thinking animation on an enemy card
 * @param {HTMLElement} enemyElement The enemy card element
 * @param {boolean} isComplex Whether this is a complex decision
 * @param {Function} onComplete Callback when animation completes
 */
export const showAIThinking = (enemyElement, isComplex = false, onComplete = () => {}) => {
  if (!enemyElement) {
    console.error('Cannot show AI thinking: Missing enemy element');
    onComplete();
    return;
  }
  
  try {
    // Create thinking indicator
    const thinking = document.createElement('div');
    thinking.className = 'battle-animation-ai-thinking';
    
    // Add dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'battle-animation-ai-thinking-dot';
      thinking.appendChild(dot);
    }
    
    // Position above enemy
    const rect = enemyElement.getBoundingClientRect();
    thinking.style.position = 'fixed';
    thinking.style.top = `${rect.top - 20}px`;
    thinking.style.left = `${rect.left + (rect.width / 2)}px`;
    thinking.style.transform = 'translate(-50%, -50%)';
    thinking.style.zIndex = '9998';
    
    // Add to body
    document.body.appendChild(thinking);
    
    // Highlight enemy card
    enemyElement.classList.add('battle-animation-ai-active');
    
    // Calculate duration based on complexity
    const duration = isComplex ? 
      ANIMATION_DURATIONS.AI_THINKING.COMPLEX : 
      ANIMATION_DURATIONS.AI_THINKING.NORMAL;
    
    // Clean up and callback
    setTimeout(() => {
      if (thinking && thinking.parentNode) {
        thinking.remove();
      }
      enemyElement.classList.remove('battle-animation-ai-active');
      onComplete();
    }, duration);
  } catch (error) {
    console.error('Error in showAIThinking:', error);
    onComplete();
  }
};

/**
 * Creates and animates a screen flash effect
 * @param {string} color The flash color (hex or rgba)
 * @param {number} duration How long the flash lasts in ms
 * @param {number} intensity Flash opacity (0.0-1.0)
 */
export const screenFlash = (color = '#fff', duration = 300, intensity = 0.3) => {
  try {
    // Create flash element
    const flash = document.createElement('div');
    flash.className = 'battle-animation-screen-flash';
    
    // Set style
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = color;
    flash.style.opacity = '0';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '9996';
    
    // Add to body
    document.body.appendChild(flash);
    
    // Animate
    requestAnimationFrame(() => {
      flash.style.transition = `opacity ${duration / 2}ms ease-in`;
      flash.style.opacity = intensity.toString();
      
      setTimeout(() => {
        flash.style.transition = `opacity ${duration / 2}ms ease-out`;
        flash.style.opacity = '0';
        
        setTimeout(() => {
          if (flash && flash.parentNode) {
            flash.remove();
          }
        }, duration / 2);
      }, duration / 2);
    });
  } catch (error) {
    console.error('Error in screenFlash:', error);
  }
};

/**
 * Shakes the entire battlefield for emphasis
 * @param {number} intensity Shake intensity (1-10)
 * @param {number} duration Shake duration in ms
 */
export const shakeScreen = (intensity = 5, duration = 500) => {
  try {
    // Get the battlefield element
    const battlefield = document.querySelector('.battlefield');
    if (!battlefield) return;
    
    // Scale intensity to reasonable pixels
    const pixelIntensity = Math.min(10, Math.max(1, intensity)) * 1.5;
    
    // Apply shake animation
    battlefield.style.animation = `battle-animation-shake ${duration}ms ease-in-out`;
    
    // Set shake intensity via CSS vars
    battlefield.style.setProperty('--shake-intensity', `${pixelIntensity}px`);
    
    // Reset after animation completes
    setTimeout(() => {
      battlefield.style.animation = '';
    }, duration);
  } catch (error) {
    console.error('Error in shakeScreen:', error);
  }
};

/**
 * Animates status effect application
 */
export const animateStatusEffect = (
  targetElement,
  effect,
  isPositive = true,
  onComplete = () => {}
) => {
  if (!targetElement || !effect) {
    onComplete();
    return;
  }
  
  try {
    const rect = targetElement.getBoundingClientRect();
    
    // Create effect container
    const effectContainer = document.createElement('div');
    effectContainer.className = `battle-animation-status-effect ${isPositive ? 'buff' : 'debuff'}`;
    
    effectContainer.style.position = 'fixed';
    effectContainer.style.top = `${rect.top + (rect.height / 2)}px`;
    effectContainer.style.left = `${rect.left + (rect.width / 2)}px`;
    effectContainer.style.transform = 'translate(-50%, -50%)';
    effectContainer.style.zIndex = '9997';
    
    // Create effect icon
    const effectIcon = document.createElement('div');
    effectIcon.className = 'status-effect-icon';
    effectIcon.textContent = effect.icon || (isPositive ? '✨' : '💀');
    effectContainer.appendChild(effectIcon);
    
    // Create effect name
    const effectName = document.createElement('div');
    effectName.className = 'status-effect-name';
    effectName.textContent = effect.name || effect;
    effectContainer.appendChild(effectName);
    
    document.body.appendChild(effectContainer);
    
    // Add particles
    const particleType = isPositive ? 'buff' : 'debuff';
    generateParticles(targetElement, particleType, 15);
    
    // Add glow to target
    targetElement.classList.add(`status-effect-${isPositive ? 'buff' : 'debuff'}-glow`);
    
    // Remove after animation
    setTimeout(() => {
      if (effectContainer && effectContainer.parentNode) {
        effectContainer.remove();
      }
      targetElement.classList.remove(`status-effect-${isPositive ? 'buff' : 'debuff'}-glow`);
      onComplete();
    }, 1200);
  } catch (error) {
    console.error('Error in animateStatusEffect:', error);
    onComplete();
  }
};

/**
 * Animates energy regeneration
 */
export const animateEnergyRegen = (
  isPlayer = true,
  amount = 0,
  hasBonus = false,
  onComplete = () => {}
) => {
  try {
    // Find energy display element
    const energySelector = isPlayer ? '.player-energy .energy-value' : '.enemy-energy .energy-value';
    const energyElement = document.querySelector(energySelector);
    
    if (!energyElement) {
      onComplete();
      return;
    }
    
    const rect = energyElement.getBoundingClientRect();
    
    // Create energy orbs
    const orbCount = Math.min(amount, 10);
    for (let i = 0; i < orbCount; i++) {
      setTimeout(() => {
        const orb = document.createElement('div');
        orb.className = `battle-animation-energy-orb ${isPlayer ? 'player' : 'enemy'}`;
        
        // Random starting position around the battlefield
        const startAngle = (Math.PI * 2 * i) / orbCount;
        const startRadius = 100 + Math.random() * 50;
        const startX = window.innerWidth / 2 + Math.cos(startAngle) * startRadius;
        const startY = window.innerHeight / 2 + Math.sin(startAngle) * startRadius;
        
        orb.style.position = 'fixed';
        orb.style.top = `${startY}px`;
        orb.style.left = `${startX}px`;
        orb.style.transform = 'translate(-50%, -50%)';
        orb.style.zIndex = '9996';
        
        document.body.appendChild(orb);
        
        // Animate to energy counter
        setTimeout(() => {
          orb.style.transition = 'all 800ms cubic-bezier(0.2, 0.85, 0.4, 1)';
          orb.style.top = `${rect.top + rect.height / 2}px`;
          orb.style.left = `${rect.left + rect.width / 2}px`;
          orb.style.opacity = '0';
          orb.style.transform = 'translate(-50%, -50%) scale(0.3)';
        }, 50);
        
        // Remove orb
        setTimeout(() => {
          if (orb && orb.parentNode) {
            orb.remove();
          }
        }, 1000);
      }, i * 100);
    }
    
    // Show bonus effect if applicable
    if (hasBonus) {
      setTimeout(() => {
        const bonusEffect = document.createElement('div');
        bonusEffect.className = 'battle-animation-energy-bonus';
        bonusEffect.textContent = 'MOMENTUM BONUS!';
        
        bonusEffect.style.position = 'fixed';
        bonusEffect.style.top = `${rect.top - 30}px`;
        bonusEffect.style.left = `${rect.left + rect.width / 2}px`;
        bonusEffect.style.transform = 'translate(-50%, -50%)';
        bonusEffect.style.zIndex = '9998';
        
        document.body.appendChild(bonusEffect);
        
        setTimeout(() => {
          if (bonusEffect && bonusEffect.parentNode) {
            bonusEffect.remove();
          }
        }, 1500);
      }, 300);
    }
    
    // Complete after all orbs have animated
    setTimeout(onComplete, orbCount * 100 + 1000);
  } catch (error) {
    console.error('Error in animateEnergyRegen:', error);
    onComplete();
  }
};

/**
 * Shows synergy activation effect
 * FIXED: Handle missing color property and provide default colors
 */
export const animateSynergyActivation = (synergies) => {
  if (!synergies || synergies.length === 0) return;
  
  try {
    // FIXED: Define default colors for different synergy types
    const defaultColors = {
      'species': 'rgba(76, 175, 80, 0.2)',           // Green for species synergy
      'legendary_presence': 'rgba(255, 215, 0, 0.2)', // Gold for legendary
      'stat_synergy': 'rgba(33, 150, 243, 0.2)',     // Blue for stat synergy
      'form_protection': 'rgba(156, 39, 176, 0.2)',  // Purple for form protection
      'balanced_team': 'rgba(0, 188, 212, 0.2)',     // Cyan for balanced team
      'full_field': 'rgba(255, 87, 34, 0.2)',        // Orange for full field
      'default': 'rgba(33, 150, 243, 0.2)'           // Default blue
    };
    
    synergies.forEach((synergy, index) => {
      setTimeout(() => {
        // Create synergy burst at center of screen
        const burst = document.createElement('div');
        burst.className = `battle-animation-synergy-burst ${synergy.type}`;
        
        burst.style.position = 'fixed';
        burst.style.top = '50%';
        burst.style.left = '50%';
        burst.style.transform = 'translate(-50%, -50%)';
        burst.style.zIndex = '9995';
        
        document.body.appendChild(burst);
        
        // Add synergy particles
        generateParticles(burst, 'synergy', 20);
        
        // FIXED: Use default color if synergy.color is missing
        const flashColor = synergy.color || 
                          defaultColors[synergy.type] || 
                          defaultColors['default'];
        
        screenFlash(flashColor, 400, 0.3);
        
        // Remove burst after animation
        setTimeout(() => {
          if (burst && burst.parentNode) {
            burst.remove();
          }
        }, 1000);
      }, index * 300);
    });
  } catch (error) {
    console.error('Error in animateSynergyActivation:', error);
  }
};

/**
 * Enhanced particle generation with new types
 */
export const generateParticles = (targetElement, particleType = 'damage', count = 10) => {
  if (!targetElement) return;
  
  try {
    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9995';
    
    document.body.appendChild(container);
    
    // NEW: Define particle properties by type
    const particleConfigs = {
      'damage': { color: '#FF4444', shadow: 'rgba(255, 0, 0, 0.7)' },
      'heal': { color: '#4CAF50', shadow: 'rgba(0, 255, 0, 0.7)' },
      'magic': { color: '#BB86FC', shadow: 'rgba(150, 0, 255, 0.7)' },
      'gold': { color: '#FFD700', shadow: 'rgba(255, 215, 0, 0.7)' },
      'shield': { color: '#2196F3', shadow: 'rgba(33, 150, 243, 0.7)' },
      'buff': { color: '#4CAF50', shadow: 'rgba(76, 175, 80, 0.8)' },
      'debuff': { color: '#F44336', shadow: 'rgba(244, 67, 54, 0.8)' },
      'synergy': { color: '#00BCD4', shadow: 'rgba(0, 188, 212, 0.8)' },
      'explosion': { color: '#FF5722', shadow: 'rgba(255, 87, 34, 0.9)' },
      'impact': { color: '#FF9800', shadow: 'rgba(255, 152, 0, 0.8)' },
      'deflect': { color: '#9E9E9E', shadow: 'rgba(158, 158, 158, 0.6)' }
    };
    
    const config = particleConfigs[particleType] || particleConfigs['damage'];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = `battle-animation-particle ${particleType}`;
      
      // Apply custom styling
      particle.style.backgroundColor = config.color;
      particle.style.boxShadow = `0 0 5px ${config.shadow}`;
      
      // Randomize particle properties
      const angle = Math.random() * 360;
      const distance = Math.random() * 50 + 20;
      const size = Math.random() * 8 + 4;
      const duration = Math.random() * 1000 + 500;
      
      particle.style.position = 'absolute';
      particle.style.top = `${centerY}px`;
      particle.style.left = `${centerX}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      particle.style.setProperty('--angle', `${angle}deg`);
      particle.style.setProperty('--distance', `${distance}px`);
      particle.style.setProperty('--duration', `${duration}ms`);
      
      container.appendChild(particle);
      
      particle.classList.add('animate');
      
      setTimeout(() => {
        if (particle && particle.parentNode) {
          particle.remove();
        }
      }, duration);
    }
    
    setTimeout(() => {
      if (container && container.parentNode) {
        container.remove();
      }
    }, 2000);
  } catch (error) {
    console.error('Error in generateParticles:', error);
  }
};

/**
 * Gets the DOM element for a creature by ID with retry logic
 * @param {string} creatureId The creature's ID
 * @param {boolean} isEnemy Whether it's an enemy creature
 * @returns {Promise<HTMLElement|null>} Promise that resolves to the creature's DOM element or null
 */
export const getCreatureElementWithRetry = async (creatureId, isEnemy = false) => {
  // Build selector for the creature card
  const selector = `.${isEnemy ? 'battlefield-enemy' : 'battlefield-player'} .creature-card[data-id="${creatureId}"]`;
  
  // Try to get element immediately
  let element = document.querySelector(selector);
  if (element) return element;
  
  // If not found, wait and retry
  await new Promise(resolve => setTimeout(resolve, 100));
  element = document.querySelector(selector);
  if (element) return element;
  
  // Final attempt with mutation observer
  return waitForElement(selector, 500);
};

/**
 * Gets the DOM element for a creature by ID
 * @param {string} creatureId The creature's ID
 * @param {boolean} isEnemy Whether it's an enemy creature
 * @returns {HTMLElement|null} The creature's DOM element or null
 */
export const getCreatureElement = (creatureId, isEnemy = false) => {
  // Build selector for the creature card
  const selector = `.${isEnemy ? 'battlefield-enemy' : 'battlefield-player'} .creature-card[data-id="${creatureId}"]`;
  return document.querySelector(selector);
};

/**
 * Wrapper for consistent animation timing
 * @param {Function} animationFunction Function that starts animation
 * @param {number} delay Optional delay before starting
 * @returns {Promise} Promise that resolves when animation completes
 */
export const animateWithTiming = (animationFunction, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => {
      try {
        animationFunction(() => resolve());
      } catch (error) {
        console.error('Error in animateWithTiming:', error);
        resolve();
      }
    }, delay);
  });
};

/**
 * COMPLETE FIX: executeDamageNumberAnimation for proper spell damage display
 */
export const executeDamageNumberAnimation = async (animation) => {
  const { targetId, amount, damageDisplayType, isCritical, isBlocked, damageType } = animation;
  
  console.log('Executing damage number animation:', {
    targetId,
    amount,
    damageDisplayType,
    damageType
  });
  
  // Determine if target is enemy
  const enemyField = document.querySelectorAll('.battlefield-enemy .creature-card');
  const isEnemy = Array.from(enemyField).some(card => card.dataset.id === targetId);
  
  const targetElement = await getCreatureElementWithRetry(targetId, isEnemy);
  
  if (!targetElement) {
    console.log("Missing element for damage number animation");
    return;
  }
  
  // Use damageDisplayType if provided, otherwise default to 'physical'
  const displayType = damageDisplayType || 'physical';
  
  showDamageNumber(
    targetElement,
    amount,
    displayType,
    isCritical || false,
    isBlocked || false,
    damageType || 'normal'
  );
  
  return Promise.resolve();
};

export default {
  animateAttack,
  animateDefend,
  animateSpell,
  animateTool,
  animateTurnTransition,
  animateStatusEffect,
  animateEnergyRegen,
  animateSynergyActivation,
  showAIThinking,
  showDamageNumber,
  showBlockEffect,
  showComboIndicator,
  generateComboBurst,
  screenFlash,
  shakeScreen,
  generateParticles,
  getCreatureElement,
  getCreatureElementWithRetry,
  animateWithTiming,
  executeDamageNumberAnimation,
  waitForElement,
  ANIMATION_DURATIONS,
  ANIMATION_CLASSES
};
