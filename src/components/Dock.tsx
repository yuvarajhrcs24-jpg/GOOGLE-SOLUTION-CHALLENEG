import React, { useState } from 'react';
import { Map, Globe2, BarChart2, Users, Box, AlertTriangle, MessageSquare, Bot, Loader2, ShieldAlert } from 'lucide-react';
import AIChat from './AIChat';
import { useDisasterStore } from '../store/disaster';
import { predictResourceNeeds, detectMisinformation } from '../lib/gemini';

interface DockProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'deployed' | 'training';
  location: string;
}

interface ResourceItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  location: string;
  status: 'available' | 'in-use' | 'maintenance';
}

interface IncidentReport {
  id: string;
  title: string;
  severity: number;
  location: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
}

interface Communication {
  id: string;
  type: 'message' | 'alert' | 'update';
  sender: string;
  content: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Dr. Sarah Johnson', role: 'Medical Lead', status: 'available', location: 'Chennai' },
  { id: '2', name: 'Raj Kumar', role: 'Rescue Specialist', status: 'deployed', location: 'Kerala' },
  { id: '3', name: 'Priya Singh', role: 'Emergency Coordinator', status: 'available', location: 'Mumbai' },
  { id: '4', name: 'Alex Chen', role: 'Logistics Manager', status: 'training', location: 'Delhi' }
];

const mockResources: ResourceItem[] = [
  { id: '1', name: 'Emergency Medical Kits', type: 'Medical', quantity: 500, location: 'Central Warehouse', status: 'available' },
  { id: '2', name: 'Water Purification Units', type: 'Water', quantity: 50, location: 'South Hub', status: 'in-use' },
  { id: '3', name: 'Rescue Boats', type: 'Transport', quantity: 10, location: 'Coastal Station', status: 'maintenance' }
];

const mockIncidents: IncidentReport[] = [
  { id: '1', title: 'Flash Flood Warning', severity: 4, location: 'Wayanad', timestamp: '2025-02-15T10:30:00Z', status: 'new' },
  { id: '2', title: 'Building Collapse', severity: 5, location: 'Mumbai Suburbs', timestamp: '2025-02-15T09:15:00Z', status: 'investigating' },
  { id: '3', title: 'Forest Fire', severity: 3, location: 'Nilgiris', timestamp: '2025-02-15T08:45:00Z', status: 'resolved' }
];

const initialCommunications: Communication[] = [
  { id: '1', type: 'alert', sender: 'Emergency Ops', content: 'Immediate evacuation required in coastal areas', timestamp: '2025-02-15T10:45:00Z', priority: 'high' },
  { id: '2', type: 'message', sender: 'Field Team Alpha', content: 'Rescue operation completed successfully', timestamp: '2025-02-15T10:30:00Z', priority: 'medium' },
  { id: '3', type: 'update', sender: 'Weather Service', content: 'Storm expected to intensify in next 6 hours', timestamp: '2025-02-15T10:15:00Z', priority: 'high' }
];

