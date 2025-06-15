// src/utils/statusEffects.js - Stun and other status effect implementations

// Status effect types (only stun for now)
export const STATUS_EFFECTS = {
  STUNNED: {
    name: 'Stunned',
    icon: '💫',
    description: 'Cannot perform any actions this turn',
    preventActions: true,
    duration: 1
  }
  // Note: Defending is handled by the existing game system using isDefending flag
  // and active effects, not through this status system
};

// Apply stun to a creature
export const applyStun = (creature, duration = 1) => {
  return {
    ...creature,
    statusEffects: [
      ...(creature.statusEffects || []),
      {
        type: 'STUNNED',
        duration: duration,
        appliedTurn: creature.currentTurn || 0
      }
    ],
    isStunned: true
  };
};

// Check if creature is stunned
export const isCreatureStunned = (creature) => {
  if (!creature.statusEffects) return false;
  
  return creature.statusEffects.some(effect => 
    effect.type === 'STUNNED' && effect.duration > 0
  );
};

// Process status effects at turn start
export const processStatusEffects = (creature, currentTurn) => {
  if (!creature.statusEffects || creature.statusEffects.length === 0) {
    return creature;
  }
  
  const updatedEffects = [];
  let isStillStunned = false;
  
  creature.statusEffects.forEach(effect => {
    // Reduce duration
    const remainingDuration = effect.duration - 1;
    
    if (remainingDuration > 0) {
      updatedEffects.push({
        ...effect,
        duration: remainingDuration
      });
      
      if (effect.type === 'STUNNED') {
        isStillStunned = true;
      }
    }
  });
  
  return {
    ...creature,
    statusEffects: updatedEffects,
    isStunned: isStillStunned
  };
};

// Integration with battle system
export const canCreatureAct = (creature) => {
  // Check if stunned
  if (isCreatureStunned(creature)) {
    return {
      canAct: false,
      reason: 'Creature is stunned and cannot act this turn'
    };
  }
  
  // Note: Defending creatures CAN still act
  // The isDefending flag doesn't prevent actions
  
  // Check other conditions (energy, health, etc.)
  if (creature.currentHealth <= 0) {
    return {
      canAct: false,
      reason: 'Creature has been defeated'
    };
  }
  
  return {
    canAct: true,
    reason: null
  };
};

// Update Shardstorm spell to properly apply stun
export const applyShardstormEffect = (target, isStunned) => {
  if (!isStunned) return target;
  
  return applyStun(target, 1); // Stun for 1 turn
};

// Battle action handler integration
export const handleCreatureAction = (creature, action, battleState) => {
  // Check if creature can act
  const { canAct, reason } = canCreatureAct(creature);
  
  if (!canAct) {
    return {
      success: false,
      message: reason,
      skipTurn: true
    };
  }
  
  // Process the action normally
  return {
    success: true,
    skipTurn: false
  };
};
