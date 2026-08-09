// ===================================================
// SIGA_APP - LÓGICA DE CAPACITACIONES (CORREGIDO)
// ===================================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDesplegablesDesdeSupabase();
    await cargarCapacitacionActiva();
    configurarBotonesAccion();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// 1. CARGA DE DESPLEGABLES
async function cargarDesplegablesDesdeSupabase() {
    const db = obtenerDB();
    if (!db) return;

    await Promise.all([
        cargarSelectProgramas(db),
        cargarSelectCursos(db),
        cargarSelectInstructores(db)
    ]);
}

async function cargarSelectProgramas(db) {
    const select = document.getElementById('programa');
    if (!select) return;

    const { data, error } = await db
        .from('programas')
        .select('id, codigo, nombre, estado')
        .order('nombre', { ascending: true });

    if (error) return;

    select.innerHTML = '<option value="">Seleccione...</option>';
    if (data && data.length > 0) {
        data.forEach(p => {
            if (!p.estado || p.estado === 'Activo') {
                const codigoTexto = p.codigo ? `${p.codigo} - ` : '';
                select.innerHTML += `<option value="${p.nombre}">${codigoTexto}${p.nombre}</option>`;
            }
        });
    }
}

async function cargarSelectCursos(db) {
    const select = document.getElementById('curso');
    if (!select) return;

    const { data, error } = await db
        .from('cursos')
        .select('id, codigo_curso, nombre, estado')
        .order('nombre', { ascending: true });

    if (error) return;

    select.innerHTML = '<option value="">Seleccione...</option>';
    if (data && data.length > 0) {
        data.forEach(c => {
            if (!c.estado || c.estado === 'Activo') {
                const codigoTexto = c.codigo_curso ? `${c.codigo_curso} - ` : '';
                select.innerHTML += `<option value="${c.nombre}" data-codigo="${c.codigo_curso}">${codigoTexto}${c.nombre}</option>`;
            }
        });
    }
}

async function cargarSelectInstructores(db) {
    const select1 = document.getElementById('instructor1');
    const select2 = document.getElementById('instructor2');

    if (!select1 && !select2) return;

    const { data, error } = await db
        .from('instructores')
        .select('id, codigo, nombre, apellido, estado')
        .order('apellido', { ascending: true });

    if (error) return;

    let opcionesHtml = '<option value="">Seleccione...</option>';
    if (data && data.length > 0) {
        data.forEach(i => {
            if (!i.estado || i.estado === 'Activo') {
                const codigoTexto = i.codigo ? `${i.codigo} - ` : '';
                const nombreCompleto = `${i.apellido}, ${i.nombre}`;
                opcionesHtml += `<option value="${nombreCompleto}">${codigoTexto}${nombreCompleto}</option>`;
            }
        });
    }

    if (select1) select1.innerHTML = opcionesHtml;
    if (select2) select2.innerHTML = opcionesHtml;
}

// 2. CARGAR O GENERAR NUEVO ID_CAP
async function cargarCapacitacionActiva() {
    const inputIdCap = document.getElementById('idCap');
    const rawData = localStorage.getItem("capacitacion_activa");

    if (rawData) {
        try {
            const cap = JSON.parse(rawData);
            if (inputIdCap && cap.id_cap) inputIdCap.value = cap.id_cap;
            
            setValorCampo('programa', cap.programa);
            setValorCampo('curso', cap.nombre_curso || cap.curso);
            setValorCampo('clase', cap.clase_nro || cap.clase || "1");
            setValorCampo('estado', cap.estado || "Programado");
            setValorCampo('fecha', cap.fecha);
            setValorCampo('horaInicio', cap.hs_inicio || cap.horaInicio);
            setValorCampo('horaFin', cap.hs_fin || cap.horaFin);
            setValorCampo('instructor1', cap.instructor_1 || cap.instructor1);
            setValorCampo('instructor2', cap.instructor_2 || cap.instructor2);
            setValorCampo('lugar', cap.lugar);
            setValorCampo('centro', cap.centro);
            setValorCampo('tema', cap.tema);
            setValorCampo('observaciones', cap.observaciones);
            return;
        } catch (e) {
            console.error("Error al leer capacitacion_activa:", e);
        }
    }

    if (inputIdCap) {
        const nuevoId = await generarNuevoIdCapSupabase();
        inputIdCap.value = nuevoId;
    }
}

function setValorCampo(id, valor) {
    const elem = document.getElementById(id);
    if (elem && valor !== undefined && valor !== null) {
        elem.value = valor;
    }
}

