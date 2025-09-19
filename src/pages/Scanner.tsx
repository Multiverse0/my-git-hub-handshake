import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { startTrainingSession, getTrainingLocationByQR } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DuplicateRegistrationModal } from '../components/DuplicateRegistrationModal';


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
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check if we have a code parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('c'); // Support both 'code' and 'c' parameters
    const autoStart = params.get('auto') === 'true';
    
    if (code) {
      handleQRCode(code);
    }

    // Check if we should auto-start the camera
    if (location.state?.autoStart || autoStart) {
      setScanning(true);
      setError(null);
      setLastScannedCode(null);
      setIsProcessing(false);
      setScanAttempts(0);
      setSuccess(false);
      setShowDuplicateModal(false);
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
    
    const now = Date.now();
    
    // Prevent duplicate scans within a short time window (3 seconds)
    if (lastScannedCode === scannedText || (now - lastProcessTime < 3000)) {
      console.log('Duplicate scan prevented - same code or too soon');
      return;
    }

    setLastProcessTime(now);
    
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
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    if (!isAuthenticated || !user?.id || !user.organization_id) {
      const errorMsg = 'Du må være logget inn for å registrere trening.';
      setError(errorMsg);
      setIsProcessing(false);
      return;
    }


    try {
      // Get training location from database
      const locationResult = await getTrainingLocationByQR(user.organization_id!, code);
      
      if (locationResult.error || !locationResult.data) {
        throw new Error(`Kunne ikke finne skytebanen for kode: "${code}". Sjekk at QR-koden er gyldig.`);
      }
      
      const location = locationResult.data;

      // Start training session in database (discipline will be determined automatically)
      const sessionResult = await startTrainingSession(
        user.organization_id!,
        user.id,
        location.id
      );
      
      if (sessionResult.error) {
        if (sessionResult.error.includes('allerede registrert') || sessionResult.error.includes('Du har allerede registrert')) {
          // Show duplicate registration modal - ensure no conflicts with success state
          setError(null);
          setSuccess(false);
          setScanning(false);
          setIsProcessing(false);
          cleanup(); // Clean up camera resources
          setShowDuplicateModal(true);
          return;
        }
        throw new Error(sessionResult.error);
      }
      
      // Show success message - ensure no conflicts with duplicate modal
      if (!showDuplicateModal) {
        setError(null);
        setShowDuplicateModal(false);
        setSuccess(true);
        setScanning(false);
        cleanup(); // Clean up camera resources
      }
      
      // Redirect to training log after 2 seconds
      setTimeout(() => {
        navigate('/log');
      }, 5000);
    } catch (error) {
      console.error('Processing Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Det oppstod en feil. Vennligst prøv igjen.';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
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
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t('scanner.title')}</h1>
        </div>
        
        <p className="text-muted-foreground mb-6">
          {t('scanner.description')}
        </p>

        {!scanning && !isProcessing && (
          <button
            onClick={() => {
              setScanning(true);
              setError(null);
              setLastScannedCode(null);
              setScanAttempts(0);
            }}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            {t('scanner.startButton')}
          </button>
        )}

        {scanning && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-w-md mx-auto">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50"></div>
              </div>
            </div>

            <button
              onClick={() => setScanning(false)}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {t('scanner.cancelButton')}
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Behandler QR-kode...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive font-medium">Feil</p>
            </div>
            <p className="text-destructive/80 mt-1">{error}</p>
          </div>
        )}
      </div>

      <DuplicateRegistrationModal 
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
      />
    </div>
  );
}