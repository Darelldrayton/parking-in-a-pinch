// Service Worker Unregistration Script
// This script aggressively removes all service workers

(async function() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      console.log(`Found ${registrations.length} service worker registrations`);
      
      // Unregister all service workers
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log('Service worker unregistered:', result);
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} caches to delete`);
        
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('Cache deleted:', cacheName);
        }
      }
      
      console.log('All service workers and caches cleared!');
      
      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing service workers:', error);
    }
  }
})();