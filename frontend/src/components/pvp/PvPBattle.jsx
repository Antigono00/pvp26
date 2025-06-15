import React, { useState, useEffect, useCallback, useReducer } from 'react';
import Battlefield from '../battle/Battlefield';
import PlayerHand from '../battle/PlayerHand';
import ActionPanel from '../battle/ActionPanel';
import BattleLog from '../battle/BattleLog';
import BattleHeader from '../battle/BattleHeader';
import { calculateDerivedStats } from '../../utils/battleCalculations';
import { processAttack, applyTool, applySpell, defendCreature } from '../../utils/battleCore';
import './PvPBattle.css';

const POLL_INTERVAL = 2000; // Poll every 2 seconds when waiting for opponent
const TURN_TIME_LIMIT = 60000; // 60 seconds per turn

// Action types
const ACTIONS = {
  SET_BATTLE_STATE: 'SET_BATTLE_STATE',
  UPDATE_CREATURE: 'UPDATE_CREATURE',
  PROCESS_OPPONENT_ACTION: 'PROCESS_OPPONENT_ACTION',
  SUBMIT_ACTION: 'SUBMIT_ACTION',
  UPDATE_TIME: 'UPDATE_TIME',
  SET_LOADING: 'SET_LOADING',
  ADD_LOG: 'ADD_LOG'
};

// Battle reducer
const pvpBattleReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_BATTLE_STATE:
      return {
        ...state,
        ...action.battleState,
        loading: false
      };
      
    case ACTIONS.UPDATE_CREATURE:
      const { isPlayer, creature } = action;
      const field = isPlayer ? 'playerField' : 'enemyField';
      
      return {
        ...state,
        [field]: state[field].map(c => 
          c.id === creature.id ? creature : c
        ).filter(c => c.currentHealth > 0)
      };
      
    case ACTIONS.PROCESS_OPPONENT_ACTION:
      // Process opponent's action and update state
      return processOpponentAction(state, action.actionData);
      
    case ACTIONS.UPDATE_TIME:
      return {
        ...state,
        timeRemaining: action.timeRemaining
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.loading
      };
      
    case ACTIONS.ADD_LOG:
      return {
        ...state,
        battleLog: [...state.battleLog, {
          id: Date.now() + Math.random(),
          turn: state.turn,
          message: action.message
        }]
      };
      
    default:
      return state;
  }
};

