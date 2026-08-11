// ===================================================
// SIGA_APP - LÓGICA DE BÚSQUEDA DE DOTACIÓN
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosDotacion();
});

function inicializarEventosDotacion() {
    const inputLegajo = document.getElementById('legajo');
    if (!inputLegajo) return;

    // Detección en tiempo real de tipeo
    inputLegajo.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Solo números
        e.target.value = val;

        // Disparo automático al completar los 5 dígitos
        if (val.length === 5) {
            ejecutarBusquedaLegajo();
            inputLegajo.blur(); // Oculta el teclado táctil en tablets tras encontrar los datos
        }
    });
}

async function ejecutarBusquedaLegajo() {
    const inputLegajo = document.getElementById('legajo');
    if (!inputLegajo) return;

    let valor = inputLegajo.value.trim();
    if (!valor) return;

    // Rellena con ceros a la izquierda para legajos cortos (ej: 102 -> 00102)
    const legajoBuscado = valor.padStart(5, '0');
    inputLegajo.value = legajoBuscado;

    const db = window.supabaseClient || window.supabase;
    let empleado = null;

    if (db) {
        try {
            const { data } = await db
                .from('asistentes')
                .select('*')
                .eq('legajo', legajoBuscado)
                .maybeSingle();

            if (data) empleado = data;
        } catch (e) {
            console.warn('Error al consultar Supabase:', e);
        }
    }

    // Fallback a memoria local si existiera
    if (!empleado && typeof empleadosData !== 'undefined' && Array.isArray(empleadosData)) {
        empleado = empleadosData.find(emp => String(emp.legajo).padStart(5, '0') === legajoBuscado);
    }

    if (empleado) {
        completarCamposDotacion(empleado);
        inputLegajo.blur(); // Cierra teclado táctil
    } else {
        alert(`No se encontró ningún empleado con el legajo ${legajoBuscado}`);
        limpiarCamposDotacion(false);
    }
}

function completarCamposDotacion(e) {
    document.getElementById('apellido').value = e.apellido || e.Apellido || '';
    document.getElementById('nombreEmpleado').value = e.nombre || e.Nombre || '';
    document.getElementById('puesto').value = e.puesto || e.Puesto || '';
    document.getElementById('categoria').value = e.categoria || e.Categoria || '';
    document.getElementById('direccion').value = e.direccion || e.Direccion || '';
    document.getElementById('gerencia').value = e.gerencia || e.Gerencia || '';
    document.getElementById('jefatura').value = e.jefatura || e.Jefatura || '';
    document.getElementById('manager').value = e.manager || e.Manager || '';
    document.getElementById('email').value = e.email || e.Email || '';
}

function limpiarCamposDotacion(limpiarLegajo = true) {
    if (limpiarLegajo) {
        const inputLegajo = document.getElementById('legajo');
        if (inputLegajo) {
            inputLegajo.value = '';
            inputLegajo.focus();
        }
    }

    const campos = ['apellido', 'nombreEmpleado', 'puesto', 'categoria', 'direccion', 'gerencia', 'jefatura', 'manager', 'email'];
    campos.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
}
