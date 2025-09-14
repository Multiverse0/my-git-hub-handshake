import { useState, useEffect } from 'react';

interface SalesBanner {
  id: string;
  imageUrl: string;
  fileName: string;
  uploadDate: string;
  active: boolean;
  linkUrl?: string;
}

export function SalesBannerCarousel() {
  const [banners, setBanners] = useState<SalesBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    // Load banners from localStorage
    const loadBanners = () => {
      try {
        const saved = localStorage.getItem('salesBanners');
        if (saved) {
          const allBanners = JSON.parse(saved);
          const activeBanners = allBanners.filter((banner: SalesBanner) => banner.active);
          setBanners(activeBanners);
        }
      } catch (error) {
        console.error('Error loading sales banners:', error);
      }
    };

    loadBanners();

    // Listen for changes in localStorage
    const handleStorageChange = () => {
      loadBanners();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check for updates every 5 seconds
    const interval = setInterval(loadBanners, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Auto-rotate banners every 15 seconds
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Don't render if no active banners
  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  const BannerContent = () => (
    <div className="w-full">
      <img 
        src={currentBanner.imageUrl}
        alt={currentBanner.fileName}
        className="w-full h-auto max-h-64 object-cover rounded-lg"
        style={{ aspectRatio: '6/1' }}
      />
    </div>
  );

  return (
    <div className="w-full mb-6">
      <div className="relative overflow-hidden rounded-lg">
        {currentBanner.linkUrl ? (
          <a 
            href={currentBanner.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] transform duration-200"
            title={`Klikk for å besøke ${currentBanner.linkUrl}`}
          >
            <BannerContent />
          </a>
        ) : (
          <BannerContent />
        )}
        
        {/* Banner indicators if multiple banners */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentBannerIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Banner counter if multiple banners */}
        {banners.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {currentBannerIndex + 1} / {banners.length}
          </div>
        )}
      </div>
    </div>
  );
}