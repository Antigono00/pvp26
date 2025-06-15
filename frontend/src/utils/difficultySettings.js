// src/utils/difficultySettings.js - ENHANCED DIFFICULTY SYSTEM WITH REAL ITEMS
import { 
  getRandomCreatureTemplate, 
  createEnemyCreature 
} from './enemyCreatures';

// ===== SIGNIFICANTLY INCREASED DIFFICULTY SETTINGS =====
// Balanced to require specific creature compositions to win
export const getDifficultySettings = (difficulty) => {
  const settings = {
    easy: {
      // Easy now requires: 1 Form 3, 1 Form 2, 1 Form 1 + good spell usage
      enemyStatsMultiplier: 1,     // Increased from 0.9
      enemyCreatureLevel: {
        min: 1, // More Form 1-2 creatures
        max: 2  // Up to Form 2 creatures
      },
      enemyRarity: {
        common: 0.4,
        rare: 0.35,
        epic: 0.2,
        legendary: 0.05
      },
      initialHandSize: 3,            // Increased from 2
      enemyDeckSize: 6,              // Increased from 4
      maxFieldSize: 5,               // Increased from 4
      enemyAILevel: 2,               // Increased from 1
      enemyEnergyRegen: 3,           // Increased from 2
      rewardMultiplier: 0.5,
      multiActionChance: 0.35,       // Increased from 0.2
      aggressionLevel: 0.5,          // Increased from 0.3
      startingEnergy: 10,            // New: Start with more energy
      bonusStartingItems: 1,         // New: Extra starting items
      focusFireChance: 0.4,          // New: Chance to focus attacks
      comboAwareness: 0.3,           // New: Awareness of combo mechanics
      predictiveDepth: 1             // New: Turns to look ahead
    },
    
    medium: {
      // Medium requires: 2 Form 3, 1 Form 2, 1 Form 1
      enemyStatsMultiplier: 1.1,     // Increased from 1.0
      enemyCreatureLevel: {
        min: 1, // Form 1-3 creatures
        max: 3
      },
      enemyRarity: {
        common: 0.2,
        rare: 0.35,
        epic: 0.35,
        legendary: 0.1
      },
      initialHandSize: 3,
      enemyDeckSize: 7,              // Increased from 5
      maxFieldSize: 5,
      enemyAILevel: 3,               // Increased from 2
      enemyEnergyRegen: 3,           // Increased from 3
      rewardMultiplier: 1.0,
      multiActionChance: 0.55,       // Increased from 0.4
      aggressionLevel: 0.65,         // Increased from 0.5
      startingEnergy: 11,            // New
      bonusStartingItems: 2,         // New
      focusFireChance: 0.6,          // New
      comboAwareness: 0.5,           // New
      predictiveDepth: 2             // New
    },
    
    hard: {
      // Hard requires: 4 Form 3, 2 Form 2, 2 Form 1
      enemyStatsMultiplier: 1.2,      // Increased from 1.2
      enemyCreatureLevel: {
        min: 2, // Form 2-3 creatures
        max: 3
      },
      enemyRarity: {
        common: 0.05,
        rare: 0.25,
        epic: 0.45,
        legendary: 0.25
      },
      initialHandSize: 4,             // Increased from 3
      enemyDeckSize: 8,               // Increased from 6
      maxFieldSize: 6,                // Increased from 5
      enemyAILevel: 4,                // Increased from 3
      enemyEnergyRegen: 3,            // Increased from 4
      rewardMultiplier: 1.5,
      multiActionChance: 0.75,        // Increased from 0.6
      aggressionLevel: 0.8,           // Increased from 0.7
      startingEnergy: 13,             // New
      bonusStartingItems: 3,          // New
      focusFireChance: 0.8,           // New
      comboAwareness: 0.7,            // New
      predictiveDepth: 3              // New
    },
    
    expert: {
      // Expert requires: 7 Form 3, 3 Form 2, 2 Form 1 + perfect play
      enemyStatsMultiplier: 1.3,      // Increased from 1.5
      enemyCreatureLevel: {
        min: 2, // Mostly Form 3 creatures
        max: 3
      },
      enemyRarity: {
        common: 0,
        rare: 0.1,
        epic: 0.5,
        legendary: 0.4
      },
      initialHandSize: 5,             // Increased from 4
      enemyDeckSize: 10,              // Increased from 7
      maxFieldSize: 6,
      enemyAILevel: 5,                // Increased from 4
      enemyEnergyRegen: 3,            // Increased from 5
      rewardMultiplier: 2.0,
      multiActionChance: 0.95,        // Increased from 0.8
      aggressionLevel: 0.95,          // Increased from 0.85
      startingEnergy: 15,             // New
      bonusStartingItems: 5,          // New
      focusFireChance: 0.95,          // New
      comboAwareness: 0.9,            // New
      predictiveDepth: 4              // New
    }
  };
  
  return settings[difficulty] || settings.medium;
};

