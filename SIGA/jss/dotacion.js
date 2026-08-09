// ===================================================
// SIGA_APP - LÓGICA DE DOTACIÓN Y ASISTENTES
// ===================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Detectar si venimos con una capacitación asignada
    verificarCapacitacionOrigen();

    // 2. Cargar el listado de personal inmediatamente
    await cargarListadoPersonal();

    // 3. Vincular el buscador en tiempo real
    configurarBuscador();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// Muestra qué capacitación se está editando si venimos desde Actividades
function verificarCapacitacionOrigen() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCap = urlParams.get('id_cap') || localStorage.getItem("id_cap_asistencia");

    if (idCap) {
        const header = document.querySelector('.subtitulo') || document.querySelector('header div');
        if (header) {
            const aviso = document.createElement('div');
            aviso.style.cssText = "background: #e8f8f5; color: #117a65; padding: 10px 15px; border-radius: 6px; font-weight: bold; margin-top: 10px; border: 1px solid #a3e4d7;";
            aviso.innerHTML = `📋 Registrando asistentes para la capacitación: <strong>${idCap}</strong>`;
            header.appendChild(aviso);
        }
    }
}

// Carga la lista completa desde la tabla de Supabase
async function cargarListadoPersonal() {
    const db = obtenerDB();
    if (!db) return;

    // Buscar o crear el contenedor para la tabla si no existe en la vista
    let contenedorTabla = document.getElementById('contenedorTablaPersonal');
    if (!contenedorTabla) {
        contenedorTabla = document.createElement('div');
        contenedorTabla.id = 'contenedorTablaPersonal';
        contenedorTabla.style.marginTop = '30px';
        document.querySelector('.formulario')?.appendChild(contenedorTabla);
    }

    contenedorTabla.innerHTML = '<p style="text-align:center; padding:20px;">Cargando personal...</p>';

    try {
        const { data, error } = await db
            .from('asistentes')
            .select('*')
            .order('apellido', { ascending: true })
            .limit(100);

        if (error) throw error;

        window.listaPersonalCompleta = data || [];
        renderizarTablaPersonal(window.listaPersonalCompleta);

    } catch (err) {
        console.error("Error cargando personal:", err);
        contenedorTabla.innerHTML = '<p style="color:red; text-align:center;">Error al conectar con la base de personal.</p>';
    }
}

function renderizarTablaPersonal(lista) {
    const contenedor = document.getElementById('contenedorTablaPersonal');
    if (!contenedor) return;

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding:20px;">No se encontraron registros de personal.</p>';
        return;
    }

    let html = `
        <h3 style="margin-bottom:15px; color:#2c3e50;">Listado de Personal (${lista.length})</h3>
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <thead>
                    <tr style="background:#2c3e50; color:#fff; text-align:left;">
                        <th style="padding:12px;">Legajo</th>
                        <th style="padding:12px;">Apellido y Nombre</th>
                        <th style="padding:12px;">Puesto</th>
                        <th style="padding:12px;">Gerencia</th>
                        <th style="padding:12px; text-align:center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
    `;

    lista.forEach(emp => {
        html += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px; font-weight:bold;">${emp.legajo || '-'}</td>
                <td style="padding:10px;">${emp.apellido || ''}, ${emp.nombre || ''}</td>
                <td style="padding:10px;">${emp.puesto || '-'}</td>
                <td style="padding:10px;">${emp.gerencia || '-'}</td>
                <td style="padding:10px; text-align:center;">
                    <button onclick="asignarAsistente('${emp.legajo}')" style="background:#27ae60; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                        + Añadir
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    contenedor.innerHTML = html;
}

// Filtrado rápido al escribir en Legajo, Apellido o Nombre
function configurarBuscador() {
    const inputLegajo = document.getElementById('legajo');
    const inputApellido = document.getElementById('apellido');
    const inputNombre = document.getElementById('nombre');

    const filtrar = () => {
        if (!window.listaPersonalCompleta) return;

        const leg = inputLegajo?.value.toLowerCase().trim() || '';
        const ape = inputApellido?.value.toLowerCase().trim() || '';
        const nom = inputNombre?.value.toLowerCase().trim() || '';

        const resultado = window.listaPersonalCompleta.filter(item => {
            const matchLeg = !leg || (item.legajo && item.legajo.toLowerCase().includes(leg));
            const matchApe = !ape || (item.apellido && item.apellido.toLowerCase().includes(ape));
            const matchNom = !nom || (item.nombre && item.nombre.toLowerCase().includes(nom));
            return matchLeg && matchApe && matchNom;
        });

        renderizarTablaPersonal(resultado);
    };

    inputLegajo?.addEventListener('input', filtrar);
    inputApellido?.addEventListener('input', filtrar);
    inputNombre?.addEventListener('input', filtrar);
}

window.asignarAsistente = function(legajo) {
    const idCap = new URLSearchParams(window.location.search).get('id_cap') || localStorage.getItem("id_cap_asistencia");
    alert(`Asistente con legajo ${legajo} asignado a la capacitación ${idCap || 'seleccionada'}.`);
};