export default function Dock({ activeView, onViewChange }: DockProps) {
  const { teams, disasters, deployTeam, reports, updateReport } = useDisasterStore();
  const [showPanel, setShowPanel] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [panelContent, setPanelContent] = useState<React.ReactNode | null>(null);
  const [communications, setCommunications] = useState<Communication[]>(initialCommunications);
  const [newMessage, setNewMessage] = useState('');
  
  // Analytics State
  const [selectedDisasterForPrediction, setSelectedDisasterForPrediction] = useState<string>('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<string | null>(null);

  // Verification State
  const [verifyingIncident, setVerifyingIncident] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, string>>({});

  const menuItems = [
    { id: 'chat', icon: Bot, label: 'AI Assistant' },
    { id: 'map', icon: Map, label: 'Map View' },
    { id: 'globe', icon: Globe2, label: 'Globe' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'teams', icon: Users, label: 'Teams' },
    { id: 'resources', icon: Box, label: 'Resources' },
    { id: 'incidents', icon: AlertTriangle, label: 'Incidents' },
    { id: 'communications', icon: MessageSquare, label: 'Comms' }
  ];

  const handleViewChange = (view: string) => {
    if (view === 'chat') {
      setShowChat(!showChat);
      if (showPanel) setShowPanel(false);
    } else {
      onViewChange(view);
      if (['teams', 'resources', 'incidents', 'communications'].includes(view)) {
        setShowPanel(true);
        setPanelContent(renderPanelContent(view));
        if (showChat) setShowChat(false);
      } else {
        setShowPanel(false);
      }
    }
  };

  const renderPanelContent = (view: string) => {
    switch (view) {
      case 'analytics':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Crisis Analytics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/30 p-3 rounded-lg border border-white/10 text-center">
                <div className="text-2xl font-bold text-blue-400">{disasters.filter(d => d.status === 'active').length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Active Disasters</div>
              </div>
              <div className="bg-black/30 p-3 rounded-lg border border-white/10 text-center">
                <div className="text-2xl font-bold text-green-400">{teams.filter(t => t.status === 'available').length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Available Teams</div>
              </div>
              <div className="bg-black/30 p-3 rounded-lg border border-white/10 text-center">
                <div className="text-2xl font-bold text-yellow-400">{resources.reduce((acc, r) => acc + r.quantity, 0)}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Resources</div>
              </div>
              <div className="bg-black/30 p-3 rounded-lg border border-white/10 text-center">
                <div className="text-2xl font-bold text-red-400">{reports.filter(r => r.status === 'pending').length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Pending Reports</div>
              </div>
            </div>

            <div className="glass p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-400" />
                AI Resource Needs Prediction
              </h3>
              <p className="text-sm text-gray-400 mb-3">Select an active disaster to predict future resource requirements and shortages.</p>
              
              <div className="flex space-x-2 mb-4">
                <select 
                  className="bg-black/50 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 outline-none flex-1"
                  value={selectedDisasterForPrediction}
                  onChange={(e) => setSelectedDisasterForPrediction(e.target.value)}
                >
                  <option value="" disabled>Select a disaster...</option>
                  {disasters.filter(d => d.status === 'active').map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!selectedDisasterForPrediction) return;
                    setIsPredicting(true);
                    setPredictionResult(null);
                    const disaster = disasters.find(d => d.id === selectedDisasterForPrediction);
                    if (disaster) {
                      try {
                        const result = await predictResourceNeeds({
                          type: disaster.type,
                          severity: disaster.severity,
                          affectedPopulation: disaster.affected_population || undefined,
                          location: disaster.location_name
                        });
                        setPredictionResult(result);
                      } catch (err) {
                        console.error(err);
                        setPredictionResult("Failed to predict resources.");
                      }
                    }
                    setIsPredicting(false);
                  }}
                  disabled={!selectedDisasterForPrediction || isPredicting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  {isPredicting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Predict
                </button>
              </div>

              {predictionResult && (
                <div className="bg-black/40 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {predictionResult}
                </div>
              )}
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Emergency Response Teams</h2>
            <div className="space-y-4">
              {teams.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No active response teams</div>
              ) : teams.map(member => (
                <div key={member.id} className="glass p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-300">{member.type.charAt(0).toUpperCase() + member.type.slice(1)} Team</p>
                      <p className="text-sm text-gray-400">{member.location_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'available' ? 'bg-green-500/20 text-green-300' :
                      member.status === 'responding' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  {member.specializations && member.specializations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.specializations.map(spec => (
                        <span key={spec} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  {member.status === 'available' && disasters.length > 0 && (
                    <div className="mt-3 flex items-center space-x-2">
                      <select 
                        className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-gray-600 outline-none flex-1"
                        onChange={(e) => {
                          if (e.target.value) {
                            deployTeam(member.id, e.target.value);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Deploy to disaster...</option>
                        {disasters.filter(d => d.status === 'active').map(d => (
                          <option key={d.id} value={d.id}>{d.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {member.status === 'responding' && member.assigned_to && (
                    <div className="mt-2 text-xs text-blue-400 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Assigned to: {disasters.find(d => d.id === member.assigned_to)?.title || 'Unknown Disaster'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'resources':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Resource Management</h2>
            <div className="space-y-4">
              {mockResources.map(resource => (
                <div key={resource.id} className="glass p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{resource.name}</h3>
                      <p className="text-sm text-gray-300">{resource.type}</p>
                      <p className="text-sm text-gray-400">
                        {resource.quantity} units at {resource.location}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      resource.status === 'available' ? 'bg-green-500/20 text-green-300' :
                      resource.status === 'in-use' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {resource.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'incidents':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Incident Reports</h2>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No incident reports found</div>
              ) : reports.map(incident => (
                <div key={incident.id} className="glass p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{incident.title}</h3>
                      <p className="text-sm text-gray-300">{incident.location_name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(incident.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (incident.severity || 1) >= 4 ? 'bg-red-500/20 text-red-300' :
                        (incident.severity || 1) >= 3 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        Severity {incident.severity || 1}
                      </span>
                      <select 
                        className={`px-2 py-1 rounded-full text-xs font-medium outline-none cursor-pointer appearance-none ${
                          incident.status === 'pending' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' :
                          incident.status === 'verified' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' :
                          'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        }`}
                        value={incident.status}
                        onChange={(e) => updateReport(incident.id, { status: e.target.value as any })}
                      >
                        <option value="pending" className="bg-gray-800 text-red-400">Pending</option>
                        <option value="verified" className="bg-gray-800 text-yellow-400">Verified</option>
                        <option value="resolved" className="bg-gray-800 text-green-400">Resolved</option>
                        <option value="false-alarm" className="bg-gray-800 text-gray-400">False Alarm</option>
                      </select>
                      <button
                        onClick={async () => {
                          setVerifyingIncident(incident.id);
                          try {
                            const result = await detectMisinformation({
                              title: incident.title,
                              description: incident.description,
                              source: incident.reporter_id || 'Anonymous'
                            });
                            setVerificationResults(prev => ({ ...prev, [incident.id]: result }));
                          } catch (err) {
                            console.error(err);
                          }
                          setVerifyingIncident(null);
                        }}
                        disabled={verifyingIncident === incident.id}
                        className="text-xs flex items-center space-x-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded transition-colors"
                      >
                        {verifyingIncident === incident.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                        <span>AI Verify</span>
                      </button>
                    </div>
                  </div>
                  {verificationResults[incident.id] && (
                    <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs text-purple-200 whitespace-pre-wrap">
                      <span className="font-semibold block mb-1">AI Trust Analysis:</span>
                      {verificationResults[incident.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'communications':
        return (
          <div className="p-4 flex flex-col h-[60vh]">
            <h2 className="text-xl font-bold text-white mb-4 shrink-0">Communications Center</h2>
            <div className="space-y-4 flex-1 overflow-y-auto mb-4">
              {communications.map(comm => (
                <div key={comm.id} className="glass p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          comm.priority === 'high' ? 'bg-red-500' :
                          comm.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></span>
                        <h3 className="font-semibold text-white">{comm.sender}</h3>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{comm.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comm.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      comm.type === 'alert' ? 'bg-red-500/20 text-red-300' :
                      comm.type === 'message' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {comm.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto shrink-0 pt-4 border-t border-white/10">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newMessage.trim()) return;
                  setCommunications([{
                    id: Date.now().toString(),
                    type: 'message',
                    sender: 'You',
                    content: newMessage,
                    timestamp: new Date().toISOString(),
                    priority: 'medium'
                  }, ...communications]);
                  setNewMessage('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-lg rounded-full p-2 border border-white/10 shadow-lg">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'chat' ? showChat : activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`relative group p-3 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Chat Panel */}
      {showChat && (
        <div className="fixed bottom-32 right-8 w-96 z-40 shadow-2xl">
          <AIChat />
        </div>
      )}

      {/* Other Panels */}
      {showPanel && panelContent && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-40">
          <div className="glass rounded-xl shadow-xl max-h-[60vh] overflow-y-auto">
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
}