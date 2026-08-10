// ===================================================
// 10/08/2026 - V0.1 - SIGA_APP - REGISTRO DE ASISTENTES
// ===================================================

let listaAsistentes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarPantallaAsistentes();
    configurarEventos();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// Función central para recuperar el ID_CAP actual sin importar el formato de origen
function obtenerIdCapActual(capData) {
    if (capData) {
        const idEncontrado = capData.id_cap || capData.idCap || capData.id;
        if (idEncontrado) return idEncontrado;
    }

    // Intento por selector en HTML
    const inputId = document.getElementById('resumenIdCap') || 
                    document.getElementById('idCap') || 
                    document.getElementById('id_cap') || 
                    document.querySelector("input[placeholder*='CAP']");
    if (inputId && inputId.value.trim()) return inputId.value.trim();

    // Intento por localStorage directo
    const capActivaRaw = localStorage.getItem("capacitacion_activa");
    if (capActivaRaw) {
        try {
            const parsed = JSON.parse(capActivaRaw);
            const idParsed = parsed.id_cap || parsed.idCap || parsed.id;
            if (idParsed) return idParsed;
        } catch (e) { console.error(e); }
    }

    return localStorage.getItem("id_cap_asistencia") || '';
}

// 1. CARGA DE CABECERA Y ASISTENTES
async function inicializarPantallaAsistentes() {
    const capActivaRaw = localStorage.getItem("capacitacion_activa");
    let capData = null;

    if (capActivaRaw) {
        try { capData = JSON.parse(capActivaRaw); } catch (e) { console.error(e); }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idCapTarget = obtenerIdCapActual(capData) || urlParams.get('id_cap');

    // Consultar a Supabase si falta información del curso
    const db = obtenerDB();
    if (db && idCapTarget && (!capData || !capData.nombre_curso)) {
        try {
            const { data } = await db
                .from('capacitaciones')
                .select('*')
                .eq('id_cap', idCapTarget)
                .maybeSingle();

            if (data) capData = data;
        } catch (err) {
            console.error("Error consultando capacitación:", err);
        }
    }

    poblarCabeceraVisible(capData, idCapTarget);

    if (idCapTarget) {
        await cargarAsistentesSupabase(idCapTarget);
    }
}

function poblarCabeceraVisible(cap, idFallback) {
    const datos = {
        id: obtenerIdCapActual(cap) || idFallback || '',
        curso: cap?.nombre_curso || cap?.curso || '',
        clase: cap?.clase_nro || cap?.clase || '1',
        fecha: cap?.fecha || '',
        instructor: cap?.instructor_1 || cap?.instructor1 || cap?.instructor || ''
    };

    // 1. Asignación por selector o ID explícito
    const inputId = document.getElementById('resumenIdCap') || document.getElementById('idCap') || document.getElementById('id_cap');
    const inputCurso = document.getElementById('resumenCurso') || document.getElementById('curso') || document.getElementById('nombre_curso');
    const inputClase = document.getElementById('resumenClase') || document.getElementById('clase') || document.getElementById('clase_nro');
    const inputFecha = document.getElementById('resumenFecha') || document.getElementById('fecha');
    const inputInst = document.getElementById('resumenInstructor') || document.getElementById('instructor') || document.getElementById('instructor_1');

    if (inputId) inputId.value = datos.id;
    if (inputCurso) inputCurso.value = datos.curso;
    if (inputClase) inputClase.value = datos.clase;
    if (inputFecha) inputFecha.value = datos.fecha;
    if (inputInst) inputInst.value = datos.instructor;

    // 2. Respaldo directo por posición de inputs en el bloque superior
    const todosInputs = document.querySelectorAll('main input, form input, .card input, input');
    if (todosInputs.length >= 5) {
        if (!inputId || !inputId.value) todosInputs[0].value = datos.id;
        if (!inputCurso || !inputCurso.value) todosInputs[1].value = datos.curso;
        if (!inputClase || !inputClase.value) todosInputs[2].value = datos.clase;
        if (!inputFecha || !inputFecha.value) todosInputs[3].value = datos.fecha;
        if (!inputInst || !inputInst.value) todosInputs[4].value = datos.instructor;
    }
}

async function cargarAsistentesSupabase(idCap) {
    const db = obtenerDB();
    if (!db) return;

    try {
        const { data, error } = await db
            .from('asistentes')
            .select('*')
            .eq('id_cap', idCap);

        listaAsistentes = (!error && data) ? data : [];
        renderizarGrilla();
    } catch (err) {
        console.error("Error leyendo asistentes de Supabase:", err);
    }
}

// 2. AGREGAR PARTICIPANTE
function agregarParticipante() {
    const inputs = document.querySelectorAll('input');
    const inputLegajo = document.getElementById('inputLegajo') || document.getElementById('legajo') || inputs[5];
    const inputCalificaciones = document.getElementById('inputCalificacion') || document.getElementById('calificacion') || inputs[6];
    const inputObservaciones = document.getElementById('inputObservaciones') || document.getElementById('observaciones') || inputs[7];

    const idCap = obtenerIdCapActual();
    const legajoVal = inputLegajo?.value.trim();

    if (!legajoVal) {
        alert("Por favor, ingrese un número de legajo.");
        return;
    }

    const nomina = window.empleados || window.dotacion || (typeof empleados !== 'undefined' ? empleados : []);
    const emp = nomina.find(e => e.legajo && String(e.legajo).trim().toLowerCase() === legajoVal.toLowerCase());

    if (!emp) {
        alert(`El legajo ${legajoVal} no se encuentra registrado en la base de empleados.`);
        return;
    }

    if (listaAsistentes.some(a => String(a.legajo).trim() === String(emp.legajo).trim())) {
        alert("El empleado ya está agregado en la grilla.");
        return;
    }

    const nuevoAsistente = {
        id_cap: idCap,
        legajo: String(emp.legajo).trim(),
        apellido: emp.apellido || '',
        nombre: emp.nombre || '',
        puesto: emp.puesto || '',
        categoria: emp.categoria || '',
        direccion: emp.direccion || '',
        gerencia: emp.gerencia || '',
        jefatura: emp.jefatura || '',
        email: emp.email || '',
        calificacion: inputCalificaciones?.value.trim() || '-',
        observaciones: inputObservaciones?.value.trim() || '-'
    };

    listaAsistentes.push(nuevoAsistente);
    renderizarGrilla();

    if (inputLegajo) inputLegajo.value = '';
    if (inputCalificaciones) inputCalificaciones.value = '';
    if (inputObservaciones) inputObservaciones.value = '';
}

function renderizarGrilla() {
    const tbody = document.getElementById('tbodyAsistentes') || document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (listaAsistentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">
                    No hay participantes registrados para esta clase aún.
                </td>
            </tr>
        `;
        return;
    }

    listaAsistentes.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';

        tr.innerHTML = `
            <td style="padding:12px 15px; font-weight:bold;">${item.legajo}</td>
            <td style="padding:12px 15px;">${item.apellido}</td>
            <td style="padding:12px 15px;">${item.nombre}</td>
            <td style="padding:12px 15px;">${item.calificacion}</td>
            <td style="padding:12px 15px;">${item.observaciones}</td>
            <td style="padding:12px 15px; color:#64748b;">Pendiente</td>
            <td style="padding:12px 15px; text-align:center;">
                <button onclick="quitarParticipante(${idx})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                    Quitar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.quitarParticipante = function(index) {
    listaAsistentes.splice(index, 1);
    renderizarGrilla();
};

// 3. GUARDAR EN SUPABASE Y CERRAR REGISTRO
async function cerrarRegistro() {
    const idCap = obtenerIdCapActual();

    if (!idCap) {
        alert("No hay un ID_CAP válido asignado.");
        return;
    }

    const confirmacion = confirm(`¿Desea cerrar el registro de la capacitación?\n\nID: ${idCap}\nTotal de asistentes: ${listaAsistentes.length}`);
    if (!confirmacion) return;

    const db = obtenerDB();
    if (db) {
        try {
            await db.from('asistentes').delete().eq('id_cap', idCap);

            if (listaAsistentes.length > 0) {
                const { error: errInsert } = await db.from('asistentes').insert(listaAsistentes);
                if (errInsert) throw errInsert;
            }

            await db.from('capacitaciones').update({ estado: 'Finalizado' }).eq('id_cap', idCap);

        } catch (err) {
            console.error("Error guardando en Supabase:", err);
            alert("Error al guardar asistentes: " + (err.message || "Error de conexión"));
            return;
        }
    }

    localStorage.removeItem("capacitacion_activa");
    localStorage.removeItem("id_cap_asistencia");

    alert(`Registro cerrado con éxito. La capacitación ${idCap} pasó a estado Finalizado.`);
    window.location.href = "actividades.html";
}

function configurarEventos() {
    const botones = document.querySelectorAll('button');
    
    const btnAgregar = document.getElementById('btnAgregarParticipante') || Array.from(botones).find(b => b.textContent.includes('Agregar'));
    if (btnAgregar) btnAgregar.onclick = (e) => { e.preventDefault(); agregarParticipante(); };

    const btnCerrar = document.getElementById('btnCerrarRegistro') || Array.from(botones).find(b => b.textContent.includes('Cerrar'));
    if (btnCerrar) btnCerrar.onclick = (e) => { e.preventDefault(); cerrarRegistro(); };

    const btnCancelar = document.getElementById('btnCancelar') || Array.from(botones).find(b => b.textContent.includes('Cancelar'));
    if (btnCancelar) btnCancelar.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem("capacitacion_activa");
        window.location.href = "actividades.html";
    };

    const btnImprimir = document.getElementById('btnImprimir') || Array.from(botones).find(b => b.textContent.includes('Imprimir'));
    if (btnImprimir) btnImprimir.onclick = (e) => { e.preventDefault(); window.print(); };
}
