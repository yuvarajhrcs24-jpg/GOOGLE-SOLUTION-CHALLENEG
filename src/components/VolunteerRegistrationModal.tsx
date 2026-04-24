import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { useDisasterStore } from '../store/disaster';
import type { Database } from '../lib/database.types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TeamInsert = Database['public']['Tables']['teams']['Insert'];

interface VolunteerRegistrationModalProps {
  onClose: () => void;
}

export default function VolunteerRegistrationModal({ onClose }: VolunteerRegistrationModalProps) {
  const { createTeam } = useDisasterStore();
  const [formData, setFormData] = useState<Partial<TeamInsert>>({
    name: '',
    type: 'rescue',
    capacity: 1,
    current_members: 1,
    location_name: '',
    status: 'available',
    specializations: [],
    location: {
      type: 'Point',
      coordinates: [0, 0]
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (!formData.location?.coordinates[0] || !formData.location?.coordinates[1]) {
        throw new Error('Please provide valid coordinates');
      }

      await createTeam(formData as TeamInsert);
      toast.success('Volunteer registered successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to register volunteer:', error);
      setError(error instanceof Error ? error.message : 'Failed to register as volunteer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoordinateChange = (type: 'longitude' | 'latitude', value: string) => {
    const numValue = Number(value);
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: type === 'longitude' 
          ? [numValue, prev.location?.coordinates[1] || 0]
          : [prev.location?.coordinates[0] || 0, numValue]
      }
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-slate-900"
        >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Register as Volunteer</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team / Individual Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., John Doe or Rapid Rescue Group"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TeamInsert['type'] })}
            >
              <option value="medical">Medical / First Aid</option>
              <option value="rescue">Search & Rescue</option>
              <option value="firefighting">Firefighting</option>
              <option value="police">Security / Police</option>
              <option value="engineering">Engineering / Logistics</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity (People)</label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Members</label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                value={formData.current_members}
                onChange={(e) => setFormData({ ...formData, current_members: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                value={formData.location?.coordinates[0] || ''}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                placeholder="-180 to 180"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                value={formData.location?.coordinates[1] || ''}
                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                placeholder="-90 to 90"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location Base</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="e.g., Chennai Center"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Users className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
