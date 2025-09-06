# AKTIVLOGG - Complete Developer Brief

## 🎯 Project Overview

**AKTIVLOGG** is a comprehensive digital training attendance tracking system designed specifically for Norwegian sports clubs, shooting clubs, and athletic organizations. The system replaces traditional paper-based attendance lists with a modern, QR-code based digital solution.

### 🌟 Key Features
- **No App Required**: Works directly in web browsers on all devices
- **QR Code Registration**: Members scan QR codes to register attendance
- **Multi-tenant SaaS**: Supports multiple organizations with custom branding
- **Complete Admin Suite**: Full member management and reporting

---

## 🎨 Design System & Branding

### Primary Color Palette
```css
/* Primary Brand Colors */
--primary-color: #FFD700;     /* SVPK Gold/Yellow - Main brand color */
--secondary-color: #1F2937;   /* Dark Gray - Text on yellow backgrounds */
--accent-color: #FFA500;      /* Orange - Gradients and highlights */

/* Background Colors */
--bg-primary: #111827;        /* Main dark background */
--bg-secondary: #1F2937;      /* Card backgrounds */
--bg-tertiary: #374151;       /* Input fields, hover states */

/* Text Colors */
--text-primary: #F9FAFB;      /* Primary white text */
--text-secondary: #D1D5DB;    /* Secondary gray text */
--text-tertiary: #9CA3AF;     /* Muted text, placeholders */

/* Border Colors */
--border-primary: #374151;    /* Default borders */
--border-accent: #FFD700;     /* Highlighted borders */

/* Status Colors */
--success: #10B981;           /* Green for success states */
--warning: #F59E0B;           /* Amber for warnings */
--error: #EF4444;             /* Red for errors */
--info: #3B82F6;              /* Blue for information */
```

### 🎨 Color Usage Guidelines

#### **Primary Yellow (#FFD700)**
- Navigation active states
- Primary buttons
- Brand elements and logos
- Success indicators
- Call-to-action elements

#### **Dark Gray (#1F2937)**
- Text on yellow backgrounds
- Navigation bars
- Card backgrounds
- Secondary elements

#### **Background Hierarchy**
- `#111827` - Main page background
- `#1F2937` - Card and component backgrounds  
- `#374151` - Input fields and interactive elements

### 🔤 Typography System

```css
/* Font Family */
font-family: 'Inter', sans-serif;

/* Font Weights */
font-weight: 400;  /* Regular text */
font-weight: 500;  /* Medium - buttons, labels */
font-weight: 600;  /* Semibold - headings */
font-weight: 700;  /* Bold - main titles */

/* Font Sizes */
text-xs: 0.75rem;     /* 12px - Small labels */
text-sm: 0.875rem;    /* 14px - Body text */
text-base: 1rem;      /* 16px - Default */
text-lg: 1.125rem;    /* 18px - Large body */
text-xl: 1.25rem;     /* 20px - Small headings */
text-2xl: 1.5rem;     /* 24px - Section headings */
text-3xl: 1.875rem;   /* 30px - Page titles */
text-4xl: 2.25rem;    /* 36px - Hero titles */

/* Line Heights */
line-height: 1.2;     /* Tight - headings */
line-height: 1.5;     /* Normal - body text */
line-height: 1.6;     /* Relaxed - long text */
```

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom theming
- **Routing**: React Router with protected routes
- **State Management**: React Context API
- **QR Scanning**: HTML5 QR Code library
- **PDF Generation**: jsPDF for training log exports
- **File Uploads**: React Dropzone

### Backend Requirements
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Supabase Storage for documents and images
- **Email Service**: SendGrid/Mailgun integration
- **Edge Functions**: Supabase Edge Functions for email sending

---