// ===== ENHANCED ENEMY CREATURE GENERATION =====
// Generate enemy creatures with increased power
export const generateEnemyCreatures = (difficulty, count = 5, playerCreatures = []) => {
  const settings = getDifficultySettings(difficulty);
  
  const maxCreatureCount = settings.enemyDeckSize || 5;
  const adjustedCount = Math.min(count, maxCreatureCount);
  
  const creatures = [];

  // Create a pool of species templates from player creatures or use defaults
  const speciesPool = [];
  
  if (playerCreatures && playerCreatures.length > 0) {
    const playerSpeciesIds = new Set();
    
    playerCreatures.forEach(creature => {
      if (creature.species_id) {
        playerSpeciesIds.add(creature.species_id);
      }
    });
    
    Array.from(playerSpeciesIds).forEach(speciesId => {
      speciesPool.push(speciesId);
    });
  }
  
  // ===== ENHANCED ENEMY GENERATION WITH BETTER COMPOSITION =====
  for (let i = 0; i < adjustedCount; i++) {
    // Generate a creature with appropriate rarity
    const rarity = selectRarity(settings.enemyRarity);
    
    // Generate form level with bias towards higher forms
    let form;
    if (difficulty === 'expert') {
      // Expert: 80% chance for max form
      form = Math.random() < 0.8 ? settings.enemyCreatureLevel.max : 
             Math.floor(Math.random() * (settings.enemyCreatureLevel.max - settings.enemyCreatureLevel.min + 1)) + settings.enemyCreatureLevel.min;
    } else if (difficulty === 'hard') {
      // Hard: 65% chance for max form
      form = Math.random() < 0.65 ? settings.enemyCreatureLevel.max : 
             Math.floor(Math.random() * (settings.enemyCreatureLevel.max - settings.enemyCreatureLevel.min + 1)) + settings.enemyCreatureLevel.min;
    } else if (difficulty === 'medium') {
      // Medium: Balanced distribution with slight bias to higher forms
      const rand = Math.random();
      if (rand < 0.4) {
        form = settings.enemyCreatureLevel.max;
      } else if (rand < 0.7) {
        form = Math.max(settings.enemyCreatureLevel.min, settings.enemyCreatureLevel.max - 1);
      } else {
        form = settings.enemyCreatureLevel.min;
      }
    } else {
      // Easy: Still challenging but more manageable
      form = Math.random() < 0.3 ? settings.enemyCreatureLevel.max : 
             Math.floor(Math.random() * (settings.enemyCreatureLevel.max - settings.enemyCreatureLevel.min + 1)) + settings.enemyCreatureLevel.min;
    }
    
    // Select a species ID
    let speciesId;
    if (speciesPool.length > 0) {
      speciesId = speciesPool[Math.floor(Math.random() * speciesPool.length)];
    } else {
      const template = getRandomCreatureTemplate();
      speciesId = template.id;
    }
    
    // Generate enhanced stats
    const stats = generateEnemyStats(rarity, form, settings.enemyStatsMultiplier);
    
    // Determine specialty stats (more specialties on higher difficulties)
    let specialtyStats = [];
    
    const statTypes = ['energy', 'strength', 'magic', 'stamina', 'speed'];
    
    // Enhanced specialty count based on difficulty
    const specialtyCount = (difficulty === 'expert') ? 
      (Math.random() < 0.8 ? 3 : 2) : // Expert: 80% chance for 3 specialties
      (difficulty === 'hard') ?
      (Math.random() < 0.7 ? 2 : 1) : // Hard: 70% chance for 2 specialties
      (difficulty === 'medium') ?
      (Math.random() < 0.5 ? 2 : 1) : // Medium: 50% chance for 2 specialties
      (Math.random() < 0.3 ? 2 : 1);  // Easy: 30% chance for 2 specialties
    
    for (let j = 0; j < specialtyCount; j++) {
      const availableStats = statTypes.filter(stat => !specialtyStats.includes(stat));
      const randomStat = availableStats[Math.floor(Math.random() * availableStats.length)];
      specialtyStats.push(randomStat);
    }
    
    // Create the enemy creature
    const creature = createEnemyCreature(speciesId, form, rarity, stats);
    
    // Add specialty stats to the creature
    creature.specialty_stats = specialtyStats;
    
    // Apply evolution boosts
    applyEvolutionBoosts(creature, form);
    
    // Add enhanced stat upgrades based on difficulty
    addEnhancedStatUpgrades(creature, form, difficulty);
    
    // Add combination bonuses on harder difficulties
    if (difficulty === 'hard' || difficulty === 'expert') {
      const combinationChance = difficulty === 'expert' ? 0.7 : 0.5;
      if (Math.random() < combinationChance) {
        const combinationLevel = difficulty === 'expert' ? 
          Math.floor(Math.random() * 3) + 2 : // 2-4 combination levels
          Math.floor(Math.random() * 2) + 1;  // 1-2 combination levels
        creature.combination_level = combinationLevel;
        applyCombinationBonuses(creature, combinationLevel);
      }
    }
    
    creatures.push(creature);
  }
  
  return creatures;
};

