// ===================================================
// SIGA_APP - CONEXIÓN CENTRAL A SUPABASE
// ===================================================

const SUPABASE_URL = "https://ktpogfjwfusdizebatiz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cG9nZmp3ZnVzZGl6ZWJhdGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjU3ODEsImV4cCI6MjEwMTc0MTc4MX0.ztqlcViTRilORg6Lg0cXwO8sM5tdFkptx_xA0UdSrNU";

if (typeof supabase !== "undefined") {
    // Solo guardamos el cliente en supabaseClient para no romper la librería original
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.warn("Aviso: La librería CDN de Supabase no se cargó en esta pantalla. (Normal si la pantalla no usa base de datos).");
}