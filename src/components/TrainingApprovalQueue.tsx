import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, MapPin, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface PendingTraining {
  id: string;
  sessionId: string;
  memberName: string;
  memberNumber: string;
  date: string;
  location: string;
  duration: string;
  approved: boolean;
  createdAt: string;
}

interface TrainingApprovalQueueProps {
  onCountChange?: (count: number) => void;
}

// Generate dummy pending training approvals for demo
const generateDummyApprovals = (): PendingTraining[] => {
  const members = [
    'Astrid Bergström', 'Magnus Haugen', 'Ingrid Svendsen', 'Bjørn Kristoffersen',
    'Solveig Dahl', 'Torstein Lie', 'Marit Sørensen', 'Geir Mikkelsen',
    'Lise Andersen', 'Per Olsen', 'Kari Nilsen', 'Tom Hansen',
    'Anne Larsen', 'Bjørn Eriksen', 'Silje Pedersen'
  ];
  
  const locations = ['Innendørs 25m', 'Utendørs 25m'];
  const durations = ['1.5 timer', '2 timer', '2.5 timer'];
  
  return members.map((member, index) => ({
    id: `dummy-${index + 1}`,
    sessionId: `session-${index + 1}`,
    memberName: member,
    memberNumber: `${10001 + index}`,
    date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time today
    location: locations[Math.floor(Math.random() * locations.length)],
    duration: durations[Math.floor(Math.random() * durations.length)],
    approved: false,
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  }));
};

export function TrainingApprovalQueue({ onCountChange }: TrainingApprovalQueueProps) {
  const { profile } = useAuth();
  const [pendingTrainings, setPendingTrainings] = useState<PendingTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load pending training approvals from localStorage
  useEffect(() => {
    const loadPendingTrainings = () => {
      try {
        const saved = localStorage.getItem('pendingTrainingApprovals');
        let pending: PendingTraining[] = [];
        
        if (saved) {
          const parsed = JSON.parse(saved);
          pending = parsed.filter((training: PendingTraining) => !training.approved);
        } else {
          // Generate dummy data for demo
          const dummyData = generateDummyApprovals();
          localStorage.setItem('pendingTrainingApprovals', JSON.stringify(dummyData));
          pending = dummyData;
        }
        
        setPendingTrainings(pending);
        
        // Notify parent component of count change
        if (onCountChange) {
          onCountChange(pending.length);
        }
      } catch (error) {
        console.error('Error loading pending trainings:', error);
        // Fallback to dummy data
        const dummyData = generateDummyApprovals();
        setPendingTrainings(dummyData);
        if (onCountChange) {
          onCountChange(dummyData.length);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPendingTrainings();

    // Listen for updates
    const interval = setInterval(loadPendingTrainings, 2000);
    
    return () => clearInterval(interval);
  }, [onCountChange]);

  const handleApprove = async (trainingId: string) => {
    setProcessingId(trainingId);
    
    try {
      // Update pending approvals
      const saved = localStorage.getItem('pendingTrainingApprovals');
      if (saved) {
        const approvals = JSON.parse(saved);
        const updatedApprovals = approvals.map((approval: PendingTraining) =>
          approval.id === trainingId 
            ? { ...approval, approved: true, approvedBy: profile?.full_name || 'Admin', approvedAt: new Date().toISOString() }
            : approval
        );
        localStorage.setItem('pendingTrainingApprovals', JSON.stringify(updatedApprovals));
      }

      // Update training sessions
      const savedSessions = localStorage.getItem('trainingSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const training = pendingTrainings.find(t => t.id === trainingId);
        
        if (training) {
          const updatedSessions = sessions.map((session: any) =>
            session.id === training.sessionId
              ? { 
                  ...session, 
                  verified: true, 
                  approved: true,
                  verifiedBy: profile?.full_name || 'Admin',
                  rangeOfficer: profile?.full_name || 'Admin',
                  verification_time: new Date().toISOString()
                }
              : session
          );
          localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
        }
      }

      // Remove from pending list
      setPendingTrainings(prev => prev.filter(training => training.id !== trainingId));
      
      // Update count
      if (onCountChange) {
        onCountChange(pendingTrainings.length - 1);
      }

      // Trigger refresh
      localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
      
    } catch (error) {
      console.error('Error approving training:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (trainingId: string) => {
    if (!window.confirm('Er du sikker på at du vil avslå denne treningsøkten?')) {
      return;
    }

    setProcessingId(trainingId);
    
    try {
      // Remove from pending approvals
      const saved = localStorage.getItem('pendingTrainingApprovals');
      if (saved) {
        const approvals = JSON.parse(saved);
        const updatedApprovals = approvals.filter((approval: PendingTraining) => approval.id !== trainingId);
        localStorage.setItem('pendingTrainingApprovals', JSON.stringify(updatedApprovals));
      }

      // Remove from training sessions
      const savedSessions = localStorage.getItem('trainingSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const training = pendingTrainings.find(t => t.id === trainingId);
        
        if (training) {
          const updatedSessions = sessions.filter((session: any) => session.id !== training.sessionId);
          localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
        }
      }

      // Remove from pending list
      setPendingTrainings(prev => prev.filter(training => training.id !== trainingId));
      
      // Update count
      if (onCountChange) {
        onCountChange(pendingTrainings.length - 1);
      }

      // Trigger refresh
      localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
      
    } catch (error) {
      console.error('Error rejecting training:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-svpk-yellow animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-6">Ventende Godkjenninger</h3>
      
      {pendingTrainings.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Ingen ventende treningsøkter</p>
          <p className="text-sm text-gray-500">
            Treningsøkter som registreres via QR-skanning vil vises her for godkjenning
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTrainings.map((training) => (
            <div key={training.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-svpk-yellow" />
                    <div>
                      <h4 className="font-medium">{training.memberName}</h4>
                      <p className="text-sm text-gray-400">Medlem #{training.memberNumber}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{format(new Date(training.date), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{training.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{training.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleReject(training.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                    disabled={processingId === training.id}
                    title="Avslå treningsøkt"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(training.id)}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-full transition-colors"
                    disabled={processingId === training.id}
                    title="Godkjenn treningsøkt"
                  >
                    {processingId === training.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {pendingTrainings.length > 0 && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Godkjenning av treningsøkter:</p>
              <p>
                Klikk på den grønne haken for å godkjenne en treningsøkt. 
                Godkjente økter vil vises i medlemmets treningslogg og telle mot våpensøknadskrav.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}