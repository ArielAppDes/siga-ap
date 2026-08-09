// ===================================================
// SIGA_APP - LÓGICA DE DOTACIÓN (LECTURA LOCAL EMPLEADOS.JS)
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    mostrarCapacitacionActiva();
    configurarBuscadorLegajo();
    configurarImportacionExcel();
    configurarBotones();
});

// Muestra el ID de la capacitación actual si venimos desde Actividades
function mostrarCapacitacionActiva() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCap = urlParams.get('id_cap') || localStorage.getItem("id_cap_asistencia");
    const container = document.getElementById('badgeCapacitacion');

    if (idCap && container) {
        container.innerHTML = `
            <div style="background: #e8f8f5; color: #117a65; padding: 8px 15px; border-radius: 6px; font-weight: bold; border: 1px solid #a3e4d7;">
                📋 Registrando para: <strong>${idCap}</strong>
            </div>
        `;
    }
}

// Búsqueda en tiempo real sobre la variable global "empleados" del archivo empleados.js
function configurarBuscadorLegajo() {
    const inputLegajo = document.getElementById('legajo');
    if (!inputLegajo) return;

    inputLegajo.addEventListener('input', (e) => {
        const val = e.target.value.trim();

        if (!val) {
            limpiarCamposEmpleado();
            return;
        }

        // Verificar que la constante global 'empleados' exista en el entorno
        const lista = window.empleados || (typeof empleados !== 'undefined' ? empleados : []);

        if (lista.length === 0) {
            console.warn("No se encontró la lista de empleados. Verifique la carga de empleados.js en el HTML.");
            return;
        }

        // Buscar coincidencia de legajo (soporta coincidencia parcial o exacta)
        const encontrado = lista.find(emp => emp.legajo && emp.legajo.toLowerCase() === val.toLowerCase());

        if (encontrado) {
            completarFormularioEmpleado(encontrado);
        } else {
            limpiarCamposEmpleado();
        }
    });
}

function completarFormularioEmpleado(emp) {
    setVal('apellido', emp.apellido);
    setVal('nombre', emp.nombre);
    setVal('puesto', emp.puesto);
    setVal('categoria', emp.categoria);
    setVal('direccion', emp.direccion);
    setVal('gerencia', emp.gerencia);
    setVal('jefatura', emp.jefatura);
    setVal('manager', emp.manager);
    setVal('email', emp.email);
}

function limpiarCamposEmpleado() {
    const campos = ['apellido', 'nombre', 'puesto', 'categoria', 'direccion', 'gerencia', 'jefatura', 'manager', 'email'];
    campos.forEach(c => setVal(c, ''));
}

function setVal(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor || '';
}

// Lógica para procesar un archivo Excel si se selecciona
function configurarImportacionExcel() {
    const inputExcel = document.getElementById('archivoExcel');
    if (!inputExcel) return;

    inputExcel.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

                alert(`Nómina leída correctamente: ${rows.length} registros hallados.`);
                console.log("Nómina cargada desde Excel:", rows);
            } catch (err) {
                console.error("Error al procesar el archivo Excel:", err);
                alert("Ocurrió un error al leer el archivo Excel.");
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function configurarBotones() {
    const btnAgregar = document.getElementById('btnAgregarAsistente');
    if (btnAgregar) {
        btnAgregar.onclick = () => {
            const legajo = document.getElementById('legajo')?.value;
            const idCap = localStorage.getItem("id_cap_asistencia");

            if (!legajo) {
                alert("Por favor, busque e ingrese un legajo válido.");
                return;
            }

            alert(`Empleado con legajo ${legajo} asignado correctamente a la capacitación ${idCap || ''}.`);
        };
    }

    const btnVolver = document.getElementById('btnVolver');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = "capacitaciones.html";
        };
    }
}

// ===================================================
// SIGA_APP - LÓGICA DE DOTACIÓN (LECTURA LOCAL EMPLEADOS)
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    mostrarCapacitacionActiva();
    configurarBuscadorLegajo();
    configurarImportacionExcel();
    configurarBotones();
});

function mostrarCapacitacionActiva() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCap = urlParams.get('id_cap') || localStorage.getItem("id_cap_asistencia");
    const container = document.getElementById('badgeCapacitacion');

    if (idCap && container) {
        container.innerHTML = `
            <div style="background: #e8f8f5; color: #117a65; padding: 8px 15px; border-radius: 6px; font-weight: bold; border: 1px solid #a3e4d7;">
                📋 Registrando para: <strong>${idCap}</strong>
            </div>
        `;
    }
}

function configurarBuscadorLegajo() {
    const inputLegajo = document.getElementById('legajo');
    if (!inputLegajo) return;

    inputLegajo.addEventListener('input', (e) => {
        const val = e.target.value.trim();

        if (!val) {
            limpiarCamposEmpleado();
            return;
        }

        const lista = window.empleados || (typeof empleados !== 'undefined' ? empleados : []);

        if (lista.length === 0) {
            console.warn("No se encontró la lista de empleados.");
            return;
        }

        // Búsqueda por coincidencia de legajo
        const encontrado = lista.find(emp => emp.legajo && emp.legajo.toLowerCase() === val.toLowerCase());

        if (encontrado) {
            completarFormularioEmpleado(encontrado);
        } else {
            limpiarCamposEmpleado();
        }
    });
}

function completarFormularioEmpleado(emp) {
    setVal('apellido', emp.apellido);
    setVal('nombre', emp.nombre);
    setVal('puesto', emp.puesto);
    setVal('categoria', emp.categoria);
    setVal('direccion', emp.direccion);
    setVal('gerencia', emp.gerencia);
    setVal('jefatura', emp.jefatura);
    setVal('manager', emp.manager);
    setVal('email', emp.email);
}

function limpiarCamposEmpleado() {
    const campos = ['apellido', 'nombre', 'puesto', 'categoria', 'direccion', 'gerencia', 'jefatura', 'manager', 'email'];
    campos.forEach(c => setVal(c, ''));
}

function setVal(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor || '';
}

function configurarImportacionExcel() {
    const inputExcel = document.getElementById('archivoExcel');
    if (!inputExcel) return;

    inputExcel.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

                alert(`Nómina cargada desde Excel: ${rows.length} registros hallados.`);
                console.log("Datos de nómina:", rows);
            } catch (err) {
                console.error("Error al procesar Excel:", err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function configurarBotones() {
    const btnAgregar = document.getElementById('btnAgregarAsistente');
    if (btnAgregar) {
        btnAgregar.onclick = () => {
            const legajo = document.getElementById('legajo')?.value;
            const idCap = localStorage.getItem("id_cap_asistencia");

            if (!legajo) {
                alert("Por favor, ingrese un legajo válido.");
                return;
            }

            alert(`Empleado con legajo ${legajo} asignado a la capacitación ${idCap || ''}.`);
        };
    }

    const btnVolver = document.getElementById('btnVolver');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = "capacitaciones.html";
        };
    }
}
