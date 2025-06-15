// src/utils/battleAI.js - ENHANCED AI WITH SUPERIOR INTELLIGENCE
import { getDifficultySettings } from './difficultySettings';

// Get max enemy field size based on difficulty
const getMaxEnemyFieldSize = (difficulty) => {
  const settings = getDifficultySettings(difficulty);
  return settings.maxFieldSize || 3;
};

// ENHANCED: Superior AI action determination with predictive planning
export const determineAIAction = (
  difficulty, 
  enemyHand, 
  enemyField, 
  playerField, 
  enemyTools = [], 
  enemySpells = [], 
  enemyEnergy = 10,
  gameState = {} // New parameter for additional context
) => {
  console.log(`Enhanced AI Turn - Difficulty: ${difficulty}, Energy: ${enemyEnergy}, Hand: ${enemyHand.length}, Field: ${enemyField.length}`);
  console.log(`Available items - Tools: ${enemyTools.length}, Spells: ${enemySpells.length}`);
  
  // Get difficulty settings for advanced AI behavior
  const difficultySettings = getDifficultySettings(difficulty);
  const maxFieldSize = getMaxEnemyFieldSize(difficulty);
  
  try {
    // Basic validation
    const hasCreaturesInHand = enemyHand.length > 0;
    const hasCreaturesOnField = enemyField.length > 0;
    const hasEnergyToAct = enemyEnergy > 0;
    
    // If we have no creatures anywhere and no energy, end turn
    if (!hasCreaturesInHand && !hasCreaturesOnField) {
      console.log("AI: No creatures available, ending turn");
      return { type: 'endTurn' };
    }
    
    // If we have no energy at all, end turn
    if (!hasEnergyToAct) {
      console.log("AI: No energy available, ending turn");
      return { type: 'endTurn' };
    }
    
    // Enhanced game state analysis
    const enhancedGameState = analyzeEnhancedGameState(
      enemyField,
      playerField,
      enemyHand,
      enemyEnergy,
      enemyTools,
      enemySpells,
      difficulty,
      gameState
    );
    
    console.log("Enhanced Game State Analysis:", enhancedGameState);
    
    // Predictive planning based on difficulty
    const predictiveDepth = difficultySettings.predictiveDepth || 0;
    let optimalStrategy = null;
    
    if (predictiveDepth > 0) {
      optimalStrategy = calculateOptimalStrategy(
        enemyField,
        playerField,
        enemyHand,
        enemyEnergy,
        enemyTools,
        enemySpells,
        predictiveDepth,
        enhancedGameState,
        difficultySettings
      );
      console.log("Optimal Strategy Calculated:", optimalStrategy);
    }
    
    // Determine if multi-action turn should be executed
    const shouldMultiAction = shouldExecuteMultiAction(
      difficultySettings,
      enemyEnergy,
      enhancedGameState,
      optimalStrategy
    );
    
    // Enhanced action planning with strategic depth
    const actionPlan = planEnhancedActions(
      difficulty,
      enemyHand,
      enemyField,
      playerField,
      enemyTools,
      enemySpells,
      enemyEnergy,
      maxFieldSize,
      difficultySettings,
      enhancedGameState,
      optimalStrategy
    );
    
    if (actionPlan && actionPlan.length > 0) {
      // Validate and filter actions
      const validActions = actionPlan.filter(action => validateAction(action));
      
      if (validActions.length === 0) {
        console.log("AI: No valid actions found, ending turn");
        return { type: 'endTurn' };
      }
      
      // Return array of actions for multi-action turns
      if (shouldMultiAction && validActions.length > 1) {
        const maxActions = getMaxActionsForDifficulty(difficulty);
        const multiActions = validActions.slice(0, Math.min(maxActions, validActions.length));
        console.log(`AI executing ENHANCED MULTI-ACTION turn with ${multiActions.length} actions`);
        return multiActions;
      } else {
        // Return single action
        console.log('AI executing single strategic action');
        return validActions[0];
      }
    }
    
    // Fallback to single action if planning fails
    const singleAction = determineEnhancedSingleAction(
      difficulty, 
      enemyHand, 
      enemyField, 
      playerField, 
      enemyTools, 
      enemySpells, 
      enemyEnergy, 
      maxFieldSize,
      enhancedGameState
    );
    
    if (!singleAction || singleAction.type === undefined) {
      console.log("AI: Fallback - ending turn");
      return { type: 'endTurn' };
    }
    
    return singleAction;
    
  } catch (error) {
    console.error("AI Error:", error);
    return { type: 'endTurn' };
  }
};

// ADD: Strategy determination with visual hints
export const determineAIStrategy = (
  difficulty,
  enemyHand,
  enemyField,
  playerField,
  enemyTools,
  enemySpells,
  currentEnergy,
  gameState
) => {
  // Analyze enhanced game state
  const enhancedGameState = analyzeEnhancedGameState(
    enemyField,
    playerField,
    enemyHand,
    currentEnergy,
    enemyTools,
    enemySpells,
    difficulty,
    gameState
  );
  
  // Determine primary strategy based on game state
  let strategy = {
    name: 'resource-efficiency',
    description: '',
    stance: null
  };
  
  // Maximum Aggression
  if (enhancedGameState.shouldAttackAggressively && 
      enhancedGameState.lethalDamageAvailable > 0 &&
      enemyField.length >= playerField.length) {
    strategy = {
      name: 'maximum-aggression',
      description: 'The enemy takes an aggressive stance!',
      stance: 'aggressive',
      color: 'rgba(255, 0, 0, 0.1)'
    };
  }
  // Defensive Setup
  else if (enhancedGameState.shouldDefendStrategically ||
           enhancedGameState.criticalCreatures.length > 0) {
    strategy = {
      name: 'defensive-setup',
      description: 'The enemy assumes a defensive posture...',
      stance: 'defensive',
      color: 'rgba(33, 150, 243, 0.1)'
    };
  }
  // Combo Setup
  else if (enhancedGameState.shouldSetupCombo ||
           enhancedGameState.comboOpportunity) {
    strategy = {
      name: 'combo-setup',
      description: 'The enemy seems to be planning something...',
      stance: 'combo',
      color: 'rgba(128, 0, 128, 0.1)'
    };
  }
  // Synergy Focus (NEW)
  else if (checkForPotentialSynergies(enemyHand, enemyField).length > 0) {
    strategy = {
      name: 'synergy-focus',
      description: 'The enemy coordinates their forces...',
      stance: 'synergy',
      color: 'rgba(0, 188, 212, 0.1)'
    };
  }
  // Resource Efficiency (default)
  else {
    strategy = {
      name: 'resource-efficiency',
      description: 'The enemy carefully considers their options...',
      stance: null,
      color: null
    };
  }
  
  return strategy;
};

// ADD: Check for potential synergies that could be created
const checkForPotentialSynergies = (hand, field) => {
  const synergies = [];
  const allCreatures = [...hand, ...field];
  
  // Check species synergies
  const speciesCount = {};
  allCreatures.forEach(creature => {
    speciesCount[creature.species_name] = (speciesCount[creature.species_name] || 0) + 1;
  });
  
  Object.entries(speciesCount).forEach(([species, count]) => {
    if (count >= 2) {
      synergies.push({
        type: 'species',
        species: species,
        count: count,
        potential: count < allCreatures.filter(c => c.species_name === species).length
      });
    }
  });
  
  // Check stat synergies
  const statPairs = [
    { stats: ['strength', 'stamina'], name: 'Physical' },
    { stats: ['magic', 'energy'], name: 'Magical' },
    { stats: ['speed', 'strength'], name: 'Agile' }
  ];
  
  statPairs.forEach(pair => {
    const hasFirst = allCreatures.some(c => c.specialty_stats?.includes(pair.stats[0]));
    const hasSecond = allCreatures.some(c => c.specialty_stats?.includes(pair.stats[1]));
    if (hasFirst && hasSecond) {
      synergies.push({
        type: 'stats',
        stats: pair.stats,
        name: pair.name
      });
    }
  });
  
  return synergies;
};

// ADD: Helper function to check stat synergy potential
const checkStatSynergyPotential = (creature, field) => {
  const statPairs = [
    ['strength', 'stamina'],
    ['magic', 'energy'],
    ['speed', 'strength']
  ];
  
  for (const pair of statPairs) {
    const creatureHas = creature.specialty_stats?.includes(pair[0]) || 
                       creature.specialty_stats?.includes(pair[1]);
    const fieldHas = field.some(f => 
      (f.specialty_stats?.includes(pair[0]) || f.specialty_stats?.includes(pair[1])) &&
      !f.specialty_stats?.some(stat => creature.specialty_stats?.includes(stat))
    );
    
    if (creatureHas && fieldHas) return true;
  }
  
  return false;
};

// ADD: Export the strategy helper for use in BattleGame
export const getAIStrategyVisuals = (strategy) => {
  const visuals = {
    'maximum-aggression': {
      creatureClass: 'aggressive-stance',
      screenEffect: { type: 'flash', color: 'rgba(255, 0, 0, 0.1)', duration: 500 },
      particleType: 'damage',
      message: 'The enemy takes an aggressive stance!'
    },
    'defensive-setup': {
      creatureClass: 'defensive-stance',
      screenEffect: { type: 'flash', color: 'rgba(33, 150, 243, 0.1)', duration: 500 },
      particleType: 'shield',
      message: 'The enemy assumes a defensive posture...'
    },
    'combo-setup': {
      creatureClass: 'combo-stance',
      screenEffect: { type: 'flash', color: 'rgba(128, 0, 128, 0.1)', duration: 500 },
      particleType: 'magic',
      message: 'The enemy seems to be planning something...'
    },
    'synergy-focus': {
      creatureClass: 'synergy-stance',
      screenEffect: { type: 'flash', color: 'rgba(0, 188, 212, 0.1)', duration: 500 },
      particleType: 'synergy',
      message: 'The enemy coordinates their forces...'
    },
    'resource-efficiency': {
      creatureClass: null,
      screenEffect: null,
      particleType: null,
      message: 'The enemy carefully considers their options...'
    }
  };
  
  return visuals[strategy] || visuals['resource-efficiency'];
};

