// src/components/IncubatorWidget.jsx
import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const IncubatorWidget = ({ machineId, onClose }) => {
  // From your GameContext
  const {
    machines,
    activateMachine,
    loadGameFromServer,
    upgradeMachine,
    calculateMachineCost,
    canAfford,
    formatResource,
    tcorvax,
    catNips,
    energy,
    eggs
  } = useContext(GameContext);

  // From the RadixConnect context
  const {
    connected,
    accounts,
    selectedAccount,
    updateAccountSharing
  } = useRadixConnect();

  // Find the Incubator machine instance
  const machine = machines.find((m) => m.id === machineId);

  // Local UI states
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [lastActivationResult, setLastActivationResult] = useState(null);
  const [activationData, setActivationData] = useState(null);
  const [showStakingInfo, setShowStakingInfo] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);

  // Calculate upgrade cost if applicable
  const upgradeCost = machine?.level < 2 
    ? calculateMachineCost('incubator') 
    : null;
  
  const canUpgrade = upgradeCost ? canAfford(upgradeCost) : false;

  // 1) Check overall connection status
  useEffect(() => {
    if (!connected) {
      setConnectionStatus('disconnected');
    } else if (!accounts || accounts.length === 0) {
      setConnectionStatus('connected-no-accounts');
    } else {
      setConnectionStatus('ready');
    }
    setIsLoading(false);
  }, [connected, accounts]);

  // 2) Activate Incubator with response capture
  const handleActivate = () => {
    if (machine && connectionStatus === 'ready') {
      setIsLoading(true);
      
      // Create a simplified activation function that doesn't rely on window.axios
      const activateIncubator = async () => {
        try {
          // Prepare the request directly with the account address
          const requestData = {
            machineId: machine.id
          };
          
          // Only add account address when connected with accounts
          if (connected && accounts && accounts.length > 0) {
            requestData.accountAddress = accounts[0].address;
            console.log('Including account address in request:', accounts[0].address);
          }
          
          // Make the activation request directly with fetch
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
          
          // Parse the response
          const data = await response.json();
          console.log('Activation response:', data);
          
          // Important: Force reload game state to update HUD immediately
          loadGameFromServer();
          
          // Set the activation data from our direct response
          setActivationData(data);
          setLastActivationResult({
            success: true,
            message: `Incubator activated successfully!`,
            data: data
          });
        } catch (error) {
          console.error('Activation error:', error);
          setLastActivationResult({
            success: false,
            message: error.message || 'Error activating incubator. Please try again.'
          });
        }
        setIsLoading(false);
      };
      
      // Execute our activation function
      activateIncubator();
    } else {
      onClose();
    }
  };

  // 3) Handle incubator upgrade
  const handleUpgrade = () => {
    if (machine && machine.level < 2) {
      setShowUpgradeConfirm(true);
    }
  };

  // 4) Confirm upgrade
  const confirmUpgrade = async () => {
    setIsLoading(true);
    try {
      await upgradeMachine(machine.id);
      // Reload game state to update the machine level
      await loadGameFromServer();
      setShowUpgradeConfirm(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error upgrading incubator:', error);
      setIsLoading(false);
    }
  };

  // 5) Toggle connection details panel
  const toggleConnectionDetails = () => {
    setShowConnectionDetails(prev => !prev);
  };

  // 6) Toggle staking info panel
  const toggleStakingInfo = () => {
    setShowStakingInfo(prev => !prev);
  };

  // 7) Close after successful activation
  const handleCloseAfterActivation = () => {
    onClose();
  };

  // 8) Reset to try again after failed activation
  const handleTryAgain = () => {
    setLastActivationResult(null);
    setActivationData(null);
  };

  // If machine not found, return nothing
  if (!machine) return null;

  return (
    <div className="welcome-message" style={{ maxWidth: '800px' }}>
      <h1>Incubator Staking</h1>

      {/* Connection status indicator */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px',
          padding: '5px 10px',
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

      {/* Machine level indicator */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '10px',
          padding: '5px 10px',
          borderRadius: '12px',
          fontSize: '14px',
          backgroundColor: machine.level >= 2 ? 'rgba(230, 74, 25, 0.2)' : 'rgba(255, 87, 34, 0.2)',
          color: machine.level >= 2 ? '#E64A19' : '#FF5722',
          fontWeight: 'bold'
        }}
      >
        Level {machine.level}{machine.level >= 2 ? ' (MAX)' : ''}
      </div>

      {/* A) If wallet is disconnected */}
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
          <p>Please connect your Radix wallet using the top-right button.</p>
        </div>
      )}

      {/* B) If wallet is connected but no account shared */}
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
          <p>Please share an account to use the Incubator.</p>
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

      {/* C) If wallet is fully ready (connected + accounts) and not loading or showing result */}
      {connectionStatus === 'ready' && !isLoading && !lastActivationResult && (
        <div
          style={{
            background: 'rgba(76, 175, 80, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}
        >
          <p>
            Connected to account:{' '}
            <strong>
              {selectedAccount?.label ||
                (selectedAccount?.address
                  ? selectedAccount.address.slice(0, 10) + '...'
                  : accounts[0]?.address
                  ? accounts[0].address.slice(0, 10) + '...'
                  : 'N/A')}
            </strong>
          </p>
          
          <div style={{ 
            background: 'rgba(255, 87, 34, 0.1)', 
            padding: '15px', 
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#FF5722', margin: '0 0 15px 0' }}>About sCVX Staking</h2>
            <p>The Incubator generates TCorvax and Eggs rewards based on your sCVX holdings.</p>
            
            {/* Show level 1 benefits */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '10px', 
              borderRadius: '8px',
              margin: '10px 0',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#FF5722' }}>
                Level 1 Benefits:
              </p>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>+1 TCorvax for every 100 sCVX (Max 10)</li>
                <li>+1 Egg for every 500 sCVX</li>
              </ul>
            </div>
            
            {/* Show level 2 benefits, if current level is 1 */}
            {machine.level === 1 && (
              <div style={{ 
                background: 'rgba(230, 74, 25, 0.2)', 
                padding: '10px', 
                borderRadius: '8px',
                margin: '10px 0',
                textAlign: 'left'
              }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#E64A19' }}>
                  Level 2 Benefits (Upgrade available):
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>All Level 1 benefits</li>
                  <li>+1 Additional TCorvax for every 1000 sCVX (No maximum)</li>
                </ul>
              </div>
            )}
            
            {/* If already level 2, show current benefits */}
            {machine.level === 2 && (
              <div style={{ 
                background: 'rgba(76, 175, 80, 0.2)', 
                padding: '10px', 
                borderRadius: '8px',
                margin: '10px 0',
                textAlign: 'left'
              }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#4CAF50' }}>
                  Maximum Level Unlocked!
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>+1 TCorvax for every 100 sCVX (Max 10)</li>
                  <li>+1 Additional TCorvax for every 1000 sCVX (No maximum)</li>
                  <li>+1 Egg for every 500 sCVX</li>
                </ul>
              </div>
            )}
            
            <p style={{ fontWeight: 'bold' }}>Don't have sCVX yet?</p>
            <button
              onClick={toggleStakingInfo}
              style={{
                backgroundColor: '#FF5722',
                color: 'white',
                marginTop: '10px',
                padding: '5px 15px',
                width: 'auto',
                display: 'inline-block'
              }}
            >
              Learn How to Stake {showStakingInfo ? '▲' : '▼'}
            </button>
          </div>
          
          {/* New staking information panel */}
          {showStakingInfo && (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '15px', 
              borderRadius: '8px',
              margin: '0 0 20px 0',
              fontSize: '14px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#FF5722' }}>How to Get sCVX Tokens:</h3>
              
              <ol style={{ padding: '0 0 0 20px', margin: '0 0 15px 0', textAlign: 'left' }}>
                <li style={{ margin: '0 0 10px 0' }}>
                  Visit <a href="https://corvax.meme" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5722', fontWeight: 'bold' }}>corvax.meme</a> with your Radix wallet connected
                </li>
                <li style={{ margin: '0 0 10px 0' }}>Click "Connect Wallet" if you haven't already</li>
                <li style={{ margin: '0 0 10px 0' }}>Navigate to the "Staking" section</li>
                <li style={{ margin: '0 0 10px 0' }}>Input the amount of CVX you want to stake</li>
                <li style={{ margin: '0 0 10px 0' }}>Confirm the transaction in your Radix wallet</li>
                <li style={{ margin: '0 0 10px 0' }}>Once complete, you'll receive sCVX tokens representing your stake</li>
              </ol>
              
              <div style={{ 
                background: 'rgba(255, 87, 34, 0.2)', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0', fontWeight: 'bold' }}>
                  <a href="https://corvax.meme" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5722', textDecoration: 'none' }}>
                    Click here to go to corvax.meme and start staking
                  </a>
                </p>
              </div>
              
              <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', opacity: '0.7', textAlign: 'center' }}>
                Note: You'll need to own some CVX tokens on the Radix network first.
              </p>
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '20px 0',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', margin: '0 0 5px 0', opacity: 0.7 }}>Activation Rule:</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', color: '#FF5722' }}>
                Level 1: 1 TCorvax per 100 sCVX (Max 10)
              </p>
              {machine.level >= 2 && (
                <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#E64A19' }}>
                  Level 2: +1 TCorvax per 1000 sCVX (No Max)
                </p>
              )}
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#FFD700' }}>
                All Levels: 1 Egg per 500 sCVX
              </p>
            </div>
          </div>

          {/* Show upgrade button if level 1 */}
          {machine.level === 1 && (
            <div style={{
              background: 'rgba(230, 74, 25, 0.2)',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '15px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#E64A19' }}>Upgrade to Level 2</h3>
              
              <p>Unlock unlimited bonus TCorvax rewards by upgrading your Incubator to Level 2!</p>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '10px',
                borderRadius: '5px',
                margin: '10px 0',
                textAlign: 'left',
                fontSize: '14px'
              }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Upgrade Cost:</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>TCorvax:</span>
                  <span style={{ 
                    color: tcorvax >= (upgradeCost?.tcorvax || 0) ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }}>
                    {upgradeCost?.tcorvax || 0} (You have: {formatResource(tcorvax)})
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>CatNips:</span>
                  <span style={{ 
                    color: catNips >= (upgradeCost?.catNips || 0) ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }}>
                    {upgradeCost?.catNips || 0} (You have: {formatResource(catNips)})
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>Energy:</span>
                  <span style={{ 
                    color: energy >= (upgradeCost?.energy || 0) ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }}>
                    {upgradeCost?.energy || 0} (You have: {formatResource(energy)})
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={!canUpgrade}
                style={{
                  backgroundColor: canUpgrade ? '#E64A19' : '#999',
                  opacity: canUpgrade ? 1 : 0.7,
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  marginTop: '10px',
                  cursor: canUpgrade ? 'pointer' : 'not-allowed'
                }}
              >
                {canUpgrade ? 'Upgrade to Level 2' : 'Not Enough Resources'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* D) If we are still loading */}
      {isLoading && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid #4CAF50',
                borderTop: '2px solid transparent',
                animation: 'spin 1s linear infinite',
                marginRight: '15px'
              }}
            />
            <p style={{ margin: 0 }}>Processing your request...</p>
          </div>
          <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
            {showUpgradeConfirm 
              ? 'Applying upgrade to your Incubator...' 
              : 'Checking your sCVX balance and calculating rewards...'}
          </p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {/* E) Show activation result */}
      {lastActivationResult && (
        <div
          style={{
            background: lastActivationResult.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <h3 style={{ 
            color: lastActivationResult.success ? '#4CAF50' : '#F44336',
            margin: '0 0 15px 0'
          }}>
            {lastActivationResult.success ? 'Success!' : 'Error'}
          </h3>
          
          <p style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
            {lastActivationResult.message}
          </p>
          
          {lastActivationResult.success && activationData && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.3)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Activation Details:</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span>Your sCVX Balance:</span>
                <strong>{activationData.stakedCVX?.toFixed(4) || '0'} sCVX</strong>
              </div>
              
              {/* Show base rewards */}
              {activationData.baseReward > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>Base Rewards (1 per 100 sCVX):</span>
                  <strong style={{ color: '#FF5722' }}>
                    +{activationData.baseReward || '0'} TCorvax
                  </strong>
                </div>
              )}
              
              {/* Show bonus rewards if level 2 */}
              {machine.level >= 2 && activationData.bonusReward > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>Level Bonus (1 per 1000 sCVX):</span>
                  <strong style={{ color: '#E64A19' }}>
                    +{activationData.bonusReward || '0'} TCorvax
                  </strong>
                </div>
              )}
              
              {/* Show eggs rewards */}
              {activationData.eggsReward > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>Eggs (1 per 500 sCVX):</span>
                  <strong style={{ color: '#FFD700' }}>
                    +{activationData.eggsReward || '0'} Eggs
                  </strong>
                </div>
              )}
              
              {/* Show total rewards */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                margin: '10px 0 5px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                paddingTop: '10px',
                fontWeight: 'bold'
              }}>
                <span>Total TCorvax Earned:</span>
                <strong style={{ color: '#4CAF50' }}>
                  +{(activationData.baseReward || 0) + (activationData.bonusReward || 0)} TCorvax
                </strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span>New TCorvax Balance:</span>
                <strong>{activationData.updatedResources?.tcorvax?.toFixed(1) || '0'}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span>New Eggs Balance:</span>
                <strong>{activationData.updatedResources?.eggs?.toFixed(1) || '0'}</strong>
              </div>
              
              <p style={{ fontSize: '12px', margin: '15px 0 0 0', opacity: 0.7 }}>
                You can activate the Incubator again after the cooldown period.
              </p>
            </div>
          )}
          
          {lastActivationResult.success && activationData && activationData.stakedCVX === 0 && (
            <div style={{ 
              background: 'rgba(255, 193, 7, 0.2)', 
              padding: '15px', 
              borderRadius: '8px',
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                No sCVX detected in your account!
              </p>
              <p>
                Want to earn higher rewards? Visit <a href="https://corvax.meme" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5722', fontWeight: 'bold' }}>corvax.meme</a> to stake your CVX and earn sCVX tokens.
              </p>
              <button
                onClick={() => window.open('https://corvax.meme', '_blank')}
                style={{
                  backgroundColor: '#FF5722',
                  color: 'white',
                  marginTop: '10px',
                  padding: '5px 15px',
                  width: 'auto',
                  display: 'inline-block'
                }}
              >
                Go to corvax.meme
              </button>
            </div>
          )}
          
          <button
            onClick={lastActivationResult.success ? handleCloseAfterActivation : handleTryAgain}
            style={{
              backgroundColor: lastActivationResult.success ? '#4CAF50' : '#F44336',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {lastActivationResult.success ? 'Close' : 'Try Again'}
          </button>
        </div>
      )}
      
      {/* Upgrade confirmation dialog */}
      {showUpgradeConfirm && !isLoading && (
        <div
          style={{
            background: 'rgba(230, 74, 25, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <h3 style={{ color: '#E64A19', margin: '0 0 15px 0' }}>
            Confirm Upgrade to Level 2
          </h3>
          
          <p style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
            Are you sure you want to upgrade your Incubator to Level 2?
          </p>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '10px',
            borderRadius: '5px',
            margin: '10px 0',
            textAlign: 'left',
            fontSize: '14px'
          }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Cost:</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>TCorvax:</span>
              <strong style={{ color: '#FF5722' }}>
                {upgradeCost?.tcorvax || 0}
              </strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>CatNips:</span>
              <strong style={{ color: '#FF5722' }}>
                {upgradeCost?.catNips || 0}
              </strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>Energy:</span>
              <strong style={{ color: '#FF5722' }}>
                {upgradeCost?.energy || 0}
              </strong>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '10px',
            borderRadius: '5px',
            margin: '10px 0',
            textAlign: 'left',
            fontSize: '14px'
          }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Benefits:</p>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Keep all Level 1 rewards</li>
              <li><strong>+1 Additional TCorvax</strong> for every 1000 sCVX</li>
              <li>No maximum on Level 2 bonus rewards</li>
            </ul>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button
              onClick={() => setShowUpgradeConfirm(false)}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                flex: '1',
                marginRight: '10px'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={confirmUpgrade}
              style={{
                backgroundColor: '#E64A19',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                flex: '1'
              }}
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
      
      {/* Connection details panel */}
      {showConnectionDetails && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
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
              <strong>Account Address:</strong> {selectedAccount?.address || accounts[0]?.address || 'N/A'}
            </p>
          </div>
          
          <p style={{ fontSize: '11px', margin: '10px 0 0 0', lineHeight: 1.4 }}>
            <strong>Note:</strong> To use the Incubator, you need sCVX tokens which you can get by staking in the DeFiPlaza staking pool at <a href="https://corvax.meme" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5722' }}>corvax.meme</a>.
          </p>
        </div>
      )}

      {/* Final buttons: Close or Activate */}
      {!lastActivationResult && !showUpgradeConfirm && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <button onClick={onClose}>Close</button>
          <button
            onClick={handleActivate}
            disabled={isLoading || connectionStatus !== 'ready'}
            style={{
              backgroundColor: connectionStatus === 'ready' ? '#4CAF50' : '#999',
              opacity: connectionStatus === 'ready' ? 1 : 0.7
            }}
          >
            Activate Incubator
          </button>
        </div>
      )}
    </div>
  );
};

export default IncubatorWidget;
