// ===================================================
// SIGA_APP - LÓGICA DE CAPACITACIONES (SUPABASE)
// ===================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar select desplegables desde Supabase
    await cargarDesplegablesDesdeSupabase();

    // 2. Cargar datos de la capacitación activa (o nuevo ID)
    await cargarCapacitacionActiva();

    // 3. Vincular botones de acción
    configurarBotonesAccion();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// ===================================================
// 1. CARGAR SELECTS DESDE SUPABASE
// ===================================================

async function cargarDesplegablesDesdeSupabase() {
    const db = obtenerDB();
    if (!db) {
        console.error('El cliente de Supabase no está disponible.');
        return;
    }

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

    if (error) {
        console.error('Error al obtener programas:', error.message);
        return;
    }

    select.innerHTML = '<option value="">Seleccione...</option>';
    if (data && data.length > 0) {
        data.forEach(p => {
            if (!p.estado || p.estado === 'Activo') {
                const codigoTexto = p.codigo ? `${p.codigo} - ` : '';
                // Usamos el nombre como value para guardarlo limpio en la tabla capacitaciones
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

    if (error) {
        console.error('Error al obtener cursos:', error.message);
        return;
    }

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

    if (error) {
        console.error('Error al obtener instructores:', error.message);
        return;
    }

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

// ===================================================
// 2. CARGAR CAPACITACIÓN ACTIVA Y LLENAR CAMPOS
// ===================================================

async function cargarCapacitacionActiva() {
    const inputIdCap = document.getElementById('id_cap') || document.querySelector("input[placeholder*='CAP-']");
    const rawData = localStorage.getItem("capacitacion_activa");

    if (rawData) {
        try {
            const cap = JSON.parse(rawData);

            if (inputIdCap && cap.id_cap) inputIdCap.value = cap.id_cap;
            
            // Llenar rest de campos si existen en el formulario
            setValorCampo('programa', cap.programa);
            setValorCampo('curso', cap.nombre_curso || cap.curso);
            setValorCampo('clase_nro', cap.clase_nro || "1");
            setValorCampo('estado', cap.estado || "Programado");
            setValorCampo('fecha', cap.fecha);
            setValorCampo('hs_inicio', cap.hs_inicio);
            setValorCampo('hs_fin', cap.hs_fin);
            setValorCampo('instructor1', cap.instructor_1 || cap.instructor1);
            setValorCampo('instructor2', cap.instructor_2 || cap.instructor2);
            setValorCampo('lugar', cap.lugar);
            setValorCampo('centro', cap.centro);
            setValorCampo('tema', cap.tema);
            setValorCampo('observaciones', cap.observaciones);

            return;
        } catch (e) {
            console.error("Error al parsear capacitacion_activa:", e);
        }
    }

    // Si no hay capacitación activa, obtener de Supabase el próximo ID libre
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

    if (!db) return `CAP-${anioActual}-001-01`;

    try {
        const { data, error } = await db
            .from("capacitaciones")
            .select("id_cap");

        if (error || !data || data.length === 0) {
            return `CAP-${anioActual}-001-01`;
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
        return `CAP-${anioActual}-${sig}-01`;

    } catch (e) {
        console.error("Error consultando IDs en Supabase:", e);
        return `CAP-${anioActual}-001-01`;
    }
}

// ===================================================
// 3. EVENTOS DE BOTONES (GUARDAR Y ASISTENTES)
// ===================================================

function configurarBotonesAccion() {
    // Buscar botón Guardar por ID o por clase
    const btnGuardar = document.getElementById('btnGuardar') || document.querySelector('.btn.guardar');
    if (btnGuardar) {
        btnGuardar.onclick = guardarCapacitacion;
    }

    // Buscar botón Registrar Asistentes
    const btnAsistentes = document.getElementById('btnAsistentes') || document.getElementById('btnRegistrarAsistentes') || document.querySelector('.btn.asistentes');
    if (btnAsistentes) {
        btnAsistentes.onclick = irARegistrarAsistentes;
    }
}

async function guardarCapacitacion(e) {
    if (e) e.preventDefault();

    const db = obtenerDB();
    if (!db) {
        alert("Sin conexión a Supabase.");
        return;
    }

    const id_cap = document.getElementById('id_cap')?.value || document.querySelector("input[placeholder*='CAP-']")?.value;
    const programa = document.getElementById('programa')?.value || '';
    const selectCurso = document.getElementById('curso');
    const nombre_curso = selectCurso?.value || '';
    const codigo_curso = selectCurso?.options[selectCurso.selectedIndex]?.dataset?.codigo || '';

    if (!id_cap) {
        alert("El código ID_CAP es obligatorio.");
        return;
    }

    const payload = {
        id_cap: id_cap,
        programa: programa,
        codigo_curso: codigo_curso,
        nombre_curso: nombre_curso,
        clase_nro: document.getElementById('clase_nro')?.value || '1',
        estado: document.getElementById('estado')?.value || 'Programado',
        fecha: document.getElementById('fecha')?.value || null,
        hs_inicio: document.getElementById('hs_inicio')?.value || null,
        hs_fin: document.getElementById('hs_fin')?.value || null,
        instructor_1: document.getElementById('instructor1')?.value || '',
        instructor_2: document.getElementById('instructor2')?.value || '',
        lugar: document.getElementById('lugar')?.value || '',
        centro: document.getElementById('centro')?.value || '',
        tema: document.getElementById('tema')?.value || '',
        observaciones: document.getElementById('observaciones')?.value || ''
    };

    try {
        const { data, error } = await db
            .from('capacitaciones')
            .upsert([payload], { onConflict: 'id_cap' });

        if (error) throw error;

        // Actualizar en localStorage la versión guardada
        localStorage.setItem("capacitacion_activa", JSON.stringify(payload));
        alert(`Capacitación ${id_cap} guardada con éxito en Supabase.`);

    } catch (err) {
        console.error("Error al guardar capacitación:", err);
        alert("Ocurrió un error al intentar guardar en Supabase: " + err.message);
    }
}

function irARegistrarAsistentes(e) {
    if (e) e.preventDefault();

    const id_cap = document.getElementById('id_cap')?.value || document.querySelector("input[placeholder*='CAP-']")?.value;

    if (!id_cap) {
        alert("Primero debe generar o guardar la capacitación.");
        return;
    }

    // Redireccionar al panel o abrir modal de asistencia guardando el ID de referencia
    localStorage.setItem("id_cap_asistencia", id_cap);
    
    // Si tenés una pantalla dedicada para la toma de asistencia:
    if (typeof abrirModalAsistentes === 'function') {
        abrirModalAsistentes(id_cap);
    } else {
        window.location.href = `dotacion.html?id_cap=${encodeURIComponent(id_cap)}`;
    }
}