// ENHANCED: Analyze game state with deeper understanding
const analyzeEnhancedGameState = (
  enemyField, 
  playerField, 
  enemyHand, 
  enemyEnergy, 
  enemyTools,
  enemySpells,
  difficulty,
  gameState
) => {
  const analysis = {
    // Basic metrics
    enemyTotalPower: 0,
    playerTotalPower: 0,
    enemyAvgHealth: 0,
    playerAvgHealth: 0,
    
    // Threat assessment
    immediateThreats: [],
    criticalCreatures: [],
    weakEnemies: [],
    priorityTargets: [],
    
    // Strategic metrics
    shouldAttackAggressively: false,
    shouldDefendStrategically: false,
    shouldSetupCombo: false,
    shouldFocusFire: false,
    
    // Resource efficiency
    fieldControlRatio: 0,
    energyEfficiency: enemyEnergy / Math.max(enemyField.length, 1),
    handQuality: 0,
    boardTension: 0,
    
    // Advanced metrics
    winProbability: 0,
    turnsToVictory: 999,
    turnsToDefeat: 999,
    optimalFieldSize: 0,
    comboOpportunity: false,
    lethalDamageAvailable: 0,
    
    // Item analysis
    availableItemCombos: [],
    bestToolTarget: null,
    bestSpellCombo: null,
    
    // Strategy hints for display
    aggressionIndicators: {
      hasLethal: false,
      canEliminateMultiple: false,
      hasPowerAdvantage: false,
      attackerCount: 0
    },
    
    defenseIndicators: {
      needsEmergencyDefense: false,
      isOutnumbered: false,
      lowAverageHealth: false,
      hasDefensiveTools: false
    },
    
    comboIndicators: {
      currentCombo: gameState.consecutiveActions?.enemy || 0,
      canMaintainCombo: false,
      comboWorthIt: false
    },
    
    synergyIndicators: {
      activeSynergies: 0,
      potentialSynergies: 0,
      synergyCreaturesInHand: 0
    }
  };
  
  // Calculate creature powers and health
  let enemyCreatureCount = 0;
  let playerCreatureCount = 0;
  
  enemyField.forEach(creature => {
    enemyCreatureCount++;
    const power = calculateCreaturePower(creature);
    analysis.enemyTotalPower += power;
    analysis.enemyAvgHealth += (creature.currentHealth / creature.battleStats?.maxHealth || 1);
    
    const healthPercent = creature.currentHealth / (creature.battleStats?.maxHealth || 50);
    if (healthPercent < 0.3) {
      analysis.immediateThreats.push(creature);
    }
    if (healthPercent < 0.15 || (creature.rarity === 'Legendary' && healthPercent < 0.25)) {
      analysis.criticalCreatures.push(creature);
    }
  });
  
  playerField.forEach(creature => {
    playerCreatureCount++;
    const power = calculateCreaturePower(creature);
    analysis.playerTotalPower += power;
    analysis.playerAvgHealth += (creature.currentHealth / creature.battleStats?.maxHealth || 1);
    
    const healthPercent = creature.currentHealth / (creature.battleStats?.maxHealth || 50);
    if (healthPercent < 0.4) {
      analysis.weakEnemies.push(creature);
    }
    
    // Calculate priority score for targeting
    const priorityScore = calculateTargetPriority(creature, enemyField, difficulty);
    analysis.priorityTargets.push({
      creature: creature,
      score: priorityScore,
      canEliminate: canEliminateTarget(creature, enemyField, enemyEnergy)
    });
  });
  
  // Sort priority targets
  analysis.priorityTargets.sort((a, b) => b.score - a.score);
  
  // Calculate averages
  if (enemyCreatureCount > 0) {
    analysis.enemyAvgHealth /= enemyCreatureCount;
  }
  if (playerCreatureCount > 0) {
    analysis.playerAvgHealth /= playerCreatureCount;
  }
  
  // Calculate hand quality with better evaluation
  analysis.handQuality = calculateEnhancedHandQuality(enemyHand, enemyField, playerField);
  
  // Calculate board tension
  analysis.boardTension = Math.abs(analysis.enemyTotalPower - analysis.playerTotalPower) / 
    Math.max(analysis.enemyTotalPower, analysis.playerTotalPower, 1);
  
  // Calculate field control
  analysis.fieldControlRatio = enemyCreatureCount / Math.max(playerCreatureCount, 1);
  
  // Calculate optimal field size based on game state
  analysis.optimalFieldSize = calculateOptimalFieldSize(
    enemyField,
    playerField,
    enemyHand,
    enemyEnergy,
    difficulty
  );
  
  // Enhanced strategic determinations
  const powerAdvantage = analysis.enemyTotalPower > analysis.playerTotalPower * 1.1;
  const healthAdvantage = analysis.enemyAvgHealth > analysis.playerAvgHealth * 1.2;
  const numericalAdvantage = analysis.fieldControlRatio >= 1.2;
  const canFinishTargets = analysis.weakEnemies.length >= 2;
  const highTension = analysis.boardTension > 0.5;
  
  // Determine aggressive strategy
  analysis.shouldAttackAggressively = (
    powerAdvantage ||
    healthAdvantage ||
    numericalAdvantage ||
    canFinishTargets ||
    (difficulty === 'hard' || difficulty === 'expert') ||
    (highTension && analysis.enemyTotalPower >= analysis.playerTotalPower)
  );
  
  // Determine defensive strategy
  analysis.shouldDefendStrategically = (
    analysis.criticalCreatures.length > 0 ||
    (analysis.enemyAvgHealth < 0.4 && !powerAdvantage) ||
    (playerCreatureCount > enemyCreatureCount * 1.5)
  );
  
  // Determine combo setup
  analysis.shouldSetupCombo = (
    enemyEnergy >= 8 &&
    enemyCreatureCount >= 2 &&
    (enemyTools.length > 0 || enemySpells.length > 0)
  );
  
  // Determine focus fire strategy
  const focusFireChance = getDifficultySettings(difficulty).focusFireChance || 0.5;
  analysis.shouldFocusFire = (
    Math.random() < focusFireChance ||
    analysis.weakEnemies.length > 0 ||
    (difficulty === 'expert' && playerCreatureCount <= 3)
  );
  
  // Calculate lethal damage available
  analysis.lethalDamageAvailable = calculateTotalDamageAvailable(
    enemyField,
    enemyEnergy,
    enemySpells
  );
  
  // Check for combo opportunities
  analysis.comboOpportunity = checkComboOpportunities(
    enemyField,
    enemyTools,
    enemySpells,
    enemyEnergy
  );
  
  // Analyze available item combos
  analysis.availableItemCombos = findItemCombos(
    enemyTools,
    enemySpells,
    enemyField,
    playerField
  );
  
  // Calculate win/loss projections
  const projections = calculateBattleProjections(
    enemyField,
    playerField,
    enemyHand,
    analysis
  );
  analysis.winProbability = projections.winProbability;
  analysis.turnsToVictory = projections.turnsToVictory;
  analysis.turnsToDefeat = projections.turnsToDefeat;
  
  // Update strategy indicators
  const playerTotalHealth = playerField.reduce((sum, c) => sum + c.currentHealth, 0);
  analysis.aggressionIndicators = {
    hasLethal: analysis.lethalDamageAvailable >= playerTotalHealth,
    canEliminateMultiple: analysis.weakEnemies.length >= 2,
    hasPowerAdvantage: analysis.enemyTotalPower > analysis.playerTotalPower * 1.3,
    attackerCount: enemyField.filter(c => !c.isDefending && c.currentHealth > 20).length
  };
  
  analysis.defenseIndicators = {
    needsEmergencyDefense: analysis.criticalCreatures.length > 0,
    isOutnumbered: enemyCreatureCount < playerCreatureCount - 1,
    lowAverageHealth: analysis.enemyAvgHealth < 0.4,
    hasDefensiveTools: enemyTools.some(t => t.tool_effect === 'Shield')
  };
  
  analysis.comboIndicators = {
    currentCombo: gameState.consecutiveActions?.enemy || 0,
    canMaintainCombo: enemyEnergy >= 6 && enemyCreatureCount >= 2,
    comboWorthIt: gameState.consecutiveActions?.enemy >= 2 || enemyEnergy >= 15
  };
  
  analysis.synergyIndicators = {
    activeSynergies: checkFieldSynergies(enemyField).length,
    potentialSynergies: checkForPotentialSynergies(enemyHand, enemyField).length,
    synergyCreaturesInHand: enemyHand.filter(c => 
      enemyField.some(f => f.species_name === c.species_name) ||
      checkStatSynergyPotential(c, enemyField)
    ).length
  };
  
  return analysis;
};

// Helper function to check field synergies
const checkFieldSynergies = (field) => {
  const synergies = [];
  
  // Check species synergies on field
  const speciesCount = {};
  field.forEach(creature => {
    speciesCount[creature.species_name] = (speciesCount[creature.species_name] || 0) + 1;
  });
  
  Object.entries(speciesCount).forEach(([species, count]) => {
    if (count >= 2) {
      synergies.push({
        type: 'species',
        species: species,
        count: count
      });
    }
  });
  
  return synergies;
};

// Calculate creature power with better accuracy
const calculateCreaturePower = (creature) => {
  if (!creature || !creature.battleStats) return 0;
  
  let power = 0;
  
  // Base stats contribution
  const stats = creature.stats || {};
  power += Object.values(stats).reduce((sum, stat) => sum + stat, 0);
  
  // Battle stats contribution
  const attackPower = Math.max(
    creature.battleStats.physicalAttack || 0,
    creature.battleStats.magicalAttack || 0
  );
  const defensePower = Math.max(
    creature.battleStats.physicalDefense || 0,
    creature.battleStats.magicalDefense || 0
  );
  
  power += attackPower * 2; // Attack is weighted more
  power += defensePower;
  power += (creature.battleStats.maxHealth || 50) / 10;
  
  // Current health factor
  const healthPercent = creature.currentHealth / (creature.battleStats.maxHealth || 50);
  power *= healthPercent;
  
  // Rarity multiplier
  const rarityMultipliers = {
    'Legendary': 1.5,
    'Epic': 1.3,
    'Rare': 1.15,
    'Common': 1.0
  };
  power *= rarityMultipliers[creature.rarity] || 1.0;
  
  // Form multiplier
  power *= (1 + (creature.form || 0) * 0.2);
  
  // Active effects bonus
  if (creature.activeEffects && creature.activeEffects.length > 0) {
    power *= 1.1;
  }
  
  // Defending penalty (less threatening)
  if (creature.isDefending) {
    power *= 0.8;
  }
  
  return Math.round(power);
};

