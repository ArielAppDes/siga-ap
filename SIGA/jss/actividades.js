// ===================================================
// 16/08/2026 - V0.6 - SIGA_APP - LÓGICA DE ACTIVIDADES CON CABECERA DINÁMICA Y TRANSFERENCIAS (30 DÍAS)
// ===================================================

const DIAS_EVALUACION_TRANSFERENCIA = 30; // ⚙️ Parámetro de prueba (cambiar a 90 en producción)

document.addEventListener("DOMContentLoaded", () => {
    inicializarTarjetas();
    configurarEventosModal();
    verificarCampoIdCapLocal();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function inicializarTarjetas() {
    // Nueva Capacitación
    document.getElementById("cardNueva")?.addEventListener("click", async () => {
        localStorage.removeItem("capacitacion_activa");
        const nuevoIdCap = await obtenerSiguienteIdCap();
        const nuevaCap = { id_cap: nuevoIdCap, clase_nro: "1", estado: "Programado" };
        localStorage.setItem("capacitacion_activa", JSON.stringify(nuevaCap));
        window.location.href = "capacitaciones.html";
    });

    // Programadas
    document.getElementById("cardProgramadas")?.addEventListener("click", () => {
        abrirModalPorEstado("Programado", "Capacitaciones Programadas");
    });

    // En curso
    document.getElementById("cardEnCurso")?.addEventListener("click", () => {
        abrirModalPorEstado("En curso", "Capacitaciones En Curso");
    });

    // Finalizadas
    document.getElementById("cardFinalizadas")?.addEventListener("click", () => {
        abrirModalPorEstado("Finalizado", "Historial de Capacitaciones Finalizadas");
    });

    // Encuesta de Satisfacción (QR directos)
    document.getElementById("cardSatisfaccion")?.addEventListener("click", () => {
        abrirModalPorEstado("QR", "Encuesta de Satisfacción - Seleccionar Capacitación");
    });

    // Encuesta de Transferencia (Gestión Post-30 Días)
    document.getElementById("cardTransferencia")?.addEventListener("click", () => {
        abrirModalTransferencia();
    });
}

// Genera correlativo CAP-AAAA-XXX-01
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
    const modalCap = document.getElementById("modalCapacitaciones");
    const btnCerrarCap = document.getElementById("btnCerrarModal");
    const modalQR = document.getElementById("modalQR");
    const btnCerrarQR = document.getElementById("btnCerrarQR");

    btnCerrarCap?.addEventListener("click", () => { if (modalCap) modalCap.style.display = "none"; });
    btnCerrarQR?.addEventListener("click", () => { if (modalQR) modalQR.style.display = "none"; });

    window.addEventListener("click", (e) => {
        if (e.target === modalCap) modalCap.style.display = "none";
        if (e.target === modalQR) modalQR.style.display = "none";
    });
}

// ----------------------------------------------------
// MODAL GENERAL (PROGRAMADAS / EN CURSO / FINALIZADAS / QR)
// ----------------------------------------------------
async function abrirModalPorEstado(estadoFiltro, titulo) {
    const modal = document.getElementById("modalCapacitaciones");
    const txtTitulo = document.getElementById("tituloModal");
    const tbody = document.getElementById("tbodyCapacitaciones");
    const thead = document.querySelector("#modalCapacitaciones table thead");

    // Adaptar cabecera para capacitaciones estándar
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th style="padding:10px;">ID CAP</th>
                <th style="padding:10px;">Curso</th>
                <th style="padding:10px; text-align:center;">Clase</th>
                <th style="padding:10px;">Fecha</th>
                <th style="padding:10px;">Instructor/es</th>
                <th style="padding:10px; text-align:center;">Acción</th>
            </tr>
        `;
    }

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
        let query = db.from("capacitaciones").select("*");
        if (estadoFiltro !== "QR") {
            query = query.eq("estado", estadoFiltro);
        }

        const { data, error } = await query.order("id_cap", { ascending: false });
        if (error) throw error;

        if (!data || data.length === 0) {
            const msj = estadoFiltro === "QR" ? "No existen capacitaciones registradas." : `No hay capacitaciones en estado '<strong>${estadoFiltro}</strong>'.`;
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">${msj}</td></tr>`;
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
        const instructores = [item.instructor_1, item.instructor_2].filter(Boolean).join(", ") || "-";

        if (estadoFiltro === "Programado") {
            botonAccion = `<button onclick="editarProgramada('${item.id_cap}')" style="background:#27ae60; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Editar</button>`;
        } else if (estadoFiltro === "En curso") {
            botonAccion = `<button onclick="cargarSiguienteClase('${item.id_cap}')" style="background:#2980b9; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Continuar Clase</button>`;
        } else if (estadoFiltro === "QR") {
            botonAccion = `<button onclick="generarQRModal('${item.id_cap}', '${(item.nombre_curso || '').replace(/'/g, "\\'")}')" style="background:#18C48F; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:600;">📱 Generar QR</button>`;
        } else {
            botonAccion = `
                <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                    <button onclick="imprimirPlanillaHistorica('${item.id_cap}')" style="background-color: #1F6FEB; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;" title="Imprimir Planilla A4">🖨️</button>
                    <button onclick="verFinalizada('${item.id_cap}')" style="background-color: #7f8c8d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Ver Detalle</button>
                </div>
            `;
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

// ----------------------------------------------------
// MÓDULO ESPECIAL: ENCUESTA DE TRANSFERENCIA
// ----------------------------------------------------
async function abrirModalTransferencia() {
    const modal = document.getElementById("modalCapacitaciones");
    const txtTitulo = document.getElementById("tituloModal");
    const tbody = document.getElementById("tbodyCapacitaciones");
    const thead = document.querySelector("#modalCapacitaciones table thead");

    // Adaptar cabecera específica para Transferencias
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th style="padding:10px;">ID CAP</th>
                <th style="padding:10px;">Curso</th>
                <th style="padding:10px; text-align:center;">Fecha Cursada</th>
                <th style="padding:10px; text-align:center;">Fecha Obj. Tra.</th>
                <th style="padding:10px; text-align:center;">Estado / Atraso</th>
                <th style="padding:10px; text-align:center;">Acciones</th>
            </tr>
        `;
    }

    const inputBuscar = document.getElementById('inputBuscarModal');
    if (inputBuscar) inputBuscar.value = '';

    if (txtTitulo) txtTitulo.textContent = "Encuesta de Transferencia (Evaluación Post-Capacitación)";
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando capacitaciones...</td></tr>';
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
            .eq("estado", "Finalizado")
            .neq("estado_tra", "No Aplica")
            .order("id_cap", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay capacitaciones pendientes de evaluación de transferencia.</td></tr>`;
            return;
        }

        renderizarFilasTransferencia(data);
    } catch (err) {
        console.error("Error al cargar transferencias:", err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Error al consultar capacitaciones.</td></tr>';
    }
}

function renderizarFilasTransferencia(lista) {
    const tbody = document.getElementById("tbodyCapacitaciones");
    if (!tbody) return;

    tbody.innerHTML = "";
    const hoy = new Date();

    lista.forEach(item => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";

        let fechaObj;
        if (item.fecha_tra) {
            fechaObj = new Date(item.fecha_tra + "T00:00:00");
        } else if (item.fecha) {
            fechaObj = new Date(item.fecha + "T00:00:00");
            fechaObj.setDate(fechaObj.getDate() + DIAS_EVALUACION_TRANSFERENCIA);
        } else {
            fechaObj = new Date();
        }

        const difMs = fechaObj.getTime() - hoy.getTime();
        const diasDiferencia = Math.ceil(difMs / (1000 * 3600 * 24));

        let contadorHTML = "";
        const estadoActual = item.estado_tra || "Pendiente";

        if (estadoActual === "Enviada" || estadoActual === "Recibida") {
            const badgeColor = estadoActual === "Recibida" ? "#10b981" : "#0284c7";
            contadorHTML = `<span style="background:${badgeColor}; color:#fff; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600;">${estadoActual}</span>`;
        } else if (diasDiferencia < 0) {
            const atraso = Math.abs(diasDiferencia);
            contadorHTML = `<span style="color:#ef4444; font-weight:700; font-size:13px;">🚨 ${atraso} días de atraso</span>`;
        } else {
            contadorHTML = `<span style="color:#16a34a; font-weight:600; font-size:13px;">🟢 Faltan ${diasDiferencia} días</span>`;
        }

        const nombreCursoEscaped = (item.nombre_curso || '').replace(/'/g, "\\'");

        const accionesHTML = `
            <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                <button onclick="generarQRTransferencia('${item.id_cap}', '${nombreCursoEscaped}')" style="background:#18C48F; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:600; font-size:12px;" title="Generar QR para Jefatura">
                    📱 QR Jefatura
                </button>
                <button onclick="omitirTransferencia('${item.id_cap}')" style="background:#dc2626; color:#fff; border:none; padding:6px 8px; border-radius:4px; cursor:pointer; font-size:12px;" title="Omitir / Borrar de pendientes">
                    🗑️ Omitir
                </button>
            </div>
        `;

        tr.innerHTML = `
            <td style="padding:10px; font-weight:bold;">${item.id_cap || "-"}</td>
            <td style="padding:10px;">${item.nombre_curso || "-"}</td>
            <td style="padding:10px; text-align:center;">${item.fecha || "-"}</td>
            <td style="padding:10px; text-align:center;">${fechaObj.toISOString().split("T")[0]}</td>
            <td style="padding:10px; text-align:center;">${contadorHTML}</td>
            <td style="padding:10px; text-align:center;">${accionesHTML}</td>
        `;

        tbody.appendChild(tr);
    });

    window.listaCapacitacionesTemp = lista;
}

// Omitir transferencia ("No Aplica")
window.omitirTransferencia = async function(idCap) {
    if (!confirm(`¿Confirmás omitir la encuesta de transferencia para la capacitación ${idCap}? Ya no figurará como pendiente.`)) return;

    const db = obtenerDB();
    if (!db) return;

    try {
        const { error } = await db
            .from("capacitaciones")
            .update({ estado_tra: "No Aplica" })
            .eq("id_cap", idCap);

        if (error) throw error;

        alert("Capacitación omitida correctamente.");
        abrirModalTransferencia();
    } catch (err) {
        console.error("Error al omitir transferencia:", err);
        alert("Ocurrió un error al actualizar la capacitación.");
    }
};

// Generar QR de Transferencia apuntando a encuesta_transferencia.html
window.generarQRTransferencia = async function(idCap, nombreCurso) {
    const modalQR = document.getElementById("modalQR");
    const contenedorQR = document.getElementById("contenedorQR");
    const qrSubtitulo = document.getElementById("qrSubtitulo");
    const qrIdCapText = document.getElementById("qrIdCapText");

    if (!contenedorQR || !modalQR) return;

    const db = obtenerDB();
    if (db) {
        await db
            .from("capacitaciones")
            .update({ 
                estado_tra: "Enviada",
                fecha_envio_transferencia: new Date().toISOString()
            })
            .eq("id_cap", idCap);
    }

    contenedorQR.innerHTML = "";

    const rutaBase = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const urlTransferencia = `${rutaBase}encuesta_transferencia.html?id_cap=${encodeURIComponent(idCap)}`;

    new QRCode(contenedorQR, {
        text: urlTransferencia,
        width: 180,
        height: 180,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    if (qrSubtitulo) qrSubtitulo.textContent = `Evaluación de Transferencia: ${nombreCurso}`;
    if (qrIdCapText) qrIdCapText.textContent = `ID: ${idCap}`;

    modalQR.style.display = "flex";
};

// Generar QR de Satisfacción normal
window.generarQRModal = function(idCap, nombreCurso) {
    const modalQR = document.getElementById("modalQR");
    const contenedorQR = document.getElementById("contenedorQR");
    const qrSubtitulo = document.getElementById("qrSubtitulo");
    const qrIdCapText = document.getElementById("qrIdCapText");

    if (!contenedorQR || !modalQR) return;

    contenedorQR.innerHTML = "";

    const rutaBase = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const urlEncuesta = `${rutaBase}encuesta.html?id_cap=${encodeURIComponent(idCap)}`;

    new QRCode(contenedorQR, {
        text: urlEncuesta,
        width: 180,
        height: 180,
        colorDark: "#1a252f",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    if (qrSubtitulo) qrSubtitulo.textContent = nombreCurso || "Escaneá para evaluar la capacitación";
    if (qrIdCapText) qrIdCapText.textContent = `ID: ${idCap}`;

    modalQR.style.display = "flex";
};

// Editar Programada
window.editarProgramada = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;
    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = "capacitaciones.html";
};

// Continuar Clase (Siguiente Clase)
window.cargarSiguienteClase = async function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;

    const db = obtenerDB();
    if (db) {
        const hoy = new Date();
        const fecha30Dias = new Date();
        fecha30Dias.setDate(hoy.getDate() + DIAS_EVALUACION_TRANSFERENCIA);
        const fechaTraStr = fecha30Dias.toISOString().split("T")[0];

        await db
            .from("capacitaciones")
            .update({ 
                estado: "Finalizado",
                fecha_tra: fechaTraStr,
                estado_tra: "Pendiente"
            })
            .eq("id_cap", idCap);
    }

    let claseActual = parseInt(cap.clase_nro || "1", 10);
    let siguienteClase = claseActual + 1;
    const numClaseFormateado = String(siguienteClase).padStart(2, "0");
    const partes = idCap.split("-");

    if (partes.length >= 3) partes[3] = numClaseFormateado;
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

// Ver Finalizada
window.verFinalizada = function(idCap) {
    const cap = window.listaCapacitacionesTemp?.find(c => c.id_cap === idCap);
    if (!cap) return;
    localStorage.setItem("capacitacion_activa", JSON.stringify(cap));
    window.location.href = "capacitaciones.html";
};

// Imprimir Planilla Histórica
window.imprimirPlanillaHistorica = function(idCap) {
    if (!idCap) return;
    window.open(`planilla_asistencia.html?id_cap=${encodeURIComponent(idCap)}`, '_blank');
};

// Buscador Modal
function filtrarModal() {
    const input = document.getElementById('inputBuscarModal');
    if (!input) return;

    const termino = input.value.toLowerCase().trim();
    const filas = document.querySelectorAll('#tbodyCapacitaciones tr');

    filas.forEach(fila => {
        if (fila.children.length <= 1) return;
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(termino) ? '' : 'none';
    });
}