async function generarNuevoIdCapSupabase() {
    const db = obtenerDB();
    const anioActual = new Date().getFullYear();

    if (!db) return `CAP-${anioActual}-001-1`;

    try {
        const { data, error } = await db
            .from("capacitaciones")
            .select("id_cap");

        if (error || !data || data.length === 0) {
            return `CAP-${anioActual}-001-1`;
        }

        let maxNum = 0;
        data.forEach(row => {
            if (row.id_cap) {
                const partes = row.id_cap.split("-");
                if (partes.length >= 3) {
                    const n = parseInt(partes[2], 10);
                    if (!isNaN(n) && n > maxNum) maxNum = n;
                }
            }
        });

        const sig = String(maxNum + 1).padStart(3, "0");
        return `CAP-${anioActual}-${sig}-1`;

    } catch (e) {
        console.error("Error al obtener ID de Supabase:", e);
        return `CAP-${anioActual}-001-1`;
    }
}

// 3. CAPTURAR Y CONVERTIR PAYLOAD LIMPIO
function armarPayloadFormulario() {
    const id_cap = document.getElementById('idCap')?.value.trim() || '';
    const selectCurso = document.getElementById('curso');
    const nombre_curso = selectCurso ? selectCurso.value : '';
    const codigo_curso = selectCurso?.options[selectCurso.selectedIndex]?.dataset?.codigo || '';
    const claseVal = document.getElementById('clase')?.value || '1';

    const partesId = id_cap.split('-');
    const id_cap_padre = partesId.length >= 3 ? `${partesId[0]}-${partesId[1]}-${partesId[2]}` : id_cap;
    const clase_nro = parseInt(claseVal, 10) || 1;

    // Convertidor de campos vacíos a null (Evita error en columnas DATE/TIME de Supabase)
    const getCleanVal = (id) => {
        const v = document.getElementById(id)?.value?.trim();
        return (v && v !== "") ? v : null;
    };

    return {
        id_cap: id_cap,
        id_cap_padre: id_cap_padre,
        clase_nro: clase_nro,
        programa: getCleanVal('programa') || '',
        codigo_curso: codigo_curso,
        nombre_curso: nombre_curso,
        estado: getCleanVal('estado') || 'Programado',
        fecha: getCleanVal('fecha'),
        hs_inicio: getCleanVal('horaInicio'),
        hs_fin: getCleanVal('horaFin'),
        instructor_1: getCleanVal('instructor1') || '',
        instructor_2: getCleanVal('instructor2') || '',
        lugar: getCleanVal('lugar') || '',
        centro: getCleanVal('centro') || '',
        tema: getCleanVal('tema') || '',
        observaciones: getCleanVal('observaciones') || ''
    };
}

// 4. ACCIONES DE BOTONES
function configurarBotonesAccion() {
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) btnGuardar.onclick = guardarCapacitacion;

    const btnAsistentes = document.getElementById('btnAsistentes');
    if (btnAsistentes) btnAsistentes.onclick = irARegistrarAsistentes;

    const btnVolver = document.getElementById('btnVolver');
    if (btnVolver) {
        btnVolver.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem("capacitacion_activa");
            window.location.href = "actividades.html";
        };
    }
}

async function guardarCapacitacion(e) {
    if (e) e.preventDefault();

    const db = obtenerDB();
    if (!db) {
        alert("Sin conexión a Supabase.");
        return;
    }

    const payload = armarPayloadFormulario();

    if (!payload.id_cap) {
        alert("El código ID_CAP no es válido.");
        return;
    }

    try {
        const { error } = await db
            .from('capacitaciones')
            .upsert([payload], { onConflict: 'id_cap' });

        if (error) throw error;

        localStorage.removeItem("capacitacion_activa");
        alert(`Capacitación ${payload.id_cap} guardada exitosamente.`);
        window.location.href = "actividades.html";

    } catch (err) {
        console.error("Error guardando en Supabase:", err);
        alert("Error al guardar en Supabase: " + err.message);
    }
}

function irARegistrarAsistentes(e) {
    if (e) e.preventDefault();

    const payload = armarPayloadFormulario();

    if (!payload.id_cap) {
        alert("Debe existir un ID_CAP válido para continuar.");
        return;
    }

    // Guardar copia local activa para que dotacion.html pueble los campos superiores al instante
    localStorage.setItem("capacitacion_activa", JSON.stringify(payload));
    localStorage.setItem("id_cap_asistencia", payload.id_cap);

    window.location.href = `dotacion.html?id_cap=${encodeURIComponent(payload.id_cap)}`;
}