// Calculate target priority with smarter evaluation
const calculateTargetPriority = (target, attackers, difficulty) => {
  let priority = 0;
  
  // Base priority from threat level
  const threatLevel = calculateCreaturePower(target);
  priority += threatLevel;
  
  // Health-based priority (prefer finishing off weak enemies)
  const healthPercent = target.currentHealth / (target.battleStats?.maxHealth || 50);
  if (healthPercent < 0.25) {
    priority += 100; // Very high priority for near-death targets
  } else if (healthPercent < 0.5) {
    priority += 50;
  }
  
  // Rarity priority
  const rarityPriority = {
    'Legendary': 80,
    'Epic': 60,
    'Rare': 40,
    'Common': 20
  };
  priority += rarityPriority[target.rarity] || 20;
  
  // Form priority
  priority += (target.form || 0) * 25;
  
  // Specialty stats priority (high-value targets)
  if (target.specialty_stats && target.specialty_stats.length >= 2) {
    priority += 30;
  }
  
  // Active effects priority (buffed targets are higher priority)
  if (target.activeEffects && target.activeEffects.length > 0) {
    priority += 20 * target.activeEffects.length;
  }
  
  // Can we eliminate this target?
  const canEliminate = attackers.some(attacker => {
    const damage = estimateAttackDamage(attacker, target);
    return damage >= target.currentHealth;
  });
  
  if (canEliminate) {
    priority += 150; // Massive priority boost for elimination
  }
  
  // Difficulty-based adjustments
  if (difficulty === 'expert' || difficulty === 'hard') {
    // On harder difficulties, prioritize high-value targets more
    if (target.rarity === 'Legendary' || target.rarity === 'Epic') {
      priority *= 1.3;
    }
  }
  
  return priority;
};

// Check if we can eliminate a target this turn
const canEliminateTarget = (target, attackers, availableEnergy) => {
  let totalDamage = 0;
  let energyCost = 0;
  
  // Calculate potential damage from all attackers
  attackers.forEach(attacker => {
    if (!attacker.isDefending && energyCost + 2 <= availableEnergy) {
      const damage = estimateAttackDamage(attacker, target);
      totalDamage += damage;
      energyCost += 2;
    }
  });
  
  return totalDamage >= target.currentHealth;
};

// Calculate enhanced hand quality
const calculateEnhancedHandQuality = (hand, currentField, enemyField) => {
  if (hand.length === 0) return 0;
  
  let totalQuality = 0;
  
  hand.forEach(creature => {
    let quality = 0;
    
    // Base quality from power
    quality += calculateCreaturePower(creature) / 10;
    
    // Energy efficiency
    const energyCost = creature.battleStats?.energyCost || 3;
    const efficiency = calculateCreaturePower(creature) / energyCost;
    quality += efficiency * 5;
    
    // Synergy with current field
    const synergyScore = calculateFieldSynergy(creature, currentField);
    quality += synergyScore * 3;
    
    // Counter potential against enemy field
    let counterScore = 0;
    enemyField.forEach(enemy => {
      if (hasTypeAdvantage(creature, enemy)) {
        counterScore += 10;
      }
    });
    quality += counterScore;
    
    // Form and rarity bonuses
    quality += (creature.form || 0) * 10;
    const rarityBonus = {
      'Legendary': 20,
      'Epic': 15,
      'Rare': 10,
      'Common': 5
    };
    quality += rarityBonus[creature.rarity] || 5;
    
    totalQuality += quality;
  });
  
  return totalQuality / hand.length;
};

// Calculate optimal field size for current game state
const calculateOptimalFieldSize = (currentField, enemyField, hand, energy, difficulty) => {
  const maxFieldSize = getMaxEnemyFieldSize(difficulty);
  const currentSize = currentField.length;
  
  // Base optimal size on enemy field
  let optimal = Math.min(enemyField.length + 1, maxFieldSize);
  
  // Adjust based on hand quality
  const handQuality = calculateEnhancedHandQuality(hand, currentField, enemyField);
  if (handQuality > 50) {
    optimal = Math.min(optimal + 1, maxFieldSize);
  }
  
  // Adjust based on energy availability
  if (energy >= 15) {
    optimal = Math.min(optimal + 1, maxFieldSize);
  }
  
  // Never go below enemy field size if we're losing
  const ourPower = currentField.reduce((sum, c) => sum + calculateCreaturePower(c), 0);
  const theirPower = enemyField.reduce((sum, c) => sum + calculateCreaturePower(c), 0);
  
  if (theirPower > ourPower && optimal < enemyField.length) {
    optimal = Math.min(enemyField.length, maxFieldSize);
  }
  
  return optimal;
};

// Calculate total damage available this turn
const calculateTotalDamageAvailable = (attackers, energy, spells) => {
  let totalDamage = 0;
  let remainingEnergy = energy;
  
  // Calculate attack damage
  attackers.forEach(attacker => {
    if (!attacker.isDefending && remainingEnergy >= 2) {
      const attackPower = Math.max(
        attacker.battleStats?.physicalAttack || 0,
        attacker.battleStats?.magicalAttack || 0
      );
      totalDamage += attackPower;
      remainingEnergy -= 2;
    }
  });
  
  // Calculate spell damage
  if (spells && spells.length > 0 && remainingEnergy >= 4) {
    const damageSpells = spells.filter(spell => 
      spell.spell_effect === 'Surge' || 
      spell.spell_type === 'strength' || 
      spell.spell_type === 'magic'
    );
    
    if (damageSpells.length > 0) {
      // Estimate spell damage (simplified)
      totalDamage += 25;
      remainingEnergy -= 4;
    }
  }
  
  return totalDamage;
};

// Check for combo opportunities
const checkComboOpportunities = (field, tools, spells, energy) => {
  // Check for tool + attack combos
  const hasAttackBuffs = tools.some(t => 
    t.tool_effect === 'Surge' || t.tool_type === 'strength'
  );
  const hasStrongAttackers = field.some(c => {
    const attackPower = Math.max(
      c.battleStats?.physicalAttack || 0,
      c.battleStats?.magicalAttack || 0
    );
    return attackPower > 15 && !c.isDefending;
  });
  
  if (hasAttackBuffs && hasStrongAttackers && energy >= 2) {
    return true;
  }
  
  // Check for spell combos
  if (spells.length >= 2 && energy >= 8) {
    return true;
  }
  
  // Check for multi-attack combo
  const availableAttackers = field.filter(c => !c.isDefending).length;
  if (availableAttackers >= 3 && energy >= 6) {
    return true;
  }
  
  return false;
};

// Find available item combos
const findItemCombos = (tools, spells, ownField, enemyField) => {
  const combos = [];
  
  // Tool + Attack combos
  tools.forEach(tool => {
    if (tool.tool_effect === 'Surge' || tool.tool_type === 'strength') {
      ownField.forEach(creature => {
        const attackPower = Math.max(
          creature.battleStats?.physicalAttack || 0,
          creature.battleStats?.magicalAttack || 0
        );
        if (attackPower > 15) {
          combos.push({
            type: 'buff-attack',
            tool: tool,
            creature: creature,
            value: attackPower * 1.5
          });
        }
      });
    }
  });
  
  // Defensive combos
  tools.forEach(tool => {
    if (tool.tool_effect === 'Shield') {
      const criticalCreatures = ownField.filter(c => 
        c.currentHealth < c.battleStats?.maxHealth * 0.3
      );
      criticalCreatures.forEach(creature => {
        combos.push({
          type: 'emergency-defense',
          tool: tool,
          creature: creature,
          value: calculateCreaturePower(creature)
        });
      });
    }
  });
  
  // Spell combos
  if (spells.length >= 2) {
    const damageSpells = spells.filter(s => 
      s.spell_effect === 'Surge' || s.spell_type === 'strength'
    );
    if (damageSpells.length >= 2) {
      combos.push({
        type: 'double-spell',
        spells: damageSpells.slice(0, 2),
        value: 50
      });
    }
  }
  
  // Sort by value
  combos.sort((a, b) => b.value - a.value);
  
  return combos;
};

// Calculate battle projections
const calculateBattleProjections = (ownField, enemyField, hand, gameState) => {
  const ourPower = gameState.enemyTotalPower;
  const theirPower = gameState.playerTotalPower;
  
  // Simple projection model
  const powerRatio = ourPower / Math.max(theirPower, 1);
  const healthRatio = gameState.enemyAvgHealth / Math.max(gameState.playerAvgHealth, 0.1);
  
  // Win probability based on multiple factors
  let winProbability = 0.5; // Base 50%
  
  // Power advantage
  if (powerRatio > 1.5) winProbability += 0.3;
  else if (powerRatio > 1.2) winProbability += 0.2;
  else if (powerRatio > 1.0) winProbability += 0.1;
  else if (powerRatio < 0.8) winProbability -= 0.2;
  else if (powerRatio < 0.6) winProbability -= 0.3;
  
  // Health advantage
  if (healthRatio > 1.5) winProbability += 0.2;
  else if (healthRatio > 1.2) winProbability += 0.1;
  else if (healthRatio < 0.8) winProbability -= 0.1;
  else if (healthRatio < 0.5) winProbability -= 0.2;
  
  // Field control
  if (gameState.fieldControlRatio > 1.5) winProbability += 0.1;
  else if (gameState.fieldControlRatio < 0.7) winProbability -= 0.1;
  
  // Cap probability
  winProbability = Math.max(0.05, Math.min(0.95, winProbability));
  
  // Estimate turns to victory/defeat
  const avgDamagePerTurn = ourPower * 0.3; // Rough estimate
  const enemyTotalHealth = enemyField.reduce((sum, c) => sum + c.currentHealth, 0);
  const turnsToVictory = Math.ceil(enemyTotalHealth / Math.max(avgDamagePerTurn, 1));
  
  const theirAvgDamage = theirPower * 0.3;
  const ourTotalHealth = ownField.reduce((sum, c) => sum + c.currentHealth, 0);
  const turnsToDefeat = Math.ceil(ourTotalHealth / Math.max(theirAvgDamage, 1));
  
  return {
    winProbability,
    turnsToVictory,
    turnsToDefeat
  };
};

// Calculate optimal strategy with lookahead
const calculateOptimalStrategy = (
  ownField,
  enemyField,
  hand,
  energy,
  tools,
  spells,
  depth,
  gameState,
  settings
) => {
  // Simplified strategy calculation for performance
  const strategies = [];
  
  // Strategy 1: Maximum aggression
  strategies.push({
    name: 'maximum-aggression',
    priority: gameState.shouldAttackAggressively ? 100 : 50,
    focus: 'eliminate-threats',
    actions: ['deploy-attackers', 'buff-attack', 'focus-fire']
  });
  
  // Strategy 2: Defensive setup
  strategies.push({
    name: 'defensive-setup',
    priority: gameState.shouldDefendStrategically ? 100 : 30,
    focus: 'protect-valuable',
    actions: ['deploy-defenders', 'use-shields', 'defend-action']
  });
  
  // Strategy 3: Combo setup
  strategies.push({
    name: 'combo-setup',
    priority: gameState.shouldSetupCombo ? 90 : 40,
    focus: 'build-advantage',
    actions: ['deploy-synergy', 'setup-buffs', 'prepare-burst']
  });
  
  // Strategy 4: Resource efficiency
  strategies.push({
    name: 'resource-efficiency',
    priority: energy < 10 ? 80 : 60,
    focus: 'maximize-value',
    actions: ['efficient-deploy', 'value-trades', 'save-energy']
  });
  
  // Sort by priority
  strategies.sort((a, b) => b.priority - a.priority);
  
  // Return the best strategy
  return strategies[0];
};

