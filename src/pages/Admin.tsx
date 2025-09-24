import { useState, useEffect } from 'react';
import { Shield, Plus, Calendar, CheckCircle, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { getOrganizationTrainingSessions, verifyTrainingSession, getOrganizationMembers } from '../lib/supabase';
import { MemberManagement } from '../components/MemberManagement';
import { TrainingApprovalQueue } from '../components/TrainingApprovalQueue';
import { QRCodeManagement } from '../components/QRCodeManagement';
import { ManualTrainingModal } from '../components/ManualTrainingModal';
import { AdminFullTrainingLog } from '../components/AdminFullTrainingLog';
import { OrganizationSettings } from '../components/OrganizationSettings';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SupabaseStatus } from '../components/SupabaseStatus';
import { StatisticsCard } from '../components/StatisticsCard';
import { MembershipProgressCard } from '../components/MembershipProgressCard';

export function Admin() {
  const { user, profile, organization } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'approvals' | 'qr' | 'log' | 'settings' | 'email'>('overview');
  const [showManualModal, setShowManualModal] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todaysUnapprovedCount, setTodaysUnapprovedCount] = useState(0);
  const [selectedDateUnapprovedCount, setSelectedDateUnapprovedCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalTrainingSessions, setTotalTrainingSessions] = useState(0);

  // Load training sessions and member data from database
  useEffect(() => {
    if (!organization?.id) return;
    
    const loadData = async () => {
      try {
        // Load training sessions
        const sessionsResult = await getOrganizationTrainingSessions(organization.id);
        if (sessionsResult.data) {
          const unverifiedSessions = sessionsResult.data.filter(session => !session.verified);
          
          // Today's count
          const today = new Date().toDateString();
          const todayCount = unverifiedSessions.filter(session => 
            session.start_time && new Date(session.start_time).toDateString() === today
          ).length;
          setTodaysUnapprovedCount(todayCount);
          
          // Selected date count
          const selected = new Date(selectedDate).toDateString();
          const selectedCount = unverifiedSessions.filter(session => 
            session.start_time && new Date(session.start_time).toDateString() === selected
          ).length;
          setSelectedDateUnapprovedCount(selectedCount);
          
          // Update total pending count
          setPendingApprovalsCount(unverifiedSessions.length);
          
          // Total training sessions this month
          const currentMonth = new Date();
          const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          const thisMonthSessions = sessionsResult.data.filter(session => 
            session.verified && session.start_time && new Date(session.start_time) >= firstDayOfMonth
          ).length;
          setTotalTrainingSessions(thisMonthSessions);
        }

        // Load members
        const membersResult = await getOrganizationMembers(organization.id);
        if (membersResult.data) {
          setTotalMembers(membersResult.data.length);
          const pendingCount = membersResult.data.filter(member => !member.approved).length;
          setPendingMembersCount(pendingCount);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setTodaysUnapprovedCount(0);
        setSelectedDateUnapprovedCount(0);
        setPendingApprovalsCount(0);
        setTotalMembers(0);
        setTotalTrainingSessions(0);
      }
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [organization?.id, selectedDate]);

  // Check if user has admin access
  const hasAdminAccess = user?.user_type === 'super_user' || 
                        (user?.user_type === 'organization_member' && 
                         (user?.member_profile?.role === 'admin' || user?.member_profile?.role === 'range_officer'));

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

  const handleBulkApproveToday = async () => {
    if (!organization?.id) return;
    
    try {
      // Get today's pending sessions from database
      const result = await getOrganizationTrainingSessions(organization.id);
      if (!result.data) return;
      
      const today = new Date().toDateString();
      const todayPending = result.data.filter(session => 
        !session.verified && session.start_time && new Date(session.start_time).toDateString() === today
      );
      
      if (todayPending.length === 0) {
        alert('Ingen ikke-godkjente treningsøkter funnet for dagens dato.');
        return;
      }

      if (window.confirm(`Godkjenn alle ${todayPending.length} treningsøkter for dagens dato?`)) {
        const adminName = profile?.full_name || 'Admin';
        
        // Verify all today's sessions
        // Process all sessions in parallel for faster bulk approval
        await Promise.all(
          todayPending.map(session => 
            verifyTrainingSession(session.id, adminName)
          )
        );
        
        // Reset counts
        setTodaysUnapprovedCount(0);
        setPendingApprovalsCount(prev => Math.max(0, prev - todayPending.length));
      }
    } catch (error) {
      console.error('Error in bulk approve today:', error);
      alert('Det oppstod en feil ved bulk-godkjenning.');
    }
  };

  const handleBulkApproveSelectedDate = async () => {
    if (!organization?.id) return;
    
    try {
      // Get selected date's pending sessions from database
      const result = await getOrganizationTrainingSessions(organization.id);
      if (!result.data) return;
      
      const selected = new Date(selectedDate).toDateString();
      const selectedPending = result.data.filter(session => 
        !session.verified && session.start_time && new Date(session.start_time).toDateString() === selected
      );
      
      if (selectedPending.length === 0) {
        alert('Ingen ikke-godkjente treningsøkter funnet for valgt dato.');
        return;
      }

      if (window.confirm(`Godkjenn alle ${selectedPending.length} treningsøkter for ${new Date(selectedDate).toLocaleDateString('nb-NO')}?`)) {
        const adminName = profile?.full_name || 'Admin';
        
        // Verify all selected date's sessions
        // Process all sessions in parallel for faster bulk approval
        await Promise.all(
          selectedPending.map(session => 
            verifyTrainingSession(session.id, adminName)
          )
        );
        
        // Reset counts
        setSelectedDateUnapprovedCount(0);
        setPendingApprovalsCount(prev => Math.max(0, prev - selectedPending.length));
      }
    } catch (error) {
      console.error('Error in bulk approve selected date:', error);
      alert('Det oppstod en feil ved bulk-godkjenning.');
    }
  };

  return (
    <div className="space-y-8">
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
          {pendingApprovalsCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1 inline-flex">
              {pendingApprovalsCount}
            </span>
          )}
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatisticsCard
              title="Totale medlemmer"
              value={totalMembers}
              icon={Users}
              color="yellow"
              onClick={() => setActiveTab('members')}
            />
            <StatisticsCard
              title="Ventende godkjenning"
              value={pendingMembersCount}
              icon={AlertCircle}
              color="orange"
              onClick={() => setActiveTab('members')}
            />
            <StatisticsCard
              title="Ikke-godkjente treninger"
              value={todaysUnapprovedCount}
              icon={Shield}
              color="red"
            />
            <StatisticsCard
              title="Denne måneds treninger"
              value={totalTrainingSessions}
              icon={TrendingUp}
              color="green"
            />
          </div>

          {/* Membership Progress Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              {organization?.id && (
                <MembershipProgressCard 
                  organizationId={organization.id}
                  onLimitReached={() => {
                    // Navigate to settings tab for upgrade
                    setActiveTab('settings');
                  }}
                />
              )}
            </div>
          </div>

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


      {activeTab === 'settings' && (
        <OrganizationSettings />
      )}

      {activeTab === 'qr' && (
        <QRCodeManagement />
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

      {/* Supabase Connection Status - Bottom of page */}
      <div className="mt-12 pt-6 border-t border-gray-700">
        <SupabaseStatus iconOnly={true} />
      </div>
    </div>
  );
}