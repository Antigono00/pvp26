// src/components/battle/BattleResult.jsx - FIXED VERSION WITH STABLE REWARDS
import React, { useMemo } from 'react';

const BattleResult = ({ result, onPlayAgain, onClose, stats, difficulty }) => {
  const isVictory = result === 'victory';
  
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#FF9800';
      case 'expert': return '#FF5722';
      default: return '#4CAF50';
    }
  };
  
  // FIXED: Use useMemo to generate rewards only once when component mounts
  const rewards = useMemo(() => {
    if (!isVictory) return null;
    
    // Create a seeded random number generator for consistency
    let seed = 12345; // Base seed
    if (stats) {
      seed += stats.turns * 1000;
      seed += stats.remainingCreatures * 100;
      seed += stats.enemiesDefeated * 10;
    }
    seed += difficulty.charCodeAt(0) * 1000000; // Add difficulty to seed
    
    // Simple seeded random function for consistent results
    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    let currentSeed = seed;
    const nextRandom = () => {
      currentSeed += 1;
      return seededRandom(currentSeed);
    };
    
    const baseReward = {
      experience: 100,
      currency: 50,
      items: []
    };
    
    // Difficulty multipliers
    const difficultyMultipliers = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      expert: 3.0
    };
    
    const multiplier = difficultyMultipliers[difficulty] || 1.0;
    
    // Performance bonuses
    let performanceMultiplier = 1.0;
    
    // Bonus for finishing quickly (fewer turns)
    if (stats.turns <= 5) performanceMultiplier += 0.5;
    else if (stats.turns <= 10) performanceMultiplier += 0.3;
    else if (stats.turns <= 15) performanceMultiplier += 0.1;
    
    // Bonus for having creatures survive
    if (stats.remainingCreatures >= 3) performanceMultiplier += 0.4;
    else if (stats.remainingCreatures >= 2) performanceMultiplier += 0.2;
    else if (stats.remainingCreatures >= 1) performanceMultiplier += 0.1;
    
    // Bonus for defeating many enemies
    const defeatRatio = stats.enemiesDefeated / Math.max(stats.enemiesDefeated + stats.remainingCreatures, 1);
    if (defeatRatio >= 0.9) performanceMultiplier += 0.3;
    else if (defeatRatio >= 0.7) performanceMultiplier += 0.2;
    else if (defeatRatio >= 0.5) performanceMultiplier += 0.1;
    
    // Generate reward items with seeded randomization
    const generateRewardItems = (difficulty, performanceMultiplier, randomFunc) => {
      const items = [];
      
      // Base chance for items
      const itemChances = {
        easy: 0.3,
        medium: 0.5,
        hard: 0.7,
        expert: 0.9
      };
      
      const baseChance = itemChances[difficulty] || 0.3;
      const adjustedChance = Math.min(0.95, baseChance * performanceMultiplier);
      
      // Tool rewards
      if (randomFunc() < adjustedChance) {
        const toolTypes = ['energy', 'strength', 'magic', 'stamina', 'speed'];
        const toolEffects = ['Surge', 'Shield', 'Echo', 'Drain', 'Charge'];
        
        const randomType = toolTypes[Math.floor(randomFunc() * toolTypes.length)];
        const randomEffect = toolEffects[Math.floor(randomFunc() * toolEffects.length)];
        
        items.push({
          type: 'tool',
          name: `${randomEffect} ${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Tool`,
          rarity: getRandomRarity(difficulty, randomFunc),
          tool_type: randomType,
          tool_effect: randomEffect
        });
      }
      
      // Spell rewards (higher difficulty only)
      if ((difficulty === 'hard' || difficulty === 'expert') && randomFunc() < adjustedChance * 0.7) {
        const spellTypes = ['energy', 'strength', 'magic', 'stamina', 'speed'];
        const spellEffects = ['Surge', 'Shield', 'Echo', 'Drain', 'Charge'];
        
        const randomType = spellTypes[Math.floor(randomFunc() * spellTypes.length)];
        const randomEffect = spellEffects[Math.floor(randomFunc() * spellEffects.length)];
        
        items.push({
          type: 'spell',
          name: `${randomEffect} ${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Spell`,
          rarity: getRandomRarity(difficulty, randomFunc),
          spell_type: randomType,
          spell_effect: randomEffect
        });
      }
      
      // Rare creature enhancement items (expert difficulty only)
      if (difficulty === 'expert' && randomFunc() < 0.3) {
        items.push({
          type: 'enhancement',
          name: 'Evolution Crystal',
          rarity: 'Epic',
          description: 'Can be used to enhance a creature\'s form'
        });
      }
      
      return items;
    };
    
    // Get random rarity based on difficulty with seeded randomization
    const getRandomRarity = (difficulty, randomFunc) => {
      const rarityChances = {
        easy: { Common: 0.7, Rare: 0.25, Epic: 0.05, Legendary: 0 },
        medium: { Common: 0.5, Rare: 0.35, Epic: 0.13, Legendary: 0.02 },
        hard: { Common: 0.3, Rare: 0.4, Epic: 0.25, Legendary: 0.05 },
        expert: { Common: 0.1, Rare: 0.3, Epic: 0.45, Legendary: 0.15 }
      };
      
      const chances = rarityChances[difficulty] || rarityChances.easy;
      const random = randomFunc();
      let cumulative = 0;
      
      for (const [rarity, chance] of Object.entries(chances)) {
        cumulative += chance;
        if (random <= cumulative) {
          return rarity;
        }
      }
      
      return 'Common';
    };
    
    // Calculate final rewards
    const finalReward = {
      experience: Math.round(baseReward.experience * multiplier * performanceMultiplier),
      currency: Math.round(baseReward.currency * multiplier * performanceMultiplier),
      items: generateRewardItems(difficulty, performanceMultiplier, nextRandom)
    };
    
    return finalReward;
  }, [isVictory, difficulty, stats]); // Only recalculate if these props change
  
  // FIXED: Generate performance bonuses list only once
  const performanceBonuses = useMemo(() => {
    const bonuses = [];
    
    if (stats.turns <= 5) {
      bonuses.push({ icon: '🚀', text: 'Speed Demon: Finished in 5 turns or less!' });
    }
    if (stats.remainingCreatures >= 3) {
      bonuses.push({ icon: '🛡️', text: 'Master Strategist: All creatures survived!' });
    }
    if (stats.enemiesDefeated >= 5) {
      bonuses.push({ icon: '⚔️', text: 'Destroyer: Defeated 5 or more enemies!' });
    }
    if (difficulty === 'expert') {
      bonuses.push({ icon: '👑', text: 'Elite Warrior: Conquered Expert difficulty!' });
    }
    
    return bonuses;
  }, [stats, difficulty]);
  
  return (
    <div className={`battle-result ${isVictory ? 'victory' : 'defeat'}`}>
      <div className="result-header" 
        style={{ backgroundColor: isVictory ? '#4CAF50' : '#F44336' }}>
        <h2>{isVictory ? 'Victory!' : 'Defeat!'}</h2>
      </div>
      
      <div className="result-content">
        <div className="result-message">
          {isVictory ? (
            <p>You've defeated all enemy creatures! Your strategy and creatures have proven superior.</p>
          ) : (
            <p>All your creatures have been defeated. Better luck next time!</p>
          )}
        </div>
        
        <div className="battle-stats">
          <h3>Battle Statistics</h3>
          
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-label">Difficulty</div>
              <div className="stat-value" style={{ color: getDifficultyColor(difficulty) }}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Turns</div>
              <div className="stat-value">{stats.turns}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Creatures Remaining</div>
              <div className="stat-value">{stats.remainingCreatures}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Enemies Defeated</div>
              <div className="stat-value">{stats.enemiesDefeated}</div>
            </div>
          </div>
          
          {isVictory && rewards && (
            <div className="rewards-section">
              <h3>Rewards Earned</h3>
              
              <div className="reward-summary">
                <div className="reward-item">
                  <div className="reward-icon">⭐</div>
                  <div className="reward-details">
                    <div className="reward-amount">{rewards.experience}</div>
                    <div className="reward-type">Experience</div>
                  </div>
                </div>
                
                <div className="reward-item">
                  <div className="reward-icon">💰</div>
                  <div className="reward-details">
                    <div className="reward-amount">{rewards.currency}</div>
                    <div className="reward-type">Currency</div>
                  </div>
                </div>
              </div>
              
              {rewards.items && rewards.items.length > 0 && (
                <div className="reward-items">
                  <h4>Items Received:</h4>
                  <div className="items-list">
                    {rewards.items.map((item, index) => (
                      <div key={`reward-item-${index}`} className="reward-item-card">
                        <div className="item-icon">
                          {item.type === 'tool' ? '🔧' : 
                           item.type === 'spell' ? '✨' : 
                           item.type === 'enhancement' ? '💎' : '❓'}
                        </div>
                        <div className="item-info">
                          <div className="item-name" style={{ 
                            color: item.rarity === 'Legendary' ? '#FFD700' :
                                   item.rarity === 'Epic' ? '#9C27B0' :
                                   item.rarity === 'Rare' ? '#2196F3' : '#4CAF50'
                          }}>
                            {item.name}
                          </div>
                          <div className="item-rarity">{item.rarity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {performanceBonuses.length > 0 && (
                <div className="performance-bonuses">
                  <h4>Performance Analysis:</h4>
                  <div className="bonus-list">
                    {performanceBonuses.map((bonus, index) => (
                      <div key={`bonus-${index}`} className="bonus-item">
                        {bonus.icon} {bonus.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="result-actions">
        <button 
          className="play-again-btn"
          onClick={onPlayAgain}
          style={{ backgroundColor: isVictory ? '#4CAF50' : '#F44336' }}
        >
          Play Again
        </button>
        
        <button 
          className="close-btn"
          onClick={onClose}
        >
          Return to Game
        </button>
      </div>
    </div>
  );
};

export default BattleResult;
