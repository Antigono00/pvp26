// src/components/ItemsViewer.jsx
import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const ItemsViewer = ({ onClose }) => {
    // Context access
    const {
        isMobile,
        formatResource,
        addNotification
    } = useContext(GameContext);

    // From the RadixConnect context
    const {
        connected,
        accounts,
        updateAccountSharing
    } = useRadixConnect();

    // Component states
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('checking');
    const [showConnectionDetails, setShowConnectionDetails] = useState(false);
    const [tools, setTools] = useState([]);
    const [spells, setSpells] = useState([]);
    const [activeTab, setActiveTab] = useState('tools'); // 'tools' or 'spells'
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [error, setError] = useState(null);
    const [showRefreshButton, setShowRefreshButton] = useState(false);
    const [lastLoadTime, setLastLoadTime] = useState(0);
    const [loadingCount, setLoadingCount] = useState(0);
    const loadLockRef = useRef(false);

    // Check connection status
    useEffect(() => {
        if (!connected) {
            setConnectionStatus('disconnected');
            setIsLoading(false);
        } else if (!accounts || accounts.length === 0) {
            setConnectionStatus('connected-no-accounts');
            setIsLoading(false);
        } else {
            setConnectionStatus('ready');
            // Only load items if we have an account
            loadItems();
        }
    }, [connected, accounts]);

    // Load items from the API
    const loadItems = useCallback(async (force = false) => {
        if (!connected || !accounts || accounts.length === 0) return;
        
        // Implement a lock to prevent concurrent loads
        if (loadLockRef.current && !force) {
            console.log("Load items locked - skipping duplicate request");
            return;
        }
        
        // Add rate limiting - prevent loading more than once every 3 seconds
        const now = Date.now();
        if (!force && now - lastLoadTime < 3000 && (tools.length > 0 || spells.length > 0)) {
            console.log("Rate limiting items load - too soon since last load");
            return;
        }
        
        // Activate lock
        loadLockRef.current = true;
        
        // Increment loading count so UI knows we're making a request
        setLoadingCount(prev => prev + 1);
        setIsLoading(true);
        setError(null);
        setLastLoadTime(now);
        
        try {
            const accountAddress = accounts[0].address;
            
            // Use our API endpoint to get all user items
            const response = await fetch('/api/getUserItems', {
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
            console.log("Items data:", data);
            
            if (data.tools) {
                setTools(data.tools);
                
                // If we have tools, select the first one by default if none selected
                if (data.tools.length > 0 && !selectedItemId && activeTab === 'tools') {
                    setSelectedItemId(data.tools[0].id);
                }
            }
            
            if (data.spells) {
                setSpells(data.spells);
                
                // If we have spells and no tools, select the first spell by default
                if (data.spells.length > 0 && data.tools.length === 0 && !selectedItemId) {
                    setActiveTab('spells');
                    setSelectedItemId(data.spells[0].id);
                }
            }
            
            // Show refresh button after first load
            setShowRefreshButton(true);
        } catch (error) {
            console.error("Error loading items:", error);
            setError(`Failed to load items: ${error.message}`);
        } finally {
            setIsLoading(false);
            setLoadingCount(prev => prev - 1);
            // Release lock after a short delay to prevent immediate subsequent requests
            setTimeout(() => {
                loadLockRef.current = false;
            }, 500);
        }
    }, [connected, accounts, lastLoadTime, tools, spells, selectedItemId, activeTab]);

    // Get the selected item
    const selectedItem = 
        activeTab === 'tools' 
            ? tools.find(t => t.id === selectedItemId) 
            : spells.find(s => s.id === selectedItemId);

    // Toggle connection details panel
    const toggleConnectionDetails = () => {
        setShowConnectionDetails(prev => !prev);
    };

    // Get item effect description
    const getEffectDescription = (effectType) => {
        switch (effectType) {
            case 'Energize':
                return 'Increases energy generation';
            case 'Empower':
                return 'Boosts strength attributes';
            case 'Enchant':
                return 'Enhances magical abilities';
            case 'Fortify':
                return 'Improves stamina and resistance';
            case 'Hasten':
                return 'Increases speed and agility';
            case 'Surge':
                return 'Rapidly increases effect but burns out quickly';
            case 'Shield':
                return 'Absorbs negative effects';
            case 'Echo':
                return 'Repeats the action over time';
            case 'Drain':
                return 'Converts one resource to another';
            case 'Charge':
                return 'Builds up power slowly for greater effect';
            default:
                return 'Unknown effect';
        }
    };

    // Get stat type description 
    const getStatDescription = (statType) => {
        switch (statType) {
            case 'energy':
                return 'Affects energy generation and capacity';
            case 'strength':
                return 'Affects physical power and damage';
            case 'magic':
                return 'Affects magical abilities and spellcasting';
            case 'stamina':
                return 'Affects health, durability, and resistance';
            case 'speed':
                return 'Affects movement speed and action rate';
            default:
                return 'Unknown stat type';
        }
    };

    return (
        <>
            {/* Overlay background */}
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 9998,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                onClick={onClose}
            />
            
            {/* Modal Dialog */}
            <div 
                style={{ 
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    maxWidth: '900px',
                    width: isMobile ? '95%' : '90%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#222',
                    borderRadius: '10px',
                    boxShadow: '0 5px 25px rgba(0, 0, 0, 0.5)',
                    overflowY: 'auto',
                    touchAction: 'pan-y'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with title and buttons */}
                <div style={{ 
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#222',
                    padding: '15px',
                    borderRadius: '10px 10px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #444',
                    zIndex: 10,
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h2 style={{ margin: 0, color: '#4CAF50' }}>Your Tools & Spells</h2>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Refresh button */}
                        {showRefreshButton && (
                            <button
                                onClick={() => loadItems(true)} // Force refresh
                                disabled={isLoading}
                                style={{
                                    backgroundColor: isLoading ? '#555' : '#2196F3',
                                    padding: '8px 16px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isLoading ? 'Loading...' : 'Refresh'}
                                {isLoading && (
                                    <div
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            border: '2px solid #fff',
                                            borderTop: '2px solid transparent',
                                            animation: 'spin 1s linear infinite'
                                        }}
                                    />
                                )}
                            </button>
                        )}
                        
                        {/* Close button */}
                        <button 
                            onClick={onClose}
                            style={{
                                backgroundColor: '#333',
                                padding: '8px 16px',
                                borderRadius: '5px',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div style={{ 
                    overflowY: 'auto',
                    padding: '15px',
                    flex: '1',
                    '-webkit-overflow-scrolling': 'touch' // Better scrolling on iOS
                }}>
                    {/* Connection status indicator */}
                    <div 
                        style={{ 
                            display: 'inline-block',
                            padding: '5px 10px',
                            marginBottom: '15px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: connectionStatus === 'ready' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            color: connectionStatus === 'ready' ? '#4CAF50' : '#FF9800',
                            cursor: 'pointer'
                        }}
                        onClick={toggleConnectionDetails}
                    >
                        {connectionStatus === 'ready' ? 'Connected' : 'Connection Issues'} {showConnectionDetails ? '▲' : '▼'}
                    </div>

                    {/* Connection details panel */}
                    {showConnectionDetails && (
                        <div
                            style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                padding: '10px',
                                borderRadius: '5px',
                                marginBottom: '15px',
                                fontSize: '0.8em',
                                color: '#EEE'
                            }}
                        >
                            <h4 style={{ margin: '0 0 10px 0' }}>Connection Details</h4>
                            
                            <div>
                                <p style={{ fontSize: '11px', margin: '2px 0' }}>
                                    <strong>Radix Connected:</strong> {connected ? 'Yes' : 'No'}
                                </p>
                                <p style={{ fontSize: '11px', margin: '2px 0' }}>
                                    <strong>Accounts Shared:</strong> {accounts?.length > 0 ? 'Yes' : 'No'}
                                </p>
                                <p style={{ fontSize: '11px', margin: '2px 0' }}>
                                    <strong>Account Address:</strong> {accounts?.[0]?.address || 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* A) Wallet is disconnected */}
                    {connectionStatus === 'disconnected' && (
                        <div
                            style={{
                                background: 'rgba(255, 87, 34, 0.2)',
                                padding: '20px',
                                borderRadius: '10px',
                                marginBottom: '20px',
                                color: '#FF5722'
                            }}
                        >
                            <p><strong>Your Radix wallet is not connected</strong></p>
                            <p>Please connect your Radix wallet using the top-right button to view your items.</p>
                        </div>
                    )}

                    {/* B) Wallet is connected but no account shared */}
                    {connectionStatus === 'connected-no-accounts' && (
                        <div
                            style={{
                                background: 'rgba(255, 193, 7, 0.2)',
                                padding: '20px',
                                borderRadius: '10px',
                                marginBottom: '20px',
                                color: '#FFC107'
                            }}
                        >
                            <p><strong>Wallet connected but no account shared</strong></p>
                            <p>Please share an account to view your Tools & Spells.</p>
                            <button
                                onClick={updateAccountSharing}
                                style={{
                                    backgroundColor: '#FFC107',
                                    color: 'black',
                                    marginTop: '10px'
                                }}
                            >
                                Share an account
                            </button>
                        </div>
                    )}

                    {/* C) Loading state */}
                    {isLoading && connectionStatus === 'ready' && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            padding: '40px',
                            gap: '20px'
                        }}>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '4px solid #4CAF50',
                                    borderTop: '4px solid transparent',
                                    animation: 'spin 1s linear infinite'
                                }}
                            />
                            <p>Loading your Tools & Spells...</p>
                            
                            <style>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    )}

                    {/* D) Error state */}
                    {error && !isLoading && (
                        <div style={{
                            background: 'rgba(244, 67, 54, 0.2)',
                            padding: '20px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            color: '#F44336'
                        }}>
                            <p><strong>Error loading items</strong></p>
                            <p>{error}</p>
                            <button
                                onClick={() => loadItems(true)} // Force refresh on error
                                style={{
                                    backgroundColor: '#F44336',
                                    color: 'white',
                                    marginTop: '10px'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* E) No items found */}
                    {!isLoading && !error && connectionStatus === 'ready' && tools.length === 0 && spells.length === 0 && (
                        <div style={{
                            background: 'rgba(255, 193, 7, 0.2)',
                            padding: '20px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: '#FFC107', marginBottom: '15px' }}>No Items Found</h3>
                            <p>You don't have any Tools or Spells in your account yet.</p>
                            <p>You can get Tools and Spells by minting Evolving Creatures.</p>
                            <button
                                style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    marginTop: '20px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    onClose();
                                    // This should trigger the evolving creature minter
                                    document.querySelector('.creature-mint-button')?.click();
                                }}
                            >
                                Mint Your First Creature
                            </button>
                        </div>
                    )}

                    {/* F) Items list and details view */}
                    {!isLoading && !error && connectionStatus === 'ready' && (tools.length > 0 || spells.length > 0) && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            {/* Tabs for Tools and Spells */}
                            <div style={{
                                display: 'flex',
                                borderBottom: '1px solid #444',
                                marginBottom: '10px'
                            }}>
                                <button
                                    style={{
                                        backgroundColor: activeTab === 'tools' ? '#333' : 'transparent',
                                        color: activeTab === 'tools' ? '#fff' : '#aaa',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderTopLeftRadius: '5px',
                                        borderTopRightRadius: '5px',
                                        cursor: 'pointer',
                                        borderBottom: activeTab === 'tools' ? '2px solid #4CAF50' : 'none'
                                    }}
                                    onClick={() => {
                                        setActiveTab('tools');
                                        if (tools.length > 0) {
                                            setSelectedItemId(tools[0].id);
                                        }
                                    }}
                                >
                                    Tools ({tools.length})
                                </button>
                                <button
                                    style={{
                                        backgroundColor: activeTab === 'spells' ? '#333' : 'transparent',
                                        color: activeTab === 'spells' ? '#fff' : '#aaa',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderTopLeftRadius: '5px',
                                        borderTopRightRadius: '5px',
                                        cursor: 'pointer',
                                        borderBottom: activeTab === 'spells' ? '2px solid #9C27B0' : 'none'
                                    }}
                                    onClick={() => {
                                        setActiveTab('spells');
                                        if (spells.length > 0) {
                                            setSelectedItemId(spells[0].id);
                                        }
                                    }}
                                >
                                    Spells ({spells.length})
                                </button>
                            </div>
                            
                            {/* Content based on active tab */}
                            <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: '20px'
                            }}>
                                {/* Left panel - Item thumbnails */}
                                <div style={{
                                    width: isMobile ? '100%' : '30%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    overflowY: 'auto',
                                    maxHeight: isMobile ? '150px' : '500px',
                                    display: 'flex',
                                    flexDirection: isMobile ? 'row' : 'column',
                                    gap: '10px',
                                    flexWrap: isMobile ? 'nowrap' : 'normal',
                                    overflow: isMobile ? 'auto hidden' : 'auto'
                                }}>
                                    {activeTab === 'tools' ? (
                                        tools.length > 0 ? (
                                            tools.map(tool => (
                                                <div
                                                    key={tool.id}
                                                    style={{
                                                        backgroundColor: selectedItemId === tool.id ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                                        borderRadius: '6px',
                                                        padding: '10px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        border: `1px solid ${selectedItemId === tool.id ? '#4CAF50' : 'transparent'}`,
                                                        minWidth: isMobile ? '150px' : 'auto'
                                                    }}
                                                    onClick={() => setSelectedItemId(tool.id)}
                                                >
                                                    <img
                                                        src={tool.image_url}
                                                        alt={tool.name}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '4px',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <div>
                                                        <p style={{ 
                                                            margin: '0 0 4px 0', 
                                                            fontWeight: 'bold',
                                                            fontSize: '14px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '150px'
                                                        }}>
                                                            {tool.name}
                                                        </p>
                                                        <div style={{ 
                                                            display: 'flex',
                                                            gap: '5px',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                backgroundColor: '#4CAF50',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                color: '#000',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                Tool
                                                            </span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                color: '#fff'
                                                            }}>
                                                                {tool.tool_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                                <p>No tools found</p>
                                            </div>
                                        )
                                    ) : (
                                        spells.length > 0 ? (
                                            spells.map(spell => (
                                                <div
                                                    key={spell.id}
                                                    style={{
                                                        backgroundColor: selectedItemId === spell.id ? 'rgba(156, 39, 176, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                                        borderRadius: '6px',
                                                        padding: '10px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        border: `1px solid ${selectedItemId === spell.id ? '#9C27B0' : 'transparent'}`,
                                                        minWidth: isMobile ? '150px' : 'auto'
                                                    }}
                                                    onClick={() => setSelectedItemId(spell.id)}
                                                >
                                                    <img
                                                        src={spell.image_url}
                                                        alt={spell.name}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '4px',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <div>
                                                        <p style={{ 
                                                            margin: '0 0 4px 0', 
                                                            fontWeight: 'bold',
                                                            fontSize: '14px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '150px'
                                                        }}>
                                                            {spell.name}
                                                        </p>
                                                        <div style={{ 
                                                            display: 'flex',
                                                            gap: '5px',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                backgroundColor: '#9C27B0',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                color: '#fff',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                Spell
                                                            </span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                color: '#fff'
                                                            }}>
                                                                {spell.spell_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                                <p>No spells found</p>
                                            </div>
                                        )
                                    )}
                                </div>
                                
                                {/* Right panel - Selected item details */}
                                <div style={{
                                    width: isMobile ? '100%' : '70%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '8px',
                                    padding: '15px'
                                }}>
                                    {selectedItem ? (
                                        <div>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: isMobile ? 'column' : 'row',
                                                gap: '20px',
                                                alignItems: isMobile ? 'center' : 'flex-start'
                                            }}>
                                                {/* Item image */}
                                                <div style={{
                                                    width: isMobile ? '180px' : '220px',
                                                    height: isMobile ? '180px' : '220px',
                                                    border: `2px solid ${selectedItem.type === 'tool' ? '#4CAF50' : '#9C27B0'}`,
                                                    borderRadius: '8px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <img
                                                        src={selectedItem.image_url}
                                                        alt={selectedItem.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Item info */}
                                                <div style={{
                                                    flex: '1',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px'
                                                }}>
                                                    <h3 style={{ 
                                                        margin: '0', 
                                                        color: selectedItem.type === 'tool' ? '#4CAF50' : '#9C27B0'
                                                    }}>
                                                        {selectedItem.name}
                                                    </h3>
                                                    
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '10px',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <span style={{
                                                            backgroundColor: selectedItem.type === 'tool' ? '#4CAF50' : '#9C27B0',
                                                            color: selectedItem.type === 'tool' ? '#000' : '#fff',
                                                            padding: '5px 10px',
                                                            borderRadius: '5px',
                                                            fontWeight: 'bold',
                                                            fontSize: '12px'
                                                        }}>
                                                            {selectedItem.type === 'tool' ? 'Tool' : 'Spell'}
                                                        </span>
                                                        
                                                        <span style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            color: '#fff',
                                                            padding: '5px 10px',
                                                            borderRadius: '5px',
                                                            fontSize: '12px'
                                                        }}>
                                                            {selectedItem.type === 'tool' ? selectedItem.tool_type : selectedItem.spell_type}
                                                        </span>
                                                        
                                                        <span style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            color: '#fff',
                                                            padding: '5px 10px',
                                                            borderRadius: '5px',
                                                            fontSize: '12px'
                                                        }}>
                                                            {selectedItem.type === 'tool' ? selectedItem.tool_effect : selectedItem.spell_effect}
                                                        </span>
                                                    </div>
                                                    
                                                    <div style={{
                                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        marginTop: '10px'
                                                    }}>
                                                        <h4 style={{ margin: '0 0 10px 0' }}>Item Properties</h4>
                                                        
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '10px'
                                                        }}>
                                                            <div style={{
                                                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                                padding: '10px',
                                                                borderRadius: '5px'
                                                            }}>
                                                                <strong>Affects:</strong> {selectedItem.type === 'tool' ? selectedItem.tool_type : selectedItem.spell_type}
                                                            </div>
                                                            
                                                            <div style={{
                                                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                                padding: '10px',
                                                                borderRadius: '5px'
                                                            }}>
                                                                <strong>Effect:</strong> {selectedItem.type === 'tool' ? selectedItem.tool_effect : selectedItem.spell_effect}
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{
                                                            marginTop: '15px',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                            padding: '10px',
                                                            borderRadius: '5px'
                                                        }}>
                                                            <strong>Description:</strong> {
                                                                selectedItem.type === 'tool' 
                                                                    ? `This tool ${getEffectDescription(selectedItem.tool_effect).toLowerCase()} and affects ${getStatDescription(selectedItem.tool_type).toLowerCase()}.`
                                                                    : `This spell ${getEffectDescription(selectedItem.spell_effect).toLowerCase()} and affects ${getStatDescription(selectedItem.spell_type).toLowerCase()}.`
                                                            }
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{
                                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        marginTop: '10px'
                                                    }}>
                                                        <h4 style={{ margin: '0 0 10px 0' }}>Usage Information</h4>
                                                        
                                                        <p style={{ margin: '0' }}>
                                                            {selectedItem.type === 'tool' 
                                                                ? 'Tools can be used to enhance your creature\'s abilities and boost their stats during upgrades and evolutions.'
                                                                : 'Spells can be cast on your creatures to temporarily boost their abilities or provide special effects during gameplay.'
                                                            }
                                                        </p>
                                                    </div>
                                                    
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#aaa',
                                                        marginTop: '10px',
                                                        wordBreak: 'break-all'
                                                    }}>
                                                        Item ID: {selectedItem.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '300px'
                                        }}>
                                            <p>
                                                {activeTab === 'tools' && tools.length > 0 
                                                    ? 'Select a tool to view details'
                                                    : activeTab === 'spells' && spells.length > 0
                                                        ? 'Select a spell to view details'
                                                        : activeTab === 'tools'
                                                            ? 'No tools found'
                                                            : 'No spells found'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default ItemsViewer;
