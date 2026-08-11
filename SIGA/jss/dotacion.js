// ===================================================
// SIGA_APP - LÓGICA DE BÚSQUEDA DE DOTACIÓN (LOCAL)
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosDotacion();
});

function inicializarEventosDotacion() {
    const inputLegajo = document.getElementById('legajo');
    if (!inputLegajo) return;

    // Detectar cuando el usuario escribe para disparar al llegar a 5 dígitos
    inputLegajo.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Solo números
        e.target.value = val;

        if (val.length === 5) {
            ejecutarBusquedaLegajo();
        }
    });
}

function ejecutarBusquedaLegajo() {
    const inputLegajo = document.getElementById('legajo');
    if (!inputLegajo) return;

    let valorRaw = inputLegajo.value.trim();
    if (!valorRaw) return;

    // Convertir a número puro y a formato padded de 5 dígitos (ej: 102 -> 00102)
    const legajoNumero = parseInt(valorRaw, 10);
    const legajoPadded = String(legajoNumero).padStart(5, '0');
    
    // Formatear el input a 5 dígitos
    inputLegajo.value = legajoPadded;

    // Obtener la base local (soporta si se llama empleadosData o empleados en /data/empleados.js)
    const baseLocal = (typeof empleadosData !== 'undefined') 
        ? empleadosData 
        : ((typeof empleados !== 'undefined') ? empleados : []);

    if (!Array.isArray(baseLocal) || baseLocal.length === 0) {
        alert("No se encontró la base de datos local en 'data/empleados.js'");
        return;
    }

    // Buscar coincidencia por número o texto con/sin ceros
    const empleado = baseLocal.find(emp => {
        const leg = String(emp.legajo || emp.Legajo || emp.LEGAJO || '').trim();
        return leg === legajoPadded || leg === String(legajoNumero) || parseInt(leg, 10) === legajoNumero;
    });

    if (empleado) {
        completarCamposDotacion(empleado);
        inputLegajo.blur(); // Cierra el teclado en móviles/tablets
    } else {
        alert(`No se encontró ningún empleado con el legajo ${legajoPadded}`);
        limpiarCamposDotacion(false);
    }
}

function completarCamposDotacion(e) {
    document.getElementById('apellido').value       = e.apellido       || e.Apellido       || e.APELLIDO       || '';
    document.getElementById('nombreEmpleado').value = e.nombre         || e.Nombre         || e.NOMBRE         || '';
    document.getElementById('puesto').value         = e.puesto         || e.Puesto         || e.PUESTO         || '';
    document.getElementById('categoria').value      = e.categoria      || e.Categoria      || e.CATEGORIA      || '';
    document.getElementById('direccion').value      = e.direccion      || e.Direccion      || e.DIRECCION      || '';
    document.getElementById('gerencia').value       = e.gerencia       || e.Gerencia       || e.GERENCIA       || '';
    document.getElementById('jefatura').value       = e.jefatura       || e.Jefatura       || e.JEFATURA       || '';
    document.getElementById('manager').value        = e.manager        || e.Manager        || e.MANAGER        || '';
    document.getElementById('email').value          = e.email          || e.Email          || e.EMAIL          || '';
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
