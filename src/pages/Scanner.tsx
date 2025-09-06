import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { startTrainingSession, getRangeLocationByQRCode, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { TrainingSession } from '../lib/types';

// Fallback function for localStorage-based training session
const createLocalTrainingSession = (rangeLocationId: string, userId: string, rangeName: string, profile: any): TrainingSession => {
  console.log('Creating local training session:', { rangeLocationId, userId, rangeName });
  console.log('Profile data:', profile);
  
  const session: TrainingSession = {
    id: Date.now().toString(),
    user_id: userId,
    range_location_id: rangeLocationId,
    start_time: new Date().toISOString(),
    end_time: undefined,
    verified: false,
    verified_by: undefined,
    verification_time: undefined,
    manual_entry: false,
    range_officer_approval: false,
    range_officer_name: undefined,
    details: undefined,
    target_images: []
  };

  // Save to localStorage
  try {
    const existingSessions = localStorage.getItem('trainingSessions');
    console.log('Existing sessions in localStorage:', existingSessions);
    const sessions = existingSessions ? JSON.parse(existingSessions) : [];
    
    const fullName = profile?.full_name || 'Ukjent bruker';
    console.log('Using full name:', fullName);
    
    // Add session with display information
    const newSession = {
      ...session,
      rangeName, // Add range name for display
      memberName: fullName,
      date: new Date(),
      duration: '2 timer',
      location: rangeName,
      approved: false,
      rangeOfficer: undefined
    };
    
    console.log('New session to save:', newSession);
    sessions.push(newSession);
    
    localStorage.setItem('trainingSessions', JSON.stringify(sessions));
    console.log('Training session saved to localStorage:', newSession);
    console.log('All sessions in localStorage:', sessions);
    
    // Verify it was saved
    const savedSessions = localStorage.getItem('trainingSessions');
    console.log('Verification - sessions after save:', savedSessions);
  } catch (error) {
    console.error('Error saving training session to localStorage:', error);
  }

  return session;
};

// Fallback function for localStorage-based range location lookup
const getLocalRangeLocation = (qrCodeId: string) => {
  try {
    console.log('Looking for range location with QR code:', qrCodeId);
    const savedRanges = localStorage.getItem('rangeLocations');
    console.log('Saved ranges in localStorage:', savedRanges);
    
    if (savedRanges) {
      const ranges = JSON.parse(savedRanges);
      console.log('Parsed ranges:', ranges);
      const range = ranges.find((r: any) => r.qr_code_id === qrCodeId);
      console.log('Found range in localStorage:', range);
      return range;
    } else {
      console.log('No saved ranges found, creating default ranges');
      // Create default ranges if none exist
      const defaultRanges = [
        {
          id: '1',
          name: 'Innendørs 25m',
          qr_code_id: 'svpk-innendors-25m'
        },
        {
          id: '2', 
          name: 'Utendørs 25m',
          qr_code_id: 'svpk-utendors-25m'
        }
      ];
      localStorage.setItem('rangeLocations', JSON.stringify(defaultRanges));
      console.log('Created default ranges:', defaultRanges);
      
      const range = defaultRanges.find((r: any) => r.qr_code_id === qrCodeId);
      console.log('Found range in default ranges:', range);
      return range;
    }
  } catch (error) {
    console.error('Error loading ranges from localStorage:', error);
  }
  return null;
};

// Get random range officer for verification
const getRandomRangeOfficer = () => {
  const officers = [
    'Magne Angelsen',
    'Kenneth S. Fahle', 
    'Knut Valle',
    'Yngve Rødli',
    'Bjørn-Kristian Pedersen',
    'Espen Johansen',
    'Kurt Wadel',
    'Carina Wadel'
  ];
  return officers[Math.floor(Math.random() * officers.length)];
};

export function Scanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, profile } = useAuth();
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanAttempts, setScanAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check if we have a code parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('c'); // Support both 'code' and 'c' parameters
    
    if (code) {
      handleQRCode(code);
    }

    // Check if we should auto-start the camera
    if (location.state?.autoStart) {
      setScanning(true);
      setError(null);
      setLastScannedCode(null);
      setIsProcessing(false);
      setScanAttempts(0);
    }

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (scanning) {
      startScanning();
    } else {
      cleanup();
    }
  }, [scanning]);

  const startScanning = async () => {
    try {
      console.log('🎯 Starting QR Scanner...');
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Create QR Scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🎉 QR Code detected:', result.data);
          handleScan(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      // Start scanning
      await qrScannerRef.current.start();
      console.log('✅ QR Scanner started successfully');

    } catch (error) {
      console.error('❌ Failed to start QR scanner:', error);
      
      // Fallback to front camera
      try {
        console.log('🔄 Trying front camera...');
        if (qrScannerRef.current) {
          qrScannerRef.current.destroy();
        }
        
        qrScannerRef.current = new QrScanner(
          videoRef.current!,
          (result) => {
            console.log('🎉 QR Code detected (front cam):', result.data);
            handleScan(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'user'
          }
        );

        await qrScannerRef.current.start();
        console.log('✅ QR Scanner started with front camera');
        
      } catch (frontCameraError) {
        console.error('❌ Both cameras failed:', frontCameraError);
        setError('Kunne ikke starte kamera. Sjekk at du har gitt tilgang til kamera.');
      }
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up QR scanner...');
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const handleScan = async (scannedText: string) => {
    if (!scannedText || isProcessing) return;
    
    // Prevent duplicate scans within a short time window
    if (lastScannedCode === scannedText) {
      console.log('Duplicate scan prevented');
      return;
    }

    // Increment scan attempts for debugging
    setScanAttempts(prev => prev + 1);
    console.log(`🔍 Scan attempt ${scanAttempts + 1}:`, scannedText);

    try {
      let code = scannedText.trim();
      console.log('📝 Raw QR text:', code);
      
      // Handle URL format (extract code parameter)
      if (code.includes('scanner?c=') || code.includes('scanner?code=')) {
        const urlParams = new URLSearchParams(code.split('?')[1]);
        code = urlParams.get('c') || urlParams.get('code') || code;
        console.log('🔗 Extracted code from URL:', code);
      }
      
      // Handle full URLs (extract just the code part)
      if (code.includes('http')) {
        try {
          const url = new URL(code);
          const params = new URLSearchParams(url.search);
          code = params.get('c') || params.get('code') || code;
          console.log('🌐 Extracted code from full URL:', code);
        } catch (urlError) {
          console.log('Not a valid URL, using as-is');
        }
      }
      
      console.log('🎯 Final code to process:', code);

      if (!code) {
        throw new Error(`Tom QR-kode skannet`);
      }

      console.log('✅ Final extracted code:', code);
      setLastScannedCode(scannedText);
      await handleQRCode(code);
      
    } catch (error) {
      console.error('❌ QR Scan Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Ukjent feil ved skanning av QR-kode';
      setError(errorMsg);
      
      // Reset error and last scanned code after a delay
      setTimeout(() => {
        setLastScannedCode(null);
        setError(null);
      }, 3000);
    }
  };

  const handleQRCode = async (code: string) => {
    console.log('=== HANDLE QR CODE CALLED ===');
    console.log('Code received:', code);
    console.log('isProcessing:', isProcessing);
    
    if (isProcessing) {
      console.log('Already processing, skipping...');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    if (!isAuthenticated || !user?.id || !profile) {
      const errorMsg = 'Du må være logget inn for å registrere trening.';
      console.error('Authentication check failed:', { isAuthenticated, userId: user?.id, profile });
      setError(errorMsg);
      setIsProcessing(false);
      return;
    }

    // Check if user already registered today
    const today = new Date().toDateString();
    const existingSessions = localStorage.getItem('trainingSessions');
    if (existingSessions) {
      const sessions = JSON.parse(existingSessions);
      // Check by member name AND date to prevent login/logout exploit
      const memberName = profile?.full_name || 'Ukjent bruker';
      const todaySession = sessions.find((session: any) => 
        (session.user_id === user.id || session.memberName === memberName) && 
        new Date(session.date).toDateString() === today
      );
      
      if (todaySession) {
        // Show humorous duplicate registration message
        setError(null);
        setSuccess(false);
        setScanning(false);
        setIsProcessing(false);
        
        // Show duplicate registration modal
        const duplicateModal = document.createElement('div');
        duplicateModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50';
        duplicateModal.innerHTML = `
          <div class="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-2xl">
            <div class="flex flex-col items-center p-8 text-center">
              <div class="text-8xl mb-4">🤔</div>
              <div class="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-full mb-6">
                <span class="text-2xl font-bold">ALLEREDE REGISTRERT!</span>
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                Rolig an der, ivrig skytter! 😄
              </h2>
              <p class="text-gray-600 mb-6 text-lg">
                Du har allerede registrert trening i dag kl. ${new Date(todaySession.date).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}.<br>
                <strong>Én trening per dag</strong> er nok for å holde seg i form! 🎯
              </p>
              <div class="bg-gray-50 rounded-lg p-4 mb-6 w-full">
                <p class="text-sm text-gray-600">
                  💡 <strong>Tips:</strong> Kom tilbake i morgen for å registrere ny trening!
                </p>
              </div>
              <button onclick="this.closest('.fixed').remove()" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors duration-200 w-full">
                Skjønner! 👍
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(duplicateModal);
        return;
      }
    }

    console.log('Starting processing...');
    
    try {
      console.log('=== STARTING QR CODE PROCESSING ===');
      console.log('Code:', code);
      console.log('User ID:', user.id);
      console.log('Profile:', profile);
      console.log('Is Authenticated:', isAuthenticated);
      
      // Skip Supabase and go directly to localStorage for reliability
      let rangeLocation;
      console.log('Using localStorage for range location...');
      rangeLocation = getLocalRangeLocation(code);
      console.log('Found range location in localStorage:', rangeLocation);
      
      if (!rangeLocation) {
        console.error('No range location found for code:', code);
        throw new Error(`Kunne ikke finne skytebanen for kode: "${code}". Sjekk at QR-koden er gyldig.`);
      }
      
      console.log('Found range location:', rangeLocation);
      
      // Create training session directly in localStorage
      let session;
      console.log('Creating local training session...');
      session = createLocalTrainingSession(rangeLocation.id, user.id, rangeLocation.name, profile);
      console.log('Training session created locally');
      
      console.log('Final session result:', session);
      
      // Force refresh of training log data by updating localStorage timestamp
      localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
      console.log('Updated training log timestamp for refresh');
      
      // Trigger immediate refresh events
      window.dispatchEvent(new CustomEvent('trainingDataUpdated'));
      window.dispatchEvent(new CustomEvent('storage'));
      
      // Add to pending approvals for admin
      const pendingApprovals = localStorage.getItem('pendingTrainingApprovals');
      const approvals = pendingApprovals ? JSON.parse(pendingApprovals) : [];
      
      const newApproval = {
        id: Date.now().toString(),
        sessionId: session.id,
        memberName: profile?.full_name || 'Ukjent bruker',
        memberNumber: profile?.member_number || 'Ukjent',
        date: new Date().toISOString(),
        location: rangeLocation.name,
        duration: '2 timer',
        approved: false,
        createdAt: new Date().toISOString()
      };
      
      approvals.push(newApproval);
      localStorage.setItem('pendingTrainingApprovals', JSON.stringify(approvals));
      console.log('Added to pending approvals:', newApproval);
      
      console.log('=== SETTING SUCCESS STATE ===');
      // Show success message
      setSuccess(true);
      setScanning(false);
      console.log('Success state set to true');
      console.log('Current success state:', success);
      
      // Redirect to training log after 2 seconds
      setTimeout(() => {
        console.log('Navigating to /log');
        navigate('/log');
      }, 5000);
    } catch (error) {
      console.error('Processing Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Det oppstod en feil. Vennligst prøv igjen.';
      setError(errorMsg);
    } finally {
      console.log('Setting isProcessing to false');
      setIsProcessing(false);
    }
  };

  const handleManualInput = () => {
    console.log('=== MANUAL INPUT CLICKED ===');
    
    if (isProcessing) {
      console.log('Currently processing, ignoring manual input');
      return;
    }
    
    // Stop scanning first
    setScanning(false);
    cleanup();
    
    const code = prompt('Skriv inn QR-kode manuelt:\n\nGyldige koder:\n• svpk-innendors-25m\n• svpk-utendors-25m');
    console.log('User entered code:', code);
    
    if (code && code.trim()) {
      const trimmedCode = code.trim();
      console.log('Processing manual code:', trimmedCode);
      
      // Reset states before processing
      setError(null);
      setSuccess(false);
      
      handleQRCode(trimmedCode);
    } else {
      console.log('No code entered or empty code');
      // Restart scanning if user cancelled
      setScanning(true);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center p-8 text-center">
              <div className="bg-green-500 p-6 rounded-full mb-6 animate-pulse">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              <div className="bg-green-100 text-green-800 px-6 py-3 rounded-full mb-6">
                <span className="text-2xl font-bold">✅ REGISTRERT!</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trening Registrert!
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full">
                <div className="text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Medlem:</span>
                    <span className="text-gray-900">{profile?.full_name || 'Ukjent'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Dato:</span>
                    <span className="text-gray-900">{new Date().toLocaleDateString('nb-NO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Tid:</span>
                    <span className="text-gray-900">{new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-8 text-lg">
                Din treningsøkt er nå registrert og venter på godkjenning fra skyteleder!
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Du blir automatisk sendt til treningsloggen om 5 sekunder...
              </p>
              <button
                onClick={() => navigate('/log')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors duration-200 w-full"
              >
                Gå til Treningslogg
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-svpk-yellow mb-4">
          {t('scanner.title')}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {t('scanner.description')}
        </p>
      </header>

      <div className="card max-w-md mx-auto">
        {!scanning ? (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="bg-gray-700 p-4 rounded-full mb-4">
              <QrCode className="w-12 h-12 text-svpk-yellow" />
            </div>
            <h2 className="text-xl font-semibold mb-4">{t('scanner.start_scanning')}</h2>
            <p className="text-gray-400 mb-6">
              {t('scanner.start_camera_description')}
            </p>
            <button
              onClick={() => {
                setError(null);
                setScanning(true);
                setLastScannedCode(null);
                setIsProcessing(false);
                setScanAttempts(0);
              }}
              className="btn-primary w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('scanner.start_camera')
              )}
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}

        {scanning && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                setScanning(false);
                setError(null);
                setLastScannedCode(null);
                setIsProcessing(false);
                setScanAttempts(0);
              }}
              className="btn-secondary"
              disabled={isProcessing}
            >
              {t('scanner.cancel_scanning')}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}