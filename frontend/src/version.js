// version.js - Place this in your static assets folder
(function() {
  // CHANGE THIS VERSION NUMBER MANUALLY WITH EACH DEPLOYMENT
  const APP_VERSION = "1.0.1";
  
  // Store the current version
  localStorage.setItem('app_version', APP_VERSION);
  
  // Check if this is a fresh version
  const lastVersion = localStorage.getItem('last_app_version');
  if (lastVersion && lastVersion !== APP_VERSION) {
    console.log(`New version detected: ${APP_VERSION} (was ${lastVersion})`);
    
    // Update stored version
    localStorage.setItem('last_app_version', APP_VERSION);
    
    // Force reload all assets by appending timestamp to URLs
    const timestamp = new Date().getTime();
    
    // Reload the page after a short delay (skipped if this was already a forced reload)
    if (!window.location.href.includes('cache_bust=')) {
      setTimeout(() => {
        const reloadUrl = window.location.href + 
          (window.location.href.includes('?') ? '&' : '?') + 
          `cache_bust=${timestamp}`;
        window.location.href = reloadUrl;
      }, 500);
    }
  } else {
    // First visit or same version
    localStorage.setItem('last_app_version', APP_VERSION);
  }
})();
