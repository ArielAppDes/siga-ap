// ===================================================
// 10/08/2026 - V11.0 - SIGA_APP - LÓGICA DE ACTIVIDADES
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarTarjetas();
    configurarEventosModal();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function inicializarTarjetas() {
    document.getElementById("cardNueva")?.addEventListener("click", async () => {
        localStorage.removeItem("capacitacion_activa");
        const nuevoIdCap = await obtenerSiguienteIdCap();

        const nuevaCap = {
            id_cap: nuevoIdCap,
            clase_nro: "1",
            estado: "" // Fuerza al usuario a seleccionar estado
        };

        localStorage.setItem("capacitacion_activa", JSON.stringify(nuevaCap));
        window.location.href = "capacitaciones.html";
    });

    document.getElementById("cardProgramadas")?.addEventListener("click", () => {
        abrirModalPorEstado("Programado", "Capacitaciones Programadas");
    });

    document.getElementById("cardEnCurso")?.addEventListener("click", () => {
        abrirModalPorEstado("En curso", "Capacitaciones En Curso");
    });

    document.getElementById("cardFinalizadas")?.addEventListener("click", () => {
        abrirModalPorEstado("Finalizado", "Historial de Capacitaciones Finalizadas");
    });
}

async function obtenerSiguienteIdCap() {
    const db = obtenerDB();
    const anioActual = new Date().getFullYear();

    if (!db) return `CAP-${anioActual}-001-01`;

    try {
        const { data, error } = await db.from("capacitaciones").select("id_cap");
        if (error || !data || data.length === 0) return `CAP-${anioActual}-001-01`;

        let maxNumero = 0;
        data.forEach(item => {
            if (item.id_cap) {
                const partes = item.id_cap.split("-");
                if (partes.length >= 3) {
                    const num = parseInt(partes[2], 10);
                    if (!isNaN(num) && num > maxNumero) maxNumero = num;
                }
            }
        });

        const siguienteNumero = String(maxNumero + 1).padStart(3, "0");
        return `CAP-${anioActual}-${siguienteNumero}-01`;
    } catch (err) {
        console.error("Error consultando ID_CAP:", err);
        return `CAP-${anioActual}-001-01`;
    }
}

function configurarEventosModal() {
    const modal = document.getElementById("modalCapacitaciones");
    const btnCerrar = document.getElementById("btnCerrarModal");

    btnCerrar?.addEventListener("click", () => { if (modal) modal.style.display = "none"; });
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
}

async function abrirModalPorEstado(estadoFiltro, titulo) {
    const modal = document.getElementById("modalCapacitaciones");
    const txtTitulo = document.getElementById("tituloModal");
    const tbody = document.getElementById("tbodyCapacitaciones");

    if (txtTitulo) txtTitulo.textContent = titulo;
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando datos...</td></tr>';
    if (modal) modal.style.display = "flex";

    const db = obtenerDB();
    if (!db) return;

    try {
        const { data, error } = await db
            .from("capacitaciones")
            .select("*")
            .eq("estado", estadoFiltro)
            .order("id_cap", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay registros en estado '<strong>${estadoFiltro}</strong>'.</td></tr>`;
            return;
        }

        renderizarFilasModal(data, estadoFiltro);
    } catch (err) {
        console.error("Error consultando capacitaciones:", err);
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
        const instructores = [item.instructor_1, item.instructor_2].filter(Boolean).join(", ") || "-";

        if (estadoFiltro === "Programado") {
            botonAccion = `<button onclick="abrirCapacitacion('${item.id_cap}', 'capacitaciones.html')" style="background:#27ae60; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Editar</button>`;
        } else if (estadoFiltro === "En curso") {
            botonAccion = `<button onclick="abrirCapacitacion('${item.id_cap}', 'asistentes.html')" style="background:#2980b9; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Tomar Asistencia</button>`;
        } else {
            botonAccion = `<button onclick="abrirCapacitacion('${item.id_cap}', 'asistentes.html')" style="background:#7f8c8d; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Ver Detalle</button>`;
        }

        tr.innerHTML = `
            <td style="padding:10px; font-weight:bold;">${item.id_cap || "-"}</td>
            <td style="padding:10px;">${item.nombre_curso || "-"}</td>
            <td style="padding:10px; text-align:center;">Clase ${parseInt(item.clase_nro || "1", 10)}</td>
            <td style="padding:10px;">${item.fecha || "-"}</td>
            <td style="padding:10px;">${instructores}</td>
            <td style="padding:10px; text-align:center;">${botonAccion}</td>
        `;

        tbody.appendChild(tr);
    });

    window.listaCapacitacionesTemp = lista;
}

window.abrirCapacitacion = function(idCap, destinoHtml) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = destinoHtml;
};
