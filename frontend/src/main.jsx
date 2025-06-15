// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/StatusEffects.css';
import './battle.css';
import './animationStyles.js';
import { GameProvider } from './context/GameContext';

// Import the *new* RadixConnectProvider
import { RadixConnectProvider } from './context/RadixConnectContext';

// Provide the address of your dApp
const dAppDefinitionAddress = 'account_rdx129994zq674n4mturvkqz7cz9t7gmtn5sjspxv7py2ahqnpdvxjsqum';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1) Put RadixConnectProvider at the top */}
    <RadixConnectProvider dAppDefinitionAddress={dAppDefinitionAddress}>
      {/* 2) Then GameProvider inside */}
      <GameProvider>
        {/* 3) Finally, your App which consumes the GameContext */}
        <App />
      </GameProvider>
    </RadixConnectProvider>
  </React.StrictMode>
);
