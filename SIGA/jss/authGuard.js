(async function verificarSesion() {
    const db = window.supabaseClient || window.supabase;
    if (!db) return;

    const { data: { session } } = await db.auth.getSession();
    const paginaActual = window.location.pathname.split("/").pop() || "index.html";

    // Si NO hay sesión y NO está en el login -> Expulsa a index.html
    if (!session && paginaActual !== "index.html") {
        window.location.href = "index.html";
        return;
    }

    // Si YA hay sesión y está en index.html -> Redirige al Dashboard
    if (session && paginaActual === "index.html") {
        window.location.href = "dashboard.html";
        return;
    }
})();
