import React, { useState, useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { useRadixConnect } from '../../context/RadixConnectContext';
import PvPMatchmaking from './PvPMatchmaking';
import PvPBattle from './PvPBattle';
import PvPStats from './PvPStats';
import PvPLeaderboard from './PvPLeaderboard';
import CreatureSelector from './CreatureSelector';
import './PvPMenu.css';

const PvPMenu = ({ onClose }) => {
  const { creatureNfts, toolNfts, spellNfts, addNotification } = useContext(GameContext);
  const { connected, accounts } = useRadixConnect();
  
  const [activeTab, setActiveTab] = useState('play');
  const [selectedCreatures, setSelectedCreatures] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedSpells, setSelectedSpells] = useState([]);
  const [battleId, setBattleId] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  
  const handleStartMatchmaking = async () => {
    if (selectedCreatures.length === 0) {
      addNotification('Select at least one creature for battle!', 400, 200, '#ff5252');
      return;
    }
    
    if (selectedCreatures.length > 5) {
      addNotification('Maximum 5 creatures allowed in PvP!', 400, 200, '#ff5252');
      return;
    }
    
    setInQueue(true);
  };
  
  const handleMatchFound = (matchData) => {
    setBattleId(matchData.battleId);
    setInQueue(false);
    setActiveTab('battle');
  };
  
  const handleBattleEnd = (result) => {
    setBattleId(null);
    setActiveTab('stats');
    
    if (result.isWinner) {
      addNotification(`Victory! +${result.ratingChange} rating`, 400, 200, '#4caf50');
    } else {
      addNotification(`Defeat! ${result.ratingChange} rating`, 400, 200, '#f44336');
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'play':
        if (battleId) {
          return (
            <PvPBattle
              battleId={battleId}
              selectedCreatures={selectedCreatures}
              selectedTools={selectedTools}
              selectedSpells={selectedSpells}
              onBattleEnd={handleBattleEnd}
            />
          );
        } else if (inQueue) {
          return (
            <PvPMatchmaking
              selectedCreatures={selectedCreatures}
              selectedTools={selectedTools}
              selectedSpells={selectedSpells}
              onMatchFound={handleMatchFound}
              onCancel={() => setInQueue(false)}
            />
          );
        } else {
          return (
            <div className="pvp-deck-selection">
              <h3>Select Your Battle Deck</h3>
              
              <CreatureSelector
                availableCreatures={creatureNfts}
                selectedCreatures={selectedCreatures}
                onSelectionChange={setSelectedCreatures}
                maxSelection={5}
              />
              
              <div className="pvp-items-selection">
                <div className="pvp-tools-section">
                  <h4>Tools (Optional)</h4>
                  <div className="pvp-items-grid">
                    {toolNfts.map(tool => (
                      <div
                        key={tool.id}
                        className={`pvp-item ${selectedTools.some(t => t.id === tool.id) ? 'selected' : ''}`}
                        onClick={() => {
                          if (selectedTools.some(t => t.id === tool.id)) {
                            setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
                          } else if (selectedTools.length < 3) {
                            setSelectedTools([...selectedTools, tool]);
                          }
                        }}
                      >
                        <img src={tool.image_url || tool.key_image_url} alt={tool.name} />
                        <span>{tool.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pvp-spells-section">
                  <h4>Spells (Optional)</h4>
                  <div className="pvp-items-grid">
                    {spellNfts.map(spell => (
                      <div
                        key={spell.id}
                        className={`pvp-item ${selectedSpells.some(s => s.id === spell.id) ? 'selected' : ''}`}
                        onClick={() => {
                          if (selectedSpells.some(s => s.id === spell.id)) {
                            setSelectedSpells(selectedSpells.filter(s => s.id !== spell.id));
                          } else if (selectedSpells.length < 3) {
                            setSelectedSpells([...selectedSpells, spell]);
                          }
                        }}
                      >
                        <img src={spell.image_url || spell.key_image_url} alt={spell.name} />
                        <span>{spell.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pvp-deck-summary">
                <p>Creatures: {selectedCreatures.length}/5</p>
                <p>Tools: {selectedTools.length}/3</p>
                <p>Spells: {selectedSpells.length}/3</p>
              </div>
              
              <button
                className="pvp-start-button"
                onClick={handleStartMatchmaking}
                disabled={selectedCreatures.length === 0}
              >
                Find Opponent
              </button>
            </div>
          );
        }
        
      case 'stats':
        return <PvPStats />;
        
      case 'leaderboard':
        return <PvPLeaderboard />;
        
      default:
        return null;
    }
  };
  
  return (
    <div className="pvp-menu-overlay">
      <div className="pvp-menu">
        <div className="pvp-menu-header">
          <h2>PvP Battle Arena</h2>
          <button className="pvp-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="pvp-menu-tabs">
          <button
            className={`pvp-tab ${activeTab === 'play' ? 'active' : ''}`}
            onClick={() => setActiveTab('play')}
            disabled={battleId !== null}
          >
            Battle
          </button>
          <button
            className={`pvp-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            My Stats
          </button>
          <button
            className={`pvp-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>
        
        <div className="pvp-menu-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PvPMenu;
