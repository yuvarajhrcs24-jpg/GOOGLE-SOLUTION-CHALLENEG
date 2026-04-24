import React from 'react';
import { useDisasterStore } from '../store/disaster';
import { format } from 'date-fns';
import { AlertTriangle, Clock, MapPin, User } from 'lucide-react';

export default function EmergencyFeed() {
  const { reports } = useDisasterStore();

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="glass rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-semibold text-white">Live Emergency Feed</h2>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {sortedReports.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No active reports right now.
          </div>
        ) : (
          sortedReports.map(report => (
            <div 
              key={report.id} 
              className={`p-4 rounded-lg border-l-4 hover-lift transition-all ${
                report.severity && report.severity >= 4 ? 'border-red-500 bg-red-500/10' :
                report.severity && report.severity === 3 ? 'border-yellow-500 bg-yellow-500/10' :
                'border-blue-500 bg-blue-500/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white">{report.title}</h3>
                <span className="text-xs text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(report.created_at), 'HH:mm')}
                </span>
              </div>
              
              <p className="text-sm text-gray-300 mb-3">{report.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {report.location_name || 'Location unknown'}
                </div>
                <div className={`px-2 py-1 rounded-full ${
                  report.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                  report.status === 'verified' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {report.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
