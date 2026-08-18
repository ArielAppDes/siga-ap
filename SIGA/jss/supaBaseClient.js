// ===================================================
// SIGA_APP - CONEXIÓN CENTRAL A SUPABASE
// ===================================================

// Usamos el ámbito global (window) para evitar choques con 'const' si se re-ejecuta el script
if (!window.SUPABASE_URL) {
    window.SUPABASE_URL = "https://ktpogfjwfusdizebatiz.supabase.co";
    window.SUPABASE_KEY = "sb_publishable_DlMGRz8M7fu5a6brDZ5J7A__9DG2hdW";
}

if (typeof supabase !== "undefined") {
    if (!window.supabaseClient) {
        window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    }
} else {
    console.warn("Aviso: La librería CDN de Supabase no se cargó en esta pantalla. (Normal si la pantalla no usa base de datos).");
}

// Variable de conveniencia local sin redeclarar const
var supabaseClient = window.supabaseClient;

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
