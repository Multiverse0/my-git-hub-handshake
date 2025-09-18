import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Building2, Loader2, AlertCircle, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { createAdminUser } from '../lib/supabase';
import { DatabaseService } from '../lib/database';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Organization } from '../lib/types';

export function AdminRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Organization selector states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>(orgSlug || '');
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await DatabaseService.getOrganizations();
        setOrganizations(orgs);
        
        // If there's an org in URL, set it as selected
        if (orgSlug && orgs.find(org => org.slug === orgSlug)) {
          setSelectedOrgSlug(orgSlug);
          const org = orgs.find(org => org.slug === orgSlug);
          if (org) setSelectedOrganization(org);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    };

    loadOrganizations();
  }, [orgSlug]);

  // Update selected organization when slug changes
  useEffect(() => {
    if (selectedOrgSlug) {
      const org = organizations.find(org => org.slug === selectedOrgSlug);
      setSelectedOrganization(org || null);
    } else {
      setSelectedOrganization(null);
    }
  }, [selectedOrgSlug, organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!selectedOrganization) {
      setError('Please select an organization');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const result = await createAdminUser(
        selectedOrganization.id,
        formData.email,
        formData.password,
        formData.fullName
      );

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess('Admin user created successfully! You can now login with your credentials.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(`/login?org=${selectedOrgSlug}`);
      }, 3000);

    } catch (error) {
      console.error('Admin registration error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-500/10 text-orange-400 p-4 rounded-full inline-flex mb-4">
            <Shield className="w-12 h-12" />
          </div>
          
          <h1 className="text-2xl font-bold text-orange-400">
            Admin Registration
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Create a new administrator account
          </p>
          <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3 mt-4">
            <p className="text-xs text-orange-200 text-center">
              ⚠️ This page is for authorized personnel only
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Organization
            </label>
            {loadingOrganizations ? (
              <div className="w-full bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-gray-400">Loading organizations...</span>
              </div>
            ) : organizations.length === 0 ? (
              <div className="w-full bg-gray-700 rounded-lg px-3 py-2 text-gray-400">
                No organizations available
              </div>
            ) : (
              <Select value={selectedOrgSlug} onValueChange={setSelectedOrgSlug}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Select organization" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.slug}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-600 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-600 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-12 py-2 border border-gray-600 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-12 py-2 border border-gray-600 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {success && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !selectedOrgSlug}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Admin...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Admin Account
              </>
            )}
          </button>

          <div className="text-center">
            <div className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to={selectedOrgSlug ? `/login?org=${selectedOrgSlug}` : '/login'}
                className="text-orange-400 hover:text-orange-300"
              >
                Login here
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}