// Determine if multi-action turn should be executed
const shouldExecuteMultiAction = (settings, energy, gameState, strategy) => {
  // Base chance from settings
  let multiActionChance = settings.multiActionChance || 0.5;
  
  // Modify based on game state
  if (gameState.shouldAttackAggressively) {
    multiActionChance += 0.2;
  }
  
  if (gameState.comboOpportunity) {
    multiActionChance += 0.15;
  }
  
  if (strategy && strategy.name === 'maximum-aggression') {
    multiActionChance += 0.1;
  }
  
  // Energy requirement
  const hasEnergyForMultiple = energy >= 6;
  
  return hasEnergyForMultiple && Math.random() < multiActionChance;
};

// Get maximum actions for difficulty
const getMaxActionsForDifficulty = (difficulty) => {
  const maxActions = {
    easy: 3,
    medium: 4,
    hard: 5,
    expert: 7
  };
  
  return maxActions[difficulty] || 3;
};

// ENHANCED: Plan optimal actions with superior strategy
const planEnhancedActions = (
  difficulty,
  enemyHand,
  enemyField,
  playerField,
  enemyTools,
  enemySpells,
  enemyEnergy,
  maxFieldSize,
  settings,
  gameState,
  strategy
) => {
  const actions = [];
  let remainingEnergy = enemyEnergy;
  let currentField = [...enemyField];
  let currentHand = [...enemyHand];
  let availableTools = [...enemyTools];
  let availableSpells = [...enemySpells];
  
  const deployedCreatureIds = new Set();
  const usedActionCreatures = new Set();
  
  console.log("Planning enhanced actions with strategy:", strategy?.name);
  
  // PRIORITY 0: Emergency responses
  if (gameState.criticalCreatures.length > 0) {
    const emergencyActions = planEmergencyActions(
      gameState.criticalCreatures,
      availableTools,
      availableSpells,
      remainingEnergy
    );
    
    emergencyActions.forEach(action => {
      if (remainingEnergy >= (action.energyCost || 0)) {
        actions.push(action);
        remainingEnergy -= (action.energyCost || 0);
        
        if (action.tool) {
          availableTools = availableTools.filter(t => t.id !== action.tool.id);
        }
        if (action.spell) {
          availableSpells = availableSpells.filter(s => s.id !== action.spell.id);
        }
      }
    });
  }
  
  // PRIORITY 1: Execute optimal combos
  if (gameState.availableItemCombos.length > 0 && remainingEnergy >= 4) {
    const comboActions = executeOptimalCombos(
      gameState.availableItemCombos,
      currentField,
      playerField,
      remainingEnergy,
      usedActionCreatures
    );
    
    comboActions.forEach(action => {
      if (remainingEnergy >= (action.energyCost || 0)) {
        actions.push(action);
        remainingEnergy -= (action.energyCost || 0);
        
        if (action.creature) {
          usedActionCreatures.add(action.creature.id);
        }
      }
    });
  }
  
  // PRIORITY 2: Strategic deployment
  const deploymentNeeded = currentField.length < gameState.optimalFieldSize;
  
  if (deploymentNeeded && currentHand.length > 0) {
    const deploymentActions = planStrategicDeployment(
      currentHand,
      currentField,
      playerField,
      remainingEnergy,
      maxFieldSize,
      gameState,
      strategy,
      deployedCreatureIds
    );
    
    deploymentActions.forEach(deployment => {
      if (remainingEnergy >= deployment.energyCost && 
          currentField.length < maxFieldSize &&
          !deployedCreatureIds.has(deployment.creature.id)) {
        
        actions.push(deployment);
        remainingEnergy -= deployment.energyCost;
        currentField.push(deployment.creature);
        currentHand = currentHand.filter(c => c.id !== deployment.creature.id);
        deployedCreatureIds.add(deployment.creature.id);
      }
    });
  }
  
  // PRIORITY 3: Pre-attack buffs
  if (gameState.shouldAttackAggressively && availableTools.length > 0) {
    const buffActions = planPreAttackBuffs(
      currentField,
      playerField,
      availableTools,
      remainingEnergy,
      usedActionCreatures
    );
    
    buffActions.forEach(buff => {
      if (buff.tool && !usedActionCreatures.has(buff.target.id)) {
        actions.push(buff);
        availableTools = availableTools.filter(t => t.id !== buff.tool.id);
        // Don't mark as used yet - we want to attack with this creature
      }
    });
  }
  
  // PRIORITY 4: Lethal spell sequences
  if (remainingEnergy >= 4 && availableSpells.length > 0 && playerField.length > 0) {
    const spellSequence = planLethalSpellSequence(
      currentField,
      playerField,
      availableSpells,
      remainingEnergy,
      gameState
    );
    
    spellSequence.forEach(spellAction => {
      if (remainingEnergy >= spellAction.energyCost) {
        actions.push(spellAction);
        remainingEnergy -= spellAction.energyCost;
        availableSpells = availableSpells.filter(s => s.id !== spellAction.spell.id);
        
        if (spellAction.caster) {
          usedActionCreatures.add(spellAction.caster.id);
        }
      }
    });
  }
  
  // PRIORITY 5: Coordinated attacks with focus fire
  if (gameState.shouldFocusFire && remainingEnergy >= 2 && playerField.length > 0) {
    const attackPlan = planFocusFireAttacks(
      currentField,
      playerField,
      remainingEnergy,
      gameState.priorityTargets,
      usedActionCreatures,
      settings.aggressionLevel
    );
    
    attackPlan.forEach(attack => {
      if (remainingEnergy >= attack.energyCost && !usedActionCreatures.has(attack.attacker.id)) {
        actions.push(attack);
        remainingEnergy -= attack.energyCost;
        usedActionCreatures.add(attack.attacker.id);
      }
    });
  } else if (remainingEnergy >= 2 && playerField.length > 0) {
    // Regular attack pattern if not focus firing
    const attackPlan = planOptimalAttacks(
      currentField,
      playerField,
      remainingEnergy,
      gameState,
      usedActionCreatures
    );
    
    attackPlan.forEach(attack => {
      if (remainingEnergy >= attack.energyCost && !usedActionCreatures.has(attack.attacker.id)) {
        actions.push(attack);
        remainingEnergy -= attack.energyCost;
        usedActionCreatures.add(attack.attacker.id);
      }
    });
  }
  
  // PRIORITY 6: Setup actions for next turn
  if (remainingEnergy >= 1 && actions.length < getMaxActionsForDifficulty(difficulty)) {
    const setupActions = planSetupActions(
      currentField,
      playerField,
      availableTools,
      remainingEnergy,
      usedActionCreatures,
      strategy
    );
    
    setupActions.forEach(setup => {
      if (remainingEnergy >= (setup.energyCost || 0)) {
        actions.push(setup);
        remainingEnergy -= (setup.energyCost || 0);
        
        if (setup.creature) {
          usedActionCreatures.add(setup.creature.id);
        }
      }
    });
  }
  
  console.log(`AI planned ${actions.length} enhanced actions`);
  
  return actions;
};

// Plan emergency actions for critical situations
const planEmergencyActions = (criticalCreatures, tools, spells, energy) => {
  const actions = [];
  
  criticalCreatures.forEach(creature => {
    // Look for defensive tools
    const defensiveTool = tools.find(t => 
      t.tool_effect === 'Shield' || 
      (t.tool_type === 'stamina' && t.tool_effect === 'Echo')
    );
    
    if (defensiveTool) {
      actions.push({
        type: 'useTool',
        tool: defensiveTool,
        target: creature,
        energyCost: 0,
        priority: 'emergency'
      });
    } else if (energy >= 1) {
      // Defend if no tools available
      actions.push({
        type: 'defend',
        creature: creature,
        energyCost: 1,
        priority: 'emergency'
      });
    }
  });
  
  return actions;
};

// Execute optimal item combos
const executeOptimalCombos = (combos, ownField, enemyField, energy, usedCreatures) => {
  const actions = [];
  
  // Execute the best available combo
  for (const combo of combos) {
    if (combo.type === 'buff-attack' && energy >= 2) {
      actions.push({
        type: 'useTool',
        tool: combo.tool,
        target: combo.creature,
        energyCost: 0,
        priority: 'combo-setup'
      });
      break;
    } else if (combo.type === 'emergency-defense') {
      actions.push({
        type: 'useTool',
        tool: combo.tool,
        target: combo.creature,
        energyCost: 0,
        priority: 'defensive'
      });
      break;
    } else if (combo.type === 'double-spell' && energy >= 8) {
      // Add first spell
      const caster = ownField[0]; // Simplified
      const target = enemyField[0]; // Simplified
      
      if (caster && target) {
        actions.push({
          type: 'useSpell',
          spell: combo.spells[0],
          caster: caster,
          target: target,
          energyCost: 4,
          priority: 'combo'
        });
      }
      break;
    }
  }
  
  return actions;
};

// Plan strategic deployment
const planStrategicDeployment = (
  hand,
  currentField,
  enemyField,
  energy,
  maxFieldSize,
  gameState,
  strategy,
  deployedIds
) => {
  const deployments = [];
  const fieldSpace = maxFieldSize - currentField.length;
  
  // Sort hand by strategic value
  const sortedHand = hand.map(creature => ({
    creature,
    value: calculateDeploymentValue(creature, currentField, enemyField, gameState, strategy)
  })).sort((a, b) => b.value - a.value);
  
  // Determine deployment count based on strategy
  let targetDeployments = 1;
  
  if (strategy) {
    switch (strategy.name) {
      case 'maximum-aggression':
        targetDeployments = Math.min(fieldSpace, 3, Math.floor(energy / 5));
        break;
      case 'defensive-setup':
        targetDeployments = Math.min(fieldSpace, 2);
        break;
      case 'combo-setup':
        targetDeployments = Math.min(fieldSpace, 2);
        break;
      default:
        targetDeployments = 1;
    }
  }
  
  // Deploy high-value creatures
  let deployed = 0;
  
  for (const entry of sortedHand) {
    if (deployed >= targetDeployments) break;
    
    const cost = entry.creature.battleStats?.energyCost || 5;
    
    if (energy >= cost && !deployedIds.has(entry.creature.id)) {
      deployments.push({
        type: 'deploy',
        creature: entry.creature,
        energyCost: cost,
        priority: 'strategic',
        value: entry.value
      });
      
      energy -= cost;
      deployed++;
    }
  }
  
  return deployments;
};

