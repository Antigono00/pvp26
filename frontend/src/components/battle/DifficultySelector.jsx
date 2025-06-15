// src/components/battle/DifficultySelector.jsx
import React, { useState } from 'react';
import { getDifficultyTips } from '../../utils/difficultySettings';

const DifficultySelector = ({ onSelectDifficulty, onStartBattle, onClose, creatureCount, difficulty: currentDifficulty }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState(currentDifficulty || 'easy');
  const [showDetailedTips, setShowDetailedTips] = useState(false);
  
  const difficulties = [
    { 
      id: 'easy', 
      name: 'Easy', 
      description: 'A challenging start. Enemy creatures are stronger and AI makes tactical decisions.',
      recommendedPower: 'Balanced team with evolving creatures',
      enemyBonus: '+15% enemy stats'
    },
    { 
      id: 'medium', 
      name: 'Medium', 
      description: 'Serious challenge. Enemy creatures are significantly stronger with advanced AI tactics.',
      recommendedPower: 'Well-developed team with multiple evolutions',
      enemyBonus: '+35% enemy stats'
    },
    { 
      id: 'hard', 
      name: 'Hard', 
      description: 'Extreme difficulty. Face powerful enemies with near-perfect AI and deadly combos.',
      recommendedPower: 'Highly evolved team with synergies',
      enemyBonus: '+60% enemy stats'
    },
    { 
      id: 'expert', 
      name: 'Expert', 
      description: 'Ultimate test. Enemy creatures are vastly superior with flawless AI execution.',
      recommendedPower: 'Maximum power team with perfect strategy',
      enemyBonus: '+100% enemy stats'
    }
  ];
  
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#FF9800';
      case 'expert': return '#FF5722';
      default: return '#4CAF50';
    }
  };
  
  const getDifficultyGradient = (diff) => {
    switch (diff) {
      case 'easy': 
        return 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
      case 'medium': 
        return 'linear-gradient(135deg, #FFC107 0%, #FFB300 100%)';
      case 'hard': 
        return 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)';
      case 'expert': 
        return 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)';
      default: 
        return 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    }
  };
  
  const handleDifficultySelect = (difficultyId) => {
    setSelectedDifficulty(difficultyId);
    onSelectDifficulty(difficultyId);
  };
  
  const handleStartBattle = () => {
    onStartBattle();
  };
  
  const getDifficultyTipsForLevel = (level) => {
    return getDifficultyTips(level);
  };
  
  return (
    <div className="difficulty-selector" style={{ position: 'relative', zIndex: 10005 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Battle Arena - Choose Your Challenge</h2>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          ×
        </button>
      </div>
      
      <div className="difficulty-description" style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          <strong>Warning:</strong> All difficulty levels have been significantly increased!
        </p>
        <p>You have <strong style={{ color: '#4CAF50' }}>{creatureCount}</strong> creatures available for battle.</p>
        <button
          onClick={() => setShowDetailedTips(!showDetailedTips)}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '5px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          {showDetailedTips ? 'Hide' : 'Show'} Detailed Tips
        </button>
      </div>
      
      <div className="difficulty-options">
        {difficulties.map(difficulty => (
          <div 
            key={difficulty.id}
            className={`difficulty-option ${selectedDifficulty === difficulty.id ? 'selected' : ''}`}
            onClick={() => handleDifficultySelect(difficulty.id)}
            style={{
              borderColor: selectedDifficulty === difficulty.id ? 
                getDifficultyColor(difficulty.id) : 'transparent',
              boxShadow: selectedDifficulty === difficulty.id ?
                `0 0 20px ${getDifficultyColor(difficulty.id)}40` : 'none',
              transform: selectedDifficulty === difficulty.id ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="difficulty-header" 
              style={{ 
                background: getDifficultyGradient(difficulty.id),
                padding: '15px',
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
              {difficulty.name}
            </div>
            <div className="difficulty-content" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', fontSize: '15px' }}>{difficulty.description}</p>
              
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '10px', 
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                <p style={{ fontSize: '14px', color: getDifficultyColor(difficulty.id), fontWeight: 'bold' }}>
                  {difficulty.enemyBonus}
                </p>
              </div>
              
              <p style={{ 
                fontSize: '13px', 
                color: 'rgba(255,255,255,0.7)',
                fontStyle: 'italic'
              }}>
                <strong>Recommended:</strong> {difficulty.recommendedPower}
              </p>
              
              {showDetailedTips && selectedDifficulty === difficulty.id && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '5px',
                  borderLeft: `3px solid ${getDifficultyColor(difficulty.id)}`
                }}>
                  <h4 style={{ marginBottom: '10px', color: getDifficultyColor(difficulty.id) }}>
                    Detailed Tips:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {getDifficultyTipsForLevel(difficulty.id).map((tip, index) => (
                      <li key={index} style={{ 
                        marginBottom: '8px',
                        paddingLeft: '20px',
                        position: 'relative',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: '0',
                          color: getDifficultyColor(difficulty.id)
                        }}>▸</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="battle-controls" style={{ marginTop: '30px' }}>
        <button 
          className="start-battle-btn"
          onClick={handleStartBattle}
          style={{ 
            backgroundColor: getDifficultyColor(selectedDifficulty),
            background: getDifficultyGradient(selectedDifficulty),
            fontSize: '18px',
            padding: '15px 40px',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: creatureCount === 0 ? 'not-allowed' : 'pointer',
            opacity: creatureCount === 0 ? 0.5 : 1,
            transition: 'all 0.3s ease',
            boxShadow: creatureCount === 0 ? 'none' : `0 4px 15px ${getDifficultyColor(selectedDifficulty)}40`,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          disabled={creatureCount === 0}
          onMouseEnter={(e) => {
            if (creatureCount > 0) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 20px ${getDifficultyColor(selectedDifficulty)}60`;
            }
          }}
          onMouseLeave={(e) => {
            if (creatureCount > 0) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${getDifficultyColor(selectedDifficulty)}40`;
            }
          }}
        >
          {creatureCount === 0 ? 'No Creatures Available' : 'Start Battle!'}
        </button>
        
        {selectedDifficulty === 'expert' && (
          <p style={{
            marginTop: '15px',
            fontSize: '14px',
            color: '#FF5722',
            textAlign: 'center',
            fontWeight: 'bold',
            animation: 'pulse 2s infinite'
          }}>
            ⚠️ Expert mode requires perfect execution and resource management! ⚠️
          </p>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        
        .difficulty-option {
          cursor: pointer;
          margin-bottom: 15px;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.4);
        }
        
        .difficulty-option:hover {
          background: rgba(0, 0, 0, 0.5);
        }
        
        .difficulty-option.selected {
          background: rgba(0, 0, 0, 0.6);
        }
        
        .start-battle-btn:active {
          transform: scale(0.98) !important;
        }
      `}</style>
    </div>
  );
};

export default DifficultySelector;
