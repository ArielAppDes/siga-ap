// ===================================================
// 16/08/2026 - V0.6 - SIGA-APP - LÓGICA DE AGENDA CON ALERTAS DE TRANSFERENCIA EXACTAS Y ATRASOS PERSISTENTES
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

    const mesStr = String(mes + 1).padStart(2, "0");
    const prefijoAnioMes = `${anio}-${mesStr}`;
    
    // Capacitaciones dictadas en el mes
    capacitacionesMes = todasLasCapacitaciones.filter(c => c.fecha && c.fecha.startsWith(prefijoAnioMes));

    renderizarBannerResumenAnual(anio, mes, nombresMeses);
    renderizarGridCalendario(anio, mes);
}

function renderizarBannerResumenAnual(anioActual, mesActual, nombresMeses) {
    const elBanner = document.getElementById("resumenAnualAgenda");
    if (!elBanner) return;

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
    
    // Obtener fecha de HOY sin hora
    const hoyObj = new Date();
    const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, "0")}-${String(hoyObj.getDate()).padStart(2, "0")}`;

    for (let i = 0; i < primerDiaSemana; i++) {
        const celdaVacia = document.createElement("div");
        celdaVacia.className = "dia-celda vacio";
        gridDias.appendChild(celdaVacia);
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const celda = document.createElement("div");
        celda.className = "dia-celda";

        const diaPadded = String(dia).padStart(2, "0");
        const mesPadded = String(mes + 1).padStart(2, "0");
        const fechaStr = `${anio}-${mesPadded}-${diaPadded}`;

        // 1. Cursadas normales del día
        const eventosDelDia = capacitacionesMes.filter(c => c.fecha === fechaStr);

        // 2. Transferencias asociadas a ESTA fecha exacta o Retrasadas fijas en HOY
        const transferenciasDelDia = todasLasCapacitaciones.filter(c => {
            if (!c.fecha_tra) return false;
            const estadoTra = c.estado_tra || "Pendiente";
            if (["Enviada", "Recibida", "No Aplica"].includes(estadoTra)) return false;

            // Coincidencia exacta de fecha de entrega
            if (c.fecha_tra === fechaStr) return true;

            // Retrasos persistentes: Si ya venció y estamos dibujando la celda de HOY
            if (c.fecha_tra < hoyStr && fechaStr === hoyStr) return true;

            return false;
        });

        celda.innerHTML = `<div class="numero-dia">${dia}</div>`;

        // Renderizar tags de Cursadas
        eventosDelDia.forEach(item => {
            const tag = document.createElement("div");
            let claseEstado = "tag-programado";

            if (item.estado === "En curso") claseEstado = "tag-encurso";
            if (item.estado === "Finalizado") claseEstado = "tag-finalizado";

            tag.className = `evento-tag ${claseEstado}`;
            tag.textContent = item.nombre_curso || item.id_cap;
            celda.appendChild(tag);
        });

        // Renderizar tags de Transferencia
        transferenciasDelDia.forEach(item => {
            const tagTra = document.createElement("div");
            const esAtrasado = item.fecha_tra < hoyStr;

            let colorBg = esAtrasado ? "#dc2626" : "#f59e0b"; // Rojo si atrasado, Naranja si está en término
            let prefijo = esAtrasado ? "🚨 RETRASO TRA:" : "⚠️ ENVIAR TRA:";

            tagTra.className = "evento-tag";
            tagTra.style.cssText = `background-color: ${colorBg}; color: #ffffff; font-weight: 700; border-radius: 4px; padding: 2px 5px; font-size: 10px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
            tagTra.textContent = `${prefijo} ${item.nombre_curso || item.id_cap}`;

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

    if (titulo) titulo.textContent = `Detalle del día: ${fechaStr}`;
    if (!tbody) return;

    tbody.innerHTML = "";

    if (listaEventos.length === 0 && listaTransferencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay actividades ni entregas pendientes este día.</td></tr>';
    } else {
        // Eventos de Dictado
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

        // Eventos de Encuestas de Transferencia
        listaTransferencias.forEach(item => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #eee";
            tr.style.backgroundColor = "#fff1f2";

            const btnAccion = `<button onclick="irATransferencias()" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Ir a Transferencias</button>`;

            tr.innerHTML = `
                <td style="padding:10px; font-weight:bold; color:#dc2626;">${item.id_cap}</td>
                <td style="padding:10px; color:#991b1b; font-weight:600;">📋 Entrega Encuesta Transferencia (${item.nombre_curso || "-"})</td>
                <td style="padding:10px;">Límite: ${item.fecha_tra}</td>
                <td style="padding:10px;"><span style="background:#f87171; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">TRANSFERENCIA</span></td>
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
