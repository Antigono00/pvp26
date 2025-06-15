// src/utils/enemyPlaceholders.js
/**
 * This file contains placeholder assets for enemy creatures
 * to be used as fallbacks when regular images fail to load
 */

// Function to create data URL for a SVG colored background
const createColoredBackground = (color, text) => {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="140" height="100" viewBox="0 0 140 100">
    <rect width="140" height="100" fill="${color}" />
    <text x="70" y="50" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>
  `;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Create fallback images for each form
export const placeholder = {
  // Form 0 (Egg)
  egg: createColoredBackground('#263238', 'Egg'),
  
  // Form 1 
  form1: createColoredBackground('#1a237e', 'Form 1'),
  
  // Form 2
  form2: createColoredBackground('#4a148c', 'Form 2'),
  
  // Form 3
  form3: createColoredBackground('#880e4f', 'Form 3'),
  
  // Generic fallback
  generic: createColoredBackground('#333333', 'Creature')
};

/**
 * Get a placeholder image URL based on form
 * @param {number} form - The form number (0-3)
 * @returns {string} - Data URL for placeholder image
 */
export const getPlaceholderForForm = (form) => {
  if (form === 0) return placeholder.egg;
  if (form === 1) return placeholder.form1;
  if (form === 2) return placeholder.form2;
  if (form === 3) return placeholder.form3;
  return placeholder.generic;
};

export default {
  placeholder,
  getPlaceholderForForm
};
