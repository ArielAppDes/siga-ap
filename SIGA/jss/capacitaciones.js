// ===================================================
// SIGA_APP - LÓGICA DE CAPACITACIONES (SUPABASE)
// ===================================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDesplegablesDesdeSupabase();
});

// 1. CARGAR SELECTS DESDE SUPABASE
async function cargarDesplegablesDesdeSupabase() {
    if (typeof window.supabaseClient === 'undefined') {
        console.error('Supabase client no está inicializado.');
        return;
    }

    await Promise.all([
        cargarSelectProgramas(),
        cargarSelectCursos(),
        cargarSelectInstructores()
    ]);
}

// Cargar Programas
async function cargarSelectProgramas() {
    const select = document.getElementById('programa') || document.getElementById('selectPrograma');
    if (!select) return;

    const { data, error } = await window.supabaseClient
        .from('programas')
        .select('id, codigo, nombre')
        .eq('estado', 'Activo')
        .order('nombre', { ascending: true });

    if (error || !data) return;

    select.innerHTML = '<option value="">-- Seleccionar Programa --</option>';
    data.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.codigo ? p.codigo + ' - ' : ''}${p.nombre}</option>`;
    });
}

// Cargar Cursos
async function cargarSelectCursos() {
    const select = document.getElementById('curso') || document.getElementById('selectCurso');
    if (!select) return;

    const { data, error } = await window.supabaseClient
        .from('cursos')
        .select('id, codigo_curso, nombre')
        .eq('estado', 'Activo')
        .order('nombre', { ascending: true });

    if (error || !data) return;

    select.innerHTML = '<option value="">-- Seleccionar Curso --</option>';
    data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.codigo_curso ? c.codigo_curso + ' - ' : ''}${c.nombre}</option>`;
    });
}

// Cargar Instructores
async function cargarSelectInstructores() {
    const select = document.getElementById('instructor') || document.getElementById('selectInstructor');
    if (!select) return;

    const { data, error } = await window.supabaseClient
        .from('instructores')
        .select('id, codigo, nombre, apellido')
        .eq('estado', 'Activo')
        .order('apellido', { ascending: true });

    if (error || !data) return;

    select.innerHTML = '<option value="">-- Seleccionar Instructor --</option>';
    data.forEach(i => {
        select.innerHTML += `<option value="${i.id}">${i.codigo ? i.codigo + ' - ' : ''}${i.apellido}, ${i.nombre}</option>`;
    });
}
