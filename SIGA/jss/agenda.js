// ===================================================
// 16/08/2026 - V0.6 - SIGA-APP - LÓGICA DE AGENDA CON NOTIFICADOR GLOBAL Y ALERTAS DE TRANSFERENCIA (30 DÍAS)
// ===================================================

let fechaActual = new Date();
let capacitacionesMes = [];
let todasLasCapacitaciones = [];

document.addEventListener("DOMContentLoaded", () => {
    configurarControles();
    cargarAgendaCompleta();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function configurarControles() {
    document.getElementById("btnMesAnterior")?.addEventListener("click", () => {
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        renderizarVistaAgenda();
    });

    document.getElementById("btnMesSiguiente")?.addEventListener("click", () => {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        renderizarVistaAgenda();
    });

    const modal = document.getElementById("modalDia");
    document.getElementById("btnCerrarModalDia")?.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });
}

async function cargarAgendaCompleta() {
    const db = obtenerDB();
    if (db) {
        try {
            const { data, error } = await db
                .from("capacitaciones")
                .select("*");

            if (!error && data) {
                todasLasCapacitaciones = data;
            }
        } catch (err) {
            console.error("Error al cargar capacitaciones generales:", err);
        }
    }
    renderizarVistaAgenda();
}

function renderizarVistaAgenda() {
    const txtMesAno = document.getElementById("txtMesAno");
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    if (txtMesAno) txtMesAno.textContent = `${nombresMeses[mes]} ${anio}`;

    // 1. Filtrar capacitaciones normales del mes seleccionado
    const mesStr = String(mes + 1).padStart(2, "0");
    const prefijoAnioMes = `${anio}-${mesStr}`;
    
    capacitacionesMes = todasLasCapacitaciones.filter(c => c.fecha && c.fecha.startsWith(prefijoAnioMes));

    // 2. Renderizar Cuadro Notificador Superior
    renderizarBannerResumenAnual(anio, mes, nombresMeses);

    // 3. Renderizar Grilla del Mes con Alertas de Transferencia
    renderizarGridCalendario(anio, mes);
}

function renderizarBannerResumenAnual(anioActual, mesActual, nombresMeses) {
    const elBanner = document.getElementById("resumenAnualAgenda");
    if (!elBanner) return;

    // Conteo por meses del año actual
    const conteoPorMes = Array(12).fill(0);

    todasLasCapacitaciones.forEach(item => {
        if (!item.fecha) return;
        const [a, m] = item.fecha.split("-");
        if (parseInt(a, 10) === anioActual) {
            const indexMes = parseInt(m, 10) - 1;
            if (indexMes >= 0 && indexMes < 12) {
                conteoPorMes[indexMes]++;
            }
        }
    });

    const mesesConActividad = [];
    conteoPorMes.forEach((cant, idx) => {
        if (cant > 0 && idx !== mesActual) {
            mesesConActividad.push(`<strong>${cant}</strong> en ${nombresMeses[idx]}`);
        }
    });

    if (mesesConActividad.length === 0) {
        elBanner.innerHTML = `<span style="color:#64748b; font-weight:500;">📅 No hay actividades agendadas en otros meses de ${anioActual}.</span>`;
    } else {
        elBanner.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:13px; color:#1e293b;">
                <span>📌 <strong>Actividades agendadas en otros meses (${anioActual}):</strong></span>
                <span style="background:#e2e8f0; padding:4px 10px; border-radius:6px;">
                    ${mesesConActividad.join(" &nbsp;|&nbsp; ")}
                </span>
            </div>
        `;
    }
}

function renderizarGridCalendario(anio, mes) {
    const gridDias = document.getElementById("gridDias");
    if (!gridDias) return;

    gridDias.innerHTML = "";

    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Espacios vacíos de inicio de mes
    for (let i = 0; i < primerDiaSemana; i++) {
        const celdaVacia = document.createElement("div");
        celdaVacia.className = "dia-celda vacio";
        gridDias.appendChild(celdaVacia);
    }

    // Días del mes
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const celda = document.createElement("div");
        celda.className = "dia-celda";

        const diaPadded = String(dia).padStart(2, "0");
        const mesPadded = String(mes + 1).padStart(2, "0");
        const fechaStr = `${anio}-${mesPadded}-${diaPadded}`;

        const eventosDelDia = capacitacionesMes.filter(c => c.fecha === fechaStr);

        // Buscar alertas de Transferencia para esta fecha específica o retrasos persistentes
        const transferenciasDelDia = todasLasCapacitaciones.filter(c => {
            if (c.estado !== "Finalizado" || !c.fecha_tra) return false;
            const estadoTra = c.estado_tra || "Pendiente";
            if (estadoTra === "Enviada" || estadoTra === "Recibida" || estadoTra === "No Aplica") return false;

            const fechaTraObj = new Date(c.fecha_tra + "T00:00:00");
            const difMs = fechaTraObj.getTime() - hoy.getTime();
            const diasDiferencia = Math.ceil(difMs / (1000 * 3600 * 24));

            // Coincide con la fecha del calendario
            if (c.fecha_tra === fechaStr) {
                return true;
            }
            
            // Si está vencida y es el día de HOY, mostrar alerta roja fija
            if (diasDiferencia < 0 && fechaStr === hoy.toISOString().split("T")[0]) {
                return true;
            }

            return false;
        });

        celda.innerHTML = `<div class="numero-dia">${dia}</div>`;

        // Renderizar capacitaciones normales
        eventosDelDia.forEach(item => {
            const tag = document.createElement("div");
            let claseEstado = "tag-programado";

            if (item.estado === "En curso") claseEstado = "tag-encurso";
            if (item.estado === "Finalizado") claseEstado = "tag-finalizado";

            tag.className = `evento-tag ${claseEstado}`;
            tag.textContent = item.nombre_curso || item.id_cap;
            celda.appendChild(tag);
        });

        // Renderizar Alertas de Transferencia
        transferenciasDelDia.forEach(item => {
            const tagTra = document.createElement("div");
            const fechaTraObj = new Date(item.fecha_tra + "T00:00:00");
            const difMs = fechaTraObj.getTime() - hoy.getTime();
            const diasDiferencia = Math.ceil(difMs / (1000 * 3600 * 24));

            let colorBg = "#f59e0b"; // Naranja / Amarillo (Alerta ≤ 5 días)
            let textoTag = `⚠️ TRA: ${item.nombre_curso || item.id_cap}`;

            if (diasDiferencia < 0) {
                colorBg = "#dc2626"; // Rojo (Atraso)
                textoTag = `🚨 RETRASO TRA: ${item.nombre_curso || item.id_cap}`;
            }

            tagTra.className = "evento-tag";
            tagTra.style.cssText = `background-color: ${colorBg}; color: #ffffff; font-weight: 700; border-radius: 4px; padding: 2px 5px; font-size: 11px; margin-top: 2px;`;
            tagTra.textContent = textoTag;

            celda.appendChild(tagTra);
        });

        celda.addEventListener("click", () => {
            abrirModalDetalleDia(fechaStr, eventosDelDia, transferenciasDelDia);
        });

        gridDias.appendChild(celda);
    }
}

