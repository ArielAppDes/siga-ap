// ===================================================
// SIGA_APP - CONEXIÓN CENTRAL A SUPABASE
// ===================================================

const SUPABASE_URL = "https://ktpogfjwfusdizebatiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_DlMGRz8M7fu5a6brDZ5J7A__9DG2hdW";
if (typeof supabase !== "undefined") {
    // Solo guardamos el cliente en supabaseClient para no romper la librería original
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.warn("Aviso: La librería CDN de Supabase no se cargó en esta pantalla. (Normal si la pantalla no usa base de datos).");
}
