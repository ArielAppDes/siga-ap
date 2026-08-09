// ===================================================
// SIGA_APP - LÓGICA DE REGISTRO DE ASISTENTES
// ===================================================

let listaAsistentesGuardados = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosResumenCapacitacion();
    configurarEventosAsistencia();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// 1. CARGAR DATOS EN LA TARJETA SUPERIOR
function cargarDatosResumenCapacitacion() {
    const rawData = localStorage.getItem("capacitacion_activa");
    if (!rawData) return;

    try {
        const cap = JSON.parse(rawData);
        
        setElemValue('resumenIdCap', cap.id_cap || '');
        setElemValue('resumenCurso', cap.nombre_curso || cap.curso || '');
        setElemValue('resumenClase', cap.clase_nro || cap.clase || '1');
        setElemValue('resumenFecha', cap.fecha || new Date().toISOString().split('T')[0]);
        setElemValue('resumenInstructor', cap.instructor_1 || cap.instructor1 || '');

        cargarAsistentesPrevios(cap.id_cap);
    } catch (e) {
        console.error("Error al cargar resumen:", e);
    }
}

function setElemValue(id, val) {
    const elem = document.getElementById(id);
    if (elem) elem.value = val;
}

// 2. AGREGAR PARTICIPANTE A LA GRILLA
function configurarEventosAsistencia() {
    const btnAgregar = document.getElementById('btnAgregarParticipante');
    if (btnAgregar) btnAgregar.onclick = agregarParticipanteAGrilla;

    const btnCerrar = document.getElementById('btnCerrarRegistro');
    if (btnCerrar) btnCerrar.onclick = guardarRegistroAsistentes;

    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.onclick = () => window.location.href = "actividades.html";

    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.onclick = () => window.print();
}

function agregarParticipanteAGrilla(e) {
    if (e) e.preventDefault();

    const legajoVal = document.getElementById('inputLegajo')?.value.trim();
    const califVal = document.getElementById('inputCalificacion')?.value.trim();
    const obsVal = document.getElementById('inputObservaciones')?.value.trim();

    if (!legajoVal) {
        alert("Ingrese un número de legajo.");
        return;
    }

    // Buscar en data/empleados.js
    const nomina = window.empleados || (typeof empleados !== 'undefined' ? empleados : []);
    const empleado = nomina.find(emp => emp.legajo && emp.legajo.toLowerCase() === legajoVal.toLowerCase());

    if (!empleado) {
        alert(`No se encontró ningún empleado con el legajo ${legajoVal} en la base.`);
        return;
    }

    // Verificar si ya fue agregado
    if (listaAsistentesGuardados.some(a => a.legajo === empleado.legajo)) {
        alert("Este participante ya se encuentra agregado en la lista.");
        return;
    }

    const nuevoAsistente = {
        legajo: empleado.legajo,
        apellido: empleado.apellido,
        nombre: empleado.nombre,
        calificacion: califVal || '-',
        observaciones: obsVal || '-',
        firma: 'Pendiente'
    };

    listaAsistentesGuardados.push(nuevoAsistente);
    renderizarTablaAsistentes();

    // Limpiar inputs
    document.getElementById('inputLegajo').value = '';
    document.getElementById('inputCalificacion').value = '';
    document.getElementById('inputObservaciones').value = '';
}

function renderizarTablaAsistentes() {
    const tbody = document.getElementById('tbodyAsistentes');
    if (!tbody) return;

    tbody.innerHTML = '';

    listaAsistentesGuardados.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee';

        tr.innerHTML = `
            <td style="padding:10px 15px; font-weight:bold;">${item.legajo}</td>
            <td style="padding:10px 15px;">${item.apellido}</td>
            <td style="padding:10px 15px;">${item.nombre}</td>
            <td style="padding:10px 15px;">${item.calificacion}</td>
            <td style="padding:10px 15px;">${item.observaciones}</td>
            <td style="padding:10px 15px; color:#64748b;">${item.firma}</td>
            <td style="padding:10px 15px; text-align:center;">
                <button onclick="quitarParticipante(${index})" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">
                    Quitar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.quitarParticipante = function(index) {
    listaAsistentesGuardados.splice(index, 1);
    renderizarTablaAsistentes();
};

// 3. GUARDAR EN SUPABASE / LOCALSTORAGE
async function guardarRegistroAsistentes() {
    const idCap = document.getElementById('resumenIdCap')?.value;
    if (!idCap) {
        alert("Sin ID_CAP asignado.");
        return;
    }

    const db = obtenerDB();
    if (db) {
        try {
            // Guardar o actualizar la asistencia del id_cap
            await db.from('asistencias').upsert([{
                id_cap: idCap,
                asistentes: listaAsistentesGuardados,
                fecha_registro: new Date().toISOString()
            }], { onConflict: 'id_cap' });
        } catch (e) {
            console.error("Error al guardar en Supabase:", e);
        }
    }

    alert(`Registro de asistencia para ${idCap} guardado con éxito.`);
    window.location.href = "actividades.html";
}

async function cargarAsistentesPrevios(idCap) {
    const db = obtenerDB();
    if (!db || !idCap) return;

    try {
        const { data } = await db
            .from('asistencias')
            .select('asistentes')
            .eq('id_cap', idCap)
            .maybeSingle();

        if (data && data.asistentes) {
            listaAsistentesGuardados = data.asistentes;
            renderizarTablaAsistentes();
        }
    } catch (e) {
        console.error("Error consultando asistencias guardadas:", e);
    }
}
