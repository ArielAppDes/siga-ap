// ===================================================
// SIGA_APP - LÓGICA DE DOTACIÓN DE PERSONAL
// ===================================================

document.addEventListener('DOMContentLoaded', async () => {
    verificarCapacitacionOrigen();
    await cargarListadoPersonal();
    configurarBuscador();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

// Muestra el badge de la capacitación activa arriba
function verificarCapacitacionOrigen() {
    const urlParams = new URLSearchParams(window.location.search);
    const idCap = urlParams.get('id_cap') || localStorage.getItem("id_cap_asistencia");
    const container = document.getElementById('capInfoBox');

    if (idCap && container) {
        container.innerHTML = `
            <div style="background: #e8f8f5; color: #117a65; padding: 10px 18px; border-radius: 8px; font-weight: 600; border: 1px solid #a3e4d7; display: flex; align-items: center; gap: 8px;">
                <span>📋</span> Registrando asistentes para: <strong>${idCap}</strong>
            </div>
        `;
    }
}

// Carga los empleados almacenados en Supabase
async function cargarListadoPersonal() {
    const db = obtenerDB();
    const contenedor = document.getElementById('contenedorTablaPersonal');
    if (!contenedor) return;

    if (!db) {
        contenedor.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Sin conexión a Supabase.</p>';
        return;
    }

    contenedor.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Cargando nómina de personal...</p>';

    try {
        const { data, error } = await db
            .from('asistentes')
            .select('*')
            .order('apellido', { ascending: true })
            .limit(150);

        if (error) throw error;

        window.listaPersonalCompleta = data || [];
        renderizarTablaPersonal(window.listaPersonalCompleta);

    } catch (err) {
        console.error("Error al obtener la nómina:", err);
        contenedor.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Error al consultar la base de datos de personal.</p>';
    }
}

function renderizarTablaPersonal(lista) {
    const contenedor = document.getElementById('contenedorTablaPersonal');
    if (!contenedor) return;

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding:20px; color:#777;">No se encontraron empleados con los filtros ingresados.</p>';
        return;
    }

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="color:#2c3e50; margin:0;">Nómina de Empleados (${lista.length})</h3>
        </div>
        <div style="overflow-x:auto; border-radius:8px; border:1px solid #eee;">
            <table style="width:100%; border-collapse:collapse; background:#fff; text-align:left;">
                <thead>
                    <tr style="background:#2c3e50; color:#fff;">
                        <th style="padding:12px 15px;">Legajo</th>
                        <th style="padding:12px 15px;">Apellido y Nombre</th>
                        <th style="padding:12px 15px;">Puesto</th>
                        <th style="padding:12px 15px;">Gerencia</th>
                        <th style="padding:12px 15px; text-align:center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
    `;

    lista.forEach((emp, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
        html += `
            <tr style="border-bottom:1px solid #eee; background:${bg};">
                <td style="padding:12px 15px; font-weight:bold; color:#34495e;">${emp.legajo || '-'}</td>
                <td style="padding:12px 15px;">${emp.apellido || ''}, ${emp.nombre || ''}</td>
                <td style="padding:12px 15px; color:#555;">${emp.puesto || '-'}</td>
                <td style="padding:12px 15px; color:#555;">${emp.gerencia || '-'}</td>
                <td style="padding:12px 15px; text-align:center;">
                    <button onclick="asignarAsistente('${emp.legajo}')" style="background:#27ae60; color:white; border:none; padding:7px 14px; border-radius:5px; cursor:pointer; font-weight:bold;">
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
    const urlParams = new URLSearchParams(window.location.search);
    const idCap = urlParams.get('id_cap') || localStorage.getItem("id_cap_asistencia");
    alert(`Asistente con legajo ${legajo} asignado a la capacitación ${idCap || 'activa'}.`);
};