// ===== ENHANCED ENEMY ITEMS GENERATION =====

/**
 * Generate enemy tools from actual player tool pool
 */
export const generateEnemyTools = (difficulty, count = 2, playerAvailableTools = []) => {
  const settings = getDifficultySettings(difficulty);
  const tools = [];
  
  // Enhanced tool counts based on difficulty
  const toolCounts = {
    easy: 2,
    medium: 3,
    hard: 4,
    expert: 5
  };
  
  const actualCount = toolCounts[difficulty] || count;
  
  // If player tools are available, select from them
  if (playerAvailableTools && playerAvailableTools.length > 0) {
    // Sort tools by strategic value
    const sortedTools = [...playerAvailableTools].sort((a, b) => {
      // Prioritize by rarity
      const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
      const aRarity = rarityOrder[a.rarity] || 1;
      const bRarity = rarityOrder[b.rarity] || 1;
      
      // Then by effect type preference for AI
      const effectPreference = {
        'Surge': 5,    // High damage
        'Shield': 4,   // Protection
        'Drain': 3,    // Versatile
        'Charge': 2,   // Setup
        'Echo': 1      // Duration
      };
      const aEffect = effectPreference[a.tool_effect] || 0;
      const bEffect = effectPreference[b.tool_effect] || 0;
      
      return (bRarity * 10 + bEffect) - (aRarity * 10 + aEffect);
    });
    
    // Select tools based on difficulty
    for (let i = 0; i < actualCount && i < sortedTools.length; i++) {
      const selectedTool = sortedTools[i];
      
      // Clone the tool for enemy use
      const enemyTool = {
        ...selectedTool,
        id: `enemy_${selectedTool.id}_${Date.now()}_${i}`,
        isEnemyItem: true
      };
      
      tools.push(enemyTool);
    }
    
    console.log(`Generated ${tools.length} enemy tools from player pool for ${difficulty} difficulty`);
    return tools;
  }
  
  // Fallback: Generate generic tools if no player tools available
  console.warn("No player tools available, generating generic enemy tools");
  
  // Tool types and effects
  const toolTypes = ['energy', 'strength', 'magic', 'stamina', 'speed'];
  const toolEffects = ['Surge', 'Shield', 'Echo', 'Drain', 'Charge'];
  
  // Enhanced rarity distribution
  const rarityDistribution = {
    easy: { Common: 0.6, Rare: 0.3, Epic: 0.1, Legendary: 0 },
    medium: { Common: 0.3, Rare: 0.4, Epic: 0.25, Legendary: 0.05 },
    hard: { Common: 0.1, Rare: 0.3, Epic: 0.4, Legendary: 0.2 },
    expert: { Common: 0, Rare: 0.2, Epic: 0.4, Legendary: 0.4 }
  };
  
  const distribution = rarityDistribution[difficulty] || rarityDistribution.medium;
  
  // Generate strategic tool combinations
  const strategicCombos = [
    { type: 'strength', effect: 'Surge' },    // Attack boost
    { type: 'stamina', effect: 'Shield' },    // Defense boost
    { type: 'magic', effect: 'Echo' },        // Sustained effects
    { type: 'energy', effect: 'Drain' },      // Resource management
    { type: 'speed', effect: 'Charge' }       // Setup plays
  ];
  
  for (let i = 0; i < actualCount; i++) {
    let toolType, toolEffect;
    
    // On higher difficulties, prefer strategic combinations
    if ((difficulty === 'hard' || difficulty === 'expert') && Math.random() < 0.7) {
      const combo = strategicCombos[i % strategicCombos.length];
      toolType = combo.type;
      toolEffect = combo.effect;
    } else {
      toolType = toolTypes[Math.floor(Math.random() * toolTypes.length)];
      toolEffect = toolEffects[Math.floor(Math.random() * toolEffects.length)];
    }
    
    // Generate rarity
    const rarity = selectItemRarity(distribution);
    
    // Create generic tool with realistic naming
    const toolNames = {
      'Surge': { 
        'energy': 'Lightning Core', 
        'strength': 'Berserker Gauntlet', 
        'magic': 'Arcane Amplifier',
        'stamina': 'Vitality Surge',
        'speed': 'Swift Strike'
      },
      'Shield': {
        'energy': 'Energy Barrier',
        'strength': 'Iron Wall',
        'magic': 'Mystic Ward',
        'stamina': 'Guardian Shield',
        'speed': 'Reflex Guard'
      },
      'Echo': {
        'energy': 'Resonance Crystal',
        'strength': 'Echo Hammer',
        'magic': 'Spell Echo',
        'stamina': 'Endurance Echo',
        'speed': 'Velocity Echo'
      },
      'Drain': {
        'energy': 'Energy Siphon',
        'strength': 'Life Drain',
        'magic': 'Mana Drain',
        'stamina': 'Vitality Drain',
        'speed': 'Speed Sap'
      },
      'Charge': {
        'energy': 'Power Capacitor',
        'strength': 'Charge Blade',
        'magic': 'Spell Charge',
        'stamina': 'Fortify Charge',
        'speed': 'Momentum Builder'
      }
    };
    
    const toolName = toolNames[toolEffect]?.[toolType] || `${rarity} ${toolEffect} ${toolType.charAt(0).toUpperCase() + toolType.slice(1)} Tool`;
    
    const tool = {
      id: `enemy_tool_${Date.now()}_${i}`,
      name: `${rarity} ${toolName}`,
      tool_type: toolType,
      tool_effect: toolEffect,
      rarity: rarity,
      image_url: `/assets/tools/${toolType}_${toolEffect.toLowerCase()}.png`,
      description: generateToolDescription(toolType, toolEffect, rarity),
      power_level: calculateEnhancedItemPowerLevel(rarity, difficulty),
      usage_cost: 0,
      strategic_value: calculateStrategicValue(toolType, toolEffect, difficulty),
      isEnemyItem: true
    };
    
    tools.push(tool);
  }
  
  return tools;
};

