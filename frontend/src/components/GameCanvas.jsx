// src/components/GameCanvas.jsx - Production version with targeted fixes
import { useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../context/GameContext';
// Import from your RadixConnectContext
import { useRadixConnect } from '../context/RadixConnectContext';
import IncubatorWidget from './IncubatorWidget';
import FomoHitMinter from './FomoHitMinter';
import RoomNavigation from './RoomNavigation';
import PetBuyPrompt from './PetBuyPrompt';
import PetInteractionMenu from './PetInteractionMenu';
import EvolvingCreatureMinter from './EvolvingCreatureMinter';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const gameContainerRef = useRef(null); // Add ref for game container
  const requestRef = useRef(null);
  const assetsRef = useRef({
    backgroundImage: null,
    background2Image: null, // Added second room background
    playerImage: null,
    catsLairImage: null,
    reactorImage: null,
    amplifierImage: null,
    incubatorImage: null,
    fomoHitImage: null,
    catImage: null, // Add cat pet image
    loaded: false
  });

  const {
    isLoggedIn,
    machines,
    machineTypes,
    particles,
    notifications,
    gridSize,
    activateMachine,
    moveMachine,
    saveLayout,
    MACHINE_COOLDOWN_MS,
    INTERACTION_RANGE,
    addNotification,
    tcorvax,
    player,
    setPlayer,
    // Room navigation states
    currentRoom,
    setCurrentRoom,
    roomsUnlocked,
    getMachinesInCurrentRoom,
    // Machine movement states
    selectedMachineToMove,
    setSelectedMachineToMove,
    inMoveMode,
    setInMoveMode,
    // Pet states and functions
    pets,
    getPetsInCurrentRoom,
    buyPet,
    movePet,
    selectedPetToMove,
    setSelectedPetToMove,
    inPetMoveMode,
    setInPetMoveMode,
    getPetAtPosition,
    handleCatLairActivation,
    // Evolving Creatures modal state
    showCreatureMinter,
    setShowCreatureMinter
  } = useContext(GameContext);

  // Get Radix connection state from the RadixConnect context
  const {
    connected: isRadixConnected,
    accounts: radixAccounts,
    updateAccountSharing
  } = useRadixConnect();

  // Keyboard state
  const [keys, setKeys] = useState({});

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [targetX, setTargetX] = useState(player.x);
  const [targetY, setTargetY] = useState(player.y);
  const [autoTargetMachine, setAutoTargetMachine] = useState(null);
  const [autoPetTarget, setAutoPetTarget] = useState(null);

  // Incubator widget state
  const [showIncubatorWidget, setShowIncubatorWidget] = useState(false);
  const [selectedIncubator, setSelectedIncubator] = useState(null);
  
  // FOMO HIT minter state
  const [showFomoHitMinter, setShowFomoHitMinter] = useState(false);
  const [selectedFomoHit, setSelectedFomoHit] = useState(null);
  
  // Pet state
  const [showPetBuyPrompt, setShowPetBuyPrompt] = useState(false);
  const [selectedCatLair, setSelectedCatLair] = useState(null);
  const [showPetInteractionMenu, setShowPetInteractionMenu] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  
  // Machine movement state
  const [movingMachine, setMovingMachine] = useState(null);
  const [moveTargetRoom, setMoveTargetRoom] = useState(currentRoom);
  const [moveCursorPosition, setMoveCursorPosition] = useState({ x: 0, y: 0 });
  const [showMovePreview, setShowMovePreview] = useState(false);
  const [moveConfirmationOpen, setMoveConfirmationOpen] = useState(false);
  const [moveInstructionsVisible, setMoveInstructionsVisible] = useState(false);
  
  // Add state to track if position is selected
  const [positionSelected, setPositionSelected] = useState(false);

  // Fix for Room Navigation pointer events - targeted fix
  useEffect(() => {
    // Find and fix the room navigation component
    if (gameContainerRef.current) {
      // Apply targeted fixes only
      const roomNav = document.querySelector('.room-navigation');
      if (roomNav) {
        // Make sure room navigation doesn't block touches
        roomNav.style.pointerEvents = 'none';
        
        // But allow buttons to be clicked
        const roomNavButtons = roomNav.querySelectorAll('button');
        roomNavButtons.forEach(button => {
          button.style.pointerEvents = 'auto';
        });
      }
    }
  }, [gameContainerRef]);

  // Load assets on mount
  useEffect(() => {
    const imageSources = {
      backgroundImage: '/assets/Background.png',
      background2Image: '/assets/Background2.png', // Added second room background
      playerImage: '/assets/Player.png',
      catsLairImage: '/assets/CatsLair.png',
      reactorImage: '/assets/Reactor.png',
      amplifierImage: '/assets/Amplifier.png',
      incubatorImage: '/assets/Incubator.png',
      fomoHitImage: '/assets/FomoHit.png',
      catImage: '/assets/Cat.png' // Add cat pet image
    };

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          console.log(`Successfully loaded image: ${src}`);
          resolve(img);
        };
        img.onerror = (err) => {
          console.error(`Failed to load image: ${src}, using fallback`, err);
          // Return null so we know to use fallback rendering
          resolve(null);
        };
      });
    };

    const loadAssets = async () => {
      try {
        console.log('Starting to load assets...');

        const loadedImages = {};
        for (const [key, src] of Object.entries(imageSources)) {
          console.log(`Loading ${key} from ${src}...`);
          loadedImages[key] = await loadImage(src);
        }

        assetsRef.current = {
          ...loadedImages,
          loaded: true
        };

        console.log('All assets loaded successfully:', assetsRef.current);
      } catch (error) {
        console.error('Error loading game assets:', error);
      }
    };

    loadAssets();
  }, []);

  // Center player when switching rooms
  useEffect(() => {
    // Reset player position when changing rooms
    const newPlayerX = 400 - player.width / 2;
    const newPlayerY = 300 - player.height / 2;
    
    setPlayer({
      ...player,
      x: newPlayerX,
      y: newPlayerY,
      velocityX: 0,
      velocityY: 0
    });
    
    // Reset auto-targeting and targets as well
    setAutoTargetMachine(null);
    setAutoPetTarget(null);
    setTargetX(newPlayerX);
    setTargetY(newPlayerY);
    
    // Update the move target room when rooms are switched during move mode
    if (inMoveMode && movingMachine) {
      console.log(`Setting move target room to ${currentRoom}`);
      setMoveTargetRoom(currentRoom);
    }
  }, [currentRoom, setPlayer, player.width, player.height, inMoveMode, movingMachine]);

  // Listen for machine move requests from MoveMachines component
  useEffect(() => {
    // When a machine is selected for movement
    if (selectedMachineToMove && inMoveMode) {
      const machineToMove = machines.find(m => m.id === selectedMachineToMove);
      
      if (machineToMove && !movingMachine) {
        console.log('Starting machine move mode for:', machineToMove);
        setMovingMachine(machineToMove);
        setMoveTargetRoom(currentRoom);  // Set initial target room to current room
        setShowMovePreview(true);
        setMoveCursorPosition({
          x: machineToMove.x,
          y: machineToMove.y
        });
        setMoveInstructionsVisible(true);
        // Reset position selected state
        setPositionSelected(false);
        
        // Hide instructions after a delay
        const timer = setTimeout(() => {
          setMoveInstructionsVisible(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else if (!inMoveMode && movingMachine) {
      // Clear move mode if it's been canceled
      setMovingMachine(null);
      setShowMovePreview(false);
      setMoveConfirmationOpen(false);
      setPositionSelected(false); // Reset position selected state
    }
  }, [machines, selectedMachineToMove, inMoveMode, movingMachine, currentRoom]);

  // Handle pet movement mode
  useEffect(() => {
    // When a pet is selected for movement
    if (selectedPetToMove && inPetMoveMode) {
      const petToMove = pets.find(p => p.id === selectedPetToMove);
      
      if (petToMove) {
        console.log('Starting pet move mode for:', petToMove);
        setShowMovePreview(true);
        setMoveCursorPosition({
          x: petToMove.x,
          y: petToMove.y
        });
        setMoveInstructionsVisible(true);
        setPositionSelected(false);
        
        // Hide instructions after a delay
        const timer = setTimeout(() => {
          setMoveInstructionsVisible(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else if (!inPetMoveMode && selectedPetToMove) {
      // Clear move mode if it's been canceled
      setSelectedPetToMove(null);
      setShowMovePreview(false);
      setPositionSelected(false);
    }
  }, [pets, selectedPetToMove, inPetMoveMode]);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      );
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys((prev) => ({ ...prev, [e.key]: true }));

      // Space bar to activate nearest machine or confirm move
      if (e.key === ' ') {
        // If in pet move mode and position selected, confirm the move
        if (selectedPetToMove && inPetMoveMode && positionSelected) {
          handlePetMoveConfirm();
          e.preventDefault();
          return;
        }
        
        // If in machine move mode and position not selected, select the current position
        if (movingMachine && showMovePreview && !positionSelected) {
          setPositionSelected(true);
          setMoveConfirmationOpen(true);
          e.preventDefault();
          return;
        }
        
        // If position is already selected for machine move, toggle the confirmation dialog
        if (movingMachine && showMovePreview && positionSelected) {
          setMoveConfirmationOpen(!moveConfirmationOpen);
          e.preventDefault();
          return;
        }
        
        // Otherwise activate nearest machine or pet
        const nearestMachine = findClosestMachineInRange();
        if (nearestMachine) {
          if (nearestMachine.type === 'incubator') {
            handleIncubatorInteraction(nearestMachine);
          } else if (nearestMachine.type === 'fomoHit') {
            handleFomoHitInteraction(nearestMachine);
          } else if (nearestMachine.type === 'catLair') {
            handleActivation(nearestMachine);
          } else {
            activateMachine(nearestMachine);
          }
        } else {
          // Check if there's a pet nearby
          const nearestPet = findClosestPetInRange();
          if (nearestPet) {
            setSelectedPet(nearestPet);
            setShowPetInteractionMenu(true);
          }
        }
        e.preventDefault();
      }
      
      // Escape key to cancel move mode
      if (e.key === 'Escape') {
        if (positionSelected) {
          // If a position is selected, just cancel the position selection
          setPositionSelected(false);
          setMoveConfirmationOpen(false);
          e.preventDefault();
        } else if (movingMachine || inMoveMode) {
          // Cancel machine move mode
          handleMoveCancel();
          e.preventDefault();
        } else if (selectedPetToMove || inPetMoveMode) {
          // Cancel pet move mode
          setSelectedPetToMove(null);
          setInPetMoveMode(false);
          setShowMovePreview(false);
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player, machines, pets, activateMachine, movingMachine, selectedPetToMove, showMovePreview, inMoveMode, inPetMoveMode, positionSelected, moveConfirmationOpen]);

  // Canvas click/tap handlers for BOTH mobile and desktop
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleCanvasTap = (e) => {
      console.log('Canvas tap event triggered', e.type, e.target);
      
      e.preventDefault();
      e.stopPropagation();

      const rect = canvasRef.current.getBoundingClientRect();
      
      // Get the actual displayed size of the canvas
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Calculate the actual canvas dimensions maintaining aspect ratio
      const canvasAspectRatio = canvasRef.current.width / canvasRef.current.height;
      const displayAspectRatio = displayWidth / displayHeight;
      
      let actualWidth, actualHeight, offsetX, offsetY;
      
      if (displayAspectRatio > canvasAspectRatio) {
        // Display is wider - letterboxing on sides
        actualHeight = displayHeight;
        actualWidth = actualHeight * canvasAspectRatio;
        offsetX = (displayWidth - actualWidth) / 2;
        offsetY = 0;
      } else {
        // Display is taller - letterboxing on top/bottom
        actualWidth = displayWidth;
        actualHeight = actualWidth / canvasAspectRatio;
        offsetX = 0;
        offsetY = (displayHeight - actualHeight) / 2;
      }
      
      let tapX, tapY;
      if (e.touches && e.touches.length > 0) {
        // For touch events
        const relativeX = e.touches[0].clientX - rect.left - offsetX;
        const relativeY = e.touches[0].clientY - rect.top - offsetY;
        
        tapX = (relativeX / actualWidth) * canvasRef.current.width;
        tapY = (relativeY / actualHeight) * canvasRef.current.height;
      } else {
        // For mouse events
        const relativeX = e.clientX - rect.left - offsetX;
        const relativeY = e.clientY - rect.top - offsetY;
        
        tapX = (relativeX / actualWidth) * canvasRef.current.width;
        tapY = (relativeY / actualHeight) * canvasRef.current.height;
      }
      
      // Only process taps that are actually within the canvas area
      if (tapX >= 0 && tapX <= canvasRef.current.width && 
          tapY >= 0 && tapY <= canvasRef.current.height) {
        console.log(`Final tap coordinates: (${tapX}, ${tapY})`);
        handleCanvasClick(tapX, tapY);
      }
    };

    // Use passive: false to ensure we can prevent default behavior
    // Use capture: true to ensure we capture the event before it propagates
    canvasRef.current.addEventListener('touchstart', handleCanvasTap, { passive: false, capture: true });
    canvasRef.current.addEventListener('mousedown', handleCanvasTap, { capture: true });

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchstart', handleCanvasTap, { capture: true });
        canvasRef.current.removeEventListener('mousedown', handleCanvasTap, { capture: true });
      }
    };
  }, [canvasRef, machines, pets, player, gridSize, movingMachine, selectedPetToMove, showMovePreview, inMoveMode, inPetMoveMode, positionSelected]);

  // Add mouse move handler for showing move preview (only for desktop)
  useEffect(() => {
    if (!showMovePreview || !canvasRef.current) return;
    
    const handleMouseMove = (e) => {
      // Only update position if a position hasn't been selected yet
      if (positionSelected) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      
      const moveX = (e.clientX - rect.left) * scaleX;
      const moveY = (e.clientY - rect.top) * scaleY;
      
      // Snap to grid
      const snappedX = Math.floor(moveX / gridSize) * gridSize;
      const snappedY = Math.floor(moveY / gridSize) * gridSize;
      
      // Enforce boundaries based on what's being moved (machine or pet)
      const entitySize = movingMachine ? gridSize * 2 : gridSize * 1.5; // Pets are smaller than machines
      const maxX = canvasRef.current.width - entitySize;
      const maxY = canvasRef.current.height - entitySize;
      
      let boundedX = snappedX;
      let boundedY = snappedY;
      
      if (boundedX < 0) boundedX = 0;
      if (boundedX > maxX) boundedX = maxX;
      if (boundedY < 0) boundedY = 0;
      if (boundedY > maxY) boundedY = maxY;
      
      setMoveCursorPosition({ x: boundedX, y: boundedY });
    };
    
    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [showMovePreview, canvasRef, gridSize, positionSelected, movingMachine]);

  // Helper functions
  const distance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const getPlayerCenter = () => {
    return {
      px: player.x + player.width / 2,
      py: player.y + player.height / 2
    };
  };

  const getMachineCenter = (m) => {
    const half = gridSize;
    return {
      mx: m.x + half,
      my: m.y + half
    };
  };
  
  const getPetCenter = (p) => {
    const petSize = gridSize * 1.5;
    return {
      px: p.x + petSize / 2,
      py: p.y + petSize / 2
    };
  };

  const isPlayerInRangeOf = (entity, isEntity = 'machine') => {
    const { px, py } = getPlayerCenter();
    
    if (isEntity === 'machine') {
      const { mx, my } = getMachineCenter(entity);
      return distance(px, py, mx, my) <= INTERACTION_RANGE;
    } else {
      const petCenter = getPetCenter(entity);
      return distance(px, py, petCenter.px, petCenter.py) <= INTERACTION_RANGE;
    }
  };

  const getMachineAtPosition = (x, y) => {
    // Only consider machines in the current room
    const currentRoomMachines = getMachinesInCurrentRoom();
    const machineSize = gridSize * 2;
    
    return currentRoomMachines.find((m) => {
      return (
        x >= m.x &&
        x < m.x + machineSize &&
        y >= m.y &&
        y < m.y + machineSize
      );
    });
  };
  
  // Combine check for machines and pets to avoid duplicate code
  const getMachineOrPetAtPosition = (x, y) => {
    // First check if there's a machine at this position
    const machine = getMachineAtPosition(x, y);
    if (machine) return { type: 'machine', entity: machine };
    
    // If not, check if there's a pet at this position
    const pet = getPetAtPosition(x, y);
    if (pet) return { type: 'pet', entity: pet };
    
    return null;
  };

  const findClosestMachineInRange = () => {
    const { px, py } = getPlayerCenter();
    let bestMachine = null;
    let bestDist = Infinity;

    // Only consider machines in the current room
    const currentRoomMachines = getMachinesInCurrentRoom();
    
    currentRoomMachines.forEach((m) => {
      const { mx, my } = getMachineCenter(m);
      const dist = distance(px, py, mx, my);
      if (dist < bestDist && dist <= INTERACTION_RANGE) {
        bestDist = dist;
        bestMachine = m;
      }
    });

    return bestMachine;
  };
  
  const findClosestPetInRange = () => {
    const { px, py } = getPlayerCenter();
    let bestPet = null;
    let bestDist = Infinity;

    // Only consider pets in the current room
    const currentRoomPets = getPetsInCurrentRoom();
    
    currentRoomPets.forEach((p) => {
      const petCenter = getPetCenter(p);
      const dist = distance(px, py, petCenter.px, petCenter.py);
      if (dist < bestDist && dist <= INTERACTION_RANGE) {
        bestDist = dist;
        bestPet = p;
      }
    });

    return bestPet;
  };

  // Handle incubator interaction
  const handleIncubatorInteraction = (machine) => {
    console.log('handleIncubatorInteraction called for machine:', machine);
    
    if (!machine || machine.type !== 'incubator') {
      console.error('Invalid machine passed to handleIncubatorInteraction:', machine);
      return;
    }
    
    console.log('Radix connection status:', isRadixConnected);
    console.log('Radix accounts:', radixAccounts);

    // Open the IncubatorWidget regardless of connection status -
    // the widget will handle connection requirements internally
    setSelectedIncubator(machine);
    setShowIncubatorWidget(true);
  };
  
  // Handle FOMO HIT interaction
  const handleFomoHitInteraction = (machine) => {
    console.log('handleFomoHitInteraction called for machine:', machine);
    
    if (!machine || machine.type !== 'fomoHit') {
      console.error('Invalid machine passed to handleFomoHitInteraction:', machine);
      return;
    }
    
    console.log('Radix connection status:', isRadixConnected);
    console.log('Radix accounts:', radixAccounts);

    // For FOMO HIT, if it's first activation (lastActivated === 0) AND 
    // not already in the minting process (provisionalMint !== 1), show minter
    if (machine.lastActivated === 0 && machine.provisionalMint !== 1) {
      setSelectedFomoHit(machine);
      setShowFomoHitMinter(true);
    } else {
      // For subsequent activations or if minting is in progress,
      // just activate normally to collect TCorvax
      activateMachine(machine);
    }
  };
  
  // Handle activation for Cat's Lair with pet logic
  const handleActivation = (machine) => {
    // Special handling for Cat's Lair - check if we should show pet prompt
    if (machine.type === 'catLair') {
      const showingPetPrompt = handleCatLairActivation(machine);
      if (showingPetPrompt) {
        setSelectedCatLair(machine);
        setShowPetBuyPrompt(true);
        return; // Don't proceed with normal activation
      }
    }
    
    // Normal machine activation
    activateMachine(machine);
  };

  const autoWalkToMachine = (machine) => {
    // Don't auto walk if in move mode
    if (inMoveMode || inPetMoveMode || showMovePreview) return;
    
    const { px, py } = getPlayerCenter();
    const { mx, my } = getMachineCenter(machine);
    const distVal = distance(px, py, mx, my);

    if (distVal <= INTERACTION_RANGE) {
      if (machine.type === 'incubator') {
        handleIncubatorInteraction(machine);
      } else if (machine.type === 'fomoHit') {
        handleFomoHitInteraction(machine);
      } else if (machine.type === 'catLair') {
        handleActivation(machine);
      } else {
        activateMachine(machine);
      }
    } else {
      const offset = gridSize;
      setTargetX(mx - offset);
      setTargetY(my - offset);
      setAutoTargetMachine(machine);
    }
  };
  
  const autoWalkToPet = (pet) => {
    // Don't auto walk if in move mode
    if (inMoveMode || inPetMoveMode || showMovePreview) return;
    
    const { px, py } = getPlayerCenter();
    const petCenter = getPetCenter(pet);
    const distVal = distance(px, py, petCenter.px, petCenter.py);

    if (distVal <= INTERACTION_RANGE) {
      // We're already in range, show the pet interaction menu
      setSelectedPet(pet);
      setShowPetInteractionMenu(true);
    } else {
      // Walk to the pet first
      const offset = gridSize;
      setTargetX(petCenter.px - offset);
      setTargetY(petCenter.py - offset);
      setAutoPetTarget(pet);
    }
  };

  // Machine movement confirmation/cancellation
  const handleMoveConfirm = async () => {
    if (!movingMachine) return;
    
    console.log(`Confirming move of machine ${movingMachine.id} to (${moveCursorPosition.x}, ${moveCursorPosition.y}) in room ${moveTargetRoom}`);
    
    const success = await moveMachine(
      movingMachine.id, 
      moveCursorPosition.x, 
      moveCursorPosition.y,
      moveTargetRoom  // Important: use the target room, not current room
    );
    
    if (success) {
      addNotification("Machine moved!", moveCursorPosition.x, moveCursorPosition.y, "#4CAF50");
    }
    
    // Reset move mode
    setMovingMachine(null);
    setShowMovePreview(false);
    setMoveConfirmationOpen(false);
    setSelectedMachineToMove(null);
    setInMoveMode(false);
    setPositionSelected(false); // Reset position selected state
  };

  const handleMoveCancel = () => {
    // Cancel the move
    setMovingMachine(null);
    setShowMovePreview(false);
    setMoveConfirmationOpen(false);
    setSelectedMachineToMove(null);
    setInMoveMode(false);
    setPositionSelected(false); // Reset position selected state
  };
  
  // Handle pet move confirmation - IMPROVED VERSION
  const handlePetMoveConfirm = async () => {
    if (!selectedPetToMove) return;
    
    console.log(`Confirming move of pet ${selectedPetToMove} to (${moveCursorPosition.x}, ${moveCursorPosition.y}) in room ${currentRoom}`);
    
    // Find the pet we're moving
    const petToMove = pets.find(p => p.id === selectedPetToMove);
    if (!petToMove) {
      console.error("Cannot find pet with ID:", selectedPetToMove);
      setSelectedPetToMove(null);
      setInPetMoveMode(false);
      setShowMovePreview(false);
      setPositionSelected(false);
      return;
    }
    
    // Only call movePet once with the final position
    const success = await movePet(
      selectedPetToMove, 
      moveCursorPosition.x, 
      moveCursorPosition.y,
      currentRoom
    );
    
    if (success) {
      console.log("Pet move successful");
    } else {
      console.error("Pet move failed");
    }
    
    // Reset move mode
    setShowMovePreview(false);
    setSelectedPetToMove(null);
    setInPetMoveMode(false);
    setPositionSelected(false);
  };

  // Handle pet cancellation
  const handlePetMoveCancel = () => {
    // Cancel the move
    setShowMovePreview(false);
    setSelectedPetToMove(null);
    setInPetMoveMode(false);
    setPositionSelected(false);
  };

  // Handle canvas click or tap (combined for both mobile and desktop)
  const handleCanvasClick = (x, y) => {
    console.log(`Processing click/tap at (${x}, ${y}), current room: ${currentRoom}, move mode: ${inMoveMode || inPetMoveMode}`);
    
    // Ensure x and y are within canvas bounds
    const boundedX = Math.max(0, Math.min(canvasRef.current.width, x));
    const boundedY = Math.max(0, Math.min(canvasRef.current.height, y));
    
    // Handle machine move mode
    if (inMoveMode && movingMachine && showMovePreview) {
      // If position already selected, first reset it before selecting a new position
      if (positionSelected) {
        setPositionSelected(false);
        setMoveConfirmationOpen(false);
      }
      
      // Snap to grid
      const snapToGridX = Math.floor(boundedX / gridSize) * gridSize;
      const snapToGridY = Math.floor(boundedY / gridSize) * gridSize;
      
      console.log(`Snapped position to grid: (${snapToGridX}, ${snapToGridY})`);
      
      setMoveCursorPosition({ x: snapToGridX, y: snapToGridY });
      
      // Check for collisions
      const machineSize = gridSize * 2;
      
      // Enforce boundaries
      const maxX = canvasRef.current.width - machineSize;
      const maxY = canvasRef.current.height - machineSize;
      
      let finalX = snapToGridX;
      let finalY = snapToGridY;
      
      if (finalX < 0) finalX = 0;
      if (finalX > maxX) finalX = maxX;
      if (finalY < 0) finalY = 0;
      if (finalY > maxY) finalY = maxY;
      
      if (finalX !== snapToGridX || finalY !== snapToGridY) {
        console.log(`Adjusted position to (${finalX}, ${finalY}) due to boundaries`);
        setMoveCursorPosition({ x: finalX, y: finalY });
      }
      
      // Check for collisions with other machines IN CURRENT ROOM
      let hasCollision = false;
      
      getMachinesInCurrentRoom().forEach(m => {
        if (m.id !== movingMachine?.id) {
          const dx = Math.abs(m.x - finalX);
          const dy = Math.abs(m.y - finalY);
          if (dx < machineSize && dy < machineSize) {
            hasCollision = true;
          }
        }
      });
      
      if (!hasCollision) {
        // Set position as selected and open confirmation
        setPositionSelected(true);
        setMoveConfirmationOpen(true);
        console.log(`Position selected at (${finalX}, ${finalY}) in room ${currentRoom}`);
      } else {
        addNotification("Cannot place here - collision with another machine", finalX, finalY, "#ff4444");
      }
      
      return;
    }
    
    // Handle pet move mode - UPDATED VERSION
    if (inPetMoveMode && selectedPetToMove && showMovePreview) {
      // If position already selected, first reset it
      if (positionSelected) {
        setPositionSelected(false);
      }
      
      // Snap to grid
      const snapToGridX = Math.floor(boundedX / gridSize) * gridSize;
      const snapToGridY = Math.floor(boundedY / gridSize) * gridSize;
      
      console.log(`Snapped position to grid: (${snapToGridX}, ${snapToGridY})`);
      
      setMoveCursorPosition({ x: snapToGridX, y: snapToGridY });
      
      // Check for collisions
      const petSize = gridSize * 1.5;
      
      // Enforce boundaries
      const maxX = canvasRef.current.width - petSize;
      const maxY = canvasRef.current.height - petSize;
      
      let finalX = snapToGridX;
      let finalY = snapToGridY;
      
      if (finalX < 0) finalX = 0;
      if (finalX > maxX) finalX = maxX;
      if (finalY < 0) finalY = 0;
      if (finalY > maxY) finalY = maxY;
      
      if (finalX !== snapToGridX || finalY !== snapToGridY) {
        console.log(`Adjusted position to (${finalX}, ${finalY}) due to boundaries`);
        setMoveCursorPosition({ x: finalX, y: finalY });
      }
      
      // Set position as selected
      setPositionSelected(true);
      
      // Note: We'll wait for user to confirm the move rather than doing it immediately
      
      return;
    }

    // Check if clicked on machine or pet
    const clickedEntity = getMachineOrPetAtPosition(boundedX, boundedY);

    if (clickedEntity) {
      if (clickedEntity.type === 'machine') {
        // Handle machine click
        autoWalkToMachine(clickedEntity.entity);
      } else if (clickedEntity.type === 'pet') {
        // Handle pet click
        autoWalkToPet(clickedEntity.entity);
      }
    } else {
      // If we get here, the click was on an empty spot
      // Make sure we calculate target within bounds
      const playerSize = gridSize * 2;
      
      // Calculate target position ensuring it's within map boundaries
      const targetPositionX = Math.max(0, Math.min(canvasRef.current.width - playerSize, boundedX - playerSize / 2));
      const targetPositionY = Math.max(0, Math.min(canvasRef.current.height - playerSize, boundedY - playerSize / 2));
      
      console.log(`Setting target position to (${targetPositionX}, ${targetPositionY})`);
      
      setTargetX(targetPositionX);
      setTargetY(targetPositionY);
      setAutoTargetMachine(null);
      setAutoPetTarget(null);
    }
  };

  // Move player based on keyboard/touch input - IMPROVED
  const movePlayer = () => {
    // Skip movement if in move mode
    if (showMovePreview) return;
    
    let newPlayer = { ...player };

    // Keyboard movement
    if (keys.ArrowUp) newPlayer.velocityY -= newPlayer.acceleration;
    if (keys.ArrowDown) newPlayer.velocityY += newPlayer.acceleration;
    if (keys.ArrowLeft) {
      newPlayer.velocityX -= newPlayer.acceleration;
      newPlayer.facingRight = false;
    }
    if (keys.ArrowRight) {
      newPlayer.velocityX += newPlayer.acceleration;
      newPlayer.facingRight = true;
    }

    // Mobile auto-walk
    if (
      !keys.ArrowUp &&
      !keys.ArrowDown &&
      !keys.ArrowLeft &&
      !keys.ArrowRight &&
      isMobile
    ) {
      const dx = targetX - newPlayer.x;
      const dy = targetY - newPlayer.y;
      const distVal = distance(newPlayer.x, newPlayer.y, targetX, targetY);

      if (distVal > 1) {
        const step = Math.min(newPlayer.maxSpeed, distVal);
        newPlayer.x += (dx / distVal) * step;
        newPlayer.y += (dy / distVal) * step;

        // Update facing direction based on movement
        if (dx !== 0) {
          newPlayer.facingRight = dx > 0;
        }
        
        // Apply boundaries after movement
        newPlayer.x = Math.max(0, Math.min(canvasRef.current.width - newPlayer.width, newPlayer.x));
        newPlayer.y = Math.max(0, Math.min(canvasRef.current.height - newPlayer.height, newPlayer.y));
      } else if (autoTargetMachine) {
        if (isPlayerInRangeOf(autoTargetMachine, 'machine')) {
          if (autoTargetMachine.type === 'incubator') {
            handleIncubatorInteraction(autoTargetMachine);
          } else if (autoTargetMachine.type === 'fomoHit') {
            handleFomoHitInteraction(autoTargetMachine);
          } else if (autoTargetMachine.type === 'catLair') {
            handleActivation(autoTargetMachine);
          } else {
            activateMachine(autoTargetMachine);
          }
        }
        setAutoTargetMachine(null);
      } else if (autoPetTarget) {
        // Check if we've reached the pet
        if (isPlayerInRangeOf(autoPetTarget, 'pet')) {
          setSelectedPet(autoPetTarget);
          setShowPetInteractionMenu(true);
        }
        setAutoPetTarget(null);
      }
    } else {
      // Clamp speed
      newPlayer.velocityX = Math.max(
        -newPlayer.maxSpeed,
        Math.min(newPlayer.maxSpeed, newPlayer.velocityX)
      );
      newPlayer.velocityY = Math.max(
        -newPlayer.maxSpeed,
        Math.min(newPlayer.maxSpeed, newPlayer.velocityY)
      );

      // Apply friction
      newPlayer.velocityX *= newPlayer.friction;
      newPlayer.velocityY *= newPlayer.friction;

      // Update position with bounds checking
      newPlayer.x = Math.max(
        0,
        Math.min(canvasRef.current?.width - newPlayer.width || 800 - newPlayer.width, newPlayer.x + newPlayer.velocityX)
      );
      newPlayer.y = Math.max(
        0,
        Math.min(canvasRef.current?.height - newPlayer.height || 600 - newPlayer.height, newPlayer.y + newPlayer.velocityY)
      );
    }

    setPlayer(newPlayer);
  };

  // Game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    const gameLoop = () => {
      if (!canvasRef.current) {
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw background
      drawBackground(ctx);
      // Draw machines
      drawMachines(ctx);
      // Draw pets - add this line
      drawPets(ctx);
      // Draw player (don't draw player in move mode)
      if (!showMovePreview) {
        drawPlayer(ctx);
      }
      // Draw particles and notifications
      drawParticlesAndNotifications(ctx);

      // Move player (skip in move mode)
      if (!showMovePreview) {
        movePlayer();
      }

      // Request next frame
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [
    player,
    machines,
    pets,
    particles,
    notifications,
    keys,
    targetX,
    targetY,
    autoTargetMachine,
    autoPetTarget,
    isLoggedIn,
    isRadixConnected,
    currentRoom,
    showMovePreview,
    moveCursorPosition,
    positionSelected,
    selectedPetToMove,
    inPetMoveMode
  ]);

  // Draw functions
  const drawBackground = (ctx) => {
    // Select the appropriate background based on the current room
    const bgImage = currentRoom === 1 
      ? assetsRef.current.backgroundImage 
      : assetsRef.current.background2Image;
    
    if (bgImage) {
      try {
        ctx.drawImage(
          bgImage,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      } catch (error) {
        console.error('Error drawing background:', error);
        drawFallbackBackground(ctx);
      }
    } else {
      drawFallbackBackground(ctx);
    }
  };

  const drawFallbackBackground = (ctx) => {
    // Different fallback background colors for different rooms
    if (currentRoom === 1) {
      ctx.fillStyle = '#1a1a1a';
    } else {
      ctx.fillStyle = '#262626'; // Slightly lighter for room 2
    }
    
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    ctx.strokeStyle = currentRoom === 1 ? '#5555aa' : '#aa5555'; // Different color for room 2

    // Vertical grid lines
    for (let x = 0; x < canvasRef.current.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasRef.current.height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < canvasRef.current.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasRef.current.width, y);
      ctx.stroke();
    }
    
    // Add room number in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 120px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ROOM ${currentRoom}`, canvasRef.current.width / 2, canvasRef.current.height / 2);
  };

  const drawPlayer = (ctx) => {
    if (!player) return;

    ctx.save();
    try {
      if (assetsRef.current.playerImage) {
        if (player.facingRight) {
          ctx.translate(player.x + player.width, player.y);
          ctx.scale(-1, 1);
          ctx.drawImage(
            assetsRef.current.playerImage,
            0,
            0,
            player.width,
            player.height
          );
        } else {
          ctx.drawImage(
            assetsRef.current.playerImage,
            player.x,
            player.y,
            player.width,
            player.height
          );
        }
      } else {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        ctx.fillStyle = '#fff';
        const eyeSize = 8;
        const eyeY = player.y + player.height / 3;

        if (player.facingRight) {
          ctx.fillRect(player.x + player.width - 25, eyeY, eyeSize, eyeSize);
          ctx.fillRect(player.x + player.width - 45, eyeY, eyeSize, eyeSize);
        } else {
          ctx.fillRect(player.x + 20, eyeY, eyeSize, eyeSize);
          ctx.fillRect(player.x + 40, eyeY, eyeSize, eyeSize);
        }
      }
    } catch (error) {
      console.error('Error drawing player:', error);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    ctx.restore();
  };

  const drawMachines = (ctx) => {
    // Get only machines in the current room
    const currentRoomMachines = getMachinesInCurrentRoom();
    
    if (!currentRoomMachines || currentRoomMachines.length === 0) return;

    const machineSize = gridSize * 2;
    currentRoomMachines.forEach((m) => {
      // Skip the machine that's being moved if it's in this room
      if (movingMachine && m.id === movingMachine.id && currentRoom === movingMachine.room) return;
      
      // Try to get the appropriate image based on machine type
      let img = null;
      
      // Only use the image if it was loaded successfully
      if (m.type === 'catLair' && assetsRef.current.catsLairImage) {
        img = assetsRef.current.catsLairImage;
      } else if (m.type === 'reactor' && assetsRef.current.reactorImage) {
        img = assetsRef.current.reactorImage;
      } else if (m.type === 'amplifier' && assetsRef.current.amplifierImage) {
        img = assetsRef.current.amplifierImage;
      } else if (m.type === 'incubator' && assetsRef.current.incubatorImage) {
        img = assetsRef.current.incubatorImage;
      } else if (m.type === 'fomoHit' && assetsRef.current.fomoHitImage) {
        img = assetsRef.current.fomoHitImage;
      }

      try {
        // If we have an image, draw it, otherwise use fallback
        if (img) {
          ctx.drawImage(img, m.x, m.y, machineSize, machineSize);
        } else {
          // Fallback drawing for when image isn't available
          const machineInfo = machineTypes[m.type] || {baseColor: '#555'};
          const color = machineInfo.baseColor;
          ctx.fillStyle = color;
          ctx.fillRect(m.x, m.y, machineSize, machineSize);

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Different text display for undefined vs known type
          const displayText = machineInfo.name || m.type || 'Machine';
          ctx.fillText(displayText, m.x + machineSize / 2, m.y + machineSize / 2);
          
          // Draw icon if available
          if (machineInfo.icon) {
            ctx.font = 'bold 24px Arial';
            ctx.fillText(machineInfo.icon, m.x + machineSize / 2, m.y + machineSize / 4);
          }
        }
      } catch (error) {
        console.error(`Error drawing machine ${m.type}:`, error);
        
        // Last resort fallback
        const color = machineTypes[m.type]?.baseColor || '#555';
        ctx.fillStyle = color;
        ctx.fillRect(m.x, m.y, machineSize, machineSize);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.type || 'Machine', m.x + machineSize / 2, m.y + machineSize / 2);
      }

      // Level label - IMPROVED with higher z-index/priority
      ctx.save();
      const labelText = `Lvl ${m.level}`;
      const labelWidth = 60;
      const labelHeight = 18;
      const labelX = m.x + machineSize / 2 - labelWidth / 2;
      const labelY = m.y - labelHeight - 2;

      // Draw with a semi-transparent black outline to make it visible against any background
      // First draw a slightly larger black background for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(labelX - 2, labelY - 2, labelWidth + 4, labelHeight + 4);

      // Then draw the actual colored label
      const labelColor = machineTypes[m.type]?.baseColor || '#45a049';
      ctx.fillStyle = labelColor;
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

      // Add a border for better visibility
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

      // Draw text with shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
      ctx.restore();

      // Cooldown bar for catLair/reactor/incubator/fomoHit
      if (m.type !== 'amplifier') {
        const elapsed = Date.now() - (m.lastActivated || 0);
        const cdProgress = Math.max(0, 1 - elapsed / MACHINE_COOLDOWN_MS);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(m.x, m.y + machineSize - 8, machineSize, 6);

        const gradient = ctx.createLinearGradient(
          m.x,
          m.y + machineSize - 8,
          m.x + machineSize * cdProgress,
          m.y + machineSize - 8
        );
        gradient.addColorStop(
          0,
          machineTypes[m.type]?.levelColors[m.level] || '#4CAF50'
        );
        gradient.addColorStop(1, '#fff');
        ctx.fillStyle = gradient;
        ctx.fillRect(m.x, m.y + machineSize - 8, machineSize * cdProgress, 6);
      }

      // If amplifier is offline => show OFFLINE
      if (m.type === 'amplifier' && m.isOffline) {
        ctx.save();
        const offText = 'OFFLINE';
        const offWidth = 60;
        const offHeight = 18;
        const offX = m.x + machineSize / 2 - offWidth / 2;
        const offY = m.y + machineSize + 2;
        ctx.fillStyle = '#c62828';
        ctx.fillRect(offX, offY, offWidth, offHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(offText, offX + offWidth / 2, offY + offHeight / 2);
        ctx.restore();
      }

      // If incubator is offline => show CONNECT WALLET
      if (m.type === 'incubator' && m.isOffline) {
        ctx.save();
        const offText = 'CONNECT WALLET';
        const offWidth = 120;
        const offHeight = 18;
        const offX = m.x + machineSize / 2 - offWidth / 2;
        const offY = m.y + machineSize + 2;
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(offX, offY, offWidth, offHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(offText, offX + offWidth / 2, offY + offHeight / 2);
        ctx.restore();
      }
      
      // If FOMO HIT needs NFT minting => show MINT NFT
      if (m.type === 'fomoHit' && m.lastActivated === 0) {
        ctx.save();
        const mintText = 'MINT NFT';
        const mintWidth = 80;
        const mintHeight = 18;
        const mintX = m.x + machineSize / 2 - mintWidth / 2;
        const mintY = m.y + machineSize + 2;
        ctx.fillStyle = '#FF3D00';
        ctx.fillRect(mintX, mintY, mintWidth, mintHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mintText, mintX + mintWidth / 2, mintY + mintHeight / 2);
        ctx.restore();
      }
      
      // If FOMO HIT has provisional mint in progress => show MINTING...
      if (m.type === 'fomoHit' && m.provisionalMint === 1) {
        ctx.save();
        const mintingText = 'MINTING...';
        const mintingWidth = 90;
        const mintingHeight = 18;
        const mintingX = m.x + machineSize / 2 - mintingWidth / 2;
        const mintingY = m.y + machineSize + 2;
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(mintingX, mintingY, mintingWidth, mintingHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mintingText, mintingX + mintingWidth / 2, mintingY + mintingHeight / 2);
        ctx.restore();
      }
    });
    
    // Draw the machine move preview if in move mode and in the target room
    if (showMovePreview && movingMachine && currentRoom === moveTargetRoom) {
      // Draw a preview of the machine at cursor position
      const { x, y } = moveCursorPosition;
      const machineInfo = machineTypes[movingMachine.type];
      
      // Draw a semi-transparent preview
      ctx.globalAlpha = 0.6;
      
      try {
        // Try to get the appropriate image based on machine type
        let img = null;
        
        if (movingMachine.type === 'catLair' && assetsRef.current.catsLairImage) {
          img = assetsRef.current.catsLairImage;
        } else if (movingMachine.type === 'reactor' && assetsRef.current.reactorImage) {
          img = assetsRef.current.reactorImage;
        } else if (movingMachine.type === 'amplifier' && assetsRef.current.amplifierImage) {
          img = assetsRef.current.amplifierImage;
        } else if (movingMachine.type === 'incubator' && assetsRef.current.incubatorImage) {
          img = assetsRef.current.incubatorImage;
        } else if (movingMachine.type === 'fomoHit' && assetsRef.current.fomoHitImage) {
          img = assetsRef.current.fomoHitImage;
        }

        // Draw the machine preview
        if (img) {
          ctx.drawImage(img, x, y, machineSize, machineSize);
        } else {
          // Fallback drawing
          ctx.fillStyle = machineInfo.baseColor || "#555";
          ctx.fillRect(x, y, machineSize, machineSize);
        }
        
        // Draw border around preview - make it more noticeable with animation
        const time = Date.now() % 2000 / 2000; // Value between 0 and 1
        const borderWidth = 3 + Math.sin(time * Math.PI * 2) * 2; // Width between 1 and 5
        
        // Use different styling for selected position
        if (positionSelected) {
          ctx.strokeStyle = "#00FF00"; // Green border for selected position
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(x, y, machineSize, machineSize);
          
          // Add a "position selected" indicator
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(x, y + machineSize + 5, machineSize, 25);
          ctx.fillStyle = "#00FF00";
          ctx.font = "bold 12px Orbitron";
          ctx.textAlign = "center";
          ctx.fillText("POSITION SELECTED", x + machineSize/2, y + machineSize + 20);
        } else {
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(x, y, machineSize, machineSize);
          
          // Draw cost indicator
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x, y - 30, 100, 25);
          ctx.fillStyle = "#FFD700";
          ctx.font = "bold 14px Orbitron";
          ctx.textAlign = "center";
          ctx.fillText("Cost: 50 TCorvax", x + 50, y - 12);
          
          // Add "Click to place" text
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(x, y + machineSize + 5, machineSize, 25);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 12px Orbitron";
          ctx.textAlign = "center";
          ctx.fillText("CLICK TO PLACE", x + machineSize/2, y + machineSize + 20);
        }
        
      } catch (error) {
        console.error("Error drawing move preview:", error);
      }
      
      ctx.globalAlpha = 1.0; // Reset opacity
      
      // Draw grid overlay when in move mode to help with placement
      if ((inMoveMode || showMovePreview) && !positionSelected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let ix = 0; ix < canvasRef.current.width; ix += gridSize) {
          ctx.beginPath();
          ctx.moveTo(ix, 0);
          ctx.lineTo(ix, canvasRef.current.height);
          ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let iy = 0; iy < canvasRef.current.height; iy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, iy);
          ctx.lineTo(canvasRef.current.width, iy);
          ctx.stroke();
        }
        
        ctx.restore();
      }
    }
    
    // If we're in move mode but in a different room than the machine came from, 
    // show an indicator that we're moving a machine
    if (showMovePreview && movingMachine && currentRoom !== movingMachine.room && currentRoom === moveTargetRoom) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 16px Orbitron";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Moving ${machineTypes[movingMachine.type]?.name || 'Machine'} from Room ${movingMachine.room}`, 
        canvasRef.current.width / 2, 
        30
      );
      ctx.fillText(
        "Click anywhere to place it in this room", 
        canvasRef.current.width / 2, 
        60
      );
      ctx.restore();
    }
  };
  
  // Function to draw pets
  const drawPets = (ctx) => {
    // Get only pets in the current room
    const currentRoomPets = getPetsInCurrentRoom();
    
    if (!currentRoomPets || currentRoomPets.length === 0) return;

    const petSize = gridSize * 1.5; // Make pets slightly smaller than machines
    
    currentRoomPets.forEach((pet) => {
      // Skip the pet that's being moved
      if (selectedPetToMove && pet.id === selectedPetToMove) return;
      
      try {
        // Try to use the cat image
        if (pet.type === 'cat' && assetsRef.current.catImage) {
          ctx.drawImage(assetsRef.current.catImage, pet.x, pet.y, petSize, petSize);
        } else {
          // Fallback drawing if image isn't available
          ctx.fillStyle = '#FFD700'; // Gold color for pets
          ctx.fillRect(pet.x, pet.y, petSize, petSize);

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Cat', pet.x + petSize / 2, pet.y + petSize / 2);
          
          // Draw a cute cat face emoji
          ctx.font = 'bold 24px Arial';
          ctx.fillText('🐱', pet.x + petSize / 2, pet.y + petSize / 4);
        }
        
        // Draw little sparkle effect around pets
        const time = Date.now() % 2000 / 2000; // Value between 0 and 1
        const sparkleSize = 2 + Math.sin(time * Math.PI * 2) * 1; // Size between 1 and 3
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + time * Math.PI * 2;
          const sparkleX = pet.x + petSize / 2 + Math.cos(angle) * (petSize / 2 + 5);
          const sparkleY = pet.y + petSize / 2 + Math.sin(angle) * (petSize / 2 + 5);
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch (error) {
        console.error(`Error drawing pet:`, error);
        
        // Last resort fallback
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(pet.x, pet.y, petSize, petSize);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Cat', pet.x + petSize / 2, pet.y + petSize / 2);
      }
    });
    
    // Draw pet move preview if in pet move mode
    if (showMovePreview && selectedPetToMove && inPetMoveMode) {
      const petToMove = pets.find(p => p.id === selectedPetToMove);
      if (petToMove) {
        // Draw a semi-transparent preview
        ctx.globalAlpha = 0.6;
        
        const { x, y } = moveCursorPosition;
        
        try {
          if (assetsRef.current.catImage) {
            ctx.drawImage(assetsRef.current.catImage, x, y, petSize, petSize);
          } else {
            // Fallback
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x, y, petSize, petSize);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Cat', x + petSize / 2, y + petSize / 2);
          }
          
          // Draw a moving border
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 3 + Math.sin(Date.now() % 1000 / 1000 * Math.PI * 2) * 2;
          ctx.strokeRect(x, y, petSize, petSize);
        } catch (error) {
          console.error("Error drawing pet move preview:", error);
        }
        
        ctx.globalAlpha = 1.0; // Reset opacity
      }
    }
  };

  const drawParticlesAndNotifications = (ctx) => {
    // Draw particles
    particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw notifications
    notifications.forEach((n) => {
      ctx.globalAlpha = n.life;
      ctx.font = 'bold 16px Orbitron';
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(n.text).width;
      const textHeight = 16;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(
        n.x - textWidth / 2 - 8,
        n.y - textHeight - 4,
        textWidth + 16,
        textHeight + 8
      );
      ctx.fillStyle = n.color;
      ctx.fillText(n.text, n.x, n.y);
      ctx.globalAlpha = 1;
    });
  };

  return (
    <div 
      ref={gameContainerRef} 
      className="game-container-wrapper" 
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // Ensure no background color that would create a blue panel
        overflow: 'hidden', // Prevent overflow
        touchAction: 'auto', // Allow default touch actions
      }}
    >
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width={800}
        height={600}
        style={{
          borderRadius: '0 10px 10px 0',
          boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)',
          transition: 'box-shadow 0.3s ease',
          display: isLoggedIn ? 'block' : 'none',
          cursor: showMovePreview ? (positionSelected ? 'default' : 'move') : 'default',
          background: '#1a1a1a', // Dark background, not blue
          border: '1px solid rgba(76, 175, 80, 0.3)',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          zIndex: 1, // Ensure the canvas has a proper z-index value
          position: 'relative', // Ensure the canvas has a proper position
          // Don't set touchAction to 'none' as this can interfere with normal touch behavior
          transformOrigin: 'center', // Ensure scaling happens from the center
          // Apply special styles for mobile
          ...(isMobile ? {
            width: '100%', // Ensure the canvas takes full width on mobile
            height: 'auto', // Maintain aspect ratio
            margin: '0 auto', // Center the canvas
          } : {})
        }}
      />

      {/* Move instructions overlay - FIXED: Added pointerEvents: 'none' to allow clicks to pass through */}
      {moveInstructionsVisible && showMovePreview && !positionSelected && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 215, 0, 0.9)',
          color: 'black',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 1000,
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          animation: 'fadeInOut 5s forwards',
          pointerEvents: 'none' // This is the key fix - allow clicks to pass through
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Click or tap where you want to place the {inPetMoveMode ? 'pet' : 'machine'}!</h3>
          <p style={{ margin: '0' }}>
            Press <strong>ESC</strong> key to cancel the move.
          </p>
          
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; }
              10% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Room Navigation Component */}
      {isLoggedIn && <RoomNavigation />}

      {/* Move confirmation dialog - FIXED FOR MOBILE VISIBILITY */}
      {moveConfirmationOpen && (
        <div style={{
          position: 'fixed', // Changed from 'absolute' to 'fixed'
          ...(isMobile 
            ? {
                // Mobile positioning: centered on screen
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2000,  // Slightly increased z-index to be visible
                maxWidth: '300px'
              } 
            : {
                // Desktop positioning: unchanged
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                maxWidth: '400px'
              }
          ),
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          width: isMobile ? '85%' : '90%',
          textAlign: 'center',
          padding: '15px'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#FFD700',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            Confirm Machine Move
          </h3>
          
          <p style={{ margin: isMobile ? '5px 0' : '8px 0' }}>
            Move {machineTypes[movingMachine?.type]?.name || 'Machine'} {currentRoom !== movingMachine?.room ? `from Room ${movingMachine?.room} to Room ${currentRoom}` : 'to this location'}?
          </p>
          
          <p style={{ 
            fontWeight: 'bold', 
            color: '#FF5722',
            margin: isMobile ? '5px 0' : '8px 0'
          }}>
            Cost: 50 TCorvax
          </p>
          
          <p style={{ margin: isMobile ? '5px 0' : '8px 0' }}>
            Current TCorvax: {tcorvax.toFixed(1)}
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: isMobile ? '10px' : '15px'
          }}>
            <button
              onClick={handleMoveCancel}
              style={{ 
                backgroundColor: '#333', 
                flex: 1, 
                marginRight: '10px',
                padding: isMobile ? '8px 5px' : '12px 10px',
                fontSize: isMobile ? '13px' : '15px',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleMoveConfirm}
              style={{ 
                backgroundColor: tcorvax >= 50 ? '#4CAF50' : '#999', 
                flex: 1,
                opacity: tcorvax >= 50 ? 1 : 0.7,
                padding: isMobile ? '8px 5px' : '12px 10px',
                fontSize: isMobile ? '13px' : '15px',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: tcorvax >= 50 ? 'pointer' : 'not-allowed'
              }}
              disabled={tcorvax < 50}
            >
              {tcorvax >= 50 ? 'Confirm' : 'Not enough'}
            </button>
          </div>
        </div>
      )}

      {/* Pet Move Confirmation - WITH SAME FIX */}
      {inPetMoveMode && selectedPetToMove && positionSelected && (
        <div style={{
          position: 'fixed', // Changed from 'absolute' to 'fixed'
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          zIndex: 2000, // Slightly increased z-index to be visible
          width: isMobile ? '85%' : '90%',
          maxWidth: isMobile ? '300px' : '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>
            Confirm Pet Move
          </h3>
          
          <p style={{ margin: '5px 0' }}>
            Move your cat to this location?
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '15px'
          }}>
            <button
              onClick={() => {
                setPositionSelected(false);
              }}
              style={{ 
                backgroundColor: '#333', 
                flex: 1, 
                marginRight: '10px',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePetMoveConfirm}
              style={{ 
                backgroundColor: '#4CAF50', 
                flex: 1,
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Incubator Widget (Defi Plaza Staking) */}
      {showIncubatorWidget && selectedIncubator && (
        <IncubatorWidget
          machineId={selectedIncubator.id}
          onClose={() => setShowIncubatorWidget(false)}
        />
      )}
      
      {/* FOMO HIT NFT Minter */}
      {showFomoHitMinter && selectedFomoHit && (
        <FomoHitMinter
          machineId={selectedFomoHit.id}
          onClose={() => setShowFomoHitMinter(false)}
        />
      )}
      
      {/* Pet Buy Prompt */}
      {showPetBuyPrompt && selectedCatLair && (
        <PetBuyPrompt
          onClose={() => setShowPetBuyPrompt(false)}
          catLair={selectedCatLair}
        />
      )}
      
      {/* Pet Interaction Menu */}
      {showPetInteractionMenu && selectedPet && (
        <PetInteractionMenu
          pet={selectedPet}
          onClose={() => setShowPetInteractionMenu(false)}
        />
      )}

      {/* Evolving Creatures Minter Modal */}
      {showCreatureMinter && (
        <EvolvingCreatureMinter
          onClose={() => setShowCreatureMinter(false)}
        />
      )}
    </div>
  );
};

export default GameCanvas;
