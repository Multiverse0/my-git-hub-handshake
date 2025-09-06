import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { startTrainingSession, getTrainingLocationByQR } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


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
      
      // Start training session in database
      const sessionResult = await startTrainingSession(
        user.organization_id!,
        user.id,
        location.id
      );
      
      if (sessionResult.error) {
        if (sessionResult.error.includes('allerede registrert')) {
          // Show duplicate registration modal
          setError(null);
          setSuccess(false);
          setScanning(false);
          setIsProcessing(false);
          
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
                  Du har allerede registrert trening i dag.<br>
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
        throw new Error(sessionResult.error);
      }
      
      // Show success message
      setSuccess(true);
      setScanning(false);
      
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

  const handleManualInput = () => {
    if (isProcessing) {
      return;
    }
    
    // Stop scanning first
    setScanning(false);
    cleanup();
    
    const code = prompt('Skriv inn QR-kode manuelt:\n\nGyldige koder:\n• svpk-innendors-25m\n• svpk-utendors-25m');
    
    if (code && code.trim()) {
      const trimmedCode = code.trim();
      
      // Reset states before processing
      setError(null);
      setSuccess(false);
      
      handleQRCode(trimmedCode);
    } else {
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