/**
 * Generate enemy spells from actual player spell pool
 */
export const generateEnemySpells = (difficulty, count = 2, playerAvailableSpells = []) => {
  const settings = getDifficultySettings(difficulty);
  const spells = [];
  
  // Enhanced spell counts
  const spellCounts = {
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 4
  };
  
  const actualCount = spellCounts[difficulty] || count;
  
  // If player spells are available, select from them
  if (playerAvailableSpells && playerAvailableSpells.length > 0) {
    // Sort spells by strategic value
    const sortedSpells = [...playerAvailableSpells].sort((a, b) => {
      // Prioritize by rarity
      const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
      const aRarity = rarityOrder[a.rarity] || 1;
      const bRarity = rarityOrder[b.rarity] || 1;
      
      // Then by effect type preference for AI
      const effectPreference = {
        'Surge': 5,    // Direct damage
        'Drain': 4,    // Damage + heal
        'Charge': 3,   // Delayed power
        'Shield': 2,   // Protection
        'Echo': 1      // Duration
      };
      const aEffect = effectPreference[a.spell_effect] || 0;
      const bEffect = effectPreference[b.spell_effect] || 0;
      
      return (bRarity * 10 + bEffect) - (aRarity * 10 + aEffect);
    });
    
    // Select spells based on difficulty
    for (let i = 0; i < actualCount && i < sortedSpells.length; i++) {
      const selectedSpell = sortedSpells[i];
      
      // Clone the spell for enemy use
      const enemySpell = {
        ...selectedSpell,
        id: `enemy_${selectedSpell.id}_${Date.now()}_${i}`,
        isEnemyItem: true
      };
      
      spells.push(enemySpell);
    }
    
    console.log(`Generated ${spells.length} enemy spells from player pool for ${difficulty} difficulty`);
    return spells;
  }
  
  // Fallback: Generate generic spells if no player spells available
  console.warn("No player spells available, generating generic enemy spells");
  
  // Spell types and effects
  const spellTypes = ['energy', 'strength', 'magic', 'stamina', 'speed'];
  const spellEffects = ['Surge', 'Shield', 'Echo', 'Drain', 'Charge'];
  
  // Enhanced rarity distribution for spells
  const rarityDistribution = {
    easy: { Common: 0.5, Rare: 0.35, Epic: 0.15, Legendary: 0 },
    medium: { Common: 0.2, Rare: 0.4, Epic: 0.3, Legendary: 0.1 },
    hard: { Common: 0, Rare: 0.2, Epic: 0.5, Legendary: 0.3 },
    expert: { Common: 0, Rare: 0, Epic: 0.4, Legendary: 0.6 }
  };
  
  const distribution = rarityDistribution[difficulty] || rarityDistribution.medium;
  
  // Generate strategic spell combinations
  const lethalCombos = [
    { type: 'energy', effect: 'Surge' },      // High damage burst
    { type: 'strength', effect: 'Drain' },    // Damage + heal
    { type: 'magic', effect: 'Charge' },      // Delayed devastation
    { type: 'stamina', effect: 'Shield' }     // Team protection
  ];
  
  for (let i = 0; i < actualCount; i++) {
    let spellType, spellEffect;
    
    // On expert, always use optimal spell combinations
    if (difficulty === 'expert' && i < lethalCombos.length) {
      const combo = lethalCombos[i];
      spellType = combo.type;
      spellEffect = combo.effect;
    } else if (difficulty === 'hard' && Math.random() < 0.6) {
      const combo = lethalCombos[Math.floor(Math.random() * lethalCombos.length)];
      spellType = combo.type;
      spellEffect = combo.effect;
    } else {
      spellType = spellTypes[Math.floor(Math.random() * spellTypes.length)];
      spellEffect = spellEffects[Math.floor(Math.random() * spellEffects.length)];
    }
    
    // Generate rarity
    const rarity = selectItemRarity(distribution);
    
    // Create spell with realistic naming
    const spellNames = {
      'Surge': {
        'energy': 'Lightning Bolt',
        'strength': 'Power Strike',
        'magic': 'Arcane Blast',
        'stamina': 'Vital Surge',
        'speed': 'Quick Strike'
      },
      'Shield': {
        'energy': 'Energy Shield',
        'strength': 'Stone Skin',
        'magic': 'Mystic Barrier',
        'stamina': 'Divine Protection',
        'speed': 'Evasion Aura'
      },
      'Echo': {
        'energy': 'Chain Lightning',
        'strength': 'Reverberating Blow',
        'magic': 'Spell Echo',
        'stamina': 'Regeneration Wave',
        'speed': 'Time Dilation'
      },
      'Drain': {
        'energy': 'Life Drain',
        'strength': 'Vampiric Strike',
        'magic': 'Mana Burn',
        'stamina': 'Soul Siphon',
        'speed': 'Speed Steal'
      },
      'Charge': {
        'energy': 'Gathering Storm',
        'strength': 'Devastating Blow',
        'magic': 'Arcane Convergence',
        'stamina': 'Final Stand',
        'speed': 'Accelerate'
      }
    };
    
    const spellName = spellNames[spellEffect]?.[spellType] || `${rarity} ${spellEffect} ${spellType.charAt(0).toUpperCase() + spellType.slice(1)} Spell`;
    
    const spell = {
      id: `enemy_spell_${Date.now()}_${i}`,
      name: `${rarity} ${spellName}`,
      spell_type: spellType,
      spell_effect: spellEffect,
      rarity: rarity,
      image_url: `/assets/spells/${spellType}_${spellEffect.toLowerCase()}.png`,
      description: generateSpellDescription(spellType, spellEffect, rarity),
      power_level: calculateEnhancedItemPowerLevel(rarity, difficulty),
      mana_cost: 4,
      strategic_value: calculateStrategicValue(spellType, spellEffect, difficulty),
      isEnemyItem: true
    };
    
    spells.push(spell);
  }
  
  return spells;
};