## 🎭 Component Design Patterns

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1F2937;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background-color: #1F2937;
  color: #F9FAFB;
  border: 1px solid #374151;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.btn-secondary:hover {
  background-color: #374151;
}
```

### Card Components
```css
.card {
  background-color: #1F2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Status Indicators
```css
/* Success State */
.status-success {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid #10B981;
  color: #10B981;
}

/* Warning State */
.status-warning {
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid #F59E0B;
  color: #F59E0B;
}

/* Error State */
.status-error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid #EF4444;
  color: #EF4444;
}
```

---

## 🏢 Multi-Tenant Architecture

### Organization Branding System
Each organization can customize:
- **Primary Color**: Main brand color (default: `#FFD700`)
- **Secondary Color**: Text color on primary backgrounds (default: `#1F2937`)
- **Background Color**: Dark theme background (default: `#111827`)
- **Logo**: Custom organization logo
- **Organization Name**: Displayed in navigation and headers

### Dynamic Theming Implementation
```typescript
// CSS Custom Properties for dynamic theming
document.documentElement.style.setProperty('--primary-color', organization.primary_color);
document.documentElement.style.setProperty('--secondary-color', organization.secondary_color);
document.documentElement.style.setProperty('--background-color', organization.background_color);
```

---

## 🔐 User Roles & Permissions

### Role Hierarchy
1. **Super User** (`super_user`)
   - Full system access across all organizations
   - Can create/delete organizations
   - System configuration and settings

2. **Organization Admin** (`admin`)
   - Full access within their organization
   - Member management and approval
   - Training session verification

3. **Range Officer** (`range_officer`)
   - Training session verification
   - Limited member management

4. **Member** (`member`)
   - Personal training log access
   - QR code scanning
   - Profile management

---

## 📱 Core User Flows

### 1. Member Registration Flow
```
1. Member visits /register?org=club-slug
2. Fills out registration form (name, email, member ID)
3. System sends welcome email
4. Admin approves member in admin panel
5. System sends approval email with login credentials
6. Member can now log in and use system
```

### 2. Training Registration Flow
```
1. Member visits /scanner
2. Scans QR code posted at training location
3. System automatically registers attendance with timestamp
4. Range officer/admin verifies session in admin panel
5. Verified session appears in member's training log
6. Member can download PDF for weapon license applications
```

### 3. Admin Workflow
```
1. Admin logs in to admin panel
2. Reviews pending member approvals
3. Verifies training sessions
4. Manages QR codes for training locations
5. Generates reports and statistics
```

---

## 🎨 UI/UX Design Principles

### Visual Hierarchy
- **Primary Actions**: Yellow buttons with high contrast
- **Secondary Actions**: Gray buttons with subtle borders
- **Status Indicators**: Color-coded with icons
- **Navigation**: Clear active states with yellow accents

### Responsive Design
- **Mobile-first**: Optimized for smartphone usage
- **Tablet**: Adapted layouts for medium screens
- **Desktop**: Full-featured admin interfaces

### Accessibility
- **High Contrast**: Sufficient color contrast ratios
- **Clear Typography**: Inter font for excellent readability
- **Icon Support**: Lucide React icons for visual clarity
- **Keyboard Navigation**: Full keyboard accessibility

---

## 🔧 Key Components

### Navigation Component
- **Dynamic Branding**: Shows organization logo and colors
- **Role-based Menu**: Different options based on user role
- **Organization Selector**: Super users can switch between organizations

### QR Scanner Component
- **Camera Integration**: HTML5 camera API
- **QR Code Processing**: Handles various QR code formats
- **Error Handling**: Clear feedback for scanning issues
- **Success Animation**: Engaging confirmation flow

### Training Log Component
- **Requirement Tracking**: Visual progress rings for weapon license requirements
- **Filtering System**: Organization, activity type, and date filters
- **PDF Generation**: Official training log exports
- **Status Management**: Verified/unverified session indicators

### Admin Dashboard
- **Member Management**: Approval workflows and role assignment
- **Training Verification**: Bulk approval and individual session management
- **QR Code Management**: Create and manage training location codes
- **Organization Settings**: Branding and configuration options

---

## 📊 Database Schema Overview

### Core Tables
- **organizations**: Multi-tenant organization data
- **organization_members**: Members within each organization
- **training_locations**: QR code enabled training locations
- **member_training_sessions**: Individual training session records
- **super_users**: System administrators

### Security Model
- **Row Level Security (RLS)**: Complete data isolation between organizations
- **Role-based Access**: Granular permissions based on user roles
- **Email-based Authentication**: Secure login with password hashing

---

## 🎯 Business Logic

### Training Requirements
The system tracks different weapon license requirements:

#### **NSF (Norwegian Shooting Federation)**
- **Requirement**: 10 training sessions in 24 months
- **Color**: `#FFD700` (Yellow)
- **Activities**: All training types count

#### **DFS (Dynamic Field Shooting)**
- **Requirement**: 10 training sessions in 24 months
- **Color**: `#A855F7` (Purple)
- **Activities**: Field shooting and hunting-related

#### **DSSN (Dynamic Sport Shooting Norway)**
- **Requirement**: 10 trainings + 10 open competitions
- **Color**: `#4ADE80` (Green)
- **Activities**: Dynamic shooting events

---

## 🌐 Internationalization

### Language System
- **Base Language**: Norwegian (no)
- **Supported Languages**: English, Swedish, Danish, Finnish, German, French, Spanish, Italian, Polish
- **Translation Method**: Google Translate API integration
- **Storage**: localStorage caching for performance

### Translation Keys Structure
```typescript
// Example translation keys
'nav.home': 'Home'
'nav.scanner': 'Scan'
'log.title': 'Training Log'
'admin.member_management': 'Member Management'
```

---

## 📧 Email System

### Email Templates
1. **Welcome Admin**: New administrator onboarding
2. **Welcome Member**: New member registration confirmation
3. **Member Approved**: Account activation notification
4. **Password Reset**: Password recovery emails

### Email Providers
- **SendGrid**: Primary email service
- **Mailgun**: Alternative email service
- **Edge Functions**: Supabase serverless email sending

---

## 🔒 Security Features

### Authentication
- **Email/Password**: Standard authentication flow
- **Session Management**: Secure token handling
- **Password Hashing**: bcrypt with salt rounds

### Data Protection
- **GDPR Compliance**: Data protection and privacy controls
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: Track administrative actions

---

## 📱 Mobile Optimization

### QR Code Scanning
- **Camera Access**: Requests camera permissions
- **Multiple Formats**: Handles various QR code formats
- **Error Recovery**: Fallback options for scanning issues
- **Offline Capability**: Works without internet connection

### Touch Interface
- **Large Touch Targets**: Minimum 44px touch areas
- **Swipe Gestures**: Natural mobile interactions
- **Responsive Typography**: Scales appropriately on all devices

---

## 🚀 Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy loading for admin components
- **Image Optimization**: Compressed logos and assets
- **Caching Strategy**: localStorage for translations and settings

### Backend Optimization
- **Database Indexing**: Optimized queries for large datasets
- **CDN Integration**: Fast asset delivery
- **Edge Functions**: Serverless scaling for email services

---

## 🛠️ Development Setup

### Required Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Edge Functions)
EMAIL_API_KEY=your_sendgrid_or_mailgun_key
EMAIL_SERVICE=sendgrid
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Organization Name
```

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🎨 CSS Custom Properties

### Dynamic Theming Variables
```css
:root {
  /* Brand Colors (customizable per organization) */
  --primary-color: #FFD700;
  --secondary-color: #1F2937;
  --background-color: #111827;
  
  /* Fixed System Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Light Theme Support
```css
.light {
  --bg-primary: #F8FAFC;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-tertiary: #64748B;
  --border-primary: #E2E8F0;
  --background-color: #FFFFFF;
}
```

---

## 🧩 Component Library

### Button Components
```typescript
// Primary Button - Yellow gradient
<button className="btn-primary">
  <Icon className="w-5 h-5" />
  Button Text
</button>

// Secondary Button - Gray with border
<button className="btn-secondary">
  <Icon className="w-5 h-5" />
  Button Text
</button>
```

### Card Components
```typescript
// Standard Card
<div className="card">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-gray-400">Card content</p>
</div>
```

### Status Indicators
```typescript
// Success Status
<div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
  <span className="text-green-400 font-semibold">✅ FULFILLED</span>
</div>

// Warning Status
<div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
  <span className="text-red-400 font-semibold">❌ NOT FULFILLED</span>
</div>
```

---

## 📊 Data Models

### Organization Model
```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  primary_color: string;      // #FFD700
  secondary_color: string;    // #1F2937
  logo_url?: string;
  email?: string;
  phone?: string;
  website?: string;
  active: boolean;
}
```

### Member Model
```typescript
interface OrganizationMember {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  member_number?: string;
  role: 'member' | 'admin' | 'range_officer';
  approved: boolean;
  active: boolean;
}
```

### Training Session Model
```typescript
interface MemberTrainingSession {
  id: string;
  organization_id: string;
  member_id: string;
  location_id: string;
  start_time: string;
  verified: boolean;
  verified_by?: string;
  manual_entry: boolean;
}
```

---

## 🎨 Visual Design Guidelines

### Spacing System (8px Grid)
```css
/* Spacing Scale */
space-1: 0.25rem;   /* 4px */
space-2: 0.5rem;    /* 8px */
space-3: 0.75rem;   /* 12px */
space-4: 1rem;      /* 16px */
space-6: 1.5rem;    /* 24px */
space-8: 2rem;      /* 32px */
space-12: 3rem;     /* 48px */
space-16: 4rem;     /* 64px */
```

### Border Radius
```css
rounded-sm: 0.125rem;   /* 2px */
rounded: 0.25rem;       /* 4px */
rounded-md: 0.375rem;   /* 6px */
rounded-lg: 0.5rem;     /* 8px */
rounded-xl: 0.75rem;    /* 12px */
rounded-2xl: 1rem;      /* 16px */
```

### Shadows
```css
/* Card Shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Hover Shadow */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Button Hover Shadow */
box-shadow: 0 10px 20px rgba(255, 215, 0, 0.3);
```

---

## 🎯 User Experience Patterns

### Loading States
- **Spinner**: `<Loader2 className="w-5 h-5 animate-spin" />`
- **Skeleton**: Gray animated placeholders
- **Progress Bars**: For multi-step processes

### Success Feedback
- **Toast Notifications**: Temporary success messages
- **Modal Confirmations**: Full-screen success states
- **Icon Animations**: Checkmarks and success indicators

### Error Handling
- **Inline Errors**: Form validation messages
- **Error Boundaries**: Graceful component error handling
- **Retry Mechanisms**: User-friendly error recovery

---

## 🌟 Animation & Micro-interactions

### Hover Effects
```css
/* Button Hover */
transform: translateY(-2px);
box-shadow: 0 10px 20px rgba(255, 215, 0, 0.3);

/* Card Hover */
transform: translateY(-5px);
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
```

### Transitions
```css
/* Standard Transition */
transition: all 0.3s ease;

/* Color Transitions */
transition: color 0.2s ease, background-color 0.2s ease;

/* Transform Transitions */
transition: transform 0.3s ease, box-shadow 0.3s ease;
```

---

## 📋 Testing Strategy

### Component Testing
- **Unit Tests**: Individual component functionality
- **Integration Tests**: User flow testing
- **Visual Regression**: Screenshot comparison testing

### User Acceptance Testing
- **QR Code Scanning**: Various devices and lighting conditions
- **Admin Workflows**: Complete administrative processes
- **Multi-tenant**: Organization isolation and branding

---

## 🚀 Deployment & Production

### Build Configuration
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Email service configured
- [ ] SSL certificates installed
- [ ] Performance monitoring enabled
- [ ] Error tracking configured

---

## 📞 Support & Maintenance

### Monitoring
- **Application Performance**: Response times and error rates
- **User Analytics**: Feature usage and adoption
- **System Health**: Database and service status

### Support Channels
- **Email**: yngve@promonorge.no
- **Documentation**: Comprehensive user guides
- **Training**: Administrator onboarding sessions

---

## 🎨 Brand Guidelines Summary

### Primary Brand Colors
- **SVPK Gold**: `#FFD700` - Primary brand color, buttons, highlights
- **Dark Gray**: `#1F2937` - Text, navigation, secondary elements
- **Orange Accent**: `#FFA500` - Gradients and hover states

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Scale**: Consistent 8px spacing system

### Visual Style
- **Modern**: Clean, minimal design with subtle shadows
- **Professional**: Suitable for official documentation
- **Accessible**: High contrast and clear visual hierarchy
- **Responsive**: Optimized for all device sizes

This comprehensive system provides a complete digital transformation solution for Norwegian sports clubs, moving them from paper-based processes to a modern, efficient, and legally compliant digital platform.