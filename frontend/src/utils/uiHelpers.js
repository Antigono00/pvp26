// src/utils/uiHelpers.js
/**
 * Get a color based on creature rarity
 */
export const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'Legendary':
      return '#FFD700'; // Gold
    case 'Epic':
      return '#9C27B0'; // Purple
    case 'Rare':
      return '#2196F3'; // Blue
    default:
      return '#4CAF50'; // Green for Common
  }
};

/**
 * Get a color based on difficulty level
 */
export const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return '#4CAF50'; // Green
    case 'medium':
      return '#FFC107'; // Yellow
    case 'hard':
      return '#FF9800'; // Orange
    case 'expert':
      return '#FF5722'; // Red
    default:
      return '#4CAF50';
  }
};