/**
 * Generate a balanced set of enemy items with strategic diversity
 * FIXED: Now accepts player items to select from
 */
export const generateEnemyItems = (difficulty, playerAvailableTools = [], playerAvailableSpells = []) => {
  const settings = getDifficultySettings(difficulty);
  
  // Generate base items from player pool
  const tools = generateEnemyTools(difficulty, undefined, playerAvailableTools);
  const spells = generateEnemySpells(difficulty, undefined, playerAvailableSpells);
  
  // Add bonus items based on difficulty settings
  const bonusItems = settings.bonusStartingItems || 0;
  
  if (bonusItems > 0) {
    // Add strategic bonus items
    for (let i = 0; i < bonusItems; i++) {
      if (Math.random() < 0.6) {
        // 60% chance for bonus tool
        const bonusTools = generateEnemyTools(difficulty, 1, playerAvailableTools);
        tools.push(...bonusTools);
      } else {
        // 40% chance for bonus spell
        const bonusSpells = generateEnemySpells(difficulty, 1, playerAvailableSpells);
        spells.push(...bonusSpells);
      }
    }
  }
  
  return {
    tools: tools,
    spells: spells
  };
};

// ===== COMPREHENSIVE ENEMY GENERATION =====

/**
 * Generate complete enemy loadout with enhanced power
 * FIXED: Now accepts player items
 */