function abrirModalDetalleDia(fechaStr, listaEventos, listaTransferencias = []) {
    const modal = document.getElementById("modalDia");
    const titulo = document.getElementById("tituloModalDia");
    const tbody = document.getElementById("tbodyDia");

    if (titulo) titulo.textContent = `Capacitaciones y Alertas del día: ${fechaStr}`;
    if (!tbody) return;

    tbody.innerHTML = "";

    if (listaEventos.length === 0 && listaTransferencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay actividades agendadas para este día.</td></tr>';
    } else {
        // Eventos Estándar
        listaEventos.forEach(item => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #eee";

            const horario = (item.hs_inicio && item.hs_fin) ? `${item.hs_inicio} - ${item.hs_fin}` : "-";

            let btnAccion = "";
            if (item.estado === "Programado") {
                btnAccion = `<button onclick="editarDesdeAgenda('${item.id_cap}')" style="background:#d97706; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Editar</button>`;
            } else if (item.estado === "En curso") {
                btnAccion = `<button onclick="continuarDesdeAgenda('${item.id_cap}')" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Continuar Clase</button>`;
            } else {
                btnAccion = `<button onclick="verDesdeAgenda('${item.id_cap}')" style="background:#16a34a; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Ver Detalle</button>`;
            }

            tr.innerHTML = `
                <td style="padding:10px; font-weight:bold;">${item.id_cap}</td>
                <td style="padding:10px;">${item.nombre_curso || "-"}</td>
                <td style="padding:10px;">${horario}</td>
                <td style="padding:10px;"><strong>${item.estado || "Programado"}</strong></td>
                <td style="padding:10px; text-align:center;">${btnAccion}</td>
            `;

            tbody.appendChild(tr);
        });

        // Alertas de Transferencia en el Modal
        listaTransferencias.forEach(item => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #eee";
            tr.style.backgroundColor = "#fef2f2";

            const btnAccion = `<button onclick="irATransferencias()" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Gestionar TRA</button>`;

            tr.innerHTML = `
                <td style="padding:10px; font-weight:bold; color:#dc2626;">${item.id_cap}</td>
                <td style="padding:10px; color:#991b1b; font-weight:600;">📋 Encuesta de Transferencia (${item.nombre_curso || "-"})</td>
                <td style="padding:10px;">Todo el día</td>
                <td style="padding:10px;"><span style="background:#f87171; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px;">ALERTA ENVIÓ</span></td>
                <td style="padding:10px; text-align:center;">${btnAccion}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    window.eventosAgendaTemp = [...listaEventos, ...listaTransferencias];
    if (modal) modal.style.display = "flex";
}

window.irATransferencias = function() {
    window.location.href = "actividades.html";
};

window.editarDesdeAgenda = function(idCap) {
    const item = window.eventosAgendaTemp?.find(c => c.id_cap === idCap);
    if (!item) return;
    localStorage.setItem("capacitacion_activa", JSON.stringify(item));
    window.location.href = "capacitaciones.html";
};

window.continuarDesdeAgenda = function(idCap) {
    const item = window.eventosAgendaTemp?.find(c => c.id_cap === idCap);
    if (!item) return;

    let claseActual = parseInt(item.clase_nro || "1", 10);
    let siguienteClase = claseActual + 1;

    const partes = idCap.split("-");
    if (partes.length >= 4) partes[3] = siguienteClase;
    else if (partes.length === 3) partes.push(siguienteClase);

    const nuevaClase = {
        ...item,
        id_cap: partes.join("-"),
        clase_nro: String(siguienteClase)
    };

    localStorage.setItem("capacitacion_activa", JSON.stringify(nuevaClase));
    window.location.href = "capacitaciones.html";
};

window.verDesdeAgenda = function(idCap) {
    const item = window.eventosAgendaTemp?.find(c => c.id_cap === idCap);
    if (!item) return;
    localStorage.setItem("capacitacion_activa", JSON.stringify(item));
    window.location.href = "capacitaciones.html";
};