// Calculate deployment value with strategy consideration
const calculateDeploymentValue = (creature, currentField, enemyField, gameState, strategy) => {
  let value = 0;
  
  // Base value from power
  value += calculateCreaturePower(creature);
  
  // Energy efficiency
  const cost = creature.battleStats?.energyCost || 5;
  value += (calculateCreaturePower(creature) / cost) * 10;
  
  // Synergy value
  value += calculateFieldSynergy(creature, currentField) * 5;
  
  // Counter value
  let counterValue = 0;
  enemyField.forEach(enemy => {
    if (hasTypeAdvantage(creature, enemy)) {
      counterValue += 20;
    }
  });
  value += counterValue;
  
  // Strategy-specific bonuses
  if (strategy) {
    switch (strategy.name) {
      case 'maximum-aggression':
        // Prefer high attack creatures
        const attackPower = Math.max(
          creature.battleStats?.physicalAttack || 0,
          creature.battleStats?.magicalAttack || 0
        );
        value += attackPower * 2;
        break;
        
      case 'defensive-setup':
        // Prefer high defense/health creatures
        const defensePower = Math.max(
          creature.battleStats?.physicalDefense || 0,
          creature.battleStats?.magicalDefense || 0
        );
        value += defensePower * 2;
        value += (creature.battleStats?.maxHealth || 50) / 5;
        break;
        
      case 'combo-setup':
        // Prefer creatures with good specialty stats
        if (creature.specialty_stats && creature.specialty_stats.length >= 2) {
          value += 30;
        }
        break;
    }
  }
  
  // High form bonus
  value += (creature.form || 0) * 20;
  
  // Rarity bonus
  const rarityBonus = {
    'Legendary': 30,
    'Epic': 20,
    'Rare': 10,
    'Common': 5
  };
  value += rarityBonus[creature.rarity] || 5;
  
  return value;
};

// Plan pre-attack buffs
const planPreAttackBuffs = (ownField, enemyField, tools, energy, usedCreatures) => {
  const buffActions = [];
  
  // Find attack buff tools
  const attackBuffs = tools.filter(t => 
    t.tool_effect === 'Surge' || 
    t.tool_type === 'strength' ||
    (t.tool_type === 'magic' && t.tool_effect === 'Surge')
  );
  
  if (attackBuffs.length === 0) return buffActions;
  
  // Find best attackers to buff
  const attackers = ownField
    .filter(c => !c.isDefending && !usedCreatures.has(c.id))
    .map(c => ({
      creature: c,
      attackPower: Math.max(
        c.battleStats?.physicalAttack || 0,
        c.battleStats?.magicalAttack || 0
      )
    }))
    .sort((a, b) => b.attackPower - a.attackPower);
  
  // Buff the strongest attackers
  const buffCount = Math.min(attackBuffs.length, attackers.length);
  
  for (let i = 0; i < buffCount; i++) {
    if (attackers[i] && attackBuffs[i]) {
      buffActions.push({
        type: 'useTool',
        tool: attackBuffs[i],
        target: attackers[i].creature,
        energyCost: 0,
        priority: 'pre-attack'
      });
    }
  }
  
  return buffActions;
};

// Plan lethal spell sequence
const planLethalSpellSequence = (ownField, enemyField, spells, energy, gameState) => {
  const spellActions = [];
  
  if (ownField.length === 0 || enemyField.length === 0) return spellActions;
  
  // Find damage spells
  const damageSpells = spells.filter(s => 
    s.spell_effect === 'Surge' || 
    s.spell_type === 'strength' || 
    s.spell_type === 'magic' ||
    s.spell_effect === 'Drain'
  );
  
  if (damageSpells.length === 0) return spellActions;
  
  // Calculate spell targets
  const spellTargets = gameState.priorityTargets.slice(0, damageSpells.length);
  
  // Create spell actions
  damageSpells.forEach((spell, index) => {
    const caster = findBestSpellCaster(ownField, spell);
    const target = spellTargets[index]?.creature || enemyField[0];
    
    if (caster && target && energy >= 4) {
      spellActions.push({
        type: 'useSpell',
        spell: spell,
        caster: caster,
        target: target,
        energyCost: 4,
        priority: 'lethal'
      });
      energy -= 4;
    }
  });
  
  return spellActions;
};

// Plan focus fire attacks
const planFocusFireAttacks = (
  ownField,
  enemyField,
  energy,
  priorityTargets,
  usedCreatures,
  aggressionLevel
) => {
  const attacks = [];
  
  if (!priorityTargets || priorityTargets.length === 0) return attacks;
  
  // Get available attackers
  const availableAttackers = ownField.filter(c => 
    !c.isDefending && !usedCreatures.has(c.id)
  );
  
  if (availableAttackers.length === 0) return attacks;
  
  // Focus on highest priority target that can be eliminated
  let focusTarget = null;
  
  for (const targetInfo of priorityTargets) {
    if (targetInfo.canEliminate) {
      focusTarget = targetInfo.creature;
      break;
    }
  }
  
  // If no eliminatable target, focus on highest priority
  if (!focusTarget) {
    focusTarget = priorityTargets[0].creature;
  }
  
  // Assign all available attackers to focus target
  const maxAttacks = Math.floor(energy / 2);
  const attackCount = Math.min(availableAttackers.length, maxAttacks);
  
  for (let i = 0; i < attackCount; i++) {
    attacks.push({
      type: 'attack',
      attacker: availableAttackers[i],
      target: focusTarget,
      energyCost: 2,
      priority: 'focus-fire'
    });
  }
  
  return attacks;
};

// Plan optimal attacks without focus fire
const planOptimalAttacks = (ownField, enemyField, energy, gameState, usedCreatures) => {
  const attacks = [];
  
  // Get available attackers
  const availableAttackers = ownField.filter(c => 
    !c.isDefending && !usedCreatures.has(c.id)
  );
  
  if (availableAttackers.length === 0 || enemyField.length === 0) return attacks;
  
  // Create optimal attack pairings
  const pairings = [];
  
  availableAttackers.forEach(attacker => {
    enemyField.forEach(target => {
      const damage = estimateAttackDamage(attacker, target);
      const targetPriority = gameState.priorityTargets.find(p => p.creature.id === target.id)?.score || 0;
      
      pairings.push({
        attacker,
        target,
        damage,
        value: damage + targetPriority,
        canEliminate: damage >= target.currentHealth
      });
    });
  });
  
  // Sort by value (prioritize eliminations)
  pairings.sort((a, b) => {
    if (a.canEliminate && !b.canEliminate) return -1;
    if (!a.canEliminate && b.canEliminate) return 1;
    return b.value - a.value;
  });
  
  // Create attacks from best pairings
  const usedAttackers = new Set();
  const maxAttacks = Math.floor(energy / 2);
  
  for (const pairing of pairings) {
    if (attacks.length >= maxAttacks) break;
    
    if (!usedAttackers.has(pairing.attacker.id)) {
      attacks.push({
        type: 'attack',
        attacker: pairing.attacker,
        target: pairing.target,
        energyCost: 2,
        priority: 'optimal',
        expectedDamage: pairing.damage
      });
      
      usedAttackers.add(pairing.attacker.id);
    }
  }
  
  return attacks;
};

// Plan setup actions for next turn
const planSetupActions = (ownField, enemyField, tools, energy, usedCreatures, strategy) => {
  const setupActions = [];
  
  // Echo effects for sustained advantage
  const echoTools = tools.filter(t => t.tool_effect === 'Echo');
  
  if (echoTools.length > 0 && ownField.length > 0) {
    // Find best target for echo
    const bestTarget = ownField
      .filter(c => !usedCreatures.has(c.id))
      .sort((a, b) => calculateCreaturePower(b) - calculateCreaturePower(a))[0];
    
    if (bestTarget) {
      setupActions.push({
        type: 'useTool',
        tool: echoTools[0],
        target: bestTarget,
        energyCost: 0,
        priority: 'setup'
      });
    }
  }
  
  // Charge effects for future burst
  const chargeTools = tools.filter(t => t.tool_effect === 'Charge');
  
  if (chargeTools.length > 0 && energy >= 3) {
    const chargeTarget = ownField.find(c => 
      !usedCreatures.has(c.id) && 
      !c.activeEffects?.some(e => e.effectType === 'Charge')
    );
    
    if (chargeTarget) {
      setupActions.push({
        type: 'useTool',
        tool: chargeTools[0],
        target: chargeTarget,
        energyCost: 0,
        priority: 'setup'
      });
    }
  }
  
  // Strategic defense for valuable creatures
  if (energy >= 1) {
    const valuableCreature = ownField
      .filter(c => !c.isDefending && !usedCreatures.has(c.id))
      .sort((a, b) => {
        // Prioritize high-value healthy creatures
        const aValue = calculateCreaturePower(a) * (a.currentHealth / a.battleStats?.maxHealth);
        const bValue = calculateCreaturePower(b) * (b.currentHealth / b.battleStats?.maxHealth);
        return bValue - aValue;
      })[0];
    
    if (valuableCreature && valuableCreature.currentHealth > valuableCreature.battleStats?.maxHealth * 0.5) {
      setupActions.push({
        type: 'defend',
        creature: valuableCreature,
        energyCost: 1,
        priority: 'setup'
      });
    }
  }
  
  return setupActions;
};

// Enhanced single action determination for fallback
const determineEnhancedSingleAction = (
  difficulty,
  enemyHand,
  enemyField,
  playerField,
  enemyTools,
  enemySpells,
  enemyEnergy,
  maxFieldSize,
  gameState
) => {
  // Use specific AI functions based on difficulty
  switch (difficulty) {
    case 'easy':
      return determineEnhancedEasyAction(
        enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
      );
    case 'medium':
      return determineEnhancedMediumAction(
        enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
      );
    case 'hard':
      return determineEnhancedHardAction(
        enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
      );
    case 'expert':
      return determineEnhancedExpertAction(
        enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
      );
    default:
      return { type: 'endTurn' };
  }
};