export const generateCompleteEnemyLoadout = (difficulty, creatureCount, playerCreatures = [], playerTools = [], playerSpells = []) => {
  const creatures = generateEnemyCreatures(difficulty, creatureCount, playerCreatures);
  const items = generateEnemyItems(difficulty, playerTools, playerSpells);
  
  // Calculate total enemy power for balancing
  const totalPower = calculateTotalPower(creatures, items);
  
  return {
    creatures,
    tools: items.tools,
    spells: items.spells,
    difficulty: difficulty,
    settings: getDifficultySettings(difficulty),
    totalPower: totalPower,
    composition: analyzeCreatureComposition(creatures)
  };
};

// ===== ENHANCED HELPER FUNCTIONS =====

// Select rarity based on probability distribution
function selectRarity(rarityDistribution) {
  const rnd = Math.random();
  let cumulativeProbability = 0;
  
  for (const [rarity, probability] of Object.entries(rarityDistribution)) {
    cumulativeProbability += probability;
    if (rnd <= cumulativeProbability) {
      return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }
  }
  
  return 'Common';
}

// Select item rarity
function selectItemRarity(distribution) {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [rarity, probability] of Object.entries(distribution)) {
    cumulative += probability;
    if (random <= cumulative) {
      return rarity;
    }
  }
  
  return 'Common';
}

// Generate enhanced stats with better scaling
function generateEnemyStats(rarity, form, statsMultiplier) {
  // Enhanced base stats for higher challenge
  let baseStats;
  switch (rarity) {
    case 'Legendary':
      baseStats = { energy: 10, strength: 10, magic: 10, stamina: 10, speed: 10 };
      break;
    case 'Epic':
      baseStats = { energy: 9, strength: 9, magic: 9, stamina: 9, speed: 9 };
      break;
    case 'Rare':
      baseStats = { energy: 8, strength: 8, magic: 8, stamina: 8, speed: 8 };
      break;
    default: // Common
      baseStats = { energy: 7, strength: 7, magic: 7, stamina: 7, speed: 7 };
  }
  
  // Apply enhanced difficulty multiplier
  const stats = {};
  for (const [stat, value] of Object.entries(baseStats)) {
    // Apply the difficulty multiplier with less variance for consistency
    const variance = 0.95 + (Math.random() * 0.1); // ±5% variance
    stats[stat] = Math.round(value * statsMultiplier * variance);
    
    // Ensure stats are within reasonable bounds
    stats[stat] = Math.max(1, Math.min(20, stats[stat]));
  }
  
  return stats;
}

// Apply evolution boosts to creature stats
function applyEvolutionBoosts(creature, form) {
  if (!creature || !creature.stats) return;
  
  const stats = creature.stats;
  
  // Enhanced evolution bonuses
  if (form >= 1) {
    Object.keys(stats).forEach(stat => {
      stats[stat] += 2; // Increased from 1
    });
  }
  
  if (form >= 2) {
    Object.keys(stats).forEach(stat => {
      stats[stat] += 2; // Increased from 1
      
      // Extra boost to specialty stats
      if (creature.specialty_stats && creature.specialty_stats.includes(stat)) {
        stats[stat] += 2; // Increased from 1
      }
    });
  }
  
  if (form >= 3) {
    Object.keys(stats).forEach(stat => {
      stats[stat] += 3; // Increased from 2
    });
  }
}

// Add enhanced stat upgrades
function addEnhancedStatUpgrades(creature, form, difficulty) {
  if (!creature || !creature.stats) return;
  
  const stats = creature.stats;
  
  // Significantly increased upgrade amounts
  let totalUpgrades = form * 5; // Increased from 3
  
  // Add more upgrades for harder difficulties
  switch (difficulty) {
    case 'easy':
      totalUpgrades += 2;
      break;
    case 'medium':
      totalUpgrades += 4;
      break;
    case 'hard':
      totalUpgrades += 7;
      break;
    case 'expert':
      totalUpgrades += 10;
      break;
  }
  
  // Apply upgrades with strong bias toward specialty stats
  for (let i = 0; i < totalUpgrades; i++) {
    let statToUpgrade;
    
    // 70% chance to upgrade a specialty stat
    if (creature.specialty_stats && creature.specialty_stats.length > 0 && Math.random() < 0.7) {
      statToUpgrade = creature.specialty_stats[Math.floor(Math.random() * creature.specialty_stats.length)];
    } else {
      const availableStats = Object.keys(stats);
      statToUpgrade = availableStats[Math.floor(Math.random() * availableStats.length)];
    }
    
    stats[statToUpgrade] += 1;
  }
  
  // Apply minimum stat thresholds based on difficulty
  const minStats = {
    easy: 5,
    medium: 6,
    hard: 7,
    expert: 9
  };
  
  const minStat = minStats[difficulty] || 5;
  Object.keys(stats).forEach(stat => {
    if (stats[stat] < minStat) {
      stats[stat] = minStat;
    }
  });
}

