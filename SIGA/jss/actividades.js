// ===================================================
// 10/08/2026 - V0.2 - SIGA_APP - LÓGICA DE ACTIVIDADES (Ciclo de Vida Limpio)
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarTarjetas();
    configurarEventosModal();
    verificarCampoIdCapLocal();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function inicializarTarjetas() {
    // Tarjeta Nueva Capacitación
    document.getElementById("cardNueva")?.addEventListener("click", async () => {
        localStorage.removeItem("capacitacion_activa");

        const nuevoIdCap = await obtenerSiguienteIdCap();

        const nuevaCap = {
            id_cap: nuevoIdCap,
            clase_nro: "1",
            estado: "Programado"
        };

        localStorage.setItem("capacitacion_activa", JSON.stringify(nuevaCap));
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

// Genera correlativo CAP-AAAA-XXX-01 siempre formateado
async function obtenerSiguienteIdCap() {
    const db = obtenerDB();
    const anioActual = new Date().getFullYear();

    if (!db) return `CAP-${anioActual}-001-01`;

    try {
        const { data, error } = await db
            .from("capacitaciones")
            .select("id_cap");

        if (error || !data || data.length === 0) {
            return `CAP-${anioActual}-001-01`;
        }

        let maxNumero = 0;

        data.forEach(item => {
            if (item.id_cap) {
                const partes = item.id_cap.split("-");
                if (partes.length >= 3) {
                    const num = parseInt(partes[2], 10);
                    if (!isNaN(num) && num > maxNumero) {
                        maxNumero = num;
                    }
                }
            }
        });

        const siguienteNumero = String(maxNumero + 1).padStart(3, "0");
        return `CAP-${anioActual}-${siguienteNumero}-01`;

    } catch (err) {
        console.error("Error al consultar último ID_CAP en Supabase:", err);
        return `CAP-${anioActual}-001-01`;
    }
}

async function verificarCampoIdCapLocal() {
    const inputIdCap = document.getElementById("id_cap") || document.querySelector("input[placeholder*='CAP-']");
    if (inputIdCap && (!inputIdCap.value || inputIdCap.value.endsWith("-001-01"))) {
        const capActiva = localStorage.getItem("capacitacion_activa");
        if (!capActiva) {
            const nuevoId = await obtenerSiguienteIdCap();
            inputIdCap.value = nuevoId;
        }
    }
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

    // 🧹 LIMPIAR EL BUSCADOR AL ABRIR EL MODAL
    const inputBuscar = document.getElementById('inputBuscarModal');
    if (inputBuscar) inputBuscar.value = '';

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
        // Unificar instructores para mostrar en la grilla
        const instructores = [item.instructor_1, item.instructor_2].filter(Boolean).join(", ") || "-";

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
            <td style="padding:10px; text-align:center;">Clase ${parseInt(item.clase_nro || "1", 10)}</td>
            <td style="padding:10px;">${item.fecha || "-"}</td>
            <td style="padding:10px;">${instructores}</td>
            <td style="padding:10px; text-align:center;">${botonAccion}</td>
        `;

        tbody.appendChild(tr);
    });

    window.listaCapacitacionesTemp = lista;
}

// 1. Editar Programada
window.editarProgramada = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = "capacitaciones.html";
};

// 2. Continuar Clase "En curso" (Finaliza la anterior y formatea a 2 dígitos)
window.cargarSiguienteClase = async function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    const db = obtenerDB();
    if (db) {
        // Marcar la clase actual/anterior como Finalizada en Supabase
        await db
            .from("capacitaciones")
            .update({ estado: "Finalizado" })
            .eq("id_cap", idCap);
    }

    let claseActual = parseInt(cap.clase_nro || "1", 10);
    let siguienteClase = claseActual + 1;

    // Formatear SIEMPRE a 2 dígitos: 02, 03, 04...
    const numClaseFormateado = String(siguienteClase).padStart(2, "0");
    const partes = idCap.split("-");

    if (partes.length >= 3) {
        partes[3] = numClaseFormateado;
    }
    const nuevoIdCap = partes.slice(0, 3).join("-") + "-" + numClaseFormateado;

    const nuevaClaseCap = {
        ...cap,
        id_cap: nuevoIdCap,
        clase_nro: String(siguienteClase),
        estado: "En curso",
        fecha: new Date().toISOString().split("T")[0]
    };

    localStorage.setItem("capacitacion_activa", JSON.stringify(nuevaClaseCap));
    window.location.href = "capacitaciones.html";
};

// 3. Ver Finalizada
window.verFinalizada = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = "capacitaciones.html";
};

// --- BÚSQUEDA EN TIEMPO REAL (MODAL ACTIVIDADES) ---
function filtrarModal() {
    const input = document.getElementById('inputBuscarModal');
    if (!input) return;

    const termino = input.value.toLowerCase().trim();
    const filas = document.querySelectorAll('#tbodyCapacitaciones tr');

    filas.forEach(fila => {
        // Ignora filas de carga o mensajes sin columnas completas
        if (fila.children.length <= 1) return; 

        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(termino) ? '' : 'none';
    });
}
