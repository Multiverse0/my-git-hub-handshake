import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MapPin, User, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { getOrganizationTrainingSessions, verifyTrainingSession, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { safeDate } from '../lib/typeUtils';
import type { MemberTrainingSession } from '../lib/types';

interface TrainingApprovalQueueProps {
  onCountChange?: (count: number) => void;
}


export function TrainingApprovalQueue({ onCountChange }: TrainingApprovalQueueProps) {
  const { profile, organization } = useAuth();
  const [pendingTrainings, setPendingTrainings] = useState<MemberTrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);

  // Load pending training sessions from database
  useEffect(() => {
    if (!organization?.id) return;
    
    const loadPendingTrainings = () => {
      try {
        const loadSessions = async () => {
          const result = await getOrganizationTrainingSessions(organization.id);
          if (result.data) {
            const unverifiedSessions = result.data.filter(session => !session.verified);
            setPendingTrainings(unverifiedSessions);
            
            // Notify parent component of count change
            if (onCountChange) {
              onCountChange(unverifiedSessions.length);
            }
          }
        };
        
        loadSessions().catch(error => {
          console.error('Error loading pending trainings:', error);
          setPendingTrainings([]);
          if (onCountChange) {
            onCountChange(0);
          }
        }).finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.error('Error in loadPendingTrainings:', error);
        setPendingTrainings([]);
        if (onCountChange) {
          onCountChange(0);
        }
        setLoading(false);
      }
    };

    loadPendingTrainings();

    // Refresh every 30 seconds
    const interval = setInterval(loadPendingTrainings, 30000);
    
    return () => clearInterval(interval);
  }, [organization?.id, onCountChange]);

  const handleApprove = async (sessionId: string) => {
    setProcessingId(sessionId);
    
    try {
      const result = await verifyTrainingSession(sessionId, profile?.full_name || 'Admin');
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from pending list
      setPendingTrainings(prev => prev.filter(training => training.id !== sessionId));
      
      // Update count
      if (onCountChange) {
        onCountChange(pendingTrainings.length - 1);
      }

    } catch (error) {
      console.error('Error approving training:', error);
      setError('Kunne ikke godkjenne treningsøkt');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (sessionId: string) => {
    if (!window.confirm('Er du sikker på at du vil avslå denne treningsøkten?')) {
      return;
    }

    setProcessingId(sessionId);
    
    try {
      // Delete the training session from database
      const { error } = await supabase
        .from('member_training_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) {
        throw new Error('Kunne ikke slette treningsøkt');
      }

      // Remove from pending list
      setPendingTrainings(prev => prev.filter(training => training.id !== sessionId));
      
      // Update count
      if (onCountChange) {
        onCountChange(pendingTrainings.length - 1);
      }

    } catch (error) {
      console.error('Error rejecting training:', error);
      setError('Kunne ikke avslå treningsøkt');
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
                      <h4 className="font-medium">{training.member?.full_name}</h4>
                      <p className="text-sm text-gray-400">Medlem #{training.member?.member_number}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{safeDate(training.start_time) ? format(safeDate(training.start_time)!, 'dd.MM.yyyy HH:mm') : 'Ukjent tid'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{training.location?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{training.duration_minutes ? `${training.duration_minutes} min` : '2 timer'}</span>
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