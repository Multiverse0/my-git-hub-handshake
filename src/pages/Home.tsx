import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, ClipboardList, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SalesBannerCarousel } from '../components/SalesBannerCarousel';

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const getFirstName = () => {
    if (!profile?.full_name) return 'Bruker';
    return profile.full_name.split(' ')[0];
  };

  const handleStartScanning = () => {
    // Navigate to scanner and trigger camera start
    navigate('/scanner', { state: { autoStart: true } });
  };
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-svpk-yellow mb-4">
          {t('home.welcome', { name: getFirstName() })}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {t('home.description')}
        </p>
      </header>

      <div className="space-y-6">
        <div className="card">
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-gray-700 p-4 rounded-full mb-4">
              <QrCode className="w-8 h-8 text-svpk-yellow" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('home.scan_qr')}</h2>
            <p className="text-gray-400 mb-4">
              {t('home.scan_description')}
            </p>
            <button 
              onClick={handleStartScanning}
              className="btn-primary"
            >
              {t('home.start_scanning')}
            </button>
          </div>
        </div>

        {/* Sales Banners */}
        <SalesBannerCarousel />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-gray-700 p-4 rounded-full mb-4">
                <ClipboardList className="w-8 h-8 text-svpk-yellow" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Se Logg</h2>
              <p className="text-gray-400 mb-4">
                Se oversikt over dine gjennomførte treningsøkter
              </p>
              <button 
                onClick={() => navigate('/log')}
                className="btn-primary"
              >
                Vis Logg
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-gray-700 p-4 rounded-full mb-4">
                <Download className="w-8 h-8 text-svpk-yellow" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Last ned PDF</h2>
              <p className="text-gray-400 mb-4">
                Last ned treningsloggen som PDF når du har 10 økter
              </p>
              <button 
                onClick={() => navigate('/log')}
                className="btn-primary"
              >
                Last ned
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}