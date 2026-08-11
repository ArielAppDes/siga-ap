// ===================================================
// SIGA_APP V0.2 - LÓGICA DE ADMINISTRACIÓN Y CATÁLOGOS UNIFICADA
// ===================================================

let catalogoActual = 'programas';
let idSeleccionado = null; // Almacena el código PK seleccionado (ej: PRO-2026-001, INS-2026-001)

document.addEventListener('DOMContentLoaded', () => {
    conectarEventosMenu();
    cambiarCatalogo('programas');
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// 1. ASIGNACIÓN DE EVENTOS EN EL MENÚ LATERAL
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
    const formProgramas = document.getElementById('form-programas');
    const formCursos = document.getElementById('form-cursos');
    const formInstructores = document.getElementById('form-instructores');

    if (formProgramas) formProgramas.style.display = 'none';
    if (formCursos) formCursos.style.display = 'none';
    if (formInstructores) formInstructores.style.display = 'none';

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

// 4. PREDECIR CÓDIGOS CORRELATIVOS UNIFORMES (PREFIJO-AAAA-XXX)
async function obtenerProximoCodigo(tabla, columnaPK, prefijo) {
    const db = obtenerDB();
    const anioActual = new Date().getFullYear();
    const formatoPrefijo = `${prefijo}-${anioActual}`;

    if (!db) return `${formatoPrefijo}-001`;

    try {
        const { data, error } = await db.from(tabla).select(columnaPK);
        if (error || !data || data.length === 0) return `${formatoPrefijo}-001`;

        let maxNum = 0;
        data.forEach(item => {
            const val = item[columnaPK];
            if (val) {
                const partes = val.split('-');
                if (partes.length >= 3) {
                    const num = parseInt(partes[2], 10);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            }
        });

        const siguiente = String(maxNum + 1).padStart(3, '0');
        return `${formatoPrefijo}-${siguiente}`;
    } catch (e) {
        return `${formatoPrefijo}-001`;
    }
}

// 5. CONSULTAS Y CARGA DE GRILLAS
async function cargarProgramas() {
    const tbody = document.getElementById('tablaCatalogo');
    const db = obtenerDB();
    if (!tbody || !db) return;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Cargando programas...</td></tr>';

    const { data, error } = await db.from('programas').select('*').order('codigo_programa', { ascending: true });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay programas registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr onclick="seleccionarPrograma('${p.codigo_programa}')" style="cursor: pointer;" id="fila-${p.codigo_programa}">
            <td><strong>${p.codigo_programa}</strong></td>
            <td>${p.nombre || '-'}</td>
            <td>${p.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

async function cargarCursos() {
    const tbody = document.getElementById('tablaCatalogo');
    const db = obtenerDB();
    if (!tbody || !db) return;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Cargando cursos...</td></tr>';

    const { data, error } = await db.from('cursos').select('*').order('codigo_curso', { ascending: true });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay cursos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(c => `
        <tr onclick="seleccionarCurso('${c.codigo_curso}')" style="cursor: pointer;" id="fila-${c.codigo_curso}">
            <td><strong>${c.codigo_curso}</strong></td>
            <td>${c.nombre || '-'}</td>
            <td>${c.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

async function cargarInstructores() {
    const tbody = document.getElementById('tablaCatalogo');
    const db = obtenerDB();
    if (!tbody || !db) return;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Cargando instructores...</td></tr>';

    const { data, error } = await db.from('instructores').select('*').order('codigo_instructor', { ascending: true });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay instructores registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(i => `
        <tr onclick="seleccionarInstructor('${i.codigo_instructor}')" style="cursor: pointer;" id="fila-${i.codigo_instructor}">
            <td><strong>${i.codigo_instructor}</strong></td>
            <td>${i.apellido || ''}, ${i.nombre || ''}</td>
            <td>${i.estado || 'Activo'}</td>
        </tr>
    `).join('');
}

// 6. SELECCIÓN DE FILAS
async function seleccionarPrograma(codigo) {
    idSeleccionado = codigo;
    marcarFilaSeleccionada(codigo);
    const db = obtenerDB();

    const { data } = await db.from('programas').select('*').eq('codigo_programa', codigo).single();
    if (!data) return;

    document.getElementById('pro_codigo').value = data.codigo_programa || '';
    document.getElementById('pro_nombre').value = data.nombre || '';
    document.getElementById('pro_descripcion').value = data.descripcion || '';
    document.getElementById('pro_estado').value = data.estado || 'Activo';
}

async function seleccionarCurso(codigo) {
    idSeleccionado = codigo;
    marcarFilaSeleccionada(codigo);
    const db = obtenerDB();

    const { data } = await db.from('cursos').select('*').eq('codigo_curso', codigo).single();
    if (!data) return;

    document.getElementById('curso_codigo').value = data.codigo_curso || '';
    document.getElementById('curso_nombre').value = data.nombre || '';
    document.getElementById('curso_modalidad').value = data.modalidad || 'Presencial';
    document.getElementById('curso_teoria').value = data.hs_teoria || 0;
    document.getElementById('curso_practica').value = data.hs_practica || 0;
    document.getElementById('curso_carga').value = data.hs_totales || data.carga_horaria || 0;
    document.getElementById('curso_contenido').value = data.contenido || '';
    document.getElementById('curso_estado').value = data.estado || 'Activo';
}

async function seleccionarInstructor(codigo) {
    idSeleccionado = codigo;
    marcarFilaSeleccionada(codigo);
    const db = obtenerDB();

    const { data } = await db.from('instructores').select('*').eq('codigo_instructor', codigo).single();
    if (!data) return;

    document.getElementById('ins_codigo').value = data.codigo_instructor || '';
    document.getElementById('ins_nombre').value = data.nombre || '';
    document.getElementById('ins_apellido').value = data.apellido || '';
    document.getElementById('ins_dni').value = data.dni || '';
    document.getElementById('ins_email').value = data.email || '';
    document.getElementById('ins_especialidad').value = data.especialidad || '';
    document.getElementById('ins_tipo').value = data.tipo || 'Interno';
    document.getElementById('ins_estado').value = data.estado || 'Activo';
}

function marcarFilaSeleccionada(codigo) {
    document.querySelectorAll('#tablaCatalogo tr').forEach(tr => tr.style.backgroundColor = '');
    const fila = document.getElementById(`fila-${codigo}`);
    if (fila) fila.style.backgroundColor = '#d1e7dd';
}

// 7. LIMPIAR FORMULARIO / NUEVO REGISTRO
async function nuevoRegistro() {
    idSeleccionado = null;
    document.querySelectorAll('#tablaCatalogo tr').forEach(tr => tr.style.backgroundColor = '');

    if (catalogoActual === 'programas') {
        const codigo = await obtenerProximoCodigo('programas', 'codigo_programa', 'PRO');
        document.getElementById('pro_codigo').value = codigo;
        document.getElementById('pro_nombre').value = '';
        document.getElementById('pro_descripcion').value = '';
        document.getElementById('pro_estado').value = 'Activo';
    } else if (catalogoActual === 'cursos') {
        const codigo = await obtenerProximoCodigo('cursos', 'codigo_curso', 'CUR');
        document.getElementById('curso_codigo').value = codigo;
        document.getElementById('curso_nombre').value = '';
        document.getElementById('curso_teoria').value = 0;
        document.getElementById('curso_practica').value = 0;
        document.getElementById('curso_carga').value = 0;
        document.getElementById('curso_contenido').value = '';
        document.getElementById('curso_estado').value = 'Activo';
    } else if (catalogoActual === 'instructores') {
        const codigo = await obtenerProximoCodigo('instructores', 'codigo_instructor', 'INS');
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

// 8. GUARDAR O EDITAR REGISTRO (UPSERT)
async function guardarRegistro() {
    const db = obtenerDB();
    if (!db) return;

    if (catalogoActual === 'programas') {
        const codigo = document.getElementById('pro_codigo').value;
        const nombre = document.getElementById('pro_nombre').value.trim();
        if (!nombre) return alert('Ingresá el nombre del programa.');

        const payload = {
            codigo_programa: codigo,
            nombre: nombre,
            descripcion: document.getElementById('pro_descripcion').value,
            estado: document.getElementById('pro_estado').value
        };

        await procesarGuardado('programas', 'codigo_programa', payload, cargarProgramas);

    } else if (catalogoActual === 'cursos') {
        const codigo = document.getElementById('curso_codigo').value;
        const nombre = document.getElementById('curso_nombre').value.trim();
        if (!nombre) return alert('Ingresá el nombre del curso.');

        const payload = {
            codigo_curso: codigo,
            nombre: nombre,
            modalidad: document.getElementById('curso_modalidad').value,
            hs_teoria: parseFloat(document.getElementById('curso_teoria').value) || 0,
            hs_practica: parseFloat(document.getElementById('curso_practica').value) || 0,
            hs_totales: parseFloat(document.getElementById('curso_carga').value) || 0,
            estado: document.getElementById('curso_estado').value
        };

        await procesarGuardado('cursos', 'codigo_curso', payload, cargarCursos);

    } else if (catalogoActual === 'instructores') {
        const codigo = document.getElementById('ins_codigo').value;
        const nombre = document.getElementById('ins_nombre').value.trim();
        const apellido = document.getElementById('ins_apellido').value.trim();
        if (!nombre || !apellido) return alert('Ingresá nombre y apellido del instructor.');

        const payload = {
            codigo_instructor: codigo,
            nombre: nombre,
            apellido: apellido,
            dni: document.getElementById('ins_dni').value,
            email: document.getElementById('ins_email').value,
            especialidad: document.getElementById('ins_especialidad').value,
            tipo: document.getElementById('ins_tipo').value,
            estado: document.getElementById('ins_estado').value
        };

        await procesarGuardado('instructores', 'codigo_instructor', payload, cargarInstructores);
    }
}

async function procesarGuardado(tabla, columnaPK, payload, funcionRecargar) {
    const db = obtenerDB();
    const { error } = await db.from(tabla).upsert(payload, { onConflict: columnaPK });

    if (error) {
        alert('Error al guardar: ' + error.message);
    } else {
        alert('Registro guardado exitosamente.');
        await funcionRecargar();
        await nuevoRegistro();
    }
}

// 9. ELIMINAR REGISTRO
async function eliminarRegistro() {
    if (!idSeleccionado) return alert('Seleccioná un registro de la lista para eliminar.');
    if (!confirm(`¿Estás seguro de eliminar el registro ${idSeleccionado}?`)) return;

    const db = obtenerDB();
    let columnaPK = 'codigo_programa';
    if (catalogoActual === 'cursos') columnaPK = 'codigo_curso';
    if (catalogoActual === 'instructores') columnaPK = 'codigo_instructor';

    const { error } = await db.from(catalogoActual).delete().eq(columnaPK, idSeleccionado);

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