// Enhanced Easy AI - Still challenging but makes some mistakes
const determineEnhancedEasyAction = (
  enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
) => {
  // Emergency defense
  if (gameState.criticalCreatures.length > 0 && (enemyTools.length > 0 || enemyEnergy >= 1)) {
    const critical = gameState.criticalCreatures[0];
    
    const defensiveTool = enemyTools.find(t => 
      t.tool_effect === 'Shield' || t.tool_type === 'stamina'
    );
    
    if (defensiveTool) {
      return {
        type: 'useTool',
        tool: defensiveTool,
        target: critical,
        energyCost: 0
      };
    } else if (enemyEnergy >= 1) {
      return {
        type: 'defend',
        creature: critical,
        energyCost: 1
      };
    }
  }
  
  // Deployment (sometimes suboptimal choices)
  if (enemyField.length < Math.min(3, maxFieldSize) && enemyHand.length > 0) {
    // Easy AI sometimes deploys weaker creatures
    const deployable = enemyHand.filter(c => 
      (c.battleStats?.energyCost || 5) <= enemyEnergy
    );
    
    if (deployable.length > 0) {
      // 70% chance to pick the best, 30% to pick randomly
      let creature;
      if (Math.random() < 0.7) {
        creature = deployable.sort((a, b) => 
          calculateCreaturePower(b) - calculateCreaturePower(a)
        )[0];
      } else {
        creature = deployable[Math.floor(Math.random() * deployable.length)];
      }
      
      return {
        type: 'deploy',
        creature: creature,
        energyCost: creature.battleStats?.energyCost || 5
      };
    }
  }
  
  // Attack (not always optimal target)
  if (enemyField.length > 0 && playerField.length > 0 && enemyEnergy >= 2) {
    const attackers = enemyField.filter(c => !c.isDefending);
    
    if (attackers.length > 0) {
      const attacker = attackers[Math.floor(Math.random() * attackers.length)];
      
      // 60% chance to attack priority target, 40% random
      let target;
      if (Math.random() < 0.6 && gameState.priorityTargets.length > 0) {
        target = gameState.priorityTargets[0].creature;
      } else {
        target = playerField[Math.floor(Math.random() * playerField.length)];
      }
      
      return {
        type: 'attack',
        attacker: attacker,
        target: target,
        energyCost: 2
      };
    }
  }
  
  return { type: 'endTurn' };
};

// Enhanced Medium AI - Good tactics with occasional mistakes
const determineEnhancedMediumAction = (
  enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
) => {
  // Spell usage (80% optimal)
  if (enemySpells.length > 0 && enemyField.length > 0 && playerField.length > 0 && enemyEnergy >= 4) {
    if (Math.random() < 0.8) {
      const damageSpell = enemySpells.find(s => 
        s.spell_effect === 'Surge' || s.spell_type === 'strength'
      );
      
      if (damageSpell) {
        const caster = findBestSpellCaster(enemyField, damageSpell);
        const target = gameState.priorityTargets[0]?.creature || playerField[0];
        
        return {
          type: 'useSpell',
          spell: damageSpell,
          caster: caster,
          target: target,
          energyCost: 4
        };
      }
    }
  }
  
  // Tool usage before attacks (70% of the time)
  if (enemyTools.length > 0 && enemyField.length > 0 && Math.random() < 0.7) {
    const attackBuff = enemyTools.find(t => 
      t.tool_effect === 'Surge' || t.tool_type === 'strength'
    );
    
    if (attackBuff) {
      const strongestAttacker = enemyField
        .filter(c => !c.isDefending)
        .sort((a, b) => {
          const aAttack = Math.max(
            a.battleStats?.physicalAttack || 0,
            a.battleStats?.magicalAttack || 0
          );
          const bAttack = Math.max(
            b.battleStats?.physicalAttack || 0,
            b.battleStats?.magicalAttack || 0
          );
          return bAttack - aAttack;
        })[0];
      
      if (strongestAttacker) {
        return {
          type: 'useTool',
          tool: attackBuff,
          target: strongestAttacker,
          energyCost: 0
        };
      }
    }
  }
  
  // Strategic deployment
  if (enemyField.length < gameState.optimalFieldSize && enemyHand.length > 0) {
    const bestCreature = selectBestCreatureForDeployment(
      enemyHand, enemyField, playerField, enemyEnergy, 'medium'
    );
    
    if (bestCreature) {
      return {
        type: 'deploy',
        creature: bestCreature,
        energyCost: bestCreature.battleStats?.energyCost || 5
      };
    }
  }
  
  // Focused attacks (80% of the time)
  if (enemyField.length > 0 && playerField.length > 0 && enemyEnergy >= 2) {
    const shouldFocus = Math.random() < 0.8;
    
    if (shouldFocus && gameState.priorityTargets.length > 0) {
      const attacker = enemyField.find(c => !c.isDefending);
      const target = gameState.priorityTargets[0].creature;
      
      if (attacker && target) {
        return {
          type: 'attack',
          attacker: attacker,
          target: target,
          energyCost: 2
        };
      }
    } else {
      // Random attack
      const attacker = enemyField.find(c => !c.isDefending);
      const target = playerField[Math.floor(Math.random() * playerField.length)];
      
      if (attacker && target) {
        return {
          type: 'attack',
          attacker: attacker,
          target: target,
          energyCost: 2
        };
      }
    }
  }
  
  return { type: 'endTurn' };
};

// Enhanced Hard AI - Nearly optimal play
const determineEnhancedHardAction = (
  enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
) => {
  // Always defend critical creatures
  if (gameState.criticalCreatures.length > 0) {
    const critical = gameState.criticalCreatures[0];
    
    const shieldTool = enemyTools.find(t => t.tool_effect === 'Shield');
    if (shieldTool) {
      return {
        type: 'useTool',
        tool: shieldTool,
        target: critical,
        energyCost: 0
      };
    }
    
    if (enemyEnergy >= 1 && !critical.isDefending) {
      return {
        type: 'defend',
        creature: critical,
        energyCost: 1
      };
    }
  }
  
  // Optimal spell usage
  if (gameState.lethalDamageAvailable > 0 && enemySpells.length > 0 && enemyEnergy >= 4) {
    const bestSpellCombo = findBestSpellCombo(enemySpells, enemyField, playerField, enemyEnergy);
    if (bestSpellCombo) {
      return bestSpellCombo;
    }
  }
  
  // Setup combos
  if (gameState.comboOpportunity && enemyTools.length > 0) {
    const surgeTool = enemyTools.find(t => t.tool_effect === 'Surge');
    if (surgeTool) {
      const bestAttacker = enemyField
        .filter(c => !c.isDefending)
        .sort((a, b) => {
          const aAttack = Math.max(
            a.battleStats?.physicalAttack || 0,
            a.battleStats?.magicalAttack || 0
          );
          const bAttack = Math.max(
            b.battleStats?.physicalAttack || 0,
            b.battleStats?.magicalAttack || 0
          );
          return bAttack - aAttack;
        })[0];
      
      if (bestAttacker) {
        return {
          type: 'useTool',
          tool: surgeTool,
          target: bestAttacker,
          energyCost: 0
        };
      }
    }
  }
  
  // Optimal deployment
  if (enemyField.length < gameState.optimalFieldSize && enemyHand.length > 0) {
    const bestCreature = enemyHand
      .filter(c => (c.battleStats?.energyCost || 5) <= enemyEnergy)
      .sort((a, b) => {
        const aValue = calculateDeploymentValue(a, enemyField, playerField, gameState, null);
        const bValue = calculateDeploymentValue(b, enemyField, playerField, gameState, null);
        return bValue - aValue;
      })[0];
    
    if (bestCreature) {
      return {
        type: 'deploy',
        creature: bestCreature,
        energyCost: bestCreature.battleStats?.energyCost || 5
      };
    }
  }
  
  // Focus fire with 95% accuracy
  if (gameState.shouldFocusFire && enemyField.length > 0 && playerField.length > 0 && enemyEnergy >= 2) {
    const target = gameState.priorityTargets[0]?.creature;
    if (target) {
      // Find best attacker for this target
      const bestAttacker = enemyField
        .filter(c => !c.isDefending)
        .sort((a, b) => {
          const aDamage = estimateAttackDamage(a, target);
          const bDamage = estimateAttackDamage(b, target);
          return bDamage - aDamage;
        })[0];
      
      if (bestAttacker) {
        return {
          type: 'attack',
          attacker: bestAttacker,
          target: target,
          energyCost: 2
        };
      }
    }
  }
  
  // Strategic defense
  if (enemyEnergy >= 1 && gameState.shouldDefendStrategically) {
    const valuableHealthy = enemyField
      .filter(c => !c.isDefending && c.currentHealth > c.battleStats?.maxHealth * 0.5)
      .sort((a, b) => calculateCreaturePower(b) - calculateCreaturePower(a))[0];
    
    if (valuableHealthy) {
      return {
        type: 'defend',
        creature: valuableHealthy,
        energyCost: 1
      };
    }
  }
  
  return { type: 'endTurn' };
};

// Enhanced Expert AI - Perfect play
const determineEnhancedExpertAction = (
  enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
) => {
  // Calculate perfect move sequence
  const perfectSequence = calculatePerfectMoveSequence(
    enemyField,
    playerField,
    enemyHand,
    enemyTools,
    enemySpells,
    enemyEnergy,
    maxFieldSize,
    gameState
  );
  
  if (perfectSequence && perfectSequence.length > 0) {
    return perfectSequence[0];
  }
  
  // Fallback to hard AI logic with perfect execution
  return determineEnhancedHardAction(
    enemyHand, enemyField, playerField, enemyTools, enemySpells, enemyEnergy, maxFieldSize, gameState
  );
};

// Calculate perfect move sequence for expert AI
const calculatePerfectMoveSequence = (
  ownField,
  enemyField,
  hand,
  tools,
  spells,
  energy,
  maxFieldSize,
  gameState
) => {
  const sequence = [];
  
  // Priority 1: Save critical creatures with perfect timing
  if (gameState.criticalCreatures.length > 0) {
    gameState.criticalCreatures.forEach(creature => {
      // Calculate incoming damage
      const incomingDamage = calculateIncomingDamage(creature, enemyField);
      
      // Choose perfect defensive option
      if (creature.currentHealth <= incomingDamage) {
        const shieldTool = tools.find(t => 
          t.tool_effect === 'Shield' && 
          t.rarity === 'Legendary' || t.rarity === 'Epic'
        ) || tools.find(t => t.tool_effect === 'Shield');
        
        if (shieldTool) {
          sequence.push({
            type: 'useTool',
            tool: shieldTool,
            target: creature,
            energyCost: 0,
            priority: 'critical-save'
          });
        } else if (energy >= 1) {
          sequence.push({
            type: 'defend',
            creature: creature,
            energyCost: 1,
            priority: 'critical-save'
          });
        }
      }
    });
  }
  
  // Priority 2: Execute game-winning combos
  const winningCombo = findGameWinningCombo(
    ownField,
    enemyField,
    tools,
    spells,
    energy,
    gameState
  );
  
  if (winningCombo) {
    winningCombo.forEach(action => sequence.push(action));
    return sequence;
  }
  
  // Priority 3: Perfect resource optimization
  const optimalResourceUsage = calculateOptimalResourceUsage(
    ownField,
    enemyField,
    hand,
    tools,
    spells,
    energy,
    maxFieldSize,
    gameState
  );
  
  optimalResourceUsage.forEach(action => sequence.push(action));
  
  return sequence;
};

