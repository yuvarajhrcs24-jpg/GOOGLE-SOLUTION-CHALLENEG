import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isTracking: boolean;
}

export function useLocationTracking(shouldTrack: boolean = false) {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldTrack || !user) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setLocation(prev => ({ ...prev, isTracking: false }));
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocation(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setLocation(prev => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setLocation(prev => ({
          ...prev,
          latitude,
          longitude,
          accuracy,
          error: null
        }));

        // Optional: Update user's live location in a specific table for responders
        // E.g., a "live_locations" table or updating their volunteer/team record
        try {
          // This is a placeholder for actual backend location updates.
          // Depending on role, it might update the `teams` table or a specific `volunteer_locations` table.
          /*
          await supabase.from('user_locations').upsert({
            user_id: user.id,
            location: `POINT(${longitude} ${latitude})`,
            updated_at: new Date().toISOString()
          });
          */
        } catch (error) {
          console.error("Failed to sync location to backend", error);
        }
      },
      (error) => {
        setLocation(prev => ({ ...prev, error: error.message }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [shouldTrack, user]);

  return location;
}
