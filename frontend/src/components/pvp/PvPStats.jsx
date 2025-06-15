import React, { useState, useEffect } from 'react';
import './PvPStats.css';

const PvPStats = () => {
  const [stats, setStats] = useState(null);
  const [recentBattles, setRecentBattles] = useState([]);
  const [rank, setRank] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/pvp/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentBattles(data.recentBattles || []);
        setRank(data.rank || 0);
      }
    } catch (error) {
      console.error('Error fetching PvP stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getRankInfo = (rating) => {
    if (rating < 800) return { title: 'Bronze', color: '#CD7F32', icon: '🥉' };
    if (rating < 1000) return { title: 'Silver', color: '#C0C0C0', icon: '🥈' };
    if (rating < 1200) return { title: 'Gold', color: '#FFD700', icon: '🥇' };
    if (rating < 1500) return { title: 'Platinum', color: '#E5E4E2', icon: '💎' };
    if (rating < 1800) return { title: 'Diamond', color: '#B9F2FF', icon: '💠' };
    if (rating < 2200) return { title: 'Master', color: '#9966CC', icon: '👑' };
    return { title: 'Grandmaster', color: '#FF4500', icon: '🏆' };
  };
  
  const getWinRate = () => {
    if (!stats || stats.wins + stats.losses === 0) return 0;
    return Math.round((stats.wins / (stats.wins + stats.losses)) * 100);
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <div className="pvp-stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading stats...</p>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="pvp-stats-error">
        <p>Failed to load stats</p>
        <button onClick={fetchStats}>Retry</button>
      </div>
    );
  }
  
  const rankInfo = getRankInfo(stats.rating);
  const winRate = getWinRate();
  
  return (
    <div className="pvp-stats-container">
      <div className="pvp-stats-overview">
        <div className="pvp-rank-display">
          <div className="pvp-rank-icon">{rankInfo.icon}</div>
          <div className="pvp-rank-details">
            <h3 style={{ color: rankInfo.color }}>{rankInfo.title}</h3>
            <p className="pvp-rating">{stats.rating} Rating</p>
            <p className="pvp-rank-position">Rank #{rank}</p>
          </div>
        </div>
        
        <div className="pvp-stats-grid">
          <div className="pvp-stat-card">
            <h4>Wins</h4>
            <p className="pvp-stat-value wins">{stats.wins}</p>
          </div>
          <div className="pvp-stat-card">
            <h4>Losses</h4>
            <p className="pvp-stat-value losses">{stats.losses}</p>
          </div>
          <div className="pvp-stat-card">
            <h4>Win Rate</h4>
            <p className="pvp-stat-value">{winRate}%</p>
          </div>
          <div className="pvp-stat-card">
            <h4>Win Streak</h4>
            <p className="pvp-stat-value">
              {stats.win_streak} 
              <span className="pvp-stat-subtitle">
                (Best: {stats.best_win_streak})
              </span>
            </p>
          </div>
        </div>
        
        <div className="pvp-combat-stats">
          <h4>Combat Statistics</h4>
          <div className="pvp-combat-stat">
            <span>Total Damage Dealt</span>
            <strong>{stats.total_damage_dealt?.toLocaleString() || 0}</strong>
          </div>
          <div className="pvp-combat-stat">
            <span>Total Damage Taken</span>
            <strong>{stats.total_damage_taken?.toLocaleString() || 0}</strong>
          </div>
          <div className="pvp-combat-stat">
            <span>Damage Ratio</span>
            <strong>
              {stats.total_damage_taken > 0 
                ? (stats.total_damage_dealt / stats.total_damage_taken).toFixed(2)
                : '∞'}
            </strong>
          </div>
        </div>
      </div>
      
      <div className="pvp-recent-battles">
        <h3>Recent Battles</h3>
        {recentBattles.length === 0 ? (
          <p className="pvp-no-battles">No battles yet. Start playing to see your history!</p>
        ) : (
          <div className="pvp-battle-history">
            {recentBattles.map(battle => {
              const isPlayer1 = battle.isPlayer1;
              const won = battle.won;
              const ratingChange = isPlayer1 
                ? battle.player1_rating_change 
                : battle.player2_rating_change;
              const opponentName = isPlayer1 
                ? battle.player2_name 
                : battle.player1_name;
                
              return (
                <div 
                  key={battle.history_id} 
                  className={`pvp-battle-record ${won ? 'win' : 'loss'}`}
                >
                  <div className="pvp-battle-result">
                    <span className="pvp-result-icon">
                      {won ? '✓' : '✗'}
                    </span>
                    <div className="pvp-battle-details">
                      <p className="pvp-opponent-name">vs {opponentName}</p>
                      <p className="pvp-battle-info">
                        {battle.total_turns} turns • {formatDuration(battle.battle_duration)}
                      </p>
                    </div>
                  </div>
                  <div className="pvp-battle-rating">
                    <span className={`pvp-rating-change ${ratingChange > 0 ? 'positive' : 'negative'}`}>
                      {ratingChange > 0 ? '+' : ''}{ratingChange}
                    </span>
                    <span className="pvp-battle-time">
                      {formatDate(battle.completed_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="pvp-stats-footer">
        <button className="pvp-refresh-button" onClick={fetchStats}>
          Refresh Stats
        </button>
      </div>
    </div>
  );
};

export default PvPStats;
