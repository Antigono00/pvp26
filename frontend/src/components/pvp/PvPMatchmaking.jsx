import React, { useState, useEffect, useCallback } from 'react';
import './PvPMatchmaking.css';

const PvPMatchmaking = ({ selectedCreatures, selectedTools, selectedSpells, onMatchFound, onCancel }) => {
  const [queueTime, setQueueTime] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(30);
  const [queueStatus, setQueueStatus] = useState('joining');
  const [error, setError] = useState(null);
  
  // Join queue on mount
  useEffect(() => {
    joinQueue();
    
    // Start queue timer
    const timer = setInterval(() => {
      setQueueTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(timer);
      cancelQueue();
    };
  }, []);
  
  // Join matchmaking queue
  const joinQueue = async () => {
    try {
      setQueueStatus('joining');
      
      const response = await fetch('/api/pvp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCreatures,
          tools: selectedTools,
          spells: selectedSpells
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to join queue');
        return;
      }
      
      if (data.matched) {
        // Immediate match found
        onMatchFound(data);
      } else {
        setQueueStatus('waiting');
        setEstimatedWait(data.estimatedWaitTime || 30);
        
        // Start polling for match
        pollForMatch();
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      setError('Failed to connect to matchmaking server');
    }
  };
  
  // Poll for match status
  const pollForMatch = useCallback(() => {
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/pvp/queue/status');
        const data = await response.json();
        
        if (data.matched) {
          clearInterval(checkInterval);
          setQueueStatus('matched');
          
          // Delay slightly for animation
          setTimeout(() => {
            onMatchFound(data);
          }, 1000);
        } else if (!data.inQueue) {
          // No longer in queue (error or cancelled)
          clearInterval(checkInterval);
          setError('Removed from queue');
        } else {
          // Update estimated wait time based on actual wait
          if (data.waitTime > estimatedWait) {
            setEstimatedWait(Math.max(estimatedWait, data.waitTime + 15));
          }
        }
      } catch (error) {
        console.error('Error checking queue status:', error);
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(checkInterval);
  }, [onMatchFound, estimatedWait]);
  
  // Cancel queue
  const cancelQueue = async () => {
    try {
      await fetch('/api/pvp/queue/cancel', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error cancelling queue:', error);
    }
  };
  
  const handleCancel = () => {
    cancelQueue();
    onCancel();
  };
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate deck power for display
  const calculateDeckPower = () => {
    return selectedCreatures.reduce((total, creature) => {
      const stats = creature.stats || {};
      const statTotal = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
      const formBonus = (creature.form || 0) * 10;
      const rarityMultiplier = {
        'Common': 1,
        'Rare': 1.3,
        'Epic': 1.6,
        'Legendary': 2
      }[creature.rarity] || 1;
      
      return total + Math.round(statTotal * rarityMultiplier + formBonus);
    }, 0);
  };
  
  if (error) {
    return (
      <div className="pvp-matchmaking-container">
        <div className="pvp-matchmaking-error">
          <h3>Matchmaking Error</h3>
          <p>{error}</p>
          <button className="pvp-retry-button" onClick={joinQueue}>
            Try Again
          </button>
          <button className="pvp-cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pvp-matchmaking-container">
      <div className="pvp-matchmaking">
        <div className="pvp-matchmaking-header">
          <h2>Finding Opponent...</h2>
          <div className="pvp-queue-time">
            {formatTime(queueTime)}
          </div>
        </div>
        
        <div className="pvp-matchmaking-content">
          {queueStatus === 'matched' ? (
            <div className="pvp-match-found">
              <div className="pvp-match-animation">
                <div className="pvp-match-icon">⚔️</div>
              </div>
              <h3>Match Found!</h3>
              <p>Preparing battlefield...</p>
            </div>
          ) : (
            <>
              <div className="pvp-search-animation">
                <div className="pvp-search-ring"></div>
                <div className="pvp-search-ring"></div>
                <div className="pvp-search-ring"></div>
              </div>
              
              <div className="pvp-queue-info">
                <div className="pvp-queue-stat">
                  <span>Your Deck Power</span>
                  <strong>{calculateDeckPower()}</strong>
                </div>
                <div className="pvp-queue-stat">
                  <span>Estimated Wait</span>
                  <strong>{formatTime(Math.max(0, estimatedWait - queueTime))}</strong>
                </div>
              </div>
              
              <div className="pvp-deck-preview">
                <h4>Your Battle Deck</h4>
                <div className="pvp-deck-creatures">
                  {selectedCreatures.map(creature => (
                    <div key={creature.id} className="pvp-deck-creature">
                      <img 
                        src={creature.image_url || creature.key_image_url} 
                        alt={creature.species_name}
                      />
                      <span className={`pvp-rarity-badge ${creature.rarity.toLowerCase()}`}>
                        {creature.rarity[0]}
                      </span>
                    </div>
                  ))}
                </div>
                
                {(selectedTools.length > 0 || selectedSpells.length > 0) && (
                  <div className="pvp-deck-items">
                    {selectedTools.map(tool => (
                      <div key={tool.id} className="pvp-deck-item tool">
                        <img src={tool.image_url || tool.key_image_url} alt={tool.name} />
                      </div>
                    ))}
                    {selectedSpells.map(spell => (
                      <div key={spell.id} className="pvp-deck-item spell">
                        <img src={spell.image_url || spell.key_image_url} alt={spell.name} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pvp-matchmaking-tips">
                <p className="pvp-tip">
                  💡 Tip: {getRandomTip()}
                </p>
              </div>
            </>
          )}
        </div>
        
        {queueStatus !== 'matched' && (
          <div className="pvp-matchmaking-footer">
            <button className="pvp-cancel-queue-button" onClick={handleCancel}>
              Cancel Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Random battle tips
const tips = [
  "Higher form creatures cost more energy but are more powerful!",
  "Save energy for key moments - you regenerate 3 per turn.",
  "Defending reduces damage taken and only costs 1 energy.",
  "Tools are free to use but can only be used once per battle.",
  "Spells cost 4 energy but can have powerful effects.",
  "Watch your opponent's energy - they might be planning something big!",
  "Legendary creatures have special death effects that empower allies.",
  "Combo attacks by using multiple actions in a row for bonus damage.",
  "Each creature has specialty stats that define their strengths.",
  "The battlefield can only hold 4 creatures per side at once."
];

const getRandomTip = () => {
  return tips[Math.floor(Math.random() * tips.length)];
};

export default PvPMatchmaking;
