// ===================================================
// SIGA_APP - LÓGICA DE ACTIVIDADES (Navegación de Clases)
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarTarjetas();
    configurarEventosModal();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function inicializarTarjetas() {
    // Tarjeta Nueva Capacitación
    document.getElementById("cardNueva")?.addEventListener("click", () => {
        localStorage.removeItem("capacitacion_activa");
        window.location.href = "capacitaciones.html";
    });

    // Tarjeta Programadas
    document.getElementById("cardProgramadas")?.addEventListener("click", () => {
        abrirModalPorEstado("Programado", "Capacitaciones Programadas");
    });

    // Tarjeta En curso
    document.getElementById("cardEnCurso")?.addEventListener("click", () => {
        abrirModalPorEstado("En curso", "Capacitaciones En Curso");
    });

    // Tarjeta Finalizadas
    document.getElementById("cardFinalizadas")?.addEventListener("click", () => {
        abrirModalPorEstado("Finalizado", "Historial de Capacitaciones Finalizadas");
    });
}

function configurarEventosModal() {
    const modal = document.getElementById("modalCapacitaciones");
    const btnCerrar = document.getElementById("btnCerrarModal");

    btnCerrar?.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
}

async function abrirModalPorEstado(estadoFiltro, titulo) {
    const modal = document.getElementById("modalCapacitaciones");
    const txtTitulo = document.getElementById("tituloModal");
    const tbody = document.getElementById("tbodyCapacitaciones");

    if (txtTitulo) txtTitulo.textContent = titulo;
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando datos...</td></tr>';
    if (modal) modal.style.display = "flex";

    const db = obtenerDB();
    if (!db) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Sin conexión a Supabase.</td></tr>';
        return;
    }

    try {
        const { data, error } = await db
            .from("capacitaciones")
            .select("*")
            .eq("estado", estadoFiltro)
            .order("id_cap", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay capacitaciones en estado '<strong>${estadoFiltro}</strong>'.</td></tr>`;
            return;
        }

        renderizarFilasModal(data, estadoFiltro);

    } catch (err) {
        console.error("Error al obtener capacitaciones:", err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Error al consultar la base de datos.</td></tr>';
    }
}

function renderizarFilasModal(lista, estadoFiltro) {
    const tbody = document.getElementById("tbodyCapacitaciones");
    if (!tbody) return;

    tbody.innerHTML = "";

    lista.forEach(item => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";

        let botonAccion = "";

        if (estadoFiltro === "Programado") {
            botonAccion = `<button onclick="editarProgramada('${item.id_cap}')" style="background:#27ae60; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Editar</button>`;
        } else if (estadoFiltro === "En curso") {
            botonAccion = `<button onclick="cargarSiguienteClase('${item.id_cap}')" style="background:#2980b9; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Continuar Clase</button>`;
        } else {
            botonAccion = `<button onclick="verFinalizada('${item.id_cap}')" style="background:#7f8c8d; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Ver Detalle</button>`;
        }

        tr.innerHTML = `
            <td style="padding:10px; font-weight:bold;">${item.id_cap || "-"}</td>
            <td style="padding:10px;">${item.nombre_curso || "-"}</td>
            <td style="padding:10px; text-align:center;">Clase ${item.clase_nro || "1"}</td>
            <td style="padding:10px;">${item.fecha || "-"}</td>
            <td style="padding:10px;">${item.instructor_1 || "-"}</td>
            <td style="padding:10px; text-align:center;">${botonAccion}</td>
        `;

        tbody.appendChild(tr);
    });

    window.listaCapacitacionesTemp = lista;
}

// 1. Editar Programada (Mantiene el mismo ID y misma clase)
window.editarProgramada = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = "capacitaciones.html";
};

// 2. Continuar Clase "En curso" (CAP-2026-002-1 -> CAP-2026-002-2)
window.cargarSiguienteClase = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    let claseActual = parseInt(cap.clase_nro || "1", 10);
    let siguienteClase = claseActual + 1;

    // Construir nuevo ID manteniendo la raíz del curso (CAP-2026-002)
    const partes = idCap.split("-");
    if (partes.length >= 4) {
        partes[3] = siguienteClase;
    } else if (partes.length === 3) {
        partes.push(siguienteClase);
    }
    const nuevoIdCap = partes.join("-");

    const nuevaClaseCap = {
        ...cap,
        id_cap: nuevoIdCap,
        clase_nro: String(siguienteClase),
        fecha: new Date().toISOString().split("T")[0] // Fecha por defecto para la nueva clase
    };

    localStorage.setItem("capacitacion_activa", JSON.stringify(nuevaClaseCap));
    window.location.href = "capacitaciones.html";
};

// 3. Ver Finalizada (Consulta con los datos tal cual)
window.verFinalizada = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = "capacitaciones.html";
};