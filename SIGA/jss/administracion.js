// ===================================================
// SIGA_APP - LÓGICA DE ADMINISTRACIÓN Y CATÁLOGOS
// ===================================================

let catalogoActual = 'programas';
let idSeleccionado = null; // Guarda el ID del registro seleccionado

document.addEventListener('DOMContentLoaded', () => {
    conectarEventosMenu();
    cambiarCatalogo('programas');
});

// 1. ASIGNAR EVENTOS CLIC EN EL MENÚ
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
    idSeleccionado = null;

    document.querySelectorAll('.menu-admin ul li').forEach(li => li.classList.remove('activo'));
    const btnActivo = document.getElementById(`btn-cat-${catalogo}`);
    if (btnActivo) btnActivo.classList.add('activo');

    const panelGenerico = document.getElementById('panelGenerico');
    const panelDotacion = document.getElementById('panelDotacion');
    const panelBases = document.getElementById('panelBases');

    if (panelGenerico) panelGenerico.style.display = 'none';
    if (panelDotacion) panelDotacion.style.display = 'none';
    if (panelBases) panelBases.style.display = 'none';

    if (catalogo === 'dotacion') {
        if (panelDotacion) panelDotacion.style.display = 'block';
        return;
    }
    if (catalogo === 'bases') {
        if (panelBases) panelBases.style.display = 'block';
        return;
    }

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
        await nuevoRegistro();
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

// 4. CONSULTA Y CARGA DE DATOS DESDE SUPABASE
async function cargarCursos() {
    const tbody = document.getElementById('tablaCatalogo');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">Cargando cursos...</td></tr>';

    if (typeof window.supabaseClient === 'undefined') return;

    const { data, error } = await window.supabaseClient
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay cursos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(c => `
        <tr onclick="seleccionarCurso('${c.id}')" style="cursor: pointer;" id="fila-${c.id}">
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

// 5. PREDECIR PRÓXIMO CÓDIGO
async function obtenerProximoCodigoCurso() {
    if (typeof window.supabaseClient === 'undefined') return 'CUR-001';

    const { data, error } = await window.supabaseClient
        .from('cursos')
        .select('codigo_curso')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0 || !data[0].codigo_curso) {
        return 'CUR-001';
    }

    const ultimoCodigo = data[0].codigo_curso; // Ej: CUR-001
    const partes = ultimoCodigo.split('-');
    const num = parseInt(partes[1], 10) || 0;
    const proximoNum = String(num + 1).padStart(3, '0');

    return `CUR-${proximoNum}`;
}

// 6. SELECCIONAR FILA DE LA TABLA
async function seleccionarCurso(id) {
    idSeleccionado = id;

    // Resaltar fila seleccionada en CSS
    document.querySelectorAll('#tablaCatalogo tr').forEach(tr => tr.style.backgroundColor = '');
    const fila = document.getElementById(`fila-${id}`);
    if (fila) fila.style.backgroundColor = '#d1e7dd';

    // Obtener datos del curso
    const { data, error } = await window.supabaseClient
        .from('cursos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return;

    // Cargar en el formulario
    document.getElementById('curso_codigo').value = data.codigo_curso;
    document.getElementById('curso_nombre').value = data.nombre;
    document.getElementById('curso_modalidad').value = data.modalidad || 'Presencial';
    document.getElementById('curso_teoria').value = data.hs_teoria || 0;
    document.getElementById('curso_practica').value = data.hs_practica || 0;
    document.getElementById('curso_carga').value = data.carga_horaria || 0;
    document.getElementById('curso_contenido').value = data.contenido || '';
    document.getElementById('curso_estado').value = data.estado || 'Activo';
}

// 7. BOTÓN AGREGAR (NUEVO REGISTRO)
async function nuevoRegistro() {
    idSeleccionado = null;
    document.querySelectorAll('#tablaCatalogo tr').forEach(tr => tr.style.backgroundColor = '');

    if (catalogoActual === 'cursos') {
        const proximoCodigo = await obtenerProximoCodigoCurso();
        document.getElementById('curso_codigo').value = proximoCodigo;
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

// 8. BOTÓN GUARDAR (CREAR O EDITAR)
async function guardarRegistro() {
    if (catalogoActual === 'cursos') {
        const nombre = document.getElementById('curso_nombre').value.trim();
        if (!nombre) {
            alert('Ingresá el nombre del curso antes de guardar.');
            return;
        }

        const cursoPayload = {
            nombre: nombre,
            modalidad: document.getElementById('curso_modalidad').value,
            hs_teoria: parseFloat(document.getElementById('curso_teoria').value) || 0,
            hs_practica: parseFloat(document.getElementById('curso_practica').value) || 0,
            carga_horaria: parseFloat(document.getElementById('curso_carga').value) || 0,
            contenido: document.getElementById('curso_contenido').value,
            estado: document.getElementById('curso_estado').value
        };

        if (idSeleccionado) {
            // EDITAR REGISTRO EXISTENTE
            const { error } = await window.supabaseClient
                .from('cursos')
                .update(cursoPayload)
                .eq('id', idSeleccionado);

            if (error) {
                alert('Error al actualizar el curso: ' + error.message);
            } else {
                alert('Curso actualizado correctamente.');
                await cargarCursos();
                await nuevoRegistro();
            }
        } else {
            // CREAR NUEVO REGISTRO
            const { data, error } = await window.supabaseClient
                .from('cursos')
                .insert([cursoPayload])
                .select();

            if (error) {
                alert('Error al guardar el curso: ' + error.message);
            } else {
                alert(`Curso guardado exitosamente con código: ${data[0].codigo_curso}`);
                await cargarCursos();
                await nuevoRegistro();
            }
        }
    }
}

// 9. BOTÓN ELIMINAR
async function eliminarRegistro() {
    if (!idSeleccionado) {
        alert('Por favor, seleccioná un curso de la lista para eliminar.');
        return;
    }

    const confirmar = confirm('¿Estás seguro de que querés eliminar este curso?');
    if (!confirmar) return;

    const { error } = await window.supabaseClient
        .from('cursos')
        .delete()
        .eq('id', idSeleccionado);

    if (error) {
        alert('Error al eliminar: ' + error.message);
    } else {
        alert('Curso eliminado correctamente.');
        await cargarCursos();
        await nuevoRegistro();
    }
}

function cancelarEdicion() {
    nuevoRegistro();
}
