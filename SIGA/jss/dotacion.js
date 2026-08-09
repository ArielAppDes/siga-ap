// ===================================================
// SIGA_APP - LÓGICA DE REGISTRO DE ASISTENTES
// ===================================================

let listaAsistentesGuardados = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosResumenCapacitacion();
    configurarEventosAsistencia();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// 1. CARGAR DATOS DE LA CAPACITACIÓN Y SUS ASISTENTES
async function cargarDatosResumenCapacitacion() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCapUrl = urlParams.get('id_cap');
    const idCapLocal = localStorage.getItem("id_cap_asistencia");
    const idCapTarget = idCapUrl || idCapLocal;

    const rawData = localStorage.getItem("capacitacion_activa");
    let cap = null;

    if (rawData) {
        try {
            cap = JSON.parse(rawData);
        } catch (e) {
            console.error("Error leyendo capacitacion_activa:", e);
        }
    }

    // Si venimos de la Agenda con un ID específico en la URL, priorizamos consultar a Supabase
    const db = obtenerDB();
    if (db && idCapTarget) {
        try {
            const { data } = await db
                .from('capacitaciones')
                .select('*')
                .eq('id_cap', idCapTarget)
                .maybeSingle();

            if (data) {
                cap = data; // Usamos la data fresca desde Supabase
            }
        } catch (err) {
            console.error("Error consultando la capacitación en Supabase:", err);
        }
    }

    // Completar el resumen superior
    if (cap) {
        setElemValue('resumenIdCap', cap.id_cap || idCapTarget || '');
        setElemValue('resumenCurso', cap.nombre_curso || cap.curso || '');
        setElemValue('resumenClase', cap.clase_nro || cap.clase || '1');
        setElemValue('resumenFecha', cap.fecha || new Date().toISOString().split('T')[0]);
        setElemValue('resumenInstructor', cap.instructor_1 || cap.instructor1 || '');
        
        // Si hay un selector o campo de estado en la vista
        setElemValue('estadoSelect', cap.estado || 'Programado');
    } else if (idCapTarget) {
        setElemValue('resumenIdCap', idCapTarget);
    }

    // Cargar los participantes de esta capacitación específica
    if (idCapTarget) {
        await cargarAsistentesPrevios(idCapTarget);
    }
}

function setElemValue(id, val) {
    const elem = document.getElementById(id);
    if (elem) elem.value = val;
}

// 2. CONFIGURACIÓN DE EVENTOS DE BOTONES
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

// 3. AÑADIR PARTICIPANTE A LA GRILLA
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

    // Evitar duplicados
    if (listaAsistentesGuardados.some(a => a.legajo === empleado.legajo)) {
        alert("Este participante ya se encuentra agregado a la lista.");
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

    // Limpiar campos de ingreso
    if (document.getElementById('inputLegajo')) document.getElementById('inputLegajo').value = '';
    if (document.getElementById('inputCalificacion')) document.getElementById('inputCalificacion').value = '';
    if (document.getElementById('inputObservaciones')) document.getElementById('inputObservaciones').value = '';
}

// 4. DIBUJAR TABLA DE PARTICIPANTES EN PANTALLA
function renderizarTablaAsistentes() {
    const tbody = document.getElementById('tbodyAsistentes');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (listaAsistentesGuardados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">
                    No hay participantes registrados para esta clase aún.
                </td>
            </tr>
        `;
        return;
    }

    listaAsistentesGuardados.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';

        tr.innerHTML = `
            <td style="padding:12px 15px; font-weight:bold;">${item.legajo}</td>
            <td style="padding:12px 15px;">${item.apellido}</td>
            <td style="padding:12px 15px;">${item.nombre}</td>
            <td style="padding:12px 15px;">${item.calificacion}</td>
            <td style="padding:12px 15px;">${item.observaciones}</td>
            <td style="padding:12px 15px; color:#64748b;">${item.firma}</td>
            <td style="padding:12px 15px; text-align:center;">
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

// 5. OBTENER Y CONSULTAR PARTICIPANTES DESDE SUPABASE O LOCALSTORAGE
async function cargarAsistentesPrevios(idCap) {
    const db = obtenerDB();

    // Intento 1: Buscar en Supabase
    if (db) {
        try {
            const { data, error } = await db
                .from('asistencias')
                .select('asistentes')
                .eq('id_cap', idCap)
                .maybeSingle();

            if (!error && data && data.asistentes) {
                listaAsistentesGuardados = data.asistentes;
                renderizarTablaAsistentes();
                return;
            }
        } catch (e) {
            console.error("Error leyendo asistencias de Supabase:", e);
        }
    }

    // Intento 2: Buscar en memoria local si no hay datos en Supabase
    const localData = localStorage.getItem(`asistentes_${idCap}`);
    if (localData) {
        try {
            listaAsistentesGuardados = JSON.parse(localData);
            renderizarTablaAsistentes();
            return;
        } catch (e) {
            console.error("Error leyendo respaldo local de asistentes:", e);
        }
    }

    renderizarTablaAsistentes();
}

// 6. GUARDAR PARTICIPANTES Y ACTUALIZAR ESTADO DE LA CAPACITACIÓN
async function guardarRegistroAsistentes() {
    const idCap = document.getElementById('resumenIdCap')?.value;
    const nuevoEstado = document.getElementById('estadoSelect')?.value || 'Finalizado';

    if (!idCap) {
        alert("Atención: No hay un ID_CAP activo seleccionado.");
        return;
    }

    const db = obtenerDB();

    // Guardar copia local en el navegador
    localStorage.setItem(`asistentes_${idCap}`, JSON.stringify(listaAsistentesGuardados));

    if (db) {
        try {
            // A) Upsert de la lista de asistentes en la tabla asistencias
            await db
                .from('asistencias')
                .upsert([{
                    id_cap: idCap,
                    asistentes: listaAsistentesGuardados,
                    fecha_registro: new Date().toISOString()
                }], { onConflict: 'id_cap' });

            // B) Actualizar el estado de la capacitación (Ej: Finalizado / En curso)
            await db
                .from('capacitaciones')
                .update({ estado: nuevoEstado })
                .eq('id_cap', idCap);

        } catch (e) {
            console.error("Error guardando en Supabase:", e);
        }
    }

    alert(`Registro guardado y estado actualizado para la capacitación ${idCap}.`);
    window.location.href = "actividades.html";
}
