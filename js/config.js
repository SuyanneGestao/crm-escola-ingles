/* ========================================
   Configuração do Sistema - CRM Escola de Inglês
   Suyanne Gestão · v2.2
   ======================================== */

window.APP_CONFIG = {
    // ===== SUPABASE =====
    SUPABASE_URL: 'https://waoinjpwdhdjhiybjuue.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhb2luanB3ZGhkamhpeWJqdXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDE0OTEsImV4cCI6MjA5MjMxNzQ5MX0.kVZx8I9geVvsKifw4-OnUjgr9--kYtdLEjQ_fcstN18',

    // ===== GOOGLE CALENDAR =====
    // ⚠️ CLIENT ID CORRETO (terminando em 7r412...)
    GOOGLE_CLIENT_ID: '489155964163-7r412epueqolfp7p9t19s4psn9n15b7n.apps.googleusercontent.com',
    GOOGLE_API_KEY: 'AIzaSyCQrviKrr0QPeDZyywqaKSv-zwESIcgs5E',
    GOOGLE_DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    GOOGLE_SCOPES: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',

    // ===== APP =====
    APP_NAME: 'Central de Gestão',
    APP_VERSION: '2.2',
    USE_SUPABASE: true,
    USE_DEMO_FALLBACK: true,
};

// Compatibilidade com código antigo
window.SUPABASE_CONFIG = {
    URL: window.APP_CONFIG.SUPABASE_URL,
    KEY: window.APP_CONFIG.SUPABASE_ANON_KEY
};

console.log('📋 Config v' + window.APP_CONFIG.APP_VERSION + ' carregado');
