import React, { useState, useEffect } from 'react';
import { WifiOff, Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useDisasterStore } from '../store/disaster';

export default function PWABanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Setup service worker registration
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      useDisasterStore.getState().syncOfflineData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm font-medium flex items-center justify-center space-x-2 z-50 animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Operating in limited mode.</span>
        </div>
      )}

      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl p-4 z-50 flex items-start justify-between border-l-4 border-blue-500">
          <div className="flex-1 mr-4">
            <h3 className="font-bold text-gray-900">Install DisasterHub</h3>
            <p className="text-sm text-gray-600 mt-1">Install this app on your device for offline access during emergencies.</p>
            <button
              onClick={handleInstallClick}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </button>
          </div>
          <button 
            onClick={() => setShowInstallBanner(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl p-4 z-50 flex items-start justify-between border-l-4 border-green-500">
          <div className="flex-1 mr-4">
            <h3 className="font-bold text-gray-900">Update Available</h3>
            <p className="text-sm text-gray-600 mt-1">A new version of DisasterHub is available.</p>
            <button
              onClick={() => updateServiceWorker(true)}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Reload
            </button>
          </div>
          <button 
            onClick={() => setNeedRefresh(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
