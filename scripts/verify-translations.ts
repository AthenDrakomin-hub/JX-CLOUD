// scripts/verify-translations.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zlbemopcgjohrnyyiwvs.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define all translation keys that should be present in the database
const expectedTranslationKeys = [
  // Core navigation and UI elements
  'jxCloud', 'dashboard', 'rooms', 'orders', 'menu', 'inventory', 'finance', 'financial_hub', 
  'users', 'settings', 'images', 'supply_chain', 'signOut', 'enMode', 'zhMode', 'filMode', 
  'enterprise_auth', 'collapse', 'expand', 
  // Authentication and authorization
  'auth_title', 'auth_subtitle', 'auth_passkey_entry', 'auth_passkey_desc', 'auth_root_access', 
  'email_placeholder', 'auth_verify', 'rls_status', 'auth_failed', 'auth_passkey_error', 
  'auth_not_found', 'auth_not_allowed', 'auth_register_init', 'auth_register_desc', 
  'digital_driven', 'cloud_kitchen', 'auth_description', 'master_inject_btn', 'intel_node', 
  // Registration and approval
  'registration_pending_title', 'registration_pending_message', 'registration_email_sent', 
  'back_to_login', 'auth_network_error', 'auth_registration_error', 
  // Common operations
  'save', 'cancel', 'delete', 'edit', 'add', 'search', 'confirm', 'refresh', 
  'success', 'error', 'new_order_toast', 'sync_active', 'sync_offline',
  // System and administration
  'sys_console', 'visual_tab', 'infra_tab', 'apply_settings', 'visual_theme', 'themeLight', 
  'themeDark', 'font_typography', 'hardware_link', 'autoPrint', 'supply_chain_mgmt', 
  'client_preview', 'rbac_title', 'accounts', 'partners', 'issue_account', 'root_authority', 
  'bind_biometric', 'identity_secured', 'activate_token_generated', 'activation_desc', 
  'copied', 'confirm', 'local_name', 'module_permissions', 'enable_e', 'create_c', 'update_u', 
  'delete_d', 'save_permissions', 'issue_certificate', 'staff_activate_error', 'staff_activate_title', 
  'staff_activate_subtitle', 'staff_activate_id', 'staff_activate_role', 'staff_activate_email', 
  'staff_activate_btn', 'staff_activate_desc', 'staff_activate_done', 'financial_console', 
  'financial_hub', 'revenue_flow', 'cashierShift', 'daily_revenue', 'cashIncome', 'digitalIncome', 
  'transactionLog', 'noData', 'shiftReport', 'endShift', 'errorOccurred', 'errorDescription', 
  'retryAction', 'reportIssue', 'stationManagement', 'generateAllQR', 'zone', 'ready', 'manualOrder', 
  'orderSummary', 'clear', 'emptyCart', 'totalBill', 'placeOrder', 'station', 'guestQRCode', 
  'displayQRDesc', 'staffOperatedDesc', 'printTicket', 'voidOrder', 'standardMode', 'kdsMode', 
  'viewAudit', 'acceptOrder', 'completeOrder', 'secureCloudActive', 'revenue', 'profit_estimate', 
  'pending_orders', 'avgOrderValue', 'trend_analysis', 'node_security', 'taxonomy_mgmt', 
  'add_l1_cat', 'deploy_arch', 'all_assets', 'dish_archives', 'new_asset', 'inventory', 
  'edit_asset', 'new_asset_registry', 'overwrite_record', 'deploy_asset', 'permanently_delete', 
  'currency', 'preProductionAudit', 'productionReadiness', 'deploymentDesc', 'completed', 'pending', 
  'responseLatency', 'globalCdn', 'dataIntegrity', 'ddosMitigation', 'statusActive', 'sslTlsLabel', 
  'sslTlsDesc', 'jwtAuthLabel', 'jwtAuthDesc', 'corsPolicyLabel', 'corsPolicyDesc', 'envVarsLabel', 
  'envVarsDesc', 'dbProdLabel', 'dbProdDesc', 'redisCacheLabel', 'redisCacheDesc', 'dbBackupLabel', 
  'dbBackupDesc', 'paymentSdkLabel', 'paymentSdkDesc', 'cloudPrintLabel', 'cloudPrintDesc', 
  'infraSecurity', 'backendStorage', 'businessIntegration', 'cloud_gateway', 'visual_center', 
  'vault_info', 'syncing', 'upload_new', 'copy_url', 'preview', 'dimension_info', 'copy_link', 
  'admin_setup_title', 'admin_setup_subtitle', 'admin_setup_entity', 'admin_setup_welcome', 
  'admin_setup_btn', 'admin_setup_done', 'admin_setup_redirect', 'tax_info'
];

async function verifyTranslations() {
  console.log('Starting translation verification...');
  
  const missingKeys: { key: string; language: string }[] = [];
  
  for (const key of expectedTranslationKeys) {
    // Check if this key exists for all languages (zh, en, fil)
    for (const lang of ['zh', 'en', 'fil']) {
      const { data, error } = await supabase
        .from('translations')
        .select('key')
        .eq('key', key)
        .eq('language', lang)
        .single();
      
      if (error || !data) {
        missingKeys.push({ key, language: lang });
        console.log(`❌ Missing: ${key} for language ${lang}`);
      } else {
        console.log(`✅ Found: ${key} for language ${lang}`);
      }
    }
  }
  
  if (missingKeys.length === 0) {
    console.log('\n🎉 All translation keys are present in the database!');
    console.log(`Verified ${expectedTranslationKeys.length} keys across 3 languages.`);
  } else {
    console.log(`\n⚠️  Found ${missingKeys.length} missing translations:`);
    missingKeys.forEach(({ key, language }) => {
      console.log(`  - ${key} (${language})`);
    });
    
    console.log('\nTo fix this, run the populate-translations script:');
    console.log('  npm run populate-translations');
  }
  
  return missingKeys.length === 0;
}

// Run the verification
verifyTranslations()
  .then(success => {
    if (success) {
      console.log('\n✅ Translation verification passed!');
    } else {
      console.log('\n❌ Translation verification failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during verification:', error);
    process.exit(1);
  });