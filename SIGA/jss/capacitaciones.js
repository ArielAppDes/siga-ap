// ===================================================
// SIGA_APP - LÓGICA DE CAPACITACIONES (SUPABASE)
// ===================================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDesplegablesDesdeSupabase();
});

// 1. CARGAR SELECTS DESDE SUPABASE
async function cargarDesplegablesDesdeSupabase() {
    if (typeof window.supabaseClient === 'undefined') {
        console.error('El cliente de Supabase no está disponible.');
        return;
    }

    await Promise.all([
        cargarSelectProgramas(),
        cargarSelectCursos(),
        cargarSelectInstructores()
    ]);
}

// Cargar Programas desde Supabase
async function cargarSelectProgramas() {
    const select = document.getElementById('programa');
    if (!select) return;

    const { data, error } = await window.supabaseClient
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
                select.innerHTML += `<option value="${p.id}">${codigoTexto}${p.nombre}</option>`;
            }
        });
    }
}

// Cargar Cursos desde Supabase
async function cargarSelectCursos() {
    const select = document.getElementById('curso');
    if (!select) return;

    const { data, error } = await window.supabaseClient
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
                select.innerHTML += `<option value="${c.id}">${codigoTexto}${c.nombre}</option>`;
            }
        });
    }
}

// Cargar Instructores 1 y 2 desde Supabase
async function cargarSelectInstructores() {
    const select1 = document.getElementById('instructor1');
    const select2 = document.getElementById('instructor2');

    if (!select1 && !select2) return;

    const { data, error } = await window.supabaseClient
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
                opcionesHtml += `<option value="${i.id}">${codigoTexto}${i.apellido}, ${i.nombre}</option>`;
            }
        });
    }

    if (select1) select1.innerHTML = opcionesHtml;
    if (select2) select2.innerHTML = opcionesHtml;
}
