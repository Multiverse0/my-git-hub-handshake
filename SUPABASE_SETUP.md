# Complete Supabase Setup Guide for AKTIVLOGG

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name: `aktivlogg-production`
3. Choose a database password (save this securely)
4. Select a region close to Norway (e.g., `eu-west-1`)

## 2. Environment Variables

Create a `.env` file in your project root with these variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project dashboard:
- Go to Settings → API
- Copy the Project URL and anon/public key

## 3. Database Setup

### Run Migrations

The project includes several migration files that need to be applied:

1. **Connect to Supabase** (click the button in the top right of Bolt)
2. The migrations will be automatically applied when you connect

### Manual Migration (if needed)

If automatic migration fails, run these in the Supabase SQL Editor:

```sql
-- 1. Create RLS helper functions
-- Copy content from: supabase/migrations/create_rls_functions.sql

-- 2. Setup storage buckets  
-- Copy content from: supabase/migrations/setup_storage_buckets.sql

-- 3. Enable realtime
-- Copy content from: supabase/migrations/enable_realtime.sql
```

## 4. Storage Buckets Setup

The following storage buckets will be created automatically:

- **profiles**: User avatars and profile images (public)
- **documents**: Startkort, diplomas, member documents (private)
- **target-images**: Training session target images (private)
- **logos**: Organization logos (public)

### CORS Configuration

For each bucket, configure CORS in Supabase Dashboard:

1. Go to Storage → Settings
2. Add CORS policy:

```json
{
  "allowedOrigins": ["*"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

## 5. Authentication Setup

### Email Templates (Optional)

Customize email templates in Supabase Dashboard:
- Go to Authentication → Email Templates
- Customize signup confirmation, password reset, etc.

### Auth Settings

1. Go to Authentication → Settings
2. **Site URL**: Set to your production domain
3. **Redirect URLs**: Add your production and development URLs
4. **Email Confirmation**: Disable for demo (enable for production)

## 6. Row Level Security (RLS)

All tables have RLS enabled with proper policies:

- **Super users**: Full access to everything
- **Organization members**: Access only to their organization's data
- **Public**: Read access to active organizations only

### Test RLS Policies

1. Create a test user in Authentication
2. Try accessing data from different organizations
3. Verify users can only see their own organization's data

## 7. Edge Functions Setup (Email Service)

### Deploy Email Function

```bash
# In your local terminal (not in Bolt)
supabase functions deploy send-email
```

### Environment Variables for Edge Functions

In Supabase Dashboard → Edge Functions → Environment Variables:

```bash
EMAIL_API_KEY=your_sendgrid_or_mailgun_api_key
EMAIL_SERVICE=sendgrid
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Organization Name
```

### Test Email Function

Use the Email Management panel in the Super Admin dashboard to test email functionality.

## 8. Realtime Setup

Realtime is automatically enabled for:
- `member_training_sessions`
- `organization_members` 
- `training_locations`
- `training_session_details`
- `session_target_images`

This enables live updates when:
- New training sessions are registered
- Members are approved/added
- Training sessions are verified

## 9. Security Configuration

### API Keys

- **Anon Key**: Used for public access (safe to expose)
- **Service Role Key**: Keep secret, used for admin operations

### Database Security

- All tables use Row Level Security (RLS)
- Policies ensure data isolation between organizations
- Super users have elevated access through policy exceptions

## 10. Production Deployment

### Environment Variables for Production

Set these in your hosting platform (Netlify, Vercel, etc.):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Configuration

The project is configured for static deployment:

```bash
npm run build
```

### Domain Configuration

1. Set your production domain in Supabase Auth settings
2. Update CORS policies to include your domain
3. Configure custom domain in your hosting platform

## 11. Monitoring and Maintenance

### Database Monitoring

- Monitor query performance in Supabase Dashboard
- Set up alerts for high resource usage
- Regular backup verification

### User Management

- Monitor user registrations and approvals
- Track training session activity
- Review storage usage regularly

### Security Auditing

- Regular review of RLS policies
- Monitor authentication logs
- Update dependencies regularly

## 12. Troubleshooting

### Common Issues

1. **CORS Errors**: Check storage bucket CORS configuration
2. **RLS Errors**: Verify user context is set properly
3. **Auth Errors**: Check redirect URLs and site URL settings
4. **Storage Errors**: Verify bucket policies and file permissions

### Debug Tools

- Use the SupabaseStatus component to check connection health
- Check browser console for detailed error messages
- Use Supabase Dashboard logs for server-side issues

### Support

- Supabase Documentation: [docs.supabase.com](https://docs.supabase.com)
- Community Support: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- AKTIVLOGG Support: yngve@promonorge.no

## 13. Data Migration (From Demo)

If you have demo data in localStorage that needs to be migrated:

1. Export data using the Super Admin data export feature
2. Create corresponding records in Supabase using the admin panels
3. Verify all data is properly migrated
4. Test all functionality with real database

This completes the full Supabase integration setup for AKTIVLOGG!