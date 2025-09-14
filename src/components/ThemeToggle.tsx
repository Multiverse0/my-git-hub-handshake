import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
      const isDarkMode = savedTheme === 'dark';
      setIsDark(isDarkMode);
      applyTheme(isDarkMode);
    } else {
      // Default to dark mode
      applyTheme(true);
    }
  }, []);

  const applyTheme = (darkMode: boolean) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      // Get saved background color or use default
      const savedOrg = localStorage.getItem('currentOrganization');
      let backgroundColor = '#111827';
      if (savedOrg) {
        try {
          const orgData = JSON.parse(savedOrg);
          backgroundColor = orgData.background_color || '#111827';
        } catch (error) {
          console.warn('Could not parse organization data');
        }
      }
      document.documentElement.style.setProperty('--background-color', backgroundColor);
      document.body.style.backgroundColor = backgroundColor;
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.setProperty('--background-color', '#ffffff');
      document.body.style.backgroundColor = '#ffffff';
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('userTheme', newTheme ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-sm font-medium text-gray-300">
          {isDark ? 'Mørkt tema' : 'Lyst tema'}
        </span>
        <div className="relative">
          <input
            type="checkbox"
            checked={!isDark}
            onChange={toggleTheme}
            className="sr-only"
          />
          <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
            isDark ? 'bg-gray-600' : 'bg-blue-500'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${
              isDark ? 'translate-x-0.5' : 'translate-x-6'
            }`}>
              <div className="w-full h-full flex items-center justify-center">
                {isDark ? (
                  <Moon className="w-3 h-3 text-gray-600" />
                ) : (
                  <Sun className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}