// Apply enhanced combination bonuses
function applyCombinationBonuses(creature, combinationLevel) {
  if (!creature || !creature.stats || !creature.specialty_stats) return;
  
  const stats = creature.stats;
  
  // Enhanced bonuses per combination level
  creature.specialty_stats.forEach(stat => {
    if (stats[stat] !== undefined) {
      stats[stat] += combinationLevel * 2; // Increased from 1
    }
  });
  
  // Add general stat boost for high combination levels
  if (combinationLevel >= 3) {
    Object.keys(stats).forEach(stat => {
      stats[stat] += 1;
    });
  }
  
  creature.combination_level = combinationLevel;
}

// Calculate enhanced item power level
function calculateEnhancedItemPowerLevel(rarity, difficulty) {
  let basePower = 1.0;
  
  // Enhanced rarity multipliers
  switch (rarity) {
    case 'Legendary': basePower = 2.0; break;
    case 'Epic': basePower = 1.7; break;
    case 'Rare': basePower = 1.4; break;
    case 'Common': basePower = 1.0; break;
  }
  
  // Enhanced difficulty multipliers
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.1,
    hard: 1.3,
    expert: 1.5
  };
  
  return basePower * (difficultyMultipliers[difficulty] || 1.0);
}

// Calculate strategic value of items
function calculateStrategicValue(type, effect, difficulty) {
  let value = 0;
  
  // Base value by effect
  const effectValues = {
    'Surge': 30,    // Immediate impact
    'Shield': 35,   // Protection value
    'Echo': 25,     // Long-term value
    'Drain': 40,    // Versatile effect
    'Charge': 45    // High potential
  };
  
  value += effectValues[effect] || 20;
  
  // Type synergies
  const typeSynergies = {
    'energy-Drain': 10,
    'strength-Surge': 10,
    'magic-Echo': 10,
    'stamina-Shield': 10,
    'speed-Charge': 10
  };
  
  value += typeSynergies[`${type}-${effect}`] || 0;
  
  // Difficulty bonus
  const difficultyBonus = {
    easy: 0,
    medium: 3,
    hard: 6,
    expert: 9
  };
  
  value += difficultyBonus[difficulty] || 0;
  
  return value;
}

// Generate enhanced tool descriptions
function generateToolDescription(toolType, toolEffect, rarity) {
  const rarityAdjectives = {
    Common: 'basic',
    Rare: 'enhanced',
    Epic: 'powerful',
    Legendary: 'legendary'
  };
  
  const typeDescriptions = {
    energy: 'energy manipulation',
    strength: 'physical enhancement',
    magic: 'magical amplification',
    stamina: 'endurance boosting',
    speed: 'agility enhancement'
  };
  
  const effectDescriptions = {
    Surge: 'provides a powerful but temporary boost',
    Shield: 'offers protective enhancement',
    Echo: 'creates lasting effects over time',
    Drain: 'converts defensive power to offense',
    Charge: 'builds up power for devastating results'
  };
  
  const adjective = rarityAdjectives[rarity] || 'basic';
  const typeDesc = typeDescriptions[toolType] || 'enhancement';
  const effectDesc = effectDescriptions[toolEffect] || 'enhances abilities';
  
  return `A ${adjective} tool for ${typeDesc} that ${effectDesc}.`;
}

// Generate enhanced spell descriptions
function generateSpellDescription(spellType, spellEffect, rarity) {
  const rarityAdjectives = {
    Common: 'minor',
    Rare: 'potent',
    Epic: 'powerful',
    Legendary: 'legendary'
  };
  
  const typeDescriptions = {
    energy: 'energy',
    strength: 'force',
    magic: 'arcane',
    stamina: 'vitality',
    speed: 'temporal'
  };
  
  const effectDescriptions = {
    Surge: 'unleashes immediate powerful effects',
    Shield: 'creates protective magical barriers',
    Echo: 'resonates with lasting magical effects',
    Drain: 'siphons life force and power',
    Charge: 'builds magical energy for explosive release'
  };
  
  const adjective = rarityAdjectives[rarity] || 'minor';
  const typeDesc = typeDescriptions[spellType] || 'magical';
  const effectDesc = effectDescriptions[spellEffect] || 'affects the target';
  
  return `A ${adjective} ${typeDesc} spell that ${effectDesc}.`;
}

