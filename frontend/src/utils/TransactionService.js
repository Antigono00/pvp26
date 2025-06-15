// src/utils/TransactionService.js
import axios from 'axios';

/**
 * Service class for handling Radix transaction-related functionality
 */
class TransactionService {
  /**
   * Initialize the service with a Radix Dapp Toolkit instance
   * @param {Object} rdt - The Radix Dapp Toolkit instance
   */
  constructor(rdt) {
    this.rdt = rdt;
  }

  /**
   * Send a transaction to the Radix wallet
   * @param {string} manifest - The transaction manifest
   * @returns {Promise<string|null>} The transaction intent hash or null if failed
   */
  async sendTransaction(manifest) {
    if (!this.rdt) {
      console.error("Radix Dapp Toolkit not initialized");
      return null;
    }
    
    try {
      // Log the manifest for debugging
      console.log("Sending transaction with manifest:", manifest);
      
      const result = await this.rdt.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });
      
      if (result.isErr()) {
        console.error("Transaction error:", result.error);
        return null;
      }
      
      const intentHash = result.value.transactionIntentHash;
      console.log("Transaction sent successfully with intent hash:", intentHash);
      return intentHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      return null;
    }
  }

  /**
   * Check the status of a transaction
   * @param {string} intentHash - The transaction intent hash
   * @param {string} endpointPath - The API endpoint to call
   * @param {Object} additionalData - Additional data to send
   * @returns {Promise<Object>} The transaction status
   */
  async checkTransactionStatus(intentHash, endpointPath, additionalData = {}) {
    try {
      const response = await axios.post(endpointPath, {
        intentHash,
        ...additionalData
      });
      
      return response.data;
    } catch (error) {
      console.error("Error checking transaction status:", error);
      throw error;
    }
  }

  /**
   * Poll a transaction status until completion or timeout
   * @param {string} intentHash - The transaction intent hash
   * @param {string} endpointPath - The API endpoint to check status
   * @param {Object} additionalData - Additional data to send with the request
   * @param {number} interval - Polling interval in milliseconds
   * @param {number} maxTries - Maximum number of polling attempts
   * @returns {Promise<Object>} Final transaction status
   */
  async pollTransactionStatus(intentHash, endpointPath, additionalData = {}, interval = 3000, maxTries = 30) {
    return new Promise((resolve, reject) => {
      let tries = 0;
      
      const checkStatus = async () => {
        try {
          const statusData = await this.checkTransactionStatus(intentHash, endpointPath, additionalData);
          
          // Check if transaction is complete
          if (statusData.status === "ok" || 
              statusData.transactionStatus?.status === "CommittedSuccess") {
            resolve(statusData);
            return;
          }
          
          // Check if transaction failed
          if (statusData.transactionStatus?.status === "Failed" || 
              statusData.transactionStatus?.status === "Rejected") {
            resolve(statusData);
            return;
          }
          
          // Continue polling if not complete and not at max tries
          tries++;
          if (tries < maxTries) {
            setTimeout(checkStatus, interval);
          } else {
            // Max tries reached
            resolve({
              status: "timeout",
              message: "Transaction polling timed out",
              transactionStatus: statusData.transactionStatus
            });
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Start polling
      checkStatus();
    });
  }

  /**
   * Check and verify if the Radix wallet is ready to use
   * @param {Array} accounts - The connected accounts
   * @returns {Object} Status object with ready flag and message
   */
  static verifyWalletStatus(accounts) {
    if (!accounts || accounts.length === 0) {
      return {
        ready: false,
        message: "Please connect and share a Radix account"
      };
    }
    
    return {
      ready: true,
      message: "Wallet ready",
      accountAddress: accounts[0].address
    };
  }
}

export default TransactionService;
