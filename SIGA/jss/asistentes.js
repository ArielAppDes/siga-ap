// ===================================================
// 10/08/2026 - V0.1 - SIGA_APP - LÓGICA DE REGISTRO DE ASISTENTES
// ===================================================

let listaAsistentes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarPantallaAsistentes();
    configurarEventos();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// 1. CARGA DE CABECERA Y ASISTENTES DESDE SUPABASE
async function inicializarPantallaAsistentes() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCapUrl = urlParams.get('id_cap');
    const idCapLocal = localStorage.getItem("id_cap_asistencia");
    const capActivaRaw = localStorage.getItem("capacitacion_activa");

    let capData = null;
    if (capActivaRaw) {
        try { capData = JSON.parse(capActivaRaw); } catch (e) { console.error(e); }
    }

    const idCapTarget = capData?.id_cap || idCapUrl || idCapLocal;

    // Consultar capacitación en Supabase si no está completa en localStorage
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
            console.error("Error consultando capacitación en Supabase:", err);
        }
    }

    // Poblar los campos de la cabecera superior
    if (capData) {
        setVal('resumenIdCap', capData.id_cap || idCapTarget || '');
        setVal('resumenCurso', capData.nombre_curso || capData.curso || '');
        setVal('resumenClase', capData.clase_nro || capData.clase || '1');
        setVal('resumenFecha', capData.fecha || '');
        setVal('resumenInstructor', capData.instructor_1 || capData.instructor1 || '');
    } else if (idCapTarget) {
        setVal('resumenIdCap', idCapTarget);
    }

    // Cargar asistentes ya registrados en la tabla 'asistentes'
    if (idCapTarget) {
        await cargarAsistentesSupabase(idCapTarget);
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

        if (!error && data) {
            listaAsistentes = data;
        } else {
            listaAsistentes = [];
        }
        renderizarGrilla();
    } catch (err) {
        console.error("Error leyendo asistentes de Supabase:", err);
    }
}

// 2. BUSCAR EMPLEADO LOCAL Y AGREGAR A LA LISTA
function agregarParticipante() {
    const inputLegajo = document.getElementById('inputLegajo');
    const inputCalificacion = document.getElementById('inputCalificacion');
    const inputObservaciones = document.getElementById('inputObservaciones');
    const idCap = document.getElementById('resumenIdCap')?.value;

    const legajoVal = inputLegajo?.value.trim();
    if (!legajoVal) {
        alert("Por favor, ingrese un número de legajo.");
        return;
    }

    // Compatibilidad multi-origen con empleados / dotación local
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

    // Construir el objeto mapeando exacto las columnas de la tabla 'asistentes'
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
        calificacion: inputCalificacion?.value.trim() || '-',
        observaciones: inputObservaciones?.value.trim() || '-'
    };

    listaAsistentes.push(nuevoAsistente);
    renderizarGrilla();

    if (inputLegajo) inputLegajo.value = '';
    if (inputCalificacion) inputCalificacion.value = '';
    if (inputObservaciones) inputObservaciones.value = '';
}

function renderizarGrilla() {
    const tbody = document.getElementById('tbodyAsistentes');
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

// 3. GUARDAR ASISTENTES Y CERRAR REGISTRO
async function cerrarRegistro() {
    const idCap = document.getElementById('resumenIdCap')?.value;
    if (!idCap) {
        alert("No hay un ID_CAP válido asignado.");
        return;
    }

    const totalAsistentes = listaAsistentes.length;
    const confirmacion = confirm(`¿Desea cerrar el registro de la capacitación?\n\nID: ${idCap}\nTotal de asistentes: ${totalAsistentes}`);

    if (!confirmacion) return;

    const db = obtenerDB();
    if (db) {
        try {
            // 1. Limpiar registros previos de este id_cap para evitar duplicados
            await db.from('asistentes').delete().eq('id_cap', idCap);

            // 2. Insertar cada fila de asistente
            if (listaAsistentes.length > 0) {
                const { error: errInsert } = await db.from('asistentes').insert(listaAsistentes);
                if (errInsert) throw errInsert;
            }

            // 3. Actualizar estado de la capacitación a Finalizado
            const { error: errCap } = await db
                .from('capacitaciones')
                .update({ estado: 'Finalizado' })
                .eq('id_cap', idCap);

            if (errCap) console.warn("Aviso al actualizar estado en capacitaciones:", errCap);

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
    const btnAgregar = document.getElementById('btnAgregarParticipante');
    if (btnAgregar) btnAgregar.onclick = (e) => { e.preventDefault(); agregarParticipante(); };

    const btnCerrar = document.getElementById('btnCerrarRegistro');
    if (btnCerrar) btnCerrar.onclick = (e) => { e.preventDefault(); cerrarRegistro(); };

    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem("capacitacion_activa");
        window.location.href = "actividades.html";
    };

    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.onclick = (e) => { e.preventDefault(); window.print(); };
}

function setVal(id, valor) {
    const elem = document.getElementById(id);
    if (elem) elem.value = valor || '';
}
