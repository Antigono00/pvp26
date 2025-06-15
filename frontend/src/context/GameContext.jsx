// src/context/GameContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Import the GatewayApiClient + constants
import { GatewayApiClient, RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk';

// Use your existing RadixConnectContext for connected & accounts
import { useRadixConnect } from './RadixConnectContext';

// Import the service classes
import PetService from '../utils/PetService';
import TransactionService from '../utils/TransactionService';

// Updated machineTypes with fomoHit cost change and incubator maxLevel
const machineTypes = {
  catLair: {
    name: "Cat's Lair",
    baseCost: { tcorvax: 10 },
    production: { catNips: 5 },
    cooldown: 3600 * 1000,
    baseColor: "#4CAF50",
    levelColors: { 1: "#4CAF50", 2: "#2196F3", 3: "#00E676" },
    particleColor: "#a5d6a7",
    icon: "🐱",
    maxLevel: 3
  },
  reactor: {
    name: "Reactor",
    baseCost: { tcorvax: 10, catNips: 10 },
    production: { tcorvax: 1, energy: 2 },
    cooldown: 3600 * 1000,
    baseColor: "#2196F3",
    levelColors: { 1: "#2196F3", 2: "#1976D2", 3: "#00C853" },
    particleColor: "#90caf9",
    icon: "⚛️",
    maxLevel: 3
  },
  amplifier: {
    name: "Amplifier",
    baseCost: { tcorvax: 10, catNips: 10, energy: 10 },
    boost: { tcorvax: 0.5, energy: 0 },
    baseColor: "#9C27B0",
    levelColors: { 1: "#9C27B0", 2: "#7B1FA2", 3: "#00BFA5", 4: "#00FF00", 5: "#FFD700" },
    particleColor: "#ce93d8",
    icon: "🔊",
    maxLevel: 5
  },
  incubator: {
    name: "Incubator",
    baseCost: { tcorvax: 320, catNips: 320, energy: 320 },
    production: { tcorvax: 0 },
    cooldown: 3600 * 1000,
    baseColor: "#FF5722",
    levelColors: { 1: "#FF5722", 2: "#E64A19" }, // Added level 2 color
    particleColor: "#FFCCBC",
    icon: "🥚",
    maxLevel: 2 // Added maxLevel property
  },
  // Update FomoHit cost
  fomoHit: {
    name: "The FOMO HIT",
    baseCost: { tcorvax: 640, catNips: 640, energy: 640 }, // Updated cost
    production: { tcorvax: 5 },
    cooldown: 3600 * 1000,
    baseColor: "#FF3D00",
    levelColors: { 1: "#FF3D00" },
    particleColor: "#FFAB91",
    icon: "🔥",
    maxLevel: 1
  },
};

const MAX_LEVEL = 3;
const AMPLIFIER_MAX_LEVEL = 5;
const MACHINE_COOLDOWN_MS = 3600 * 1000;
const gridSize = 64;
const INTERACTION_RANGE = gridSize * 1.5;

// Create the context
export const GameContext = createContext();

// Correctly initialize the Gateway client for Mainnet with gatewayApiUrl
const gatewayApi = GatewayApiClient.initialize({
  networkId: RadixNetwork.Mainnet,
  applicationName: 'Corvax Lab', // any name you like
  gatewayApiUrl: 'https://mainnet-gateway.radixdlt.com'
});

export const GameProvider = ({ children }) => {
  // Telegram login / user states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Player');

  // Game resources
  const [tcorvax, setTcorvax] = useState(300.0);
  const [catNips, setCatNips] = useState(300.0);
  const [energy, setEnergy] = useState(300.0);
  const [eggs, setEggs] = useState(0.0); // New eggs resource

  // Machines
  const [machines, setMachines] = useState([]);
  const [machineCount, setMachineCount] = useState({
    catLair: 0,
    reactor: 0,
    amplifier: 0,
    incubator: 0,
    fomoHit: 0,
  });
  
  // Machine movement state - IMPORTANT for fixing the issue
  const [selectedMachineToMove, setSelectedMachineToMove] = useState(null);
  const [inMoveMode, setInMoveMode] = useState(false);

  // Pet states
  const [pets, setPets] = useState([]);
  const [selectedPetToMove, setSelectedPetToMove] = useState(null);
  const [inPetMoveMode, setInPetMoveMode] = useState(false);
  const [showPetBuyPrompt, setShowPetBuyPrompt] = useState(false);
  const [selectedCatLair, setSelectedCatLair] = useState(null);
  const [showPetInteractionMenu, setShowPetInteractionMenu] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // Transaction service
  const [transactionService, setTransactionService] = useState(null);

  // Creature NFTs states - ADDED
  const [creatureNfts, setCreatureNfts] = useState([]);
  const [toolNfts, setToolNfts] = useState([]);
  const [spellNfts, setSpellNfts] = useState([]);

  // Add this to the state declarations in GameProvider
  const [showCreatureMinter, setShowCreatureMinter] = useState(false);

  // Player
  const [player, setPlayer] = useState({
    x: 400 - gridSize,
    y: 300 - gridSize,
    width: gridSize * 2,
    height: gridSize * 2,
    velocityX: 0,
    velocityY: 0,
    maxSpeed: 4,
    acceleration: 0.5,
    friction: 0.85,
    facingRight: false
  });

  // UI states
  const [showBattleGame, setShowBattleGame] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [showLowCorvaxMessage, setShowLowCorvaxMessage] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [particles, setParticles] = useState([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Room navigation states
  const [currentRoom, setCurrentRoom] = useState(1);
  const [roomsUnlocked, setRoomsUnlocked] = useState(1);
  const [showRoomUnlockMessage, setShowRoomUnlockMessage] = useState(false);
  const [seenRoomUnlock, setSeenRoomUnlock] = useState(0); // Added seen state for persistence

  // Transaction tracking
  const [pendingTransactions, setPendingTransactions] = useState({});

  // PvP Menu state - NEW
  const [showPvPMenu, setShowPvPMenu] = useState(false);

  // Access the Radix Connect context
  const { connected, accounts, rdt } = useRadixConnect();

  // Initialize the transaction service when RDT is available
  useEffect(() => {
    if (rdt) {
      setTransactionService(new TransactionService(rdt));
    }
  }, [rdt]);

  /**
   * Direct SDK query using the SDK Gateway
   */
  const getSCvxBalanceViaSDK = async (userAccount) => {
    if (!userAccount) return 0;
    console.log('getSCvxBalanceViaSDK - checking sCVX for =>', userAccount.address);

    try {
      // sCVX resource address
      const sCVXresource = 'resource_rdx1t5q4aa74uxcgzehk0u3hjy6kng9rqyr4uvktnud8ehdqaaez50n693';
      
      // Defer to backend handling instead
      console.log('Deferring sCVX lookup to backend with address:', userAccount.address);
      return 0;
    } catch (err) {
      console.error('Error in getSCvxBalanceViaSDK =>', err);
      return 0;
    }
  };

  // Function to get machines in current room only
  const getMachinesInCurrentRoom = useCallback(() => {
    return machines.filter(machine => (machine.room || 1) === currentRoom);
  }, [machines, currentRoom]);
  
  // Function to get pets in the current room
  const getPetsInCurrentRoom = useCallback(() => {
    return pets.filter(pet => (pet.room || 1) === currentRoom);
  }, [pets, currentRoom]);

  // Function to close room unlock message and persist the dismissal
  const dismissRoomUnlock = useCallback(async () => {
    try {
      await axios.post('/api/dismissRoomUnlock');
      setSeenRoomUnlock(1);
      setShowRoomUnlockMessage(false);
    } catch (error) {
      console.error('Error dismissing room unlock message:', error);
    }
  }, []);

  // Telegram login + load game from server
  const checkLoginStatus = useCallback(async () => {
    try {
      const resp = await axios.get('/api/whoami');
      if (resp.data.loggedIn) {
        setIsLoggedIn(true);
        setUserName(resp.data.firstName || 'Player');
        await loadGameFromServer();
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }, []);

  const loadGameFromServer = useCallback(async () => {
    try {
      const resp = await axios.get('/api/getGameState');
      setTcorvax(parseFloat(resp.data.tcorvax));
      setCatNips(parseFloat(resp.data.catNips));
      setEnergy(parseFloat(resp.data.energy));
      setEggs(parseFloat(resp.data.eggs || 0)); // Add eggs handling
      setSeenRoomUnlock(resp.data.seenRoomUnlock || 0); // Add seen flag handling
      
      // Load pets (new)
      if (resp.data.pets) {
        setPets(resp.data.pets);
      }

      const newMachines = resp.data.machines.map(m => ({
        ...m,
        particleColor: machineTypes[m.type]?.particleColor
      }));
      setMachines(newMachines);

      // Count machines
      const counts = { catLair: 0, reactor: 0, amplifier: 0, incubator: 0, fomoHit: 0 };
      newMachines.forEach((m) => {
        counts[m.type] = (counts[m.type] || 0) + 1;
      });
      setMachineCount(counts);

      // Update rooms unlocked
      const prevRoomsUnlocked = roomsUnlocked;
      const newRoomsUnlocked = resp.data.roomsUnlocked || 1;
      setRoomsUnlocked(newRoomsUnlocked);
      
      // Check if we just unlocked a new room and haven't seen the message yet
      if (newRoomsUnlocked > prevRoomsUnlocked && resp.data.seenRoomUnlock === 0) {
        setShowRoomUnlockMessage(true);
        addNotification("New room unlocked! Click the arrow to navigate.", 400, 300, "#4CAF50");
      }

      setShowLowCorvaxMessage(resp.data.tcorvax < 20 && counts.reactor === 0);
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }, [roomsUnlocked]);

  // API helper functions for Evolving Creatures
  // Function to fetch all the user's creatures from the blockchain
  const getCreatureNfts = useCallback(async (accountAddress) => {
    try {
      // Use our API endpoint to get all user creatures
      const response = await fetch('/api/getUserCreatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accountAddress
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Creatures data:", data);
      
      return data.creatures || [];
    } catch (error) {
      console.error("Error loading creatures:", error);
      throw error;
    }
  }, []);

  // Load creature NFTs and related items - UPDATED
  const loadCreatureNfts = useCallback(async () => {
    try {
      // Ensure we have a connected Radix account
      if (!connected || !accounts || accounts.length === 0) {
        console.log("No connected Radix account for NFT loading, skipping");
        return;
      }
      
      const accountAddress = accounts[0].address;
      console.log('Loading creatures for account:', accountAddress);
      
      // Load creatures using the working endpoint (getUserCreatures instead of getCreatureNfts)
      try {
        const creaturesResp = await axios.post('/api/getUserCreatures', { accountAddress });
        if (creaturesResp.data && creaturesResp.data.creatures) {
          console.log('Successfully loaded creatures:', creaturesResp.data.creatures.length);
          setCreatureNfts(creaturesResp.data.creatures);
        } else {
          console.log('No creatures returned from API');
        }
      } catch (creatureError) {
        console.error('Error loading creatures:', creatureError);
      }
      
      // Load tools and spells from the working endpoint
      try {
        const itemsResp = await axios.post('/api/getUserItems', { accountAddress });
        if (itemsResp.data && itemsResp.data.tools) {
          console.log('Successfully loaded tools:', itemsResp.data.tools.length);
          setToolNfts(itemsResp.data.tools);
        }
        if (itemsResp.data && itemsResp.data.spells) {
          console.log('Successfully loaded spells:', itemsResp.data.spells.length);
          setSpellNfts(itemsResp.data.spells);
        }
      } catch (itemsError) {
        console.error('Error loading items:', itemsError);
        // Continue even if items fail to load
      }
    } catch (error) {
      console.error('Error in creature NFTs loading process:', error);
    }
  }, [connected, accounts]);

  // Modified useEffect to ensure it only runs when both logged in AND connected with accounts
  useEffect(() => {
    if (isLoggedIn && connected && accounts && accounts.length > 0) {
      console.log('Triggering loadCreatureNfts: logged in with connected account');
      loadCreatureNfts();
    }
  }, [isLoggedIn, connected, accounts, loadCreatureNfts]);

  // Utility methods
  const formatResource = (val) => {
    if (!val && val !== 0) return "0.0";
    return val.toFixed(1);
  };
  
  const canAfford = (cost) => {
    if (!cost) return true;
    return (
      (!cost.tcorvax || tcorvax >= cost.tcorvax) &&
      (!cost.catNips || catNips >= cost.catNips) &&
      (!cost.energy || energy >= cost.energy) &&
      (!cost.eggs || eggs >= cost.eggs)
    );
  };
  
  const calculateMachineCost = useCallback((type) => {
    const base = machineTypes[type]?.baseCost || {};
    const builtCount = machineCount[type] || 0;
    
    if ((type === "catLair" || type === "reactor") && builtCount === 1) {
      const multiplied = {};
      for (const k in base) {
        multiplied[k] = base[k] * 4;
      }
      return multiplied;
    }
    
    // Special case for third reactor
    if (type === "reactor" && builtCount === 2) {
      return { tcorvax: 640, catNips: 640 }; // Special cost for third reactor
    }
    
    return { ...base };
  }, [machineCount]);
  
  const canBuildMachine = useCallback((type) => {
    const builtCount = machineCount[type] || 0;
    
    if (type === "catLair") {
      if (builtCount >= 2) return false;
    } else if (type === "reactor") {
      if (builtCount >= 2) {
        // Allow a third reactor if player has incubator and fomoHit
        if (machineCount['incubator'] && machineCount['fomoHit']) {
          if (builtCount >= 3) return false;
        } else {
          return false;
        }
      }
    } else if (type === "amplifier" || type === "incubator" || type === "fomoHit") {
      if (builtCount >= 1) return false;
    }
    
    const cost = calculateMachineCost(type);
    return canAfford(cost);
  }, [machineCount, calculateMachineCost, canAfford]);

  // UI => notifications, particles
  const addNotification = (text, x, y, color) => {
    setNotifications(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        text,
        x,
        y,
        color,
        life: 3.0
      }
    ]);
  };
  
  const addParticles = (x, y, color, count = 20) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: Date.now() + i,
        x,
        y,
        color,
        size: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 3,
        life: 1.0
      });
    }
    setParticles(prev => [...prev, ...arr]);
  };

  // Build / Upgrade / Activate
  const buildMachine = async (type, x, y) => {
    try {
      const resp = await axios.post('/api/buildMachine', { 
        machineType: type, 
        x, 
        y,
        room: currentRoom  // Include current room
      });
      
      setTcorvax(parseFloat(resp.data.newResources.tcorvax));
      setCatNips(parseFloat(resp.data.newResources.catNips));
      setEnergy(parseFloat(resp.data.newResources.energy));
      
      // Check if we just unlocked a new room
      const newRoomsUnlocked = resp.data.roomsUnlocked || 1;
      if (newRoomsUnlocked > roomsUnlocked) {
        setRoomsUnlocked(newRoomsUnlocked);
        setShowRoomUnlockMessage(true);
        addNotification("New room unlocked! Click the arrow to navigate.", 400, 300, "#4CAF50");
      }
      
      await loadGameFromServer();
      addNotification(`Built ${type}!`, x + gridSize / 2, y - 20, "#4CAF50");
      addParticles(x + gridSize, y + gridSize, machineTypes[type].particleColor || "#fff");
    } catch (error) {
      console.error('Error building machine:', error);
      addNotification(
        error.response?.data?.error || "Build error!",
        x + gridSize / 2,
        y - 20,
        "#ff4444"
      );
    }
  };

  const upgradeMachine = async (machineId) => {
    try {
      const resp = await axios.post('/api/upgradeMachine', { machineId });
      setTcorvax(parseFloat(resp.data.newResources.tcorvax));
      setCatNips(parseFloat(resp.data.newResources.catNips));
      setEnergy(parseFloat(resp.data.newResources.energy));

      const machine = machines.find(m => m.id === machineId);
      if (machine) {
        addParticles(machine.x + gridSize, machine.y + gridSize, "#FFD700", 30);
        addNotification(
          `Level Up => ${resp.data.newLevel}`,
          machine.x + gridSize,
          machine.y - 20,
          "#FFD700"
        );
      }
      await loadGameFromServer();
    } catch (error) {
      console.error('Error upgrading machine:', error);
      addNotification(
        error.response?.data?.error || "Upgrade error!",
        0, 0,
        "#ff4444"
      );
    }
  };

  // Handle NFT minting with Radix
  const initiateMintTransaction = async (manifest, machineId) => {
    if (!connected || !accounts || accounts.length === 0) {
      addNotification("Connect Radix wallet and share account!", 400, 300, "#FF3D00");
      return null;
    }

    try {
      console.log("Initiating mint transaction with manifest:", manifest);
      
      // Make sure the RadixDappToolkit is ready
      if (!rdt) {
        console.error("Radix Dapp Toolkit not initialized");
        return null;
      }
      
      // Send the transaction to the wallet
      const result = await rdt.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });
      
      if (result.isErr()) {
        console.error("Transaction error:", result.error);
        addNotification("Transaction failed", 400, 300, "#FF3D00");
        return null;
      }
      
      const intentHash = result.value.transactionIntentHash;
      console.log("Transaction sent with intent hash:", intentHash);
      
      // Add tracking notification
      addNotification("NFT minting transaction sent!", 400, 300, "#FF3D00");
      
      return intentHash;
    } catch (error) {
      console.error("Error in mint transaction:", error);
      addNotification("Transaction error: " + error.message, 400, 300, "#FF3D00");
      return null;
    }
  };

  // Poll transaction status
  const pollTransactionStatus = async (intentHash, machineId) => {
    if (!intentHash) return;
    
    try {
      const response = await fetch('/api/checkMintStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intentHash,
          machineId
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Transaction status:", data);
      
      const transactionStatus = data.transactionStatus;
      
      if (transactionStatus.status === "CommittedSuccess") {
        addNotification("NFT minted successfully!", 400, 300, "#4CAF50");
        await loadGameFromServer(); // Refresh the game state
        return true;
      } else if (transactionStatus.status === "Failed" || transactionStatus.status === "Rejected") {
        addNotification("Mint failed: " + (transactionStatus.error_message || "Unknown error"), 400, 300, "#FF3D00");
        return true;
      }
      
      // Still pending
      return false;
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return false;
    }
  };

  // Pet operations
  const buyPet = async (petType, x, y, room, parentMachine) => {
    try {
      const result = await PetService.buyPet(petType, x, y, room, parentMachine);
      
      // Update cat nips
      setCatNips(parseFloat(result.newResources.catNips));
      
      // Add the new pet to state
      const newPet = {
        id: result.petId,
        type: result.petType,
        x: result.position.x,
        y: result.position.y,
        room: result.position.room,
        parentMachine: parentMachine
      };
      
      setPets(prev => [...prev, newPet]);
      
      addNotification(`Adopted a ${petType}!`, x, y, "#4CAF50");
      addParticles(x, y, "#FFD700", 30);
      
      return true;
    } catch (error) {
      console.error('Error buying pet:', error);
      addNotification(
        error.response?.data?.error || "Couldn't buy pet",
        x, y, "#ff4444"
      );
      return false;
    }
  };

  const movePet = async (petId, x, y, room = currentRoom) => {
    try {
      // Check if there's a pet being moved
      if (!petId) {
        console.error("movePet: No petId provided");
        return false;
      }

      console.log(`Moving pet ${petId} to coordinates (${x}, ${y}) in room ${room}`);

      const result = await PetService.movePet(petId, x, y, room);
      
      // Important: Use the returned position values from the API
      const newX = result.newPosition.x;
      const newY = result.newPosition.y;
      const newRoom = result.newPosition.room;
      
      console.log(`Server confirmed move to (${newX}, ${newY}) in room ${newRoom}`);
      
      // Find the pet and update its position with the values from the server
      setPets(prevPets => 
        prevPets.map(pet => 
          pet.id === petId 
            ? { 
                ...pet, 
                x: newX, 
                y: newY,
                room: newRoom
              } 
            : pet
        )
      );
      
      addNotification(`Pet moved!`, newX + gridSize / 2, newY - 20, "#4CAF50");
      
      // If moved to a different room, switch to that room
      if (newRoom !== currentRoom) {
        setCurrentRoom(newRoom);
      }
      
      // Reset selected pet and move mode
      setSelectedPetToMove(null);
      setInPetMoveMode(false);
      
      return true;
    } catch (error) {
      console.error('Error moving pet:', error);
      addNotification(
        error.response?.data?.error || "Move error!",
        0, 0,
        "#ff4444"
      );
      
      // Reset state on error too
      setSelectedPetToMove(null);
      setInPetMoveMode(false);
      
      return false;
    }
  };
  
  // Function to handle activation of a cat's lair and show pet prompt
  const handleCatLairActivation = (machine) => {
    // First check if the user already has a cat
    const hasCat = pets.some(pet => pet.type === 'cat');
    
    // Check if user has enough catnips to buy a pet
    const hasEnoughCatNips = catNips >= 1500;
    
    // Only show the prompt if user has enough catnips and doesn't have a cat yet
    if (!hasCat && hasEnoughCatNips) {
      setSelectedCatLair(machine);
      setShowPetBuyPrompt(true);
      return true; // Indicating we're showing the prompt
    }
    
    // Otherwise, just use normal activation
    return false; // Indicating we didn't show the prompt
  };
  
  // Function to check if a pet is being hovered over
  const getPetAtPosition = (x, y) => {
    // Only consider pets in the current room
    const currentRoomPets = pets.filter(pet => (pet.room || 1) === currentRoom);
    const petSize = gridSize * 1.5; // Slightly smaller than machine size
    
    return currentRoomPets.find((p) => {
      return (
        x >= p.x &&
        x < p.x + petSize &&
        y >= p.y &&
        y < p.y + petSize
      );
    });
  };

  // Function to handle buying energy with CVX - UPDATED
  const initiateBuyEnergy = async (accountAddress) => {
    if (!accountAddress) {
      addNotification("No wallet address provided", 400, 300, "#FF3D00");
      return false;
    }
    
    if (!transactionService) {
      addNotification("Transaction service not ready", 400, 300, "#FF3D00");
      return false;
    }
    
    try {
      // Get the transaction manifest
      const response = await PetService.buyEnergy(accountAddress);
      const manifest = response.manifest;
      
      if (!manifest) {
        addNotification("Failed to get transaction manifest", 400, 300, "#FF3D00");
        return false;
      }
      
      // Submit the transaction to the Radix wallet
      const intentHash = await transactionService.sendTransaction(manifest);
      
      if (intentHash) {
        // Start polling for status
        transactionService.pollTransactionStatus(
          intentHash, 
          '/api/confirmEnergyPurchase',
          {},
          3000,
          30
        )
        .then(statusData => {
          if (statusData.status === "ok") {
            // Transaction successful, update energy
            setEnergy(parseFloat(statusData.newEnergy));
            addNotification("Energy purchase successful! +500 Energy", 400, 300, "#4CAF50");
          } else if (statusData.transactionStatus?.status === "Failed" || 
                    statusData.transactionStatus?.status === "Rejected") {
            addNotification("Energy purchase failed", 400, 300, "#FF3D00");
          } else {
            addNotification("Energy purchase status unknown. Check your wallet.", 400, 300, "#FF9800");
          }
        })
        .catch(error => {
          console.error("Error polling transaction status:", error);
          addNotification("Error checking energy purchase status", 400, 300, "#FF3D00");
        });
        
        addNotification("Energy purchase transaction sent!", 400, 300, "#FF9800");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error initiating energy purchase:", error);
      addNotification("Error initiating energy purchase", 400, 300, "#FF3D00");
      return false;
    }
  };
  
  // Function to submit a CVX transaction
  const initiateCVXTransaction = async (manifest) => {
    if (!connected || !accounts || accounts.length === 0) {
      addNotification("Connect Radix wallet and share account!", 400, 300, "#FF3D00");
      return null;
    }

    try {
      console.log("Initiating CVX transaction with manifest:", manifest);
      
      // Make sure the RadixDappToolkit is ready
      if (!rdt) {
        console.error("Radix Dapp Toolkit not initialized");
        return null;
      }
      
      // Send the transaction to the wallet
      const result = await rdt.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });
      
      if (result.isErr()) {
        console.error("Transaction error:", result.error);
        addNotification("Transaction failed", 400, 300, "#FF3D00");
        return null;
      }
      
      const intentHash = result.value.transactionIntentHash;
      console.log("Transaction sent with intent hash:", intentHash);
      
      // Add tracking notification
      addNotification("Energy purchase transaction sent!", 400, 300, "#FF9800");
      
      return intentHash;
    } catch (error) {
      console.error("Error in CVX transaction:", error);
      addNotification("Transaction error: " + error.message, 400, 300, "#FF3D00");
      return null;
    }
  };

  // Machine movement function - IMPROVED
  const moveMachine = async (machineId, x, y, room = currentRoom) => {
    try {
      // Check if there's a machine being moved
      if (!machineId) {
        console.error("moveMachine: No machineId provided");
        return false;
      }

      console.log(`Moving machine ${machineId} to coordinates (${x}, ${y}) in room ${room}`);

      const resp = await axios.post('/api/moveMachine', { 
        machineId,
        x,
        y,
        room
      });
      
      setTcorvax(parseFloat(resp.data.newResources.tcorvax));
      
      // Find the machine and update its position
      setMachines(prevMachines => 
        prevMachines.map(machine => 
          machine.id === machineId 
            ? { 
                ...machine, 
                x: resp.data.newPosition.x, 
                y: resp.data.newPosition.y,
                room: resp.data.newPosition.room
              } 
            : machine
        )
      );
      
      addNotification(`Machine moved!`, x + gridSize / 2, y - 20, "#4CAF50");
      
      // If moved to a different room, switch to that room
      if (room !== currentRoom) {
        setCurrentRoom(room);
      }
      
      // Reset selected machine and move mode
      setSelectedMachineToMove(null);
      setInMoveMode(false);
      
      return true;
    } catch (error) {
      console.error('Error moving machine:', error);
      addNotification(
        error.response?.data?.error || "Move error!",
        0, 0,
        "#ff4444"
      );
      
      // Reset state on error too
      setSelectedMachineToMove(null);
      setInMoveMode(false);
      
      return false;
    }
  };

  const activateMachine = async (machine) => {
    if (!machine) return;

    // Special handling for Cat's Lair - check if we should show pet prompt
    if (machine.type === 'catLair') {
      const showingPetPrompt = handleCatLairActivation(machine);
      if (showingPetPrompt) {
        return; // Don't proceed with normal activation
      }
    }

    // Special handling for FOMO HIT and incubator
    if (machine.type === "fomoHit" || machine.type === "incubator") {
      if (!connected || !accounts || accounts.length === 0) {
        addNotification("Connect Radix wallet and share account!", machine.x + gridSize, machine.y - 20, machine.type === "fomoHit" ? "#FF3D00" : "#FF5722");
        return;
      }
    }

    try {
      // Debug logs to diagnose the issue
      console.log('machine:', machine);
      console.log('isRadixConnected:', connected);
      console.log('radixAccounts:', accounts);

      let requestData = {
        machineId: machine.id
      };

      // Add account address for incubator or fomoHit when wallet is connected
      if ((machine.type === "incubator" || machine.type === "fomoHit") && 
           connected && accounts && accounts.length > 0) {
        requestData.accountAddress = accounts[0].address;
        console.log('Including account address in request:', accounts[0].address);
      }

      // Use native fetch API
      const response = await fetch('/api/activateMachine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const resp = { data: responseData };
      
      // Handle NFT minting for FOMO HIT
      if (resp.data.requiresMint && resp.data.manifest) {
        const intentHash = await initiateMintTransaction(resp.data.manifest, machine.id);
        
        if (intentHash) {
          // Start polling for status
          let statusCheckCount = 0;
          const maxStatusChecks = 30; // Limit how many times we check
          
          const checkStatus = async () => {
            statusCheckCount++;
            const isComplete = await pollTransactionStatus(intentHash, machine.id);
            
            if (!isComplete && statusCheckCount < maxStatusChecks) {
              // Continue polling every 3 seconds
              setTimeout(checkStatus, 3000);
            }
          };
          
          // Start the polling
          setTimeout(checkStatus, 3000);
        }
      }

      if (resp.data.message) {
        addNotification(
          resp.data.message,
          machine.x + gridSize,
          machine.y - 20,
          resp.data.message === "Offline" ? "#ff4444" : "#4CAF50"
        );
      }

      if (resp.data.updatedResources) {
        const oldTcorvax = tcorvax;
        const oldCatNips = catNips;
        const oldEnergy = energy;
        const oldEggs = eggs;
        
        const newTcorvax = parseFloat(resp.data.updatedResources.tcorvax);
        const newCatNips = parseFloat(resp.data.updatedResources.catNips);
        const newEnergy = parseFloat(resp.data.updatedResources.energy);
        const newEggs = parseFloat(resp.data.updatedResources.eggs || 0);

        setTcorvax(newTcorvax);
        setCatNips(newCatNips);
        setEnergy(newEnergy);
        setEggs(newEggs);

        if (machine.type === "catLair") {
          const gainedCN = newCatNips - oldCatNips;
          addNotification(
            `+${formatResource(gainedCN)} Cat Nips`,
            machine.x + gridSize,
            machine.y,
            "#ffa500"
          );
        } else if (machine.type === "reactor") {
          const gainedTC = newTcorvax - oldTcorvax;
          const gainedEN = newEnergy - oldEnergy;
          addNotification(
            `+${formatResource(gainedTC)} TCorvax`,
            machine.x + gridSize,
            machine.y - 10,
            "#4CAF50"
          );
          addNotification(
            `+${formatResource(gainedEN)} Energy`,
            machine.x + gridSize,
            machine.y + 10,
            "#FFD700"
          );
        } else if (machine.type === "incubator") {
          const baseReward = resp.data.baseReward || 0;
          const bonusReward = resp.data.bonusReward || 0;
          const eggsReward = resp.data.eggsReward || 0;
          const scvxAmount = resp.data.stakedCVX || 0;
          
          // Always add particles for visual feedback
          addParticles(machine.x + gridSize, machine.y + gridSize, machine.particleColor || "#FFCCBC", 30);
          
          if (baseReward > 0 || bonusReward > 0 || eggsReward > 0) {
            // Calculate total TCorvax reward for visibility
            const totalTcorvax = (baseReward || 0) + (bonusReward || 0);
            
            // Show total reward first - this will appear as the primary floating number
            if (totalTcorvax > 0) {
              addNotification(
                `+${totalTcorvax} TCorvax`,
                machine.x + gridSize,
                machine.y - 20,
                "#4CAF50"
              );
            }
            
            // Show detailed breakdown slightly offset for visibility
            if (baseReward > 0) {
              addNotification(
                `+${baseReward} Base`,
                machine.x + gridSize - 40,  // Offset to the left
                machine.y - 40,
                "#FF5722"
              );
            }
            
            if (bonusReward > 0) {
              addNotification(
                `+${bonusReward} Bonus`,
                machine.x + gridSize + 40, // Offset to the right
                machine.y - 40,
                "#E64A19"
              );
            }
            
            if (eggsReward > 0) {
              addNotification(
                `+${eggsReward} Eggs`,
                machine.x + gridSize,
                machine.y + 20, // Move slightly lower
                "#FFD700"
              );
            }
            
            // Show sCVX amount only if greater than zero
            if (scvxAmount > 0) {
              addNotification(
                `${scvxAmount.toFixed(1)} sCVX`,
                machine.x + gridSize,
                machine.y + 40, // Move even lower
                "#9C27B0"
              );
            }
          } else if (resp.data.message === "Incubator Online") {
            addNotification("Incubator Online", machine.x + gridSize, machine.y - 10, "#4CAF50");
          } else if (scvxAmount === 0) {
            // Special message for when they have no sCVX
            addNotification("No sCVX Found", machine.x + gridSize, machine.y - 10, "#FFC107");
          } else {
            // Fallback notification in case no other condition is met
            addNotification("Incubator Activated", machine.x + gridSize, machine.y - 10, "#4CAF50");
          }
        } else if (machine.type === "fomoHit") {
          // Standard reward for FOMO HIT (after first activation)
          const reward = resp.data.reward || 0;
          if (reward > 0) {
            addNotification(`+${reward} TCorvax`, machine.x + gridSize, machine.y - 10, "#FF3D00");
          }
        }
      }

      if (resp.data.newLastActivated !== undefined) {
        setMachines(prev =>
          prev.map(m =>
            m.id === machine.id
              ? {
                  ...m,
                  lastActivated: resp.data.newLastActivated,
                  isOffline: (machine.type === "incubator" && resp.data.message === "Incubator Online")
                    ? false
                    : m.isOffline
                }
              : m
          )
        );
      }

      addParticles(machine.x + gridSize, machine.y + gridSize, machine.particleColor || "#fff");
      setShowLowCorvaxMessage(tcorvax < 20 && machineCount.reactor === 0);
    } catch (error) {
      console.error('Activation error:', error);
      if (error.response?.data?.remainingMs) {
        const remainMins = Math.ceil(error.response.data.remainingMs / 60000);
        addNotification(`Cooldown! Wait ${remainMins} min.`, machine.x + gridSize, machine.y - 20, "#ff4444");
      } else {
        addNotification(
          error.message || "Cannot activate",
          machine.x + gridSize,
          machine.y - 20,
          "#ff4444"
        );
      }
    }
  };

  const saveLayout = async () => {
    try {
      // Include room information for each machine
      const machinesToSave = machines.map(machine => ({
        id: machine.id,
        x: machine.x,
        y: machine.y,
        room: machine.room || 1
      }));

      await axios.post('/api/syncLayout', {
        machines: machinesToSave
      });
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  // On mount => check Telegram session
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      );
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update animations (particles, notifications)
  useEffect(() => {
    const updateAnimations = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            life: p.life - 0.01,
            size: p.size * 0.99
          }))
          .filter(p => p.life > 0)
      );

      setNotifications(prev =>
        prev
          .map(n => ({
            ...n,
            y: n.y - 0.3,
            life: n.life - 0.01
          }))
          .filter(n => n.life > 0)
      );
    };
    const interval = setInterval(updateAnimations, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider
      value={{
        // Telegram
        isLoggedIn,
        userName,

        // Resources
        tcorvax,
        catNips,
        energy,
        eggs, // Added eggs
        machines,
        machineCount,
        player,

        // UI
        showWelcomeMessage,
        setShowWelcomeMessage,
        showLowCorvaxMessage,
        setShowLowCorvaxMessage,
        isPanelOpen,
        setIsPanelOpen,
        notifications,
        particles,
        assetsLoaded,
        setAssetsLoaded,
        isMobile,

        // Machine info
        machineTypes,
        gridSize,
        INTERACTION_RANGE,
        MACHINE_COOLDOWN_MS,

        // Main functionalities
        loadGameFromServer,
        buildMachine,
        upgradeMachine,
        activateMachine,
        saveLayout,
        addNotification,
        addParticles,
        setPlayer,

        // Helpers
        canBuildMachine,
        canAfford,
        calculateMachineCost,
        formatResource,

        // NFT minting
        initiateMintTransaction,
        pollTransactionStatus,

        // Room navigation
        currentRoom,
        setCurrentRoom,
        roomsUnlocked,
        setRoomsUnlocked,
        getMachinesInCurrentRoom,
        showRoomUnlockMessage,
        seenRoomUnlock,
        dismissRoomUnlock,

        // Machine movement
        selectedMachineToMove,
        setSelectedMachineToMove,
        inMoveMode,
        setInMoveMode,
        moveMachine,

        // Pet functionality
        pets,
        setPets,
        buyPet,
        movePet,
        selectedPetToMove,
        setSelectedPetToMove,
        inPetMoveMode,
        setInPetMoveMode,
        showPetBuyPrompt,
        setShowPetBuyPrompt,
        selectedCatLair,
        setSelectedCatLair,
        showPetInteractionMenu,
        setShowPetInteractionMenu,
        selectedPet,
        setSelectedPet,
        handleCatLairActivation,
        getPetAtPosition,
        getPetsInCurrentRoom,
        initiateBuyEnergy,

        // Expose sCVX methods (mainly for compatibility)
        getSCvxBalance: getSCvxBalanceViaSDK,
        
        // Creature NFTs - ADDED
        creatureNfts,
        toolNfts,
        spellNfts,
        loadCreatureNfts,
        getCreatureNfts,
        showBattleGame,
        setShowBattleGame,

        // Add these to the contextValue object in the return statement
        showCreatureMinter,
        setShowCreatureMinter,

        // PvP Menu state - NEW
        showPvPMenu,
        setShowPvPMenu,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