const PvPBattle = ({ battleId, selectedCreatures, selectedTools, selectedSpells, onBattleEnd }) => {
  const [state, dispatch] = useReducer(pvpBattleReducer, {
    loading: true,
    battleStatus: 'active',
    isYourTurn: false,
    turn: 1,
    timeRemaining: TURN_TIME_LIMIT,
    
    // Player state
    playerHand: [],
    playerField: [],
    playerEnergy: 10,
    playerDeck: [],
    
    // Opponent state
    opponentHand: [],
    opponentField: [],
    opponentEnergy: 10,
    opponentName: 'Opponent',
    
    // Battle log
    battleLog: [],
    
    // UI state
    selectedCreature: null,
    targetCreature: null,
    actionInProgress: false
  });
  
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [targetCreature, setTargetCreature] = useState(null);
  
  // Fetch battle state
  const fetchBattleState = useCallback(async () => {
    try {
      const response = await fetch(`/api/pvp/battle/${battleId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Process battle state
        const processedState = processBattleStateForPlayer(data, selectedCreatures);
        dispatch({ type: ACTIONS.SET_BATTLE_STATE, battleState: processedState });
        
        // Check if battle ended
        if (data.status === 'completed') {
          handleBattleComplete(data);
        }
      } else {
        console.error('Failed to fetch battle state:', data.error);
      }
    } catch (error) {
      console.error('Error fetching battle state:', error);
    }
  }, [battleId, selectedCreatures]);
  
  // Process battle state for player perspective
  const processBattleStateForPlayer = (serverData, localCreatures) => {
    const { battleState, isPlayer1, yourTurn, turnNumber, opponentInfo, timeRemaining } = serverData;
    
    // Get player and opponent states based on perspective
    const playerState = isPlayer1 ? battleState.player1 : battleState.player2;
    const opponentState = isPlayer1 ? battleState.player2 : battleState.player1;
    
    // Process creatures with battle stats
    const processCreatures = (creatures) => {
      return creatures.map(creature => {
        // Find the full creature data from local storage
        const fullCreature = localCreatures.find(c => c.id === creature.id) || creature;
        const battleStats = calculateDerivedStats(fullCreature);
        
        return {
          ...fullCreature,
          ...creature, // Override with server state (health, effects, etc)
          battleStats
        };
      });
    };
    
    return {
      isYourTurn: yourTurn,
      turn: turnNumber,
      timeRemaining: timeRemaining,
      
      // Player state
      playerHand: processCreatures(playerState.hand),
      playerField: processCreatures(playerState.field),
      playerEnergy: playerState.energy,
      playerDeck: playerState.deck,
      
      // Opponent state (limited info)
      opponentHand: opponentState.hand.map(() => ({ hidden: true })), // Just show count
      opponentField: processCreatures(opponentState.field),
      opponentEnergy: opponentState.energy,
      opponentName: opponentInfo.name,
      
      // Battle log
      battleLog: battleState.battleLog || []
    };
  };
  
  // Submit action to server
  const submitAction = async (action) => {
    if (!state.isYourTurn || state.actionInProgress) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, loading: true });
    
    try {
      const response = await fetch(`/api/pvp/battle/${battleId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local state immediately
        if (data.updatedState) {
          const processedState = processBattleStateForPlayer(
            { battleState: data.updatedState, yourTurn: data.yourTurn },
            selectedCreatures
          );
          dispatch({ type: ACTIONS.SET_BATTLE_STATE, battleState: processedState });
        }
        
        // Check if battle ended
        if (data.status === 'completed') {
          handleBattleComplete(data);
        }
      } else {
        console.error('Action failed:', data.error);
        dispatch({ type: ACTIONS.ADD_LOG, message: `Action failed: ${data.error}` });
      }
    } catch (error) {
      console.error('Error submitting action:', error);
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, loading: false });
    }
  };
  
  // Handle battle completion
  const handleBattleComplete = (data) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    onBattleEnd({
      isWinner: data.isWinner,
      ratingChange: data.ratingChange || 0
    });
  };
  
  // Handle player actions
  const handlePlayerAction = useCallback((action, targetCreature, sourceCreature) => {
    if (!state.isYourTurn || state.actionInProgress) return;
    
    const actionData = {
      type: action.type,
      creatureId: sourceCreature?.id,
      targetId: targetCreature?.id,
      attackerId: action.type === 'attack' ? sourceCreature?.id : undefined,
      toolId: action.tool?.id,
      spellId: action.spell?.id,
      casterId: action.spell ? sourceCreature?.id : undefined
    };
    
    submitAction(actionData);
    
    // Clear selections
    setSelectedCreature(null);
    setTargetCreature(null);
  }, [state.isYourTurn, state.actionInProgress, submitAction]);
  
  // Timer countdown
  useEffect(() => {
    if (state.isYourTurn && state.timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch({ 
          type: ACTIONS.UPDATE_TIME, 
          timeRemaining: Math.max(0, state.timeRemaining - 1000) 
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [state.isYourTurn, state.timeRemaining]);
  
  // Initial load and polling
  useEffect(() => {
    fetchBattleState();
    
    // Set up polling when it's opponent's turn
    const interval = setInterval(() => {
      if (!state.isYourTurn && state.battleStatus === 'active') {
        fetchBattleState();
      }
    }, POLL_INTERVAL);
    
    setPollingInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchBattleState, state.isYourTurn, state.battleStatus]);
  
  // Auto-end turn on timeout
  useEffect(() => {
    if (state.timeRemaining === 0 && state.isYourTurn) {
      submitAction({ type: 'endTurn' });
    }
  }, [state.timeRemaining, state.isYourTurn, submitAction]);
  
  // Get available actions
  const getAvailableActions = useCallback((selectedCreature, targetCreature) => {
    if (!selectedCreature || !state.isYourTurn) return [];
    
    const actions = [];
    
    if (state.playerHand.some(c => c.id === selectedCreature.id)) {
      actions.push('deploy');
    }
    
    if (state.playerField.some(c => c.id === selectedCreature.id)) {
      if (targetCreature && state.opponentField.some(c => c.id === targetCreature.id) && state.playerEnergy >= 2) {
        actions.push('attack');
      }
      
      if (selectedTools.length > 0) {
        actions.push('useTool');
      }
      
      if (selectedSpells.length > 0 && state.playerEnergy >= 4) {
        actions.push('useSpell');
      }
      
      if (state.playerEnergy >= 1) {
        actions.push('defend');
      }
    }
    
    actions.push('endTurn');
    
    return actions;
  }, [state, selectedTools, selectedSpells]);
  
  if (state.loading) {
    return (
      <div className="pvp-battle-loading">
        <div className="loading-spinner"></div>
        <p>Loading battle...</p>
      </div>
    );
  }
  
  return (
    <div className="pvp-battle">
      <div className="pvp-battle-header">
        <div className="pvp-player-info">
          <span>You</span>
          <div className="pvp-energy-bar">
            <span>{state.playerEnergy}/25</span>
          </div>
        </div>
        
        <div className="pvp-turn-info">
          <h3>Turn {state.turn}</h3>
          {state.isYourTurn ? (
            <div className="pvp-timer">
              <span className={state.timeRemaining < 10000 ? 'warning' : ''}>
                {Math.floor(state.timeRemaining / 1000)}s
              </span>
            </div>
          ) : (
            <p>Opponent's Turn</p>
          )}
        </div>
        
        <div className="pvp-player-info opponent">
          <span>{state.opponentName}</span>
          <div className="pvp-energy-bar">
            <span>{state.opponentEnergy}/25</span>
          </div>
        </div>
      </div>
      
      <div className="pvp-battle-area">
        <div className="pvp-opponent-hand">
          {state.opponentHand.map((card, index) => (
            <div key={index} className="pvp-card-back">
              <span>?</span>
            </div>
          ))}
        </div>
        
        <Battlefield
          playerField={state.playerField}
          enemyField={state.opponentField}
          activePlayer={state.isYourTurn ? 'player' : 'enemy'}
          onCreatureSelect={(creature, isEnemy) => {
            if (state.isYourTurn) {
              if (isEnemy) {
                setTargetCreature(creature);
              } else {
                setSelectedCreature(creature);
              }
            }
          }}
          selectedCreature={selectedCreature}
          targetCreature={targetCreature}
          disabled={!state.isYourTurn || state.actionInProgress}
        />
        
        <PlayerHand
          hand={state.playerHand}
          onSelectCard={setSelectedCreature}
          disabled={!state.isYourTurn || state.actionInProgress}
          selectedCardId={selectedCreature?.id}
        />
      </div>
      
      <ActionPanel
        selectedCreature={selectedCreature}
        targetCreature={targetCreature}
        availableActions={getAvailableActions(selectedCreature, targetCreature)}
        onAction={handlePlayerAction}
        disabled={!state.isYourTurn || state.actionInProgress}
        availableTools={selectedTools}
        availableSpells={selectedSpells}
      />
      
      <BattleLog log={state.battleLog} />
      
      {!state.isYourTurn && (
        <div className="pvp-waiting-overlay">
          <p>Waiting for opponent...</p>
        </div>
      )}
    </div>
  );
};

// Helper function to process opponent actions
const processOpponentAction = (state, actionData) => {
  // This would process the opponent's action and update the state
  // Similar to how actions are processed in the main battle game
  return state;
};

export default PvPBattle;
