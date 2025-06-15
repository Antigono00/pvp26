// src/components/HelpButton.jsx - Production-ready with accurate game logic
import { useState, useEffect } from 'react';

const HelpButton = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Toggle help modal visibility
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };
  
  // Change active tab
  const switchTab = (tab) => {
    setActiveTab(tab);
  };
  
  // Prevent modal close when clicking inside modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  // Close modal when clicking overlay
  const handleOverlayClick = () => {
    setShowHelp(false);
  };
  
  return (
    <>
      {/* Help button */}
      <button 
        className="help-button" 
        onClick={toggleHelp}
        aria-label="Help"
        title="Game Help & Guide"
      >
        ?
      </button>
      
      {/* Help modal overlay */}
      {showHelp && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10002,
            padding: isMobile ? '10px' : '20px',
            boxSizing: 'border-box'
          }}
          onClick={handleOverlayClick}
        >
          {/* Help modal - Optimized for mobile screen usage */}
          <div 
            className="welcome-message" 
            style={{ 
              maxWidth: isMobile ? '95%' : '800px',
              width: isMobile ? '95%' : 'auto',
              maxHeight: isMobile ? '90vh' : '85vh',
              height: isMobile ? '90vh' : 'auto',
              padding: isMobile ? '25px 20px' : '40px',
              margin: 0,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
            onClick={handleModalClick}
          >
            {/* Close button */}
            <button 
              className="close-button" 
              onClick={toggleHelp}
              aria-label="Close Help"
              title="Close Help"
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '28px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                padding: '0',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                zIndex: 10003
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
            
            {/* Header */}
            <h2 style={{ 
              marginBottom: isMobile ? '20px' : '25px',
              marginTop: '0',
              textAlign: 'center',
              color: '#4CAF50',
              fontSize: isMobile ? '24px' : '28px',
              fontFamily: '"Orbitron", sans-serif'
            }}>
              Game Guide
            </h2>
            
            {/* Tab Navigation - Horizontal for both mobile and desktop */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '15px',
              overflowX: 'auto',
              flexShrink: 0,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {/* Hide scrollbar for webkit browsers */}
              <style>
                {`
                  .tab-container::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>
              
              {/* Tab buttons */}
              {['basics', 'machines', 'resources', 'battle', 'controls'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => switchTab(tab)}
                  style={{
                    padding: isMobile ? '10px 15px' : '12px 20px',
                    background: activeTab === tab ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: activeTab === tab ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid transparent',
                    color: activeTab === tab ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                    minWidth: isMobile ? 'auto' : '80px',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.target.style.background = 'rgba(76, 175, 80, 0.2)';
                      e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                      e.target.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Content area - Scrollable */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              paddingRight: isMobile ? '5px' : '10px',
              marginRight: isMobile ? '-5px' : '-10px'
            }}>
              {/* Tab content */}
              {activeTab === 'basics' && (
                <div>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: isMobile ? '18px' : '20px' }}>Two Game Systems</h3>
                  <p style={{ marginBottom: '15px', lineHeight: '1.6', fontSize: isMobile ? '14px' : '16px' }}>
                    Corvax Lab contains two completely separate game systems:
                  </p>
                  
                  <div style={{ 
                    background: 'rgba(76, 175, 80, 0.1)', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>1. Resource Management Lab</h4>
                    <p style={{ margin: '0', fontSize: isMobile ? '13px' : '14px' }}>
                      Build and upgrade machines to produce TCorvax currency. This system uses its own resources 
                      (TCorvax, Cat Nips, Energy, Eggs) and operates through machine cooldowns and production cycles.
                    </p>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(244, 67, 54, 0.1)', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                  }}>
                    <h4 style={{ color: '#F44336', margin: '0 0 10px 0' }}>2. Creature Battle System</h4>
                    <p style={{ margin: '0', fontSize: isMobile ? '13px' : '14px' }}>
                      Collect, evolve, and battle creatures with unique stats (strength, magic, speed, stamina, energy). 
                      Features turn-based PvP battles, deck building, and creature NFT minting through blockchain integration.
                    </p>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(255, 193, 7, 0.1)', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <h4 style={{ color: '#FFC107', margin: '0 0 10px 0' }}>⚠️ Important</h4>
                    <p style={{ margin: '0', fontSize: isMobile ? '13px' : '14px' }}>
                      These systems are <strong>not connected</strong>. Lab resources don't affect creature stats, 
                      and creature battle energy is separate from lab Energy. Each system has its own progression and mechanics.
                    </p>
                  </div>
                  
                  <h3 style={{ color: '#4CAF50', marginTop: '20px', marginBottom: '10px', fontSize: isMobile ? '16px' : '18px' }}>Getting Started</h3>
                  <ol style={{ paddingLeft: '20px', fontSize: isMobile ? '13px' : '14px', lineHeight: '1.6' }}>
                    <li>Start with the Resource Lab: Build a Cat's Lair, then a Reactor</li>
                    <li>Collect creatures by connecting your Radix wallet and viewing your NFTs</li>
                    <li>Try PvP battles to test your creature teams</li>
                    <li>Expand your lab with more machines and rooms</li>
                    <li>Evolve and upgrade your creatures for stronger battles</li>
                  </ol>
                </div>
              )}
              
              {activeTab === 'machines' && (
                <div>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: isMobile ? '18px' : '20px' }}>Lab Machines</h3>
                  <p style={{ marginBottom: '15px', fontSize: isMobile ? '13px' : '14px', lineHeight: '1.6' }}>
                    Each machine has specific functions, costs, and cooldowns (1 hour between activations):
                  </p>
                  
                  {/* Cat's Lair */}
                  <div style={{
                    background: 'rgba(76, 175, 80, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', marginRight: '10px' }}>🐱</span>
                      <h4 style={{ margin: '0', color: '#4CAF50' }}>Cat's Lair</h4>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Function:</strong> Produces Cat Nips (fuel for Reactors)
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Cost:</strong> 10 TCorvax (first), scaling cost for additional
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Production:</strong> 5 + (Level - 1) Cat Nips per activation
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Max Level:</strong> 3 • <strong>Cooldown:</strong> 1 hour
                    </p>
                  </div>
                  
                  {/* Reactor */}
                  <div style={{
                    background: 'rgba(33, 150, 243, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', marginRight: '10px' }}>⚛️</span>
                      <h4 style={{ margin: '0', color: '#2196F3' }}>Reactor</h4>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Function:</strong> Converts Cat Nips into TCorvax and Energy
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Cost:</strong> 10 TCorvax + 10 Cat Nips
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Consumption:</strong> 3 Cat Nips per activation
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Production:</strong> 1-2 TCorvax + 2 Energy (+ Amplifier bonus)
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Max Level:</strong> 3 • <strong>Limit:</strong> Up to 3 total (unlock conditions apply)
                    </p>
                  </div>
                  
                  {/* Amplifier */}
                  <div style={{
                    background: 'rgba(156, 39, 176, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(156, 39, 176, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', marginRight: '10px' }}>🔊</span>
                      <h4 style={{ margin: '0', color: '#9C27B0' }}>Amplifier</h4>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Function:</strong> Boosts nearby Reactor production
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Cost:</strong> 10 TCorvax + 10 Cat Nips + 10 Energy
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Boost:</strong> +0.5 TCorvax per Reactor activation
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Maintenance:</strong> Consumes 2 × Level Energy daily (goes offline without energy)
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Max Level:</strong> 5 • <strong>No Cooldown</strong> (passive boost)
                    </p>
                  </div>
                  
                  {/* Incubator */}
                  <div style={{
                    background: 'rgba(255, 87, 34, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 87, 34, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', marginRight: '10px' }}>🥚</span>
                      <h4 style={{ margin: '0', color: '#FF5722' }}>Incubator</h4>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Function:</strong> Converts sCVX holdings into TCorvax and Eggs
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Cost:</strong> 320 TCorvax + 320 Cat Nips + 320 Energy
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Requirement:</strong> sCVX tokens (stake CVX at corvax.meme)
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Rate:</strong> 1 Egg per 500 sCVX held + TCorvax based on holdings
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Max Level:</strong> 2 • <strong>Cooldown:</strong> 1 hour
                    </p>
                  </div>
                  
                  {/* FOMO HIT */}
                  <div style={{
                    background: 'rgba(255, 61, 0, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 61, 0, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', marginRight: '10px' }}>🔥</span>
                      <h4 style={{ margin: '0', color: '#FF3D00' }}>The FOMO HIT</h4>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Function:</strong> Premium production + exclusive NFT minting
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Cost:</strong> 640 TCorvax + 640 Cat Nips + 640 Energy
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Requirements:</strong> Radix wallet + build all other machine types first
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Production:</strong> 5 TCorvax per activation + mints exclusive NFTs
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Max Level:</strong> 1 • <strong>Cooldown:</strong> 1 hour
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'resources' && (
                <div>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: isMobile ? '18px' : '20px' }}>Lab Resources</h3>
                  <p style={{ marginBottom: '15px', fontSize: isMobile ? '13px' : '14px', lineHeight: '1.6' }}>
                    The Resource Management Lab uses its own economy, separate from creature battle stats:
                  </p>
                  
                  {/* TCorvax */}
                  <div style={{
                    background: 'rgba(76, 175, 80, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>💎</span> TCorvax
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      Main currency for building and upgrading machines. You start with 300 TCorvax.
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Produced by:</strong> Reactor (1-2 per activation), Incubator (sCVX-based), FOMO HIT (5 per activation)
                    </p>
                  </div>
                  
                  {/* Cat Nips */}
                  <div style={{
                    background: 'rgba(255, 167, 38, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 167, 38, 0.3)'
                  }}>
                    <h4 style={{ color: '#FFA726', margin: '0 0 10px 0', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🐱</span> Cat Nips
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      Essential fuel consumed by Reactors. You start with 300 Cat Nips.
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Produced by:</strong> Cat's Lair (5 + level bonus per activation)
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Consumed by:</strong> Reactor (3 Cat Nips per activation)
                    </p>
                  </div>
                  
                  {/* Energy */}
                  <div style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <h4 style={{ color: '#FFD700', margin: '0 0 10px 0', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>⚡</span> Energy (Lab)
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      Powers Amplifiers and required for some machine construction. You start with 300 Energy.
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Produced by:</strong> Reactor (2 per activation)
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Consumed by:</strong> Amplifier (2 × level daily to stay online)
                    </p>
                  </div>
                  
                  {/* Eggs */}
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <h4 style={{ color: '#FFC107', margin: '0 0 10px 0', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🥚</span> Eggs
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      Special resource linked to external sCVX token holdings.
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Produced by:</strong> Incubator (1 Egg per 500 sCVX held)
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'rgba(244, 67, 54, 0.1)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                  }}>
                    <h4 style={{ color: '#F44336', margin: '0 0 10px 0' }}>⚠️ Important Distinction</h4>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      Lab Energy (⚡) is completely different from creature battle energy. 
                      Lab resources don't affect creature stats or battle performance - they're separate systems!
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'battle' && (
                <div>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: isMobile ? '18px' : '20px' }}>Creature Battle System</h3>
                  <p style={{ marginBottom: '15px', fontSize: isMobile ? '13px' : '14px', lineHeight: '1.6' }}>
                    Turn-based PvP battles with creatures you own on the blockchain. This system is completely separate from lab resources.
                  </p>
                  
                  {/* Creature Stats */}
                  <div style={{
                    background: 'rgba(156, 39, 176, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(156, 39, 176, 0.3)'
                  }}>
                    <h4 style={{ color: '#9C27B0', margin: '0 0 10px 0' }}>Creature Stats & Forms</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      Each creature has 5 core stats: <strong>Energy, Strength, Magic, Stamina, Speed</strong>
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      These convert to battle stats: Physical/Magical Attack & Defense, Health, Initiative, Critical/Dodge Chance
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Forms:</strong> Egg (0) → Form 1 → Form 2 → Form 3 (Final). Higher forms = stronger stats & higher deployment cost.
                    </p>
                  </div>
                  
                  {/* Battle Mechanics */}
                  <div style={{
                    background: 'rgba(244, 67, 54, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                  }}>
                    <h4 style={{ color: '#F44336', margin: '0 0 10px 0' }}>Battle Mechanics</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px', fontSize: isMobile ? '12px' : '13px' }}>
                      <li><strong>Deployment Cost:</strong> 5 + Form Level battle energy</li>
                      <li><strong>Battle Energy:</strong> Starts at 15, regenerates +3 per turn</li>
                      <li><strong>Battlefield:</strong> Maximum 4 creatures per side</li>
                      <li><strong>Attack Cost:</strong> 3 battle energy</li>
                      <li><strong>Defend:</strong> Reduces damage, costs 1 energy</li>
                      <li><strong>Tools:</strong> Free to use, one-time per battle</li>
                      <li><strong>Spells:</strong> Cost 4 energy, powerful effects</li>
                    </ul>
                  </div>
                  
                  {/* Rarity & Strategy */}
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <h4 style={{ color: '#FFC107', margin: '0 0 10px 0' }}>Rarity & Strategy</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Rarity Multipliers:</strong> Common (1.0x), Rare (1.1x), Epic (1.2x), Legendary (1.3x)
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Specialty Stats:</strong> Each creature has 1-2 specialty stats that receive bonus multipliers
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      <strong>Synergies:</strong> Same species or complementary stat pairs provide field bonuses
                    </p>
                  </div>
                  
                  {/* PvP Access */}
                  <div style={{
                    background: 'rgba(33, 150, 243, 0.1)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}>
                    <h4 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>PvP Access</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px' }}>
                      Connect your Radix wallet to view your creature NFTs and join PvP battles.
                    </p>
                    <p style={{ margin: '0', fontSize: isMobile ? '12px' : '13px' }}>
                      Build your deck with up to 8 creatures plus tools and spells, then queue for matchmaking!
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'controls' && (
                <div>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: isMobile ? '18px' : '20px' }}>Controls & Interface</h3>
                  
                  {/* Lab Controls */}
                  <div style={{
                    background: 'rgba(33, 150, 243, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}>
                    <h4 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>Resource Lab Controls</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px', fontSize: isMobile ? '12px' : '13px' }}>
                      <li><strong>Movement:</strong> {isMobile ? 'Tap to move' : 'Arrow keys (↑ ↓ ← →)'}</li>
                      <li><strong>Activate Machine:</strong> {isMobile ? 'Tap machine' : 'Press Space when near machine'}</li>
                      <li><strong>Build/Upgrade:</strong> Use side panel {isMobile ? '(menu button)' : '(left side)'}</li>
                      <li><strong>Room Navigation:</strong> Arrow buttons {isMobile ? '(bottom-right)' : '(bottom-right corner)'}</li>
                      <li><strong>Move Machines:</strong> Side panel → Move Machines tab → Select machine → Choose new location (costs 50 TCorvax)</li>
                      {!isMobile && <li><strong>Cancel Move:</strong> Press Escape key when in move mode</li>}
                    </ul>
                  </div>
                  
                  {/* Battle Controls */}
                  <div style={{
                    background: 'rgba(244, 67, 54, 0.1)',
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                  }}>
                    <h4 style={{ color: '#F44336', margin: '0 0 10px 0' }}>Battle Controls</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px', fontSize: isMobile ? '12px' : '13px' }}>
                      <li><strong>Deploy Creature:</strong> {isMobile ? 'Tap creature in hand' : 'Click creature in hand'}</li>
                      <li><strong>Attack:</strong> {isMobile ? 'Tap your creature, then enemy target' : 'Click your creature, then enemy target'}</li>
                      <li><strong>Defend:</strong> {isMobile ? 'Tap creature, then defend button' : 'Click creature, then defend button'}</li>
                      <li><strong>Use Tools/Spells:</strong> {isMobile ? 'Tap item, then target' : 'Click item, then target'}</li>
                      <li><strong>End Turn:</strong> {isMobile ? 'Tap "End Turn" button' : 'Click "End Turn" button'}</li>
                    </ul>
                  </div>
                  
                  {/* Interface Elements */}
                  <div style={{
                    background: 'rgba(156, 39, 176, 0.1)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(156, 39, 176, 0.3)'
                  }}>
                    <h4 style={{ color: '#9C27B0', margin: '0 0 10px 0' }}>Interface Elements</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px', fontSize: isMobile ? '12px' : '13px' }}>
                      <li><strong>Resource Display:</strong> Shows TCorvax, Cat Nips, Energy, Eggs {isMobile ? '(top-right HUD)' : '(side panel)'}</li>
                      <li><strong>Room Navigation:</strong> Arrow buttons to switch between rooms</li>
                      <li><strong>Help Button:</strong> This guide {isMobile ? '(bottom-left ?)' : '(bottom-left ? button)'}</li>
                      <li><strong>Wallet Connect:</strong> Access creature NFTs {isMobile ? '(top-right)' : '(top-right corner)'}</li>
                      <li><strong>PvP Access:</strong> Join battles from side panel when creatures are available</li>
                      <li><strong>Machine Status:</strong> Cooldown bars show time remaining until next activation</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer with quick start tip */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              textAlign: 'center',
              flexShrink: 0
            }}>
              <p style={{ 
                margin: '0', 
                fontSize: isMobile ? '13px' : '14px',
                color: '#e0e0e0' 
              }}>
                Remember: Lab resources and creature battle stats are completely separate systems! 
                Access this help anytime by clicking the <strong style={{ color: '#4CAF50' }}>?</strong> button.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
