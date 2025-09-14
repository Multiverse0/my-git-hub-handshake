import { useState, useEffect } from 'react';
import { Shield, Plus, Calendar, CheckCircle } from 'lucide-react';
import { MemberManagement } from '../components/MemberManagement';
import { TrainingApprovalQueue } from '../components/TrainingApprovalQueue';
import { QRCodeManagement } from '../components/QRCodeManagement';
import { ManualTrainingModal } from '../components/ManualTrainingModal';
import { AdminFullTrainingLog } from '../components/AdminFullTrainingLog';
import { OrganizationSettings } from '../components/OrganizationSettings';
import { RangeOfficerManagement } from '../components/RangeOfficerManagement';
import { EmailManagement } from '../components/EmailManagement';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SupabaseStatus } from '../components/SupabaseStatus';

export function Admin() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'approvals' | 'qr' | 'log' | 'officers' | 'settings' | 'email'>('overview');
  const [showManualModal, setShowManualModal] = useState(false);
  const [, setPendingApprovalsCount] = useState(0);
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todaysUnapprovedCount, setTodaysUnapprovedCount] = useState(0);
  const [selectedDateUnapprovedCount, setSelectedDateUnapprovedCount] = useState(0);

  // Calculate today's unapproved count from TrainingApprovalQueue
  useEffect(() => {
    const calculateCounts = () => {
      try {
        const savedApprovals = localStorage.getItem('pendingTrainingApprovals');
        if (savedApprovals) {
          const approvals = JSON.parse(savedApprovals);
          const pendingApprovals = approvals.filter((approval: any) => !approval.approved);
          
          // Today's count
          const today = new Date().toDateString();
          const todayCount = pendingApprovals.filter((approval: any) => 
            new Date(approval.date).toDateString() === today
          ).length;
          setTodaysUnapprovedCount(todayCount);
          
          // Selected date count
          const selected = new Date(selectedDate).toDateString();
          const selectedCount = pendingApprovals.filter((approval: any) => 
            new Date(approval.date).toDateString() === selected
          ).length;
          setSelectedDateUnapprovedCount(selectedCount);
          
          // Update total pending count
          setPendingApprovalsCount(pendingApprovals.length);
        } else {
          setTodaysUnapprovedCount(0);
          setSelectedDateUnapprovedCount(0);
          setPendingApprovalsCount(0);
        }
      } catch (error) {
        console.error('Error calculating approval counts:', error);
      }
    };

    calculateCounts();
    
    // Listen for updates
    const interval = setInterval(calculateCounts, 2000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Check if user has admin access
  const hasAdminAccess = user?.user_type === 'super_user' || 
                        user?.member_profile?.role === 'admin' ||
                        user?.member_profile?.role === 'range_officer';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Ingen tilgang</h1>
          <p className="text-gray-400">Du har ikke tilgang til administrasjonspanelet</p>
        </div>
      </div>
    );
  }

  const handleBulkApproveToday = () => {
    const today = new Date().toDateString();
    
    // Get today's pending approvals
    const savedApprovals = localStorage.getItem('pendingTrainingApprovals');
    if (savedApprovals) {
      const approvals = JSON.parse(savedApprovals);
      const todayPending = approvals.filter((approval: any) => 
        new Date(approval.date).toDateString() === today && !approval.approved
      );
      
      if (todayPending.length === 0) {
        alert('Ingen ikke-godkjente treningsøkter funnet for dagens dato.');
        return;
      }

      if (window.confirm(`Godkjenn alle ${todayPending.length} treningsøkter for dagens dato?`)) {
        const adminName = profile?.full_name || 'Admin';
        
        // Mark approvals as approved
        const updatedApprovals = approvals.map((approval: any) =>
          new Date(approval.date).toDateString() === today && !approval.approved
            ? { ...approval, approved: true, approvedBy: adminName, approvedAt: new Date().toISOString() }
            : approval
        );
        
        localStorage.setItem('pendingTrainingApprovals', JSON.stringify(updatedApprovals));
        
        // Update training sessions
        const savedSessions = localStorage.getItem('trainingSessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const updatedSessions = sessions.map((session: any) => {
            const matchingApproval = todayPending.find((approval: any) => approval.sessionId === session.id);
            if (matchingApproval) {
              return { 
                ...session, 
                verified: true, 
                approved: true,
                verifiedBy: adminName,
                rangeOfficer: adminName,
                verification_time: new Date().toISOString()
              };
            }
            return session;
          });
          localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
        }
        
        localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
        
        // Reset counts
        setTodaysUnapprovedCount(0);
        setPendingApprovalsCount(prev => Math.max(0, prev - todayPending.length));
      }
    }
  };

  const handleBulkApproveSelectedDate = () => {
    const selected = new Date(selectedDate).toDateString();
    
    // Get selected date's pending approvals
    const savedApprovals = localStorage.getItem('pendingTrainingApprovals');
    if (savedApprovals) {
      const approvals = JSON.parse(savedApprovals);
      const selectedPending = approvals.filter((approval: any) => 
        new Date(approval.date).toDateString() === selected && !approval.approved
      );
      
      if (selectedPending.length === 0) {
        alert('Ingen ikke-godkjente treningsøkter funnet for valgt dato.');
        return;
      }

      if (window.confirm(`Godkjenn alle ${selectedPending.length} treningsøkter for ${new Date(selectedDate).toLocaleDateString('nb-NO')}?`)) {
        const adminName = profile?.full_name || 'Admin';
        
        // Mark approvals as approved
        const updatedApprovals = approvals.map((approval: any) =>
          new Date(approval.date).toDateString() === selected && !approval.approved
            ? { ...approval, approved: true, approvedBy: adminName, approvedAt: new Date().toISOString() }
            : approval
        );
        
        localStorage.setItem('pendingTrainingApprovals', JSON.stringify(updatedApprovals));
        
        // Update training sessions
        const savedSessions = localStorage.getItem('trainingSessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const updatedSessions = sessions.map((session: any) => {
            const matchingApproval = selectedPending.find((approval: any) => approval.sessionId === session.id);
            if (matchingApproval) {
              return { 
                ...session, 
                verified: true, 
                approved: true,
                verifiedBy: adminName,
                rangeOfficer: adminName,
                verification_time: new Date().toISOString()
              };
            }
            return session;
          });
          localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
        }
        
        localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
        
        // Reset counts
        setSelectedDateUnapprovedCount(0);
        setPendingApprovalsCount(prev => Math.max(0, prev - selectedPending.length));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Supabase Connection Status */}
      <div className="mb-6">
        <SupabaseStatus showDetails={true} />
      </div>
      
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-svpk-yellow mb-2">
            {t('admin.title')}
          </h1>
          <p className="text-gray-400">
            {t('admin.description')}
          </p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          {t('admin.add_training')}
        </button>
      </header>

      {/* Compact Mobile-Friendly Navigation */}
      <div className="flex gap-1 border-b border-gray-700 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-svpk-yellow text-gray-900 border-b-2 border-svpk-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Dagens
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg relative whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-svpk-yellow text-gray-900 border-b-2 border-svpk-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Medlem
          {pendingMembersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingMembersCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg relative whitespace-nowrap ${
            activeTab === 'log'
              ? 'bg-svpk-yellow text-gray-900 border-b-2 border-svpk-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Logg
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1 inline-flex">
            12
          </span>
        </button>
        <button
          onClick={() => setActiveTab('officers')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
            activeTab === 'officers'
              ? 'bg-svpk-yellow text-gray-900 border-b-2 border-svpk-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Ledere
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-svpk-yellow text-gray-900 border-b-2 border-svpk-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Innstillinger
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
            activeTab === 'qr'
              ? 'bg-svpk-yellow text-gray-900 border-b-2 border-svpk-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          QR-koder
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-svpk-yellow mb-4">Alle treningsregistreringer</h2>
            <p className="text-gray-400 mb-6">Oversikt over alle treningsregistreringer med klikkbare status-ikoner</p>
            
            {/* Hurtig-godkjenning Section */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-blue-400">Hurtig-godkjenning</h3>
                  <p className="text-sm text-blue-200">Godkjenn flere registreringer samtidig</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleBulkApproveToday}
                  className="btn-primary flex-1"
                >
                  <CheckCircle className="w-5 h-5" />
                  Godkjenn dagens ({todaysUnapprovedCount})
                </button>
                
                <div className="flex gap-2 flex-1">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-700 rounded-md px-3 py-2 flex-1"
                  />
                  <button
                    onClick={handleBulkApproveSelectedDate}
                    className="btn-secondary whitespace-nowrap flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Velg dato ({selectedDateUnapprovedCount})
                  </button>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Klikk på status-ikonene for å endre mellom godkjent/ikke godkjent
            </p>

            <TrainingApprovalQueue onCountChange={setPendingApprovalsCount} />
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <MemberManagement onMemberCountChange={setPendingMembersCount} />
      )}

      {activeTab === 'log' && (
        <AdminFullTrainingLog />
      )}

      {activeTab === 'officers' && (
        <RangeOfficerManagement />
      )}

      {activeTab === 'settings' && (
        <OrganizationSettings />
      )}

      {activeTab === 'qr' && (
        <QRCodeManagement />
      )}

      {user?.user_type === 'super_user' && activeTab === 'email' && (
        <EmailManagement />
      )}

      {showManualModal && (
        <ManualTrainingModal
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            // Refresh data if needed
          }}
        />
      )}
    </div>
  );
}