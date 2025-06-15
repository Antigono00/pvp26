// src/components/battle/BattleLog.jsx - Fixed Scrolling with Better UI
import React, { useEffect, useRef, useState } from 'react';

const BattleLog = ({ log, className = '' }) => {
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);
  const [hasNewEntries, setHasNewEntries] = useState(false);
  const [lastLogCount, setLastLogCount] = useState(0);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const isDesktop = window.innerWidth >= 769;
  
  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (logEndRef.current && log.length > lastLogCount) {
      // Only auto-scroll if we're already at the bottom or auto-scroll is enabled
      if (isAutoScrollEnabled) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        });
      }
      
      setHasNewEntries(true);
      
      // Clear new entry indicator after a delay
      const timer = setTimeout(() => setHasNewEntries(false), 3000);
      
      setLastLogCount(log.length);
      return () => clearTimeout(timer);
    }
  }, [log, lastLogCount, isAutoScrollEnabled]);
  
  // Handle scroll events to determine if auto-scroll should be enabled
  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      // If scrolled to bottom (with a small buffer), enable auto-scroll
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
      setIsAutoScrollEnabled(isAtBottom);
    }
  };
  
  // Categorize log entries for color coding
  const getLogEntryClass = (message) => {
    if (message.includes('damaged') || message.includes('dealt')) return 'damage';
    if (message.includes('healed') || message.includes('healing')) return 'healing';
    if (message.includes('defeated')) return 'defeat';
    if (message.includes('Victory!')) return 'victory';
    if (message.includes('deployed')) return 'deploy';
    if (message.includes('defensive stance')) return 'defend';
    if (message.includes('critical')) return 'critical';
    return '';
  };
  
  return (
    <div 
      className={`battle-log ${isDesktop ? 'desktop-sidebar' : 'mobile'} ${className}`}
      style={{ zIndex: 30 }} // Force higher z-index
    >
      <div className="log-title">
        Battle Log
        <div className="log-indicators">
          <span className="log-count">({log.length})</span>
          {hasNewEntries && !isAutoScrollEnabled && (
            <span 
              className="new-entry-indicator" 
              onClick={() => {
                setIsAutoScrollEnabled(true);
                logEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ cursor: 'pointer' }}
            >
              New! ↓
            </span>
          )}
        </div>
      </div>
      
      <div 
        className="log-entries"
        ref={logContainerRef}
        onScroll={handleScroll}
      >
        {log.length === 0 ? (
          <div className="empty-log-message">No battle events yet...</div>
        ) : (
          log.map((entry) => (
            <div 
              key={entry.id} 
              className={`log-entry ${getLogEntryClass(entry.message)}`}
            >
              <span className="turn-indicator">Turn {entry.turn}:</span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
        
        <div ref={logEndRef} style={{ height: '1px', width: '1px' }} />
      </div>
      
      {!isAutoScrollEnabled && (
        <div 
          className="scroll-to-bottom"
          onClick={() => {
            setIsAutoScrollEnabled(true);
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          ↓ Scroll to Latest
        </div>
      )}
    </div>
  );
};

export default BattleLog;