// Calculate incoming damage to a creature
const calculateIncomingDamage = (targetCreature, attackers) => {
  let totalDamage = 0;
  
  attackers.forEach(attacker => {
    if (!attacker.isDefending) {
      const damage = estimateAttackDamage(attacker, targetCreature);
      totalDamage += damage;
    }
  });
  
  return totalDamage;
};

// Find game-winning combo
const findGameWinningCombo = (ownField, enemyField, tools, spells, energy, gameState) => {
  const combo = [];
  
  // Calculate total enemy health
  const totalEnemyHealth = enemyField.reduce((sum, c) => sum + c.currentHealth, 0);
  
  // Check for lethal spell combo
  let spellDamage = 0;
  let spellCost = 0;
  
  const damageSpells = spells.filter(s => 
    s.spell_effect === 'Surge' || 
    s.spell_type === 'strength' || 
    s.spell_type === 'magic'
  ).sort((a, b) => {
    // Sort by efficiency
    const aEfficiency = estimateSpellEfficiency(a, ownField[0]);
    const bEfficiency = estimateSpellEfficiency(b, ownField[0]);
    return bEfficiency - aEfficiency;
  });
  
  // Add spells to combo
  damageSpells.forEach(spell => {
    if (spellCost + 4 <= energy) {
      const caster = findBestSpellCaster(ownField, spell);
      const target = findBestSpellTarget(enemyField, spell);
      
      if (caster && target) {
        const damage = estimateSpellDamage(spell, caster, target);
        spellDamage += damage;
        spellCost += 4;
        
        combo.push({
          type: 'useSpell',
          spell: spell,
          caster: caster,
          target: target,
          energyCost: 4,
          priority: 'lethal-combo'
        });
      }
    }
  });
  
  // Check if we need attack damage to finish
  const remainingHealth = totalEnemyHealth - spellDamage;
  const remainingEnergy = energy - spellCost;
  
  if (remainingHealth > 0 && remainingEnergy >= 2) {
    // Add buff + attack combo
    const surgeTool = tools.find(t => t.tool_effect === 'Surge');
    const bestAttacker = ownField
      .filter(c => !c.isDefending)
      .sort((a, b) => {
        const aAttack = Math.max(
          a.battleStats?.physicalAttack || 0,
          a.battleStats?.magicalAttack || 0
        );
        const bAttack = Math.max(
          b.battleStats?.physicalAttack || 0,
          b.battleStats?.magicalAttack || 0
        );
        return bAttack - aAttack;
      })[0];
    
    if (surgeTool && bestAttacker) {
      combo.unshift({
        type: 'useTool',
        tool: surgeTool,
        target: bestAttacker,
        energyCost: 0,
        priority: 'combo-setup'
      });
    }
  }
  
  // Check if combo is lethal
  const comboLethal = calculateComboLethality(combo, enemyField);
  
  return comboLethal ? combo : null;
};

// Calculate optimal resource usage
const calculateOptimalResourceUsage = (
  ownField,
  enemyField,
  hand,
  tools,
  spells,
  energy,
  maxFieldSize,
  gameState
) => {
  const actions = [];
  let remainingEnergy = energy;
  
  // Perfect deployment timing
  const deploymentValue = calculateDeploymentTiming(
    ownField,
    enemyField,
    hand,
    remainingEnergy,
    maxFieldSize,
    gameState
  );
  
  if (deploymentValue.shouldDeploy && deploymentValue.creature) {
    actions.push({
      type: 'deploy',
      creature: deploymentValue.creature,
      energyCost: deploymentValue.creature.battleStats?.energyCost || 5,
      priority: 'optimal-timing'
    });
    remainingEnergy -= deploymentValue.creature.battleStats?.energyCost || 5;
  }
  
  // Perfect item usage
  const itemPlan = planPerfectItemUsage(
    ownField,
    enemyField,
    tools,
    spells,
    remainingEnergy,
    gameState
  );
  
  itemPlan.forEach(item => {
    if (remainingEnergy >= (item.energyCost || 0)) {
      actions.push(item);
      remainingEnergy -= (item.energyCost || 0);
    }
  });
  
  // Perfect attack sequence
  if (remainingEnergy >= 2 && enemyField.length > 0) {
    const attackSequence = calculatePerfectAttackSequence(
      ownField,
      enemyField,
      remainingEnergy,
      gameState
    );
    
    attackSequence.forEach(attack => {
      if (remainingEnergy >= 2) {
        actions.push(attack);
        remainingEnergy -= 2;
      }
    });
  }
  
  return actions;
};

// Helper functions for enhanced AI

// Find best spell caster
const findBestSpellCaster = (field, spell) => {
  if (field.length === 0) return null;
  
  return field.reduce((best, current) => {
    if (!best) return current;
    
    const bestMagic = best.stats?.magic || 0;
    const currentMagic = current.stats?.magic || 0;
    
    let bestScore = bestMagic;
    let currentScore = currentMagic;
    
    // Bonus for matching spell type to creature specialty
    if (best.specialty_stats?.includes(spell.spell_type)) bestScore += 5;
    if (current.specialty_stats?.includes(spell.spell_type)) currentScore += 5;
    
    // Bonus for healthy caster
    bestScore *= (best.currentHealth / best.battleStats?.maxHealth);
    currentScore *= (current.currentHealth / current.battleStats?.maxHealth);
    
    return currentScore > bestScore ? current : best;
  }, null);
};

// Find best spell target
const findBestSpellTarget = (targets, spell) => {
  if (targets.length === 0) return null;
  
  // For damage spells, target based on elimination potential
  if (spell.spell_effect === 'Surge' || spell.spell_type === 'strength') {
    return targets.reduce((best, current) => {
      if (!best) return current;
      
      // Prioritize targets we can eliminate
      const bestElimination = best.currentHealth <= 25;
      const currentElimination = current.currentHealth <= 25;
      
      if (currentElimination && !bestElimination) return current;
      if (!currentElimination && bestElimination) return best;
      
      // Otherwise target highest threat
      const bestThreat = calculateCreaturePower(best);
      const currentThreat = calculateCreaturePower(current);
      
      return currentThreat > bestThreat ? current : best;
    }, null);
  }
  
  // For other spells, target highest value
  return targets.reduce((best, current) => {
    if (!best) return current;
    
    const bestValue = calculateCreaturePower(best);
    const currentValue = calculateCreaturePower(current);
    
    return currentValue > bestValue ? current : best;
  }, null);
};

// Find best spell combo
const findBestSpellCombo = (spells, ownField, enemyField, energy) => {
  if (spells.length === 0 || ownField.length === 0 || enemyField.length === 0) return null;
  
  const damageSpell = spells.find(s => 
    s.spell_effect === 'Surge' || s.spell_type === 'strength' || s.spell_type === 'magic'
  );
  
  if (damageSpell && energy >= 4) {
    const caster = findBestSpellCaster(ownField, damageSpell);
    const target = findBestSpellTarget(enemyField, damageSpell);
    
    if (caster && target) {
      return {
        type: 'useSpell',
        spell: damageSpell,
        caster: caster,
        target: target,
        energyCost: 4
      };
    }
  }
  
  return null;
};

// Estimate spell damage
const estimateSpellDamage = (spell, caster, target) => {
  const casterMagic = caster.stats?.magic || 5;
  const baseDamage = 20;
  
  let damage = baseDamage * (1 + casterMagic * 0.15);
  
  // Apply spell effect multipliers
  if (spell.spell_effect === 'Surge') damage *= 1.5;
  
  // Apply rarity multipliers
  const rarityMultipliers = { 'Legendary': 1.5, 'Epic': 1.3, 'Rare': 1.1, 'Common': 1.0 };
  damage *= rarityMultipliers[spell.rarity] || 1.0;
  
  // Apply defense
  const defense = target.battleStats?.magicalDefense || 0;
  damage = Math.max(1, damage - defense * 0.5);
  
  return Math.floor(damage);
};

// Estimate spell efficiency
const estimateSpellEfficiency = (spell, caster) => {
  const baseDamage = estimateSpellDamage(spell, caster, { battleStats: { magicalDefense: 5 } });
  const energyCost = 4;
  
  return baseDamage / energyCost;
};

// Check if combo is lethal
const calculateComboLethality = (combo, enemyField) => {
  let totalDamage = 0;
  const totalEnemyHealth = enemyField.reduce((sum, c) => sum + c.currentHealth, 0);
  
  combo.forEach(action => {
    if (action.type === 'useSpell') {
      totalDamage += estimateSpellDamage(action.spell, action.caster, action.target);
    } else if (action.type === 'attack') {
      totalDamage += estimateAttackDamage(action.attacker, action.target) * 
        (action.attacker.activeEffects?.some(e => e.name?.includes('Surge')) ? 1.5 : 1);
    }
  });
  
  return totalDamage >= totalEnemyHealth * 0.9;
};

// Calculate deployment timing
const calculateDeploymentTiming = (ownField, enemyField, hand, energy, maxFieldSize, gameState) => {
  const currentFieldSize = ownField.length;
  const optimalSize = gameState.optimalFieldSize;
  
  if (currentFieldSize >= optimalSize || currentFieldSize >= maxFieldSize) {
    return { shouldDeploy: false };
  }
  
  // Find best creature to deploy
  const deployable = hand.filter(c => (c.battleStats?.energyCost || 5) <= energy);
  
  if (deployable.length === 0) {
    return { shouldDeploy: false };
  }
  
  // Score each creature
  const scoredCreatures = deployable.map(creature => ({
    creature,
    score: calculateDeploymentValue(creature, ownField, enemyField, gameState, null) * 
          (1 + (gameState.winProbability < 0.5 ? 0.3 : 0)) // Deploy more aggressively when losing
  }));
  
  scoredCreatures.sort((a, b) => b.score - a.score);
  
  // Deploy if score is high enough
  const threshold = gameState.winProbability < 0.5 ? 50 : 70;
  
  if (scoredCreatures[0].score >= threshold) {
    return {
      shouldDeploy: true,
      creature: scoredCreatures[0].creature
    };
  }
  
  return { shouldDeploy: false };
};

