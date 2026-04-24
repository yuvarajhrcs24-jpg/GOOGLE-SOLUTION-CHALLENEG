import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDisasterStore } from '../store/disaster';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function SOSButton() {
  const [isPressing, setIsPressing] = useState(false);
  const { createReport } = useDisasterStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const triggerSOS = async () => {
    setLoading(true);
    try {
      // Get location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const coords = [position.coords.longitude, position.coords.latitude] as [number, number];

      // Create emergency report
      await createReport({
        type: 'rescue-needed',
        title: 'EMERGENCY SOS',
        description: 'User triggered SOS button and needs immediate assistance.',
        location: {
          type: 'Point',
          coordinates: coords
        },
        location_name: 'Unknown (GPS Coordinates)',
        severity: 5,
        reporter_id: user?.id,
      });

      toast.success('SOS Alert Sent Successfully! Emergency services have been notified.', {
        duration: 5000,
        icon: '🚨'
      });
      
    } catch (error) {
      console.error('Error triggering SOS:', error);
      toast.error('Failed to send SOS via network. Attempting SMS fallback...', { duration: 4000 });
      
      // SMS Fallback logic
      let smsBody = 'EMERGENCY SOS!';
      try {
         const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000
          });
        });
        smsBody += ` My location: https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
      } catch (e) {
        smsBody += ` Location unavailable.`;
      }
      
      window.location.href = `sms:911?body=${encodeURIComponent(smsBody)}`;
    } finally {
      setLoading(false);
      setIsPressing(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onMouseDown={() => setIsPressing(true)}
      onMouseUp={() => { if (isPressing) triggerSOS(); }}
      onMouseLeave={() => setIsPressing(false)}
      onTouchStart={() => setIsPressing(true)}
      onTouchEnd={() => { if (isPressing) triggerSOS(); }}
      disabled={loading}
      className={`fixed bottom-8 left-8 w-20 h-20 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.8)] flex items-center justify-center transition-colors duration-300 z-50 hover:bg-red-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${isPressing ? 'bg-red-700' : ''}`}
      aria-label="SOS Emergency Button"
    >
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full border-4 border-red-400"
      ></motion.div>
      <span className="font-bold text-white text-xl z-10 flex flex-col items-center">
        {loading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <AlertCircle className="w-8 h-8 mb-1 drop-shadow-md" />
            <span className="drop-shadow-md">SOS</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
