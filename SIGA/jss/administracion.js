// ===================================================
// SIGA_APP - LÓGICA DE ADMINISTRACIÓN Y CATÁLOGOS UNIFICADA
// ===================================================

let catalogoActual = 'programas';
let idSeleccionado = null; // Almacena el UUID del registro seleccionado para editar o eliminar

document.addEventListener('DOMContentLoaded', () => {
    conectarEventosMenu();
    cambiarCatalogo('programas');
});

// 1. ASIGNACIÓN DE EVENTOS EN EL MENÚ LATERAL DE CATÁLOGOS
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

    // Resaltar opción seleccionada en el menú
    document.querySelectorAll('.menu-admin ul li').forEach(li => li.classList.remove('activo'));
    const btnActivo = document.getElementById(`btn-cat-${catalogo}`);
    if (btnActivo) btnActivo.classList.add('activo');

    // Paneles principales
    const panelGenerico = document.getElementById('panelGenerico');
    const panelDotacion = document.getElementById('panelDotacion');
    const panelBases = document.getElementById('panelBases');

    if (panelGenerico) panelGenerico.style.display = 'none';
    if (panelDotacion) panelDotacion.style.display = 'none';
    if (panelBases) panelBases.style.display = 'none';

    // Vistas especiales
    if (catalogo === 'dotacion') {
        if (panelDotacion) panelDotacion.style.display = 'block';
        return;
    }
    if (catalogo === 'bases') {
        if (panelBases) panelBases.style.display = 'block';
        return;
    }

    // Panel genérico
    if (panelGenerico) panelGenerico.style.display = 'block';

    const tituloCatalogo = document.getElementById('tituloCatalogo');
    const colNombre = document.getElementById('colNombre');
    const formProgramas = document.getElementById('form-programas');
    const formCursos = document.getElementById('form-cursos');
    const formInstructores = document.getElementById('form-instructores');

    // Ocultar todos los formularios específicos
    if (formProgramas) formProgramas.style.display = 'none';
    if (formCursos) formCursos.style.display = 'none';
    if (formInstructores) formInstructores.style.display = 'none';

    // Activar formulario y cargar grilla según catálogo
    if (catalogo === 'programas') {
        if (tituloCatalogo) tituloCatalogo.textContent = 'Programas';
        if (colNombre) colNombre.textContent = 'Programa';
        if (formProgramas) formProgramas.style.display = 'block';
        await cargarProgramas();
    } else if (catalogo === 'cursos') {
        if (tituloCatalogo) tituloCatalogo.textContent = 'Cursos';
        if (colNombre) colNombre.textContent = 'Curso';
        if (formCursos) formCursos.style.display = 'block';
        await cargarCursos();
    } else if (catalogo === 'instructores') {
        if (tituloCatalogo) tituloCatalogo.textContent = 'Instructores';
        if (colNombre) colNombre.textContent = 'Instructor';
        if (formInstructores) formInstructores.style.display = 'block';
        await cargarInstructores();
    }

    await nuevoRegistro();
}

// 3. SUMA AUTOMÁTICA DE HORAS PARA CURSOS
function sumarHorasCurso() {
    const teoria = parseFloat(document.getElementById('curso_teoria')?.value) || 0;
    const practica = parseFloat(document.getElementById('curso_practica')?.value) || 0;
    const inputCarga = document.getElementById('curso_carga');
    if (inputCarga) inputCarga.value = teoria + practica;
}

// 4. PREDECIR PRÓXIMOS CÓDIGOS CORRELATIVOS
async function obtenerProximoCodigo(tabla, prefijo, numPartes = 3) {
    if (typeof window.supabaseClient === 'undefined') return `${prefijo}-001`;

    const { data, error } = await window.supabaseClient
        .from(tabla)
        .select('codigo, codigo_curso')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) return `${prefijo}-001`;

    const ultimoObj = data[0];
    const ultimoCodigo = ultimoObj.codigo || ultimoObj.codigo_curso;
    if (!ultimoCodigo) return `${prefijo}-001`;

    const partes = ultimoCodigo.split('-');
    const num = parseInt(partes[partes.length - 1], 10) || 0;
    const proximoNum = String(num + 1).padStart(3, '0');

    return numPartes === 3 ? `${partes[0]}-${partes[1]}-${proximoNum}` : `${partes[0]}-${proximoNum}`;
}