// Plan perfect item usage
const planPerfectItemUsage = (ownField, enemyField, tools, spells, energy, gameState) => {
  const itemActions = [];
  
  // Calculate item efficiency for each possible use
  const itemOptions = [];
  
  tools.forEach(tool => {
    ownField.forEach(creature => {
      const efficiency = calculateItemEfficiency(tool, creature, gameState);
      itemOptions.push({
        type: 'tool',
        item: tool,
        target: creature,
        efficiency: efficiency
      });
    });
  });
  
  if (energy >= 4) {
    spells.forEach(spell => {
      ownField.forEach(caster => {
        enemyField.forEach(target => {
          const efficiency = calculateSpellEfficiency(spell, caster, target, gameState);
          itemOptions.push({
            type: 'spell',
            item: spell,
            caster: caster,
            target: target,
            efficiency: efficiency
          });
        });
      });
    });
  }
  
  // Sort by efficiency
  itemOptions.sort((a, b) => b.efficiency - a.efficiency);
  
  // Add most efficient items
  const usedItems = new Set();
  
  itemOptions.forEach(option => {
    if (option.efficiency > 50 && !usedItems.has(option.item.id)) {
      if (option.type === 'tool') {
        itemActions.push({
          type: 'useTool',
          tool: option.item,
          target: option.target,
          energyCost: 0,
          priority: 'optimal'
        });
      } else if (option.type === 'spell' && energy >= 4) {
        itemActions.push({
          type: 'useSpell',
          spell: option.item,
          caster: option.caster,
          target: option.target,
          energyCost: 4,
          priority: 'optimal'
        });
      }
      
      usedItems.add(option.item.id);
    }
  });
  
  return itemActions;
};

// Calculate perfect attack sequence
const calculatePerfectAttackSequence = (ownField, enemyField, energy, gameState) => {
  const attacks = [];
  const maxAttacks = Math.floor(energy / 2);
  
  // Create attack matrix
  const attackMatrix = [];
  
  ownField.forEach(attacker => {
    if (!attacker.isDefending) {
      enemyField.forEach(target => {
        const damage = estimateAttackDamage(attacker, target);
        const priority = gameState.priorityTargets.find(p => p.creature.id === target.id)?.score || 0;
        
        attackMatrix.push({
          attacker,
          target,
          damage,
          priority,
          value: damage + priority + (damage >= target.currentHealth ? 200 : 0)
        });
      });
    }
  });
  
  // Sort by value
  attackMatrix.sort((a, b) => b.value - a.value);
  
  // Select optimal attacks
  const usedAttackers = new Set();
  const targetDamage = new Map();
  
  for (const attack of attackMatrix) {
    if (attacks.length >= maxAttacks) break;
    
    if (!usedAttackers.has(attack.attacker.id)) {
      // Check if target is already eliminated
      const currentDamage = targetDamage.get(attack.target.id) || 0;
      if (currentDamage < attack.target.currentHealth) {
        attacks.push({
          type: 'attack',
          attacker: attack.attacker,
          target: attack.target,
          energyCost: 2,
          priority: 'perfect',
          expectedDamage: attack.damage
        });
        
        usedAttackers.add(attack.attacker.id);
        targetDamage.set(attack.target.id, currentDamage + attack.damage);
      }
    }
  }
  
  return attacks;
};

// Calculate spell efficiency with context
const calculateSpellEfficiency = (spell, caster, target, gameState) => {
  const damage = estimateSpellDamage(spell, caster, target);
  const energyCost = 4;
  
  let efficiency = (damage / energyCost) * 10;
  
  // Bonus for elimination
  if (damage >= target.currentHealth) {
    efficiency += 100;
  }
  
  // Bonus for high-priority targets
  const targetPriority = gameState.priorityTargets.find(p => p.creature.id === target.id)?.score || 0;
  efficiency += targetPriority / 10;
  
  // Bonus for spell synergies
  if (spell.spell_effect === 'Surge' && gameState.shouldAttackAggressively) {
    efficiency += 20;
  }
  
  return efficiency;
};

// Calculate item efficiency with enhanced logic
const calculateItemEfficiency = (item, target, gameState) => {
  let efficiency = 0;
  
  // Base efficiency from item type
  efficiency += 20;
  
  // Context-based efficiency
  if (item.tool_effect === 'Shield' || item.spell_effect === 'Shield') {
    const healthPercent = target.currentHealth / (target.battleStats?.maxHealth || 50);
    efficiency += (1 - healthPercent) * 50;
    
    // Extra value for critical creatures
    if (gameState.criticalCreatures.some(c => c.id === target.id)) {
      efficiency += 50;
    }
  } else if (item.tool_effect === 'Surge' || item.spell_effect === 'Surge') {
    const attackPower = Math.max(
      target.battleStats?.physicalAttack || 0,
      target.battleStats?.magicalAttack || 0
    );
    efficiency += attackPower * 2;
    
    // Extra value if we're about to attack
    if (gameState.shouldAttackAggressively) {
      efficiency += 30;
    }
  } else if (item.tool_effect === 'Echo' || item.spell_effect === 'Echo') {
    // Long-term value
    efficiency += 30;
    
    // Extra value for high-stat creatures
    const totalStats = Object.values(target.stats || {}).reduce((sum, stat) => sum + stat, 0);
    efficiency += totalStats / 5;
  } else if (item.tool_effect === 'Charge' || item.spell_effect === 'Charge') {
    // Setup value
    if (gameState.turnsToVictory > 3) {
      efficiency += 40;
    }
  }
  
  // Rarity bonus
  const rarityBonus = {
    'Legendary': 20,
    'Epic': 15,
    'Rare': 10,
    'Common': 5
  };
  efficiency += rarityBonus[item.rarity] || 5;
  
  return efficiency;
};

// Helper: Estimate attack damage
const estimateAttackDamage = (attacker, defender) => {
  const attackerPhysical = attacker.battleStats?.physicalAttack || 0;
  const attackerMagical = attacker.battleStats?.magicalAttack || 0;
  const defenderPhysical = defender.battleStats?.physicalDefense || 0;
  const defenderMagical = defender.battleStats?.magicalDefense || 0;
  
  // Calculate both attack types and use the better one
  const physicalDamage = Math.max(1, attackerPhysical - defenderPhysical * 0.5);
  const magicalDamage = Math.max(1, attackerMagical - defenderMagical * 0.5);
  
  let damage = Math.max(physicalDamage, magicalDamage);
  
  // Apply defender status
  if (defender.isDefending) {
    damage = Math.floor(damage * 0.3);
  }
  
  return damage;
};

// Select best creature for deployment
const selectBestCreatureForDeployment = (hand, field, playerField, energy, difficulty) => {
  const affordableCreatures = hand.filter(creature => 
    (creature.battleStats?.energyCost || 5) <= energy
  );
  
  if (affordableCreatures.length === 0) return null;
  
  // Score each creature
  const scoredCreatures = affordableCreatures.map(creature => ({
    creature,
    score: calculateDeploymentScore(creature, field, playerField, difficulty)
  }));
  
  // Sort by score and return the best
  scoredCreatures.sort((a, b) => b.score - a.score);
  
  return scoredCreatures[0]?.creature || null;
};

// Calculate deployment score
const calculateDeploymentScore = (creature, currentField, playerField, difficulty) => {
  let score = 0;
  
  // Base stats score
  const statTotal = Object.values(creature.stats || {}).reduce((sum, val) => sum + val, 0);
  score += statTotal * 2;
  
  // Attack power score
  const attackPower = Math.max(
    creature.battleStats?.physicalAttack || 0,
    creature.battleStats?.magicalAttack || 0
  );
  score += attackPower * 3;
  
  // Health score
  score += (creature.battleStats?.maxHealth || 50);
  
  // Rarity and form bonuses
  const rarityMultipliers = { 'Legendary': 2.0, 'Epic': 1.6, 'Rare': 1.3, 'Common': 1.0 };
  score *= (rarityMultipliers[creature.rarity] || 1.0);
  score *= (1 + (creature.form || 0) * 0.3);
  
  // Type advantage scoring
  let typeAdvantageScore = 0;
  playerField.forEach(playerCreature => {
    if (hasTypeAdvantage(creature, playerCreature)) {
      typeAdvantageScore += 25;
    }
  });
  score += typeAdvantageScore;
  
  // Synergy score
  const synergyScore = calculateFieldSynergy(creature, currentField);
  score += synergyScore * 10;
  
  // Energy efficiency
  const energyCost = creature.battleStats?.energyCost || 5;
  score = score / energyCost;
  
  return score;
};

// Calculate field synergy
const calculateFieldSynergy = (newCreature, existingField) => {
  let synergyScore = 0;
  
  existingField.forEach(fieldCreature => {
    // Same species synergy
    if (newCreature.species_id === fieldCreature.species_id) {
      synergyScore += 2;
    }
    
    // Complementary stats synergy
    const synergies = [
      { stat1: 'strength', stat2: 'stamina', bonus: 1.5 },
      { stat1: 'magic', stat2: 'energy', bonus: 1.5 },
      { stat1: 'speed', stat2: 'strength', bonus: 1 },
      { stat1: 'stamina', stat2: 'magic', bonus: 1 },
      { stat1: 'energy', stat2: 'speed', bonus: 1 }
    ];
    
    for (const synergy of synergies) {
      if ((newCreature.stats?.[synergy.stat1] || 0) > 7 && 
          (fieldCreature.stats?.[synergy.stat2] || 0) > 7) {
        synergyScore += synergy.bonus;
      }
    }
    
    // Specialty stats synergy
    if (newCreature.specialty_stats && fieldCreature.specialty_stats) {
      const sharedSpecialties = newCreature.specialty_stats.filter(s => 
        fieldCreature.specialty_stats.includes(s)
      );
      synergyScore += sharedSpecialties.length * 0.5;
    }
  });
  
  return synergyScore;
};

// Check type advantage
const hasTypeAdvantage = (attacker, defender) => {
  if (!attacker.stats || !defender.stats) return false;
  
  const advantages = [
    { strong: 'strength', weak: 'stamina' },
    { strong: 'stamina', weak: 'speed' },
    { strong: 'speed', weak: 'magic' },
    { strong: 'magic', weak: 'energy' },
    { strong: 'energy', weak: 'strength' }
  ];
  
  for (const adv of advantages) {
    if ((attacker.stats[adv.strong] || 0) > 7 && (defender.stats[adv.weak] || 0) > 6) {
      return true;
    }
  }
  
  return false;
};

// Validate action
const validateAction = (action) => {
  switch (action.type) {
    case 'deploy':
      return action.creature && action.creature.id && action.creature.battleStats;
    case 'attack':
      return action.attacker && action.target && action.attacker.id && action.target.id;
    case 'defend':
      return action.creature && action.creature.id;
    case 'useTool':
      return action.tool && action.target && action.tool.id && action.target.id;
    case 'useSpell':
      return action.spell && action.caster && action.target && 
            action.spell.id && action.caster.id && action.target.id;
    case 'endTurn':
      return true;
    default:
      return false;
  }
};

// Export the enhanced AI
export default determineAIAction;
