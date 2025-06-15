// src/components/TelegramLogin.jsx
import { useEffect } from 'react';

const TelegramLogin = () => {
  useEffect(() => {
    // Clear any existing telegram login buttons
    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
    }

    // Create a new script element for the Telegram login widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22'; // Use latest version
    script.async = true;
    
    // Use the correct bot name
    script.setAttribute('data-telegram-login', 'CorvaxCoins_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', 'https://cvxlab.net/callback');
    script.setAttribute('data-request-access', 'write');
    
    // Add the script to the container
    if (container) {
      container.appendChild(script);
    }
    
    return () => {
      // Clean up on unmount
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="telegram-login" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        border: '2px solid rgba(76, 175, 80, 0.5)'
      }}>
        <h2 style={{
          color: '#4CAF50',
          marginBottom: '20px',
          textAlign: 'center',
          background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '2rem'
        }}>Log in with Telegram</h2>
        
        <p style={{
          textAlign: 'center',
          color: '#ccc',
          marginBottom: '30px'
        }}>Log in to synchronize your resources.</p>
        
        <div id="telegram-login-container" style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px'
        }}></div>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '14px', 
          color: '#ccc',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          Note: Make sure you're using the Telegram app and that cookies are enabled in your browser.
          <br/>
          If login fails, try clearing your browser cookies or using a different browser.
        </p>
      </div>
    </div>
  );
};

export default TelegramLogin;
