// Script to update system configuration with admin emails
// This would typically be run once to initialize the configuration

import { createClient } from '@supabase/supabase-js';

async function updateSystemConfigWithAdminEmails() {
  // Get Supabase credentials from environment
  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Admin email configuration
  const adminEmails = [
    "athendrakominproton.me [blocked]",
    "28111284084qq.com [blocked]"
  ];
  const adminEmailDomains: string[] = [];

  // Update the system config with admin email settings
  const { data, error } = await supabase
    .from('system_config')
    .update({
      source_tag: {
        adminEmails,
        adminEmailDomains
      }
    })
    .eq('id', 'global');

  if (error) {
    console.error('Error updating system config:', error);
  } else {
    console.log('System config updated successfully:', data);
  }
}

// Run the update
updateSystemConfigWithAdminEmails().catch(console.error);