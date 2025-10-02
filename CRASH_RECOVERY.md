# Crash Recovery System

This document explains the crash loop detection and recovery mechanism implemented in this application.

## Overview

The application includes a comprehensive crash recovery system that prevents infinite crash loops and helps users recover when the application encounters critical errors.

## How It Works

### 1. Crash Detection (src/main.tsx)
- **Global Error Handlers**: Catches all uncaught errors and unhandled promise rejections
- **Error Boundary Integration**: Records errors caught by React error boundaries
- **Crash Tracking**: Stores crash records in `sessionStorage` with timestamp, error message, and URL

### 2. Crash Loop Protection
- **Time Window**: 60 seconds
- **Threshold**: 3 crashes within the time window
- **Action**: Automatic emergency recovery when threshold is exceeded

### 3. Emergency Recovery Process
When 3+ crashes occur within 60 seconds:
1. Signs out the user from Supabase
2. Clears `localStorage` (cached data, tokens)
3. Clears `sessionStorage` (crash history)
4. Redirects to `/login`

### 4. Route-Level Error Boundaries (src/components/DashboardRouter.tsx)
- Each route is wrapped in an `ErrorBoundary`
- Errors in one route don't crash the entire application
- Users can navigate to other routes even if one route has errors

### 5. Enhanced EmergencyFallback (src/components/EmergencyFallback.tsx)
When users see the emergency fallback screen, they have several recovery options:

- **🔄 Clear Cache & Retry**: Signs out, clears all storage, redirects to login
- **🏥 Run Health Check**: Tests Supabase connection and redirects if successful
- **↻ Reload Page**: Simple page reload
- **→ Go to Login**: Direct navigation to login

The screen also displays:
- **Crash ID**: Unique identifier for troubleshooting
- **Crash Count**: Number of crashes in last 60 seconds
- **Error Details**: (Development mode only) Shows the actual error message

### 6. Defensive Null Checks
Key components have been hardened with null safety:

- **Admin.tsx**: Checks for `organization?.id` before data loading
- **Navigation.tsx**: Safe access to `branding?.primary_color` with fallback
- All components verify data exists before accessing nested properties

## For Developers

### Adding Crash Logging to New Components
```typescript
try {
  // Your code
} catch (error) {
  console.error('[ComponentName] Error:', error);
  // Error will be automatically recorded by global handlers
  throw error; // Re-throw to trigger error boundary
}
```

### Testing Crash Recovery
To test the crash loop detection:
1. Force 3 errors within 60 seconds
2. Observe automatic emergency recovery
3. Verify clean state after recovery

### Monitoring Crashes
Check the browser console for crash logs:
- `🔥 Uncaught error`: Global error handler
- `🔥 Unhandled promise rejection`: Async error handler
- `🔥 Error boundary caught`: React component error
- `🚨 X crashes in Ys - initiating emergency recovery`: Threshold exceeded

## User Experience

### Normal Error Flow
1. Error occurs in a component
2. Route-level error boundary catches it
3. User sees an error message with reload button
4. User can navigate to other routes
5. No data loss or full app crash

### Crash Loop Flow
1. Multiple errors occur rapidly (3 in 60s)
2. System detects crash loop
3. Emergency recovery automatically triggered
4. User redirected to clean login state
5. Session and cache cleared to prevent recurring errors

## Benefits

✅ **Prevents Infinite Loops**: Automatic recovery after repeated crashes  
✅ **Preserves User Experience**: Route isolation prevents full app crashes  
✅ **Self-Healing**: Automatic cache clearing and sign-out  
✅ **Developer Friendly**: Detailed crash logging and IDs  
✅ **User Friendly**: Clear recovery options and status information  
✅ **Defensive Code**: Null checks prevent common crash causes  

## Configuration

Adjust these constants in `src/main.tsx`:

```typescript
const CRASH_WINDOW = 60000; // Time window in ms (default: 60s)
const MAX_CRASHES = 3;      // Crash threshold (default: 3)
```

## Troubleshooting

If a user reports seeing the emergency fallback repeatedly:
1. Check the Crash ID they provide
2. Look for patterns in error messages
3. Review crash timing (are they rapid-fire or spread out?)
4. Check for null/undefined access in the affected routes
5. Verify Supabase connection is stable
