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

// ===================================================
// LÓGICA DEL MENÚ RESPONSIVE (MÓVIL)
// ===================================================

// Función global para abrir/cerrar el menú al tocar el botón ☰
window.toggleMenu = function() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

// Cierra el menú automáticamente si el usuario hace clic/tap fuera de él
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const btnMenu = document.querySelector('.btn-hamburger');
    
    if (sidebar && sidebar.classList.contains('active')) {
        // Si el clic NO fue dentro del sidebar ni en el botón hamburguesa, lo cerramos
        if (!sidebar.contains(e.target) && !btnMenu?.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});