// Calculate total power of enemy forces
function calculateTotalPower(creatures, items) {
  let totalPower = 0;
  
  // Calculate creature power
  creatures.forEach(creature => {
    const statSum = Object.values(creature.stats || {}).reduce((sum, stat) => sum + stat, 0);
    const formBonus = (creature.form || 0) * 20;
    const rarityBonus = { 'Legendary': 40, 'Epic': 30, 'Rare': 20, 'Common': 10 }[creature.rarity] || 10;
    totalPower += statSum + formBonus + rarityBonus;
  });
  
  // Calculate item power
  const itemPower = (items.tools.length * 20) + (items.spells.length * 30);
  totalPower += itemPower;
  
  return totalPower;
}

// Analyze creature composition
function analyzeCreatureComposition(creatures) {
  const composition = {
    form0: 0,
    form1: 0,
    form2: 0,
    form3: 0,
    averageStats: 0,
    rarityBreakdown: {
      Common: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0
    }
  };
  
  let totalStats = 0;
  
  creatures.forEach(creature => {
    // Count forms
    const form = creature.form || 0;
    composition[`form${form}`]++;
    
    // Count rarity
    composition.rarityBreakdown[creature.rarity]++;
    
    // Sum stats
    const statSum = Object.values(creature.stats || {}).reduce((sum, stat) => sum + stat, 0);
    totalStats += statSum;
  });
  
  composition.averageStats = Math.round(totalStats / Math.max(creatures.length, 1));
  
  return composition;
}

// NEW: Get enhanced difficulty tips
export const getDifficultyTips = (difficulty) => {
  const tips = {
    easy: [
      "Enemy creatures are 15% stronger than normal",
      "AI makes tactical decisions and uses items strategically",
      "Requires at least 1 Form 3, 1 Form 2, and 1 Form 1 creature to win",
      "Good spell usage is essential for victory"
    ],
    medium: [
      "Enemy creatures are 35% stronger than yours",
      "AI uses advanced tactics and multi-action turns",
      "Requires at least 2 Form 3, 1 Form 2, and 1 Form 1 creature",
      "Expect coordinated attacks and strategic item usage"
    ],
    hard: [
      "Enemy creatures are 60% stronger with multiple specialties",
      "AI plays near-optimally with predictive planning",
      "Requires at least 4 Form 3, 2 Form 2, and 2 Form 1 creatures",
      "Prepare for focus-fire tactics and lethal combos"
    ],
    expert: [
      "Enemy creatures are 100% stronger with maximum upgrades",
      "AI plays perfectly with multi-turn planning",
      "Requires at least 7 Form 3, 3 Form 2, and 2 Form 1 creatures",
      "Perfect resource management and execution required to win"
    ]
  };
  
  return tips[difficulty] || tips.medium;
};

// NEW: Calculate enhanced difficulty rating
export const calculateDifficultyRating = (playerCreatures, difficulty) => {
  // Calculate player composition
  const playerComposition = analyzeCreatureComposition(playerCreatures);
  
  // Define minimum requirements for each difficulty
  const requirements = {
    easy: { form3: 1, form2: 1, form1: 1, avgStats: 45 },
    medium: { form3: 2, form2: 1, form1: 1, avgStats: 55 },
    hard: { form3: 4, form2: 2, form1: 2, avgStats: 65 },
    expert: { form3: 7, form2: 3, form1: 2, avgStats: 75 }
  };
  
  const req = requirements[difficulty] || requirements.medium;
  
  // Check if player meets requirements
  const meetsRequirements = 
    playerComposition.form3 >= req.form3 &&
    playerComposition.form2 >= req.form2 &&
    playerComposition.form1 >= req.form1 &&
    playerComposition.averageStats >= req.avgStats;
  
  // Calculate power differential
  const playerPower = playerCreatures.reduce((total, creature) => {
    const statSum = Object.values(creature.stats || {}).reduce((sum, stat) => sum + stat, 0);
    const formBonus = (creature.form || 0) * 20;
    const rarityBonus = { 'Legendary': 40, 'Epic': 30, 'Rare': 20, 'Common': 10 }[creature.rarity] || 10;
    return total + statSum + formBonus + rarityBonus;
  }, 0) / Math.max(playerCreatures.length, 1);
  
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.10,
    hard: 1.20,
    expert: 1.50
  };
  
  const enemyPower = playerPower * (difficultyMultipliers[difficulty] || 1.0);
  
  return {
    playerRating: Math.round(playerPower),
    enemyRating: Math.round(enemyPower),
    meetsRequirements: meetsRequirements,
    balanced: meetsRequirements,
    composition: playerComposition,
    recommendation: meetsRequirements ? 
      `Your team composition meets the requirements for ${difficulty} difficulty.` :
      `Warning: Your team may be underpowered for ${difficulty} difficulty. Consider improving your creatures or selecting a lower difficulty.`
  };
};
