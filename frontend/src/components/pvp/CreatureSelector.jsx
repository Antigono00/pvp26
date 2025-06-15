import React, { useState } from 'react';
import './CreatureSelector.css';

const CreatureSelector = ({ availableCreatures, selectedCreatures, onSelectionChange, maxSelection = 5 }) => {
  const [sortBy, setSortBy] = useState('rarity'); // rarity, form, name, power
  
  // Sort creatures based on selected criteria
  const sortedCreatures = [...availableCreatures].sort((a, b) => {
    switch (sortBy) {
      case 'rarity':
        const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      case 'form':
        return (b.form || 0) - (a.form || 0);
      case 'name':
        return a.species_name.localeCompare(b.species_name);
      case 'power':
        const getPower = (c) => {
          const stats = c.stats || {};
          return Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
        };
        return getPower(b) - getPower(a);
      default:
        return 0;
    }
  });
  
  const handleCreatureClick = (creature) => {
    const isSelected = selectedCreatures.some(c => c.id === creature.id);
    
    if (isSelected) {
      // Remove from selection
      onSelectionChange(selectedCreatures.filter(c => c.id !== creature.id));
    } else if (selectedCreatures.length < maxSelection) {
      // Add to selection
      onSelectionChange([...selectedCreatures, creature]);
    }
  };
  
  const getCreatureStats = (creature) => {
    const stats = creature.stats || {};
    return Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
  };
  
  const getRarityClass = (rarity) => {
    return rarity ? rarity.toLowerCase() : 'common';
  };
  
  const getSelectionOrder = (creatureId) => {
    const index = selectedCreatures.findIndex(c => c.id === creatureId);
    return index >= 0 ? index + 1 : null;
  };
  
  return (
    <div className="creature-selector">
      <div className="creature-selector-header">
        <div className="creature-selector-info">
          <h4>Select Creatures ({selectedCreatures.length}/{maxSelection})</h4>
          <p>Choose your battle team wisely</p>
        </div>
        <div className="creature-selector-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="creature-sort-select"
          >
            <option value="rarity">Rarity</option>
            <option value="form">Form</option>
            <option value="name">Name</option>
            <option value="power">Power</option>
          </select>
        </div>
      </div>
      
      <div className="creature-selector-grid">
        {sortedCreatures.map(creature => {
          const isSelected = selectedCreatures.some(c => c.id === creature.id);
          const selectionOrder = getSelectionOrder(creature.id);
          const stats = getCreatureStats(creature);
          const isMaxSelected = selectedCreatures.length >= maxSelection;
          
          return (
            <div
              key={creature.id}
              className={`creature-selector-card ${isSelected ? 'selected' : ''} ${getRarityClass(creature.rarity)} ${isMaxSelected && !isSelected ? 'disabled' : ''}`}
              onClick={() => handleCreatureClick(creature)}
            >
              {isSelected && (
                <div className="creature-selection-order">{selectionOrder}</div>
              )}
              
              <div className="creature-card-image">
                <img 
                  src={creature.image_url || creature.key_image_url} 
                  alt={creature.species_name}
                />
                <div className="creature-form-badge">F{creature.form || 0}</div>
              </div>
              
              <div className="creature-card-info">
                <h5>{creature.species_name}</h5>
                <div className="creature-card-stats">
                  <span className={`creature-rarity ${getRarityClass(creature.rarity)}`}>
                    {creature.rarity}
                  </span>
                  <span className="creature-power">
                    ⚡ {stats}
                  </span>
                </div>
                
                {creature.combination_level > 0 && (
                  <div className="creature-combo-level">
                    Combo Lv.{creature.combination_level}
                  </div>
                )}
              </div>
              
              <div className="creature-card-overlay">
                <div className="creature-detailed-stats">
                  <div className="stat-row">
                    <span>Energy:</span>
                    <span>{creature.stats?.energy || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Strength:</span>
                    <span>{creature.stats?.strength || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Magic:</span>
                    <span>{creature.stats?.magic || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Stamina:</span>
                    <span>{creature.stats?.stamina || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Speed:</span>
                    <span>{creature.stats?.speed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedCreatures.length === 0 && (
        <div className="creature-selector-empty">
          <p>Select at least one creature to battle!</p>
        </div>
      )}
    </div>
  );
};

export default CreatureSelector;
