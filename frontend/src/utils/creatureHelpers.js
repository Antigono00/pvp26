// src/utils/creatureHelpers.js
/**
 * Get a descriptive string for a creature's form
 */
export const getFormDescription = (form) => {
  switch (form) {
    case 0:
      return "Egg";
    case 1:
      return "Form 1";
    case 2:
      return "Form 2";
    case 3:
      return "Form 3 (Final)";
    default:
      return `Form ${form}`;
  }
};

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
 * Calculate the total stat value for a creature
 */
export const calculateTotalStats = (stats) => {
  if (!stats) return 0;
  return Object.values(stats).reduce((sum, value) => sum + value, 0);
};
