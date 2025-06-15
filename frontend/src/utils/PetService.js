// src/utils/PetService.js
import axios from 'axios';

/**
 * Service class for handling pet-related API calls
 */
class PetService {
  /**
   * Fetch all pets for the current user
   * @returns {Promise<Array>} The pets array
   */
  static async getPets() {
    try {
      const response = await axios.get('/api/getPets');
      return response.data;
    } catch (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
  }

  /**
   * Buy a new pet
   * @param {string} petType - Type of pet (e.g., 'cat')
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} room - Room number
   * @param {number} parentMachine - ID of the parent machine (Cat's Lair)
   * @returns {Promise<Object>} The response data
   */
  static async buyPet(petType, x, y, room = 1, parentMachine = null) {
    try {
      const response = await axios.post('/api/buyPet', { 
        petType,
        x, 
        y, 
        room,
        parentMachine 
      });
      return response.data;
    } catch (error) {
      console.error('Error buying pet:', error);
      throw error;
    }
  }

  /**
   * Move a pet to a new position
   * @param {number} petId - The pet ID
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   * @param {number} room - New room number
   * @returns {Promise<Object>} The response data
   */
  static async movePet(petId, x, y, room = 1) {
    try {
      const response = await axios.post('/api/movePet', { petId, x, y, room });
      return response.data;
    } catch (error) {
      console.error('Error moving pet:', error);
      throw error;
    }
  }

  /**
   * Buy energy with CVX
   * @param {string} accountAddress - The Radix account address
   * @returns {Promise<Object>} The transaction manifest
   */
  static async buyEnergy(accountAddress) {
    try {
      const response = await axios.post('/api/buyEnergy', { accountAddress });
      return response.data;
    } catch (error) {
      console.error('Error getting energy purchase manifest:', error);
      throw error;
    }
  }

  /**
   * Confirm energy purchase after transaction
   * @param {string} intentHash - The transaction intent hash
   * @returns {Promise<Object>} The confirmation response
   */
  static async confirmEnergyPurchase(intentHash) {
    try {
      const response = await axios.post('/api/confirmEnergyPurchase', { intentHash });
      return response.data;
    } catch (error) {
      console.error('Error confirming energy purchase:', error);
      throw error;
    }
  }
}

export default PetService;