// 5. CONSULTA Y CONSULTA DE DATOS (READ)
async function cargarProgramas() {
    const tbody = document.getElementById('tablaCatalogo');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">Cargando programas...</td></tr>';

    if (typeof window.supabaseClient === 'undefined') return;

    const { data, error } = await window.supabaseClient
        .from('programas')
        .select('*')
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay programas registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr onclick="seleccionarPrograma('${p.id}')" style="cursor: pointer;" id="fila-${p.id}">
            <td><strong>${p.codigo || '-'}</strong></td>
            <td>${p.nombre}</td>
            <td>${p.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

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

async function cargarInstructores() {
    const tbody = document.getElementById('tablaCatalogo');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">Cargando instructores...</td></tr>';

    if (typeof window.supabaseClient === 'undefined') return;

    const { data, error } = await window.supabaseClient
        .from('instructores')
        .select('*')
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay instructores registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(i => `
        <tr onclick="seleccionarInstructor('${i.id}')" style="cursor: pointer;" id="fila-${i.id}">
            <td><strong>${i.codigo || '-'}</strong></td>
            <td>${i.apellido}, ${i.nombre}</td>
            <td>${i.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

// 6. SELECCIÓN DE FILAS EN LA GRILLA
async function seleccionarPrograma(id) {
    idSeleccionado = id;
    marcarFilaSeleccionada(id);

    const { data } = await window.supabaseClient.from('programas').select('*').eq('id', id).single();
    if (!data) return;

    document.getElementById('pro_codigo').value = data.codigo || '';
    document.getElementById('pro_nombre').value = data.nombre || '';
    document.getElementById('pro_descripcion').value = data.descripcion || '';
    document.getElementById('pro_estado').value = data.estado || 'Activo';
}

async function seleccionarCurso(id) {
    idSeleccionado = id;
    marcarFilaSeleccionada(id);

    const { data } = await window.supabaseClient.from('cursos').select('*').eq('id', id).single();
    if (!data) return;

    document.getElementById('curso_codigo').value = data.codigo_curso || '';
    document.getElementById('curso_nombre').value = data.nombre || '';
    document.getElementById('curso_modalidad').value = data.modalidad || 'Presencial';
    document.getElementById('curso_teoria').value = data.hs_teoria || 0;
    document.getElementById('curso_practica').value = data.hs_practica || 0;
    document.getElementById('curso_carga').value = data.carga_horaria || 0;
    document.getElementById('curso_contenido').value = data.contenido || '';
    document.getElementById('curso_estado').value = data.estado || 'Activo';
}

async function seleccionarInstructor(id) {
    idSeleccionado = id;
    marcarFilaSeleccionada(id);

    const { data } = await window.supabaseClient.from('instructores').select('*').eq('id', id).single();
    if (!data) return;

    document.getElementById('ins_codigo').value = data.codigo || '';
    document.getElementById('ins_nombre').value = data.nombre || '';
    document.getElementById('ins_apellido').value = data.apellido || '';
    document.getElementById('ins_dni').value = data.dni || '';
    document.getElementById('ins_email').value = data.email || '';
    document.getElementById('ins_especialidad').value = data.especialidad || '';
    document.getElementById('ins_tipo').value = data.tipo || 'Interno';
    document.getElementById('ins_estado').value = data.estado || 'Activo';
}

function marcarFilaSeleccionada(id) {
    document.querySelectorAll('#tablaCatalogo tr').forEach(tr => tr.style.backgroundColor = '');
    const fila = document.getElementById(`fila-${id}`);
    if (fila) fila.style.backgroundColor = '#d1e7dd';
}

// 7. LIMPIAR FORMULARIO (AGREGAR / CANCELAR)
async function nuevoRegistro() {
    idSeleccionado = null;
    document.querySelectorAll('#tablaCatalogo tr').forEach(tr => tr.style.backgroundColor = '');

    if (catalogoActual === 'programas') {
        const codigo = await obtenerProximoCodigo('programas', 'PRO-2026', 3);
        document.getElementById('pro_codigo').value = codigo;
        document.getElementById('pro_nombre').value = '';
        document.getElementById('pro_descripcion').value = '';
        document.getElementById('pro_estado').value = 'Activo';
    } else if (catalogoActual === 'cursos') {
        const codigo = await obtenerProximoCodigo('cursos', 'CUR', 2);
        document.getElementById('curso_codigo').value = codigo;
        document.getElementById('curso_nombre').value = '';
        document.getElementById('curso_teoria').value = 0;
        document.getElementById('curso_practica').value = 0;
        document.getElementById('curso_carga').value = 0;
        document.getElementById('curso_contenido').value = '';
        document.getElementById('curso_estado').value = 'Activo';
    } else if (catalogoActual === 'instructores') {
        const codigo = await obtenerProximoCodigo('instructores', 'INS-2026', 3);
        document.getElementById('ins_codigo').value = codigo;
        document.getElementById('ins_nombre').value = '';
        document.getElementById('ins_apellido').value = '';
        document.getElementById('ins_dni').value = '';
        document.getElementById('ins_email').value = '';
        document.getElementById('ins_especialidad').value = '';
        document.getElementById('ins_tipo').value = 'Interno';
        document.getElementById('ins_estado').value = 'Activo';
    }
}

// 8. GUARDAR O EDITAR REGISTRO
async function guardarRegistro() {
    if (catalogoActual === 'programas') {
        const nombre = document.getElementById('pro_nombre').value.trim();
        if (!nombre) return alert('Ingresá el nombre del programa.');

        const payload = {
            nombre: nombre,
            descripcion: document.getElementById('pro_descripcion').value,
            estado: document.getElementById('pro_estado').value
        };

        await procesarGuardado('programas', payload, cargarProgramas);

    } else if (catalogoActual === 'cursos') {
        const nombre = document.getElementById('curso_nombre').value.trim();
        if (!nombre) return alert('Ingresá el nombre del curso.');

        const payload = {
            nombre: nombre,
            modalidad: document.getElementById('curso_modalidad').value,
            hs_teoria: parseFloat(document.getElementById('curso_teoria').value) || 0,
            hs_practica: parseFloat(document.getElementById('curso_practica').value) || 0,
            carga_horaria: parseFloat(document.getElementById('curso_carga').value) || 0,
            contenido: document.getElementById('curso_contenido').value,
            estado: document.getElementById('curso_estado').value
        };

        await procesarGuardado('cursos', payload, cargarCursos);

    } else if (catalogoActual === 'instructores') {
        const nombre = document.getElementById('ins_nombre').value.trim();
        const apellido = document.getElementById('ins_apellido').value.trim();
        if (!nombre || !apellido) return alert('Ingresá nombre y apellido del instructor.');

        const payload = {
            nombre: nombre,
            apellido: apellido,
            dni: document.getElementById('ins_dni').value,
            email: document.getElementById('ins_email').value,
            especialidad: document.getElementById('ins_especialidad').value,
            tipo: document.getElementById('ins_tipo').value,
            estado: document.getElementById('ins_estado').value
        };

        await procesarGuardado('instructores', payload, cargarInstructores);
    }
}

async function procesarGuardado(tabla, payload, funcionRecargar) {
    if (idSeleccionado) {
        const { error } = await window.supabaseClient.from(tabla).update(payload).eq('id', idSeleccionado);
        if (error) alert('Error al actualizar: ' + error.message);
        else alert('Registro actualizado con éxito.');
    } else {
        const { data, error } = await window.supabaseClient.from(tabla).insert([payload]).select();
        if (error) alert('Error al guardar: ' + error.message);
        else alert('Registro guardado exitosamente.');
    }

    await funcionRecargar();
    await nuevoRegistro();
}

// 9. ELIMINAR REGISTRO
async function eliminarRegistro() {
    if (!idSeleccionado) {
        alert('Seleccioná un registro de la lista para eliminar.');
        return;
    }

    if (!confirm('¿Estás seguro de eliminar el registro seleccionado?')) return;

    const { error } = await window.supabaseClient
        .from(catalogoActual)
        .delete()
        .eq('id', idSeleccionado);

    if (error) {
        alert('Error al eliminar: ' + error.message);
    } else {
        alert('Registro eliminado correctamente.');
        if (catalogoActual === 'programas') await cargarProgramas();
        if (catalogoActual === 'cursos') await cargarCursos();
        if (catalogoActual === 'instructores') await cargarInstructores();
        await nuevoRegistro();
    }
}

function cancelarEdicion() {
    nuevoRegistro();
}
