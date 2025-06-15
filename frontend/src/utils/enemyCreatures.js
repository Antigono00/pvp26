// src/utils/enemyCreatures.js
/**
 * This file contains helper functions and presets for enemy creatures
 * to avoid 404 issues with enemy creature images
 */

// Base folder for creature assets - now pointing to public assets folder
const baseAssetUrl = "/assets/evolving_creatures";

// Creature species templates with their base image URLs and stats
const creatureTemplates = [
  {
    id: "bullx",
    name: "Bullx",
    imagePrefix: `${baseAssetUrl}/bullx`,
    specialtyStats: ["strength", "stamina"]
  },
  {
    id: "cudoge",
    name: "Cudoge",
    imagePrefix: `${baseAssetUrl}/cudoge`,
    specialtyStats: ["strength", "stamina"]
  },
  {
    id: "cvxling",
    name: "Cvxling",
    imagePrefix: `${baseAssetUrl}/cvxling`,
    specialtyStats: ["speed", "energy"]
  },
  {
    id: "corvax",
    name: "Corvax",
    imagePrefix: `${baseAssetUrl}/corvax`,
    specialtyStats: ["magic", "energy"]
  },
  {
    id: "fomotron",
    name: "Fomotron",
    imagePrefix: `${baseAssetUrl}/fomotron`,
    specialtyStats: ["energy", "strength"]
  },
  {
    id: "xerdian",
    name: "Xerdian",
    imagePrefix: `${baseAssetUrl}/xerdian`,
    specialtyStats: ["stamina", "energy"]
  },
  {
    id: "satoshium",
    name: "Satoshium",
    imagePrefix: `${baseAssetUrl}/satoshium`,
    specialtyStats: ["strength", "stamina"]
  },
  {
    id: "etherion",
    name: "Etherion",
    imagePrefix: `${baseAssetUrl}/etherion`,
    specialtyStats: ["magic", "energy"]
  },
  {
    id: "hugbloom",
    name: "Hugbloom", 
    imagePrefix: `${baseAssetUrl}/hugbloom`,
    specialtyStats: ["stamina"]
  },
  {
    id: "minermole",
    name: "Minermole",
    imagePrefix: `${baseAssetUrl}/minermole`,
    specialtyStats: ["strength", "stamina"]
  }
];

/**
 * Get an image URL for a creature of a specific form
 * @param {string} speciesId - The ID of the species 
 * @param {number} form - The form number (0-3)
 * @returns {string} - Full image URL
 */
export const getCreatureImageUrl = (speciesId, form) => {
  // Find the template for this species 
  const template = creatureTemplates.find(t => t.id === speciesId);
  
  // If no template found, use Cvxling as fallback
  const imagePrefix = template ? template.imagePrefix : `${baseAssetUrl}/cvxling`;
  
  // Determine suffix based on form
  let suffix = "_egg.png";
  if (form > 0) {
    suffix = `_form${form}.png`;
  }
  
  return `${imagePrefix}${suffix}`;
};

/**
 * Get all available creature templates
 * @returns {Array} - Array of creature templates
 */
export const getCreatureTemplates = () => {
  return creatureTemplates;
};

/**
 * Get a random creature template
 * @returns {Object} - A randomly selected creature template
 */
export const getRandomCreatureTemplate = () => {
  const randomIndex = Math.floor(Math.random() * creatureTemplates.length);
  return creatureTemplates[randomIndex];
};

/**
 * Create an enemy creature object with the correct structure and image URLs
 * @param {string} speciesId - The ID of the species to use
 * @param {number} form - The form of the creature (0-3)
 * @param {string} rarity - The rarity of the creature (Common, Rare, Epic, Legendary)
 * @param {Object} stats - The creature's stats
 * @returns {Object} - A complete enemy creature object
 */
export const createEnemyCreature = (speciesId, form, rarity, stats) => {
  // Find the template
  const template = creatureTemplates.find(t => t.id === speciesId) || getRandomCreatureTemplate();
  
  // Generate a unique ID
  const uniqueId = `enemy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Get the image URL
  const imageUrl = getCreatureImageUrl(template.id, form);
  
  // Build the creature object
  return {
    id: uniqueId,
    species_id: template.id,
    species_name: `Enemy ${template.name}`,
    form: form,
    rarity: rarity,
    stats: stats || {
      energy: 5, 
      strength: 5, 
      magic: 5, 
      stamina: 5, 
      speed: 5
    },
    image_url: imageUrl,
    specialty_stats: template.specialtyStats
  };
};

export default {
  creatureTemplates,
  getCreatureImageUrl,
  getCreatureTemplates,
  getRandomCreatureTemplate,
  createEnemyCreature
};
