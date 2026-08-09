// ===================================================
// SIGA_APP - LÓGICA DE REGISTRO DE ASISTENTES
// ===================================================

let listaAsistentes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarPantallaAsistentes();
    configurarEventos();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// 1. CARGA DE CABECERA Y ASISTENTES
async function inicializarPantallaAsistentes() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCapUrl = urlParams.get('id_cap');
    const idCapLocal = localStorage.getItem("id_cap_asistencia");
    const idCapTarget = idCapUrl || idCapLocal;

    let capData = null;

    // Intentar leer datos inmediatos desde localStorage
    const localCap = localStorage.getItem("capacitacion_activa");
    if (localCap) {
        try { capData = JSON.parse(localCap); } catch (e) { console.error(e); }
    }

    // Consultar a Supabase para obtener datos frescos
    const db = obtenerDB();
    if (db && idCapTarget) {
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

    // Cargar los participantes previamente guardados
    if (idCapTarget) {
        await cargarAsistentesSupabase(idCapTarget);
    }
}

async function cargarAsistentesSupabase(idCap) {
    const db = obtenerDB();
    if (!db) return;

    try {
        const { data, error } = await db
            .from('asistencias')
            .select('asistentes')
            .eq('id_cap', idCap)
            .maybeSingle();

        if (!error && data && Array.isArray(data.asistentes)) {
            listaAsistentes = data.asistentes;
        } else {
            listaAsistentes = [];
        }
        renderizarGrilla();
    } catch (err) {
        console.error("Error leyendo asistencias de Supabase:", err);
    }
}

// 2. SUMAR Y QUITAR PARTICIPANTES
function agregarParticipante() {
    const inputLegajo = document.getElementById('inputLegajo');
    const inputCalificacion = document.getElementById('inputCalificacion');
    const inputObservaciones = document.getElementById('inputObservaciones');

    const legajoVal = inputLegajo?.value.trim();
    if (!legajoVal) {
        alert("Por favor, ingrese un número de legajo.");
        return;
    }

    const nomina = window.empleados || (typeof empleados !== 'undefined' ? empleados : []);
    const emp = nomina.find(e => e.legajo && e.legajo.toString().toLowerCase() === legajoVal.toLowerCase());

    if (!emp) {
        alert(`El legajo ${legajoVal} no se encuentra en la base de empleados.`);
        return;
    }

    if (listaAsistentes.some(a => a.legajo === emp.legajo)) {
        alert("El empleado ya está agregado en la grilla.");
        return;
    }

    const nuevo = {
        legajo: emp.legajo,
        apellido: emp.apellido,
        nombre: emp.nombre,
        calificacion: inputCalificacion?.value.trim() || '-',
        observaciones: inputObservaciones?.value.trim() || '-',
        firma: 'Pendiente'
    };

    listaAsistentes.push(nuevo);
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
            <td style="padding:12px 15px; color:#64748b;">${item.firma}</td>
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

// 3. CERRAR REGISTRO CON POPUP Y GUARDADO
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
            await db
                .from('asistencias')
                .upsert([{
                    id_cap: idCap,
                    asistentes: listaAsistentes,
                    fecha_registro: new Date().toISOString()
                }], { onConflict: 'id_cap' });

            await db
                .from('capacitaciones')
                .update({ estado: 'Finalizado' })
                .eq('id_cap', idCap);

        } catch (err) {
            console.error("Error guardando en Supabase:", err);
            alert("Ocurrió un error al guardar los asistentes.");
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
