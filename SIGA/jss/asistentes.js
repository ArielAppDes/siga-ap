// ===================================================
// 10/08/2026 - V11.0 - SIGA_APP - REGISTRO Y CICLO DE VIDA DE ASISTENTES
// ===================================================

let listaAsistentes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarPantallaAsistentes();
    configurarEventos();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function obtenerIdCapActual(capData) {
    if (capData?.id_cap) return capData.id_cap;
    const inputId = document.getElementById('resumenIdCap') || document.getElementById('idCap') || document.getElementById('id_cap');
    if (inputId && inputId.value.trim()) return inputId.value.trim();

    const capActivaRaw = localStorage.getItem("capacitacion_activa");
    if (capActivaRaw) {
        try {
            const parsed = JSON.parse(capActivaRaw);
            if (parsed?.id_cap) return parsed.id_cap;
        } catch (e) { console.error(e); }
    }
    return localStorage.getItem("id_cap_asistencia") || '';
}

async function inicializarPantallaAsistentes() {
    const capActivaRaw = localStorage.getItem("capacitacion_activa");
    let capData = capActivaRaw ? JSON.parse(capActivaRaw) : null;
    const idCapTarget = capData?.id_cap || new URLSearchParams(window.location.search).get('id_cap');

    poblarCabeceraVisible(capData, idCapTarget);

    const db = obtenerDB();
    if (db && idCapTarget) {
        try {
            const { data } = await db.from('capacitaciones').select('*').eq('id_cap', idCapTarget).maybeSingle();
            if (data) poblarCabeceraVisible(data, idCapTarget);
        } catch (err) {
            console.error("Error consultando capacitación:", err);
        }
        await cargarAsistentesSupabase(idCapTarget);
    }
}

function poblarCabeceraVisible(cap, idFallback) {
    const idFinal = cap?.id_cap || idFallback || '';
    const instructores = [cap?.instructor_1, cap?.instructor_2].filter(Boolean).join(', ');

    const datos = {
        id: idFinal,
        curso: cap?.nombre_curso || '',
        clase: cap?.clase_nro || '1',
        fecha: cap?.fecha || new Date().toISOString().split('T')[0],
        instructor: instructores || '-',
        estado: cap?.estado || 'En curso'
    };

    const inputId = document.getElementById('resumenIdCap') || document.getElementById('idCap') || document.getElementById('id_cap');
    const inputCurso = document.getElementById('resumenCurso') || document.getElementById('curso') || document.getElementById('nombre_curso');
    const inputClase = document.getElementById('resumenClase') || document.getElementById('clase') || document.getElementById('clase_nro');
    const inputFecha = document.getElementById('resumenFecha') || document.getElementById('fecha');
    const inputInst = document.getElementById('resumenInstructor') || document.getElementById('instructor') || document.getElementById('instructor_1');
    const inputEstado = document.getElementById('resumenEstado') || document.getElementById('estado');

    if (inputId) inputId.value = datos.id;
    if (inputCurso) inputCurso.value = datos.curso;
    if (inputClase) inputClase.value = datos.clase;
    if (inputFecha) inputFecha.value = datos.fecha;
    if (inputInst) inputInst.value = datos.instructor;
    if (inputEstado) inputEstado.value = datos.estado;
}

async function cargarAsistentesSupabase(idCap) {
    const db = obtenerDB();
    if (!db) return;

    try {
        const { data, error } = await db.from('asistentes').select('*').eq('id_cap', idCap);
        listaAsistentes = (!error && data) ? data : [];
        renderizarGrilla();
    } catch (err) {
        console.error("Error leyendo asistentes:", err);
    }
}

function agregarParticipante() {
    const inputs = document.querySelectorAll('input');
    const inputLegajo = document.getElementById('inputLegajo') || document.getElementById('legajo') || inputs[5];
    const inputCalificaciones = document.getElementById('inputCalificacion') || document.getElementById('calificacion') || inputs[6];
    const inputObservaciones = document.getElementById('inputObservaciones') || document.getElementById('observaciones') || inputs[7];

    const idCap = obtenerIdCapActual();
    const legajoVal = inputLegajo?.value.trim();

    if (!legajoVal) {
        alert("Por favor, ingrese un número de legajo.");
        return;
    }

    const nomina = window.empleados || window.dotacion || [];
    const emp = nomina.find(e => e.legajo && String(e.legajo).trim().toLowerCase() === legajoVal.toLowerCase());

    if (!emp) {
        alert(`El legajo ${legajoVal} no existe en la nómina.`);
        return;
    }

    if (listaAsistentes.some(a => String(a.legajo).trim() === String(emp.legajo).trim())) {
        alert("El empleado ya está en la lista.");
        return;
    }

    listaAsistentes.push({
        id_cap: idCap,
        legajo: String(emp.legajo).trim(),
        apellido: emp.apellido || '',
        nombre: emp.nombre || '',
        calificacion: inputCalificaciones?.value.trim() || '-',
        observaciones: inputObservaciones?.value.trim() || '-'
    });

    renderizarGrilla();
    if (inputLegajo) inputLegajo.value = '';
    if (inputCalificaciones) inputCalificaciones.value = '';
    if (inputObservaciones) inputObservaciones.value = '';
}

