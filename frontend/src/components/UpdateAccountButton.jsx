// src/components/UpdateAccountButton.jsx - Fixed based on RDT documentation
import React from 'react';
import { useRadixConnect } from '../context/RadixConnectContext';
import { DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit';

/**
 * A standalone button that handles account sharing updates
 * Using the documented DataRequestBuilder API
 */
const UpdateAccountButton = () => {
  const { rdt } = useRadixConnect();
  
  const handleClick = async () => {
    try {
      console.log("Updating account sharing using documented API");
      
      if (!rdt || !rdt.walletApi) {
        console.error("RDT not available");
        return;
      }
      
      // Using the exact format from your documentation
      rdt.walletApi.setRequestData(
        // This tells the wallet to reset accounts selection
        DataRequestBuilder.accounts().reset(true)
      );
      
      console.log("Sending request with reset accounts flag");
      const result = await rdt.walletApi.sendRequest();
      console.log("Account update result:", result);

    } catch (error) {
      console.error("Update account sharing failed:", error);
      
      // Fallback method - try simple request if all else fails
      try {
        console.log("Trying basic sendRequest()");
        if (rdt && rdt.walletApi) {
          await rdt.walletApi.sendRequest();
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }
  };
  
  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: '100%'
      }}
    >
      Update Account Sharing
    </button>
  );
};

export default UpdateAccountButton;
