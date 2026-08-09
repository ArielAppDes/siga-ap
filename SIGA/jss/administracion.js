// ===================================================
// SIGA_APP - LÓGICA DE ADMINISTRACIÓN Y CATÁLOGOS
// ===================================================

let catalogoActual = 'programas';

document.addEventListener('DOMContentLoaded', () => {
    conectarEventosMenu();
    cambiarCatalogo('programas');
});

// 1. ASIGNAR EVENTOS CLIC DIRECTO POR ID
function conectarEventosMenu() {
    const mapaBotones = {
        'btn-cat-programas': 'programas',
        'btn-cat-cursos': 'cursos',
        'btn-cat-instructores': 'instructores',
        'btn-cat-dotacion': 'dotacion',
        'btn-cat-bases': 'bases'
    };

    Object.keys(mapaBotones).forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('click', (e) => {
                e.preventDefault();
                cambiarCatalogo(mapaBotones[id]);
            });
        }
    });
}

// 2. CONMUTADOR DE PANELES Y FORMULARIOS
async function cambiarCatalogo(catalogo) {
    catalogoActual = catalogo;

    // Resaltar opción en menú
    document.querySelectorAll('.menu-admin ul li').forEach(li => li.classList.remove('activo'));
    const btnActivo = document.getElementById(`btn-cat-${catalogo}`);
    if (btnActivo) btnActivo.classList.add('activo');

    // Elementos principales
    const panelGenerico = document.getElementById('panelGenerico');
    const panelDotacion = document.getElementById('panelDotacion');
    const panelBases = document.getElementById('panelBases');

    // Ocultar todos los paneles
    if (panelGenerico) panelGenerico.style.display = 'none';
    if (panelDotacion) panelDotacion.style.display = 'none';
    if (panelBases) panelBases.style.display = 'none';

    // Mostrar panel específico si es Dotación o Bases
    if (catalogo === 'dotacion') {
        if (panelDotacion) panelDotacion.style.display = 'block';
        return;
    }
    if (catalogo === 'bases') {
        if (panelBases) panelBases.style.display = 'block';
        return;
    }

    // Si es Programas, Cursos o Instructores -> Mostrar Panel Genérico
    if (panelGenerico) panelGenerico.style.display = 'block';

    const tituloCatalogo = document.getElementById('tituloCatalogo');
    const colNombre = document.getElementById('colNombre');
    const lblNombre = document.getElementById('lblNombre');
    const formGenerico = document.getElementById('form-generico');
    const formCursos = document.getElementById('form-cursos');

    if (catalogo === 'cursos') {
        if (tituloCatalogo) tituloCatalogo.textContent = 'Cursos';
        if (colNombre) colNombre.textContent = 'Curso';
        if (formGenerico) formGenerico.style.display = 'none';
        if (formCursos) formCursos.style.display = 'block';
        await cargarCursos();
    } else if (catalogo === 'programas') {
        if (tituloCatalogo) tituloCatalogo.textContent = 'Programas';
        if (colNombre) colNombre.textContent = 'Programa';
        if (lblNombre) lblNombre.textContent = 'Programa';
        if (formGenerico) formGenerico.style.display = 'block';
        if (formCursos) formCursos.style.display = 'none';
        await cargarProgramas();
    } else if (catalogo === 'instructores') {
        if (tituloCatalogo) tituloCatalogo.textContent = 'Instructores';
        if (colNombre) colNombre.textContent = 'Instructor';
        if (lblNombre) lblNombre.textContent = 'Instructor';
        if (formGenerico) formGenerico.style.display = 'block';
        if (formCursos) formCursos.style.display = 'none';
        await cargarInstructores();
    }
}

// 3. SUMA AUTOMÁTICA DE HORAS PARA CURSOS
function sumarHorasCurso() {
    const teoria = parseFloat(document.getElementById('curso_teoria')?.value) || 0;
    const practica = parseFloat(document.getElementById('curso_practica')?.value) || 0;
    const inputCarga = document.getElementById('curso_carga');
    if (inputCarga) inputCarga.value = teoria + practica;
}

// 4. CONSULTAS Y CARGA DE DATOS DESDE SUPABASE
async function cargarCursos() {
    const tbody = document.getElementById('tablaCatalogo');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">Cargando cursos...</td></tr>';

    if (typeof window.supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="3">Sin conexión a Supabase</td></tr>';
        return;
    }

    const { data, error } = await window.supabaseClient
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay cursos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(c => `
        <tr>
            <td><strong>${c.codigo_curso || '-'}</strong></td>
            <td>${c.nombre}</td>
            <td>${c.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

async function cargarProgramas() {
    const tbody = document.getElementById('tablaCatalogo');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">Cargando programas...</td></tr>';

    if (typeof window.supabaseClient === 'undefined') return;

    const { data, error } = await window.supabaseClient
        .from('programas')
        .select('*');

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay programas registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr>
            <td><strong>${p.codigo || '-'}</strong></td>
            <td>${p.nombre}</td>
            <td>${p.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

async function cargarInstructores() {
    const tbody = document.getElementById('tablaCatalogo');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3">No hay instructores registrados.</td></tr>';
}

// 5. LIMPIAR FORMULARIOS
function nuevoRegistro() {
    if (catalogoActual === 'cursos') {
        document.getElementById('curso_codigo').value = '';
        document.getElementById('curso_nombre').value = '';
        document.getElementById('curso_teoria').value = 0;
        document.getElementById('curso_practica').value = 0;
        document.getElementById('curso_carga').value = 0;
        document.getElementById('curso_contenido').value = '';
        document.getElementById('curso_estado').value = 'Activo';
    } else {
        document.getElementById('codigo').value = '';
        document.getElementById('nombre').value = '';
        document.getElementById('descripcion').value = '';
        document.getElementById('estado').value = 'Activo';
    }
}

// 6. GUARDAR CURSO EN SUPABASE
async function guardarRegistro() {
    if (catalogoActual === 'cursos') {
        const nombre = document.getElementById('curso_nombre').value.trim();
        if (!nombre) {
            alert('Ingresá el nombre del curso antes de guardar.');
            return;
        }

        const nuevoCurso = {
            nombre: nombre,
            modalidad: document.getElementById('curso_modalidad').value,
            hs_teoria: parseFloat(document.getElementById('curso_teoria').value) || 0,
            hs_practica: parseFloat(document.getElementById('curso_practica').value) || 0,
            carga_horaria: parseFloat(document.getElementById('curso_carga').value) || 0,
            contenido: document.getElementById('curso_contenido').value,
            estado: document.getElementById('curso_estado').value
        };

        const { data, error } = await window.supabaseClient
            .from('cursos')
            .insert([nuevoCurso])
            .select();

        if (error) {
            alert('Error al guardar el curso: ' + error.message);
        } else {
            alert(`Curso guardado exitosamente. Código asignado: ${data[0].codigo_curso}`);
            nuevoRegistro();
            await cargarCursos();
        }
    }
}

function cancelarEdicion() {
    nuevoRegistro();
}