function renderizarGrilla() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (listaAsistentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">No hay participantes registrados.</td></tr>';
        return;
    }

    listaAsistentes.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding:12px 15px; font-weight:bold;">${item.legajo}</td>
            <td style="padding:12px 15px;">${item.apellido}</td>
            <td style="padding:12px 15px;">${item.nombre}</td>
            <td style="padding:12px 15px;">${item.calificacion}</td>
            <td style="padding:12px 15px;">${item.observaciones}</td>
            <td style="padding:12px 15px; color:#64748b;">Pendiente</td>
            <td style="padding:12px 15px; text-align:center;">
                <button onclick="quitarParticipante(${idx})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Quitar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.quitarParticipante = function(index) {
    listaAsistentes.splice(index, 1);
    renderizarGrilla();
};

async function cerrarRegistro() {
    const idCap = obtenerIdCapActual();
    if (!idCap) {
        alert("No hay un ID_CAP válido.");
        return;
    }

    if (!confirm(`¿Desea cerrar el registro de la clase ${idCap}?`)) return;

    const db = obtenerDB();
    if (db) {
        try {
            await db.from('asistentes').delete().eq('id_cap', idCap);
            if (listaAsistentes.length > 0) {
                await db.from('asistentes').insert(listaAsistentes);
            }

            const { data: capActual } = await db.from('capacitaciones').select('*').eq('id_cap', idCap).maybeSingle();

            await db.from('capacitaciones').update({ estado: 'Finalizado' }).eq('id_cap', idCap);

            const claseActualNum = parseInt(capActual?.clase_nro || "1", 10);
            const totalClases = parseInt(capActual?.cant_clases || capActual?.total_clases || "1", 10);

            if (claseActualNum < totalClases) {
                const siguienteClaseNum = claseActualNum + 1;
                const numClaseFormateado = String(siguienteClaseNum).padStart(2, '0');
                
                const partes = idCap.split('-'); 
                const nuevoIdCap = `${partes[0]}-${partes[1]}-${partes[2]}-${numClaseFormateado}`;

                const nuevaClase = {
                    ...capActual,
                    id_cap: nuevoIdCap,
                    clase_nro: String(siguienteClaseNum),
                    estado: 'En curso',
                    fecha: new Date().toISOString().split('T')[0]
                };

                await db.from('capacitaciones').upsert([nuevaClase], { onConflict: 'id_cap' });
                alert(`Clase ${idCap} finalizada. Se habilitó la Clase ${siguienteClaseNum} (${nuevoIdCap}) En Curso.`);
            } else {
                alert(`La clase ${idCap} fue la última. Serie completada exitosamente.`);
            }

        } catch (err) {
            console.error("Error cerrando registro:", err);
            alert("Error al guardar: " + err.message);
            return;
        }
    }

    localStorage.removeItem("capacitacion_activa");
    window.location.href = "actividades.html";
}

function configurarEventos() {
    const botones = document.querySelectorAll('button');
    const btnAgregar = document.getElementById('btnAgregarParticipante') || Array.from(botones).find(b => b.textContent.includes('Agregar'));
    if (btnAgregar) btnAgregar.onclick = (e) => { e.preventDefault(); agregarParticipante(); };

    const btnCerrar = document.getElementById('btnCerrarRegistro') || Array.from(botones).find(b => b.textContent.includes('Cerrar'));
    if (btnCerrar) btnCerrar.onclick = (e) => { e.preventDefault(); cerrarRegistro(); };

    const btnCancelar = document.getElementById('btnCancelar') || Array.from(botones).find(b => b.textContent.includes('Cancelar'));
    if (btnCancelar) btnCancelar.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem("capacitacion_activa");
        window.location.href = "actividades.html";
    };
}
