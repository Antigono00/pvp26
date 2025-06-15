import React, { useState, useEffect } from 'react';
import './PvPLeaderboard.css';

const PvPLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month
  
  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage, timeFilter]);
  
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pvp/leaderboard?page=${currentPage}&perPage=20&filter=${timeFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlayers(data.players || []);
        setTotalPages(data.totalPages || 1);
        
        // Check if current user is in the list
        const myUserId = parseInt(sessionStorage.getItem('userId'));
        const myEntry = data.players.find(p => p.user_id === myUserId);
        if (myEntry) {
          setMyRank(myEntry.rank);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1: return { icon: '🥇', class: 'gold' };
      case 2: return { icon: '🥈', class: 'silver' };
      case 3: return { icon: '🥉', class: 'bronze' };
      default: return { icon: `#${rank}`, class: '' };
    }
  };
  
  const getRankInfo = (rating) => {
    if (rating < 800) return { title: 'Bronze', color: '#CD7F32' };
    if (rating < 1000) return { title: 'Silver', color: '#C0C0C0' };
    if (rating < 1200) return { title: 'Gold', color: '#FFD700' };
    if (rating < 1500) return { title: 'Platinum', color: '#E5E4E2' };
    if (rating < 1800) return { title: 'Diamond', color: '#B9F2FF' };
    if (rating < 2200) return { title: 'Master', color: '#9966CC' };
    return { title: 'Grandmaster', color: '#FF4500' };
  };
  
  const getWinRate = (wins, losses) => {
    if (wins + losses === 0) return 0;
    return Math.round((wins / (wins + losses)) * 100);
  };
  
  if (loading) {
    return (
      <div className="pvp-leaderboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }
  
  return (
    <div className="pvp-leaderboard-container">
      <div className="pvp-leaderboard-header">
        <h3>PvP Rankings</h3>
        <div className="pvp-leaderboard-filters">
          <button 
            className={`pvp-filter-button ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </button>
          <button 
            className={`pvp-filter-button ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            This Week
          </button>
          <button 
            className={`pvp-filter-button ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            This Month
          </button>
        </div>
      </div>
      
      {myRank && (
        <div className="pvp-my-rank-banner">
          <p>Your Rank: <strong>#{myRank}</strong></p>
        </div>
      )}
      
      <div className="pvp-leaderboard-table">
        <div className="pvp-leaderboard-row header">
          <div className="pvp-rank-column">Rank</div>
          <div className="pvp-player-column">Player</div>
          <div className="pvp-rating-column">Rating</div>
          <div className="pvp-stats-column">W/L</div>
          <div className="pvp-winrate-column">Win %</div>
        </div>
        
        {players.map((player) => {
          const rankDisplay = getRankDisplay(player.rank);
          const rankInfo = getRankInfo(player.rating);
          const winRate = getWinRate(player.wins, player.losses);
          const isCurrentUser = player.user_id === parseInt(sessionStorage.getItem('userId'));
          
          return (
            <div 
              key={player.user_id} 
              className={`pvp-leaderboard-row ${rankDisplay.class} ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="pvp-rank-column">
                <span className="pvp-rank-icon">{rankDisplay.icon}</span>
              </div>
              <div className="pvp-player-column">
                <span className="pvp-player-name">{player.first_name}</span>
                <span className="pvp-player-title" style={{ color: rankInfo.color }}>
                  {rankInfo.title}
                </span>
              </div>
              <div className="pvp-rating-column">
                <span className="pvp-rating-value">{player.rating}</span>
              </div>
              <div className="pvp-stats-column">
                <span className="pvp-wins">{player.wins}</span>
                <span className="pvp-separator">/</span>
                <span className="pvp-losses">{player.losses}</span>
              </div>
              <div className="pvp-winrate-column">
                <div className="pvp-winrate-bar">
                  <div 
                    className="pvp-winrate-fill" 
                    style={{ width: `${winRate}%` }}
                  ></div>
                  <span className="pvp-winrate-text">{winRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {totalPages > 1 && (
        <div className="pvp-leaderboard-pagination">
          <button 
            className="pvp-page-button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pvp-page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="pvp-page-button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PvPLeaderboard;
