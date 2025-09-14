import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, QrCode, ClipboardList, User, Shield, Menu, X, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { OrganizationSelector } from './OrganizationSelector';
import { SupabaseStatus } from './SupabaseStatus';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, organization, branding } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if user is admin or super user
  const isAdminUser = user?.user_type === 'super_user' || 
                     user?.member_profile?.role === 'admin' ||
                     user?.member_profile?.role === 'range_officer';
  
  return (
    <nav 
      className="bg-gray-800 border-b border-gray-700"
      style={{ 
        borderBottomColor: branding.primary_color + '20'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {(branding.logo_url || organization?.logo_url) ? (
              <img 
                src={branding.logo_url || organization?.logo_url || ''} 
                alt={`${branding.organization_name} Logo`} 
                className="h-10 max-w-[120px] object-contain"
              />
            ) : (
              <div 
                className="h-10 px-4 flex items-center rounded font-bold text-lg"
                style={{ backgroundColor: branding.primary_color, color: branding.secondary_color }}
              >
                {branding.organization_name}
              </div>
            )}
            
            {/* Show pending approval banner for unapproved members */}
            {user?.member_profile && !user.member_profile.approved && (
              <div className="ml-4 px-3 py-1 bg-orange-500/20 border border-orange-500 rounded-full">
                <span className="text-orange-400 text-sm font-medium">
                  ⏳ Venter på godkjenning
                </span>
              </div>
            )}
            
            {/* Supabase Status Indicator */}
            <div className="ml-4">
              <SupabaseStatus />
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <OrganizationSelector />
            
            <NavLink to="/" active={isActive('/')}>
              <Home className="w-5 h-5" />
              <span>{t('nav.home')}</span>
            </NavLink>
            
            <NavLink to="/scanner" active={isActive('/scanner')}>
              <QrCode className="w-5 h-5" />
              <span>{t('nav.scanner')}</span>
            </NavLink>
            
            <NavLink to="/log" active={isActive('/log')}>
              <ClipboardList className="w-5 h-5" />
              <span>{t('nav.log')}</span>
            </NavLink>
            
            <NavLink to="/profile" active={isActive('/profile')}>
              <User className="w-5 h-5" />
              <span>{t('nav.profile')}</span>
            </NavLink>

            {user?.user_type === 'super_user' && (
              <NavLink to="/super-admin" active={isActive('/super-admin')}>
                <Building2 className="w-5 h-5" />
                <span>Super Admin</span>
              </NavLink>
            )}

            {isAdminUser && (
              <NavLink to="/admin" active={isActive('/admin')}>
                <Shield className="w-5 h-5" />
                <span>{t('nav.admin')}</span>
              </NavLink>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/scanner"
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              style={isActive('/scanner') ? { color: branding.primary_color } : {}}
            >
              <QrCode className="w-6 h-6" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2">
              <OrganizationSelector />
            </div>
            
            <MobileNavLink 
              to="/" 
              active={isActive('/')}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span>{t('nav.home')}</span>
            </MobileNavLink>
            
            <MobileNavLink 
              to="/scanner" 
              active={isActive('/scanner')}
              onClick={() => setIsMenuOpen(false)}
            >
              <QrCode className="w-5 h-5" />
              <span>{t('nav.scanner')}</span>
            </MobileNavLink>
            
            <MobileNavLink 
              to="/log" 
              active={isActive('/log')}
              onClick={() => setIsMenuOpen(false)}
            >
              <ClipboardList className="w-5 h-5" />
              <span>{t('nav.log')}</span>
            </MobileNavLink>
            
            <MobileNavLink 
              to="/profile" 
              active={isActive('/profile')}
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="w-5 h-5" />
              <span>{t('nav.profile')}</span>
            </MobileNavLink>

            {user?.user_type === 'super_user' && (
              <MobileNavLink 
                to="/super-admin" 
                active={isActive('/super-admin')}
                onClick={() => setIsMenuOpen(false)}
              >
                <Building2 className="w-5 h-5" />
                <span>Super Admin</span>
              </MobileNavLink>
            )}

            {isAdminUser && (
              <MobileNavLink 
                to="/admin" 
                active={isActive('/admin')}
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="w-5 h-5" />
                <span>{t('nav.admin')}</span>
              </MobileNavLink>
            )}

            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, children }: { 
  to: string; 
  active: boolean; 
  children: React.ReactNode; 
}) {
  const { branding } = useAuth();
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
        active 
          ? 'bg-gray-900' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
      style={active ? { color: branding.primary_color } : {}}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, active, children, onClick }: { 
  to: string; 
  active: boolean; 
  children: React.ReactNode;
  onClick: () => void;
}) {
  const { branding } = useAuth();
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${
        active 
          ? 'bg-gray-900' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
      style={active ? { color: branding.primary_color } : {}}
    >
      {children}
    </Link>
  );
}