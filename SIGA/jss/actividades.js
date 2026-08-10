// ===================================================
// 10/08/2026 - SIGA_APP - CAPACITACIONES (Integración con Supabase)
// ===================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Cargar desplegables dinámicos desde Supabase
    await cargarSelectoresDesdeJS();

    // 2. Comprobar si hay una capacitación seleccionada en localStorage
    const dataGuardada = localStorage.getItem("capacitacion_activa");

    if (dataGuardada) {
        const cap = JSON.parse(dataGuardada);
        poblarFormulario(cap);
    } else {
        await generarProximoIdCap();
    }

    evaluarEstadoFormulario();
});

// Carga asíncrona de selectores desde las tablas de Supabase
async function cargarSelectoresDesdeJS() {
    const db = window.supabaseClient || window.supabase;
    if (!db) {
        setTimeout(cargarSelectoresDesdeJS, 400);
        return;
    }

    try {
        // 1. Cargar Programas desde la tabla 'programas'
        const { data: progs, error: errProgs } = await db.from("programas").select("nombre").eq("estado", "Activo");
        if (!errProgs && progs) {
            poblarSelect("programa", progs.map(p => p.nombre));
        }

        // 2. Cargar Cursos desde la tabla 'cursos'
        const { data: cursos, error: errCursos } = await db.from("cursos").select("nombre").eq("estado", "Activo");
        if (!errCursos && cursos) {
            poblarSelect("curso", cursos.map(c => c.nombre));
        }

        // 3. Cargar Instructores desde la tabla 'instructores'
        const { data: insts, error: errInsts } = await db.from("instructores").select("nombre, apellido").eq("estado", "Activo");
        if (!errInsts && insts) {
            const listaNombres = insts.map(i => `${i.nombre} ${i.apellido}`);
            poblarSelect("instructor1", listaNombres);
            poblarSelect("instructor2", listaNombres);
        }
    } catch (err) {
        console.error("Error al cargar desplegables desde Supabase:", err);
    }
}

function poblarSelect(idElemento, listaDatos) {
    const select = document.getElementById(idElemento);
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione...</option>';
    listaDatos.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

function poblarFormulario(cap) {
    if (document.getElementById("idCap")) document.getElementById("idCap").value = cap.id_cap || "";
    if (document.getElementById("programa")) document.getElementById("programa").value = cap.programa || "";
    if (document.getElementById("curso")) document.getElementById("curso").value = cap.nombre_curso || "";
    if (document.getElementById("clase")) document.getElementById("clase").value = cap.clase_nro || "1";
    if (document.getElementById("estado")) document.getElementById("estado").value = cap.estado || "Programado";
    if (document.getElementById("tema")) document.getElementById("tema").value = cap.tema || "";
    if (document.getElementById("fecha")) document.getElementById("fecha").value = cap.fecha || "";
    if (document.getElementById("horaInicio")) document.getElementById("horaInicio").value = cap.hs_inicio || "";
    if (document.getElementById("horaFin")) document.getElementById("horaFin").value = cap.hs_fin || "";
    if (document.getElementById("lugar")) document.getElementById("lugar").value = cap.lugar || "";
    if (document.getElementById("centro")) document.getElementById("centro").value = cap.centro || "";
    if (document.getElementById("instructor1")) document.getElementById("instructor1").value = cap.instructor_1 || "";
    if (document.getElementById("instructor2")) document.getElementById("instructor2").value = cap.instructor_2 || "";
    if (document.getElementById("observaciones")) document.getElementById("observaciones").value = cap.observaciones || "";
}

function getValor(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    const val = el.value ? el.value.trim() : "";
    return (val === "Seleccione...") ? "" : val;
}

function obtenerObjetoFormulario() {
    return {
        id_cap: getValor("idCap"),
        programa: getValor("programa"),
        nombre_curso: getValor("curso"),
        clase_nro: parseInt(getValor("clase") || "1", 10),
        estado: getValor("estado") || "Programado",
        tema: getValor("tema"),
        fecha: document.getElementById("fecha")?.value || null,
        hs_inicio: document.getElementById("horaInicio")?.value || null,
        hs_fin: document.getElementById("horaFin")?.value || null,
        lugar: getValor("lugar"),
        centro: getValor("centro"),
        instructor_1: getValor("instructor1"),
        instructor_2: getValor("instructor2"),
        observaciones: getValor("observaciones")
    };
}

// Bloquea/Desbloquea el acceso a Asistentes según los 3 estados
function evaluarEstadoFormulario() {
    const estado = getValor("estado");
    const btnAsistentes = document.getElementById("btnAsistentes");

    if (btnAsistentes) {
        if (estado === "Programado") {
            btnAsistentes.style.opacity = "0.5";
            btnAsistentes.style.cursor = "not-allowed";
            btnAsistentes.title = "Las capacitaciones 'Programadas' no permiten tomar lista de asistentes.";
        } else {
            btnAsistentes.style.opacity = "1";
            btnAsistentes.style.cursor = "pointer";
            btnAsistentes.title = "Pasar a la toma de asistencia.";
        }
    }
}

document.getElementById("estado")?.addEventListener("change", evaluarEstadoFormulario);

// Formateo dinámico de ID_CAP al cambiar el número de clase
document.getElementById("clase")?.addEventListener("input", () => {
    const inputIdCap = document.getElementById("idCap");
    const numClase = String(getValor("clase") || "1").padStart(2, "0");
    
    if (inputIdCap && inputIdCap.value) {
        const partes = inputIdCap.value.split("-");
        if (partes.length >= 3) {
            inputIdCap.value = `${partes[0]}-${partes[1]}-${partes[2]}-${numClase}`;
        }
    }
});

// Autogenera el próximo correlativo si es una capacitación nueva
async function generarProximoIdCap() {
    const inputIdCap = document.getElementById("idCap");
    const inputClase = document.getElementById("clase");
    const db = window.supabaseClient || window.supabase;
    const anio = new Date().getFullYear();

    try {
        if (!db) {
            if (inputIdCap) inputIdCap.value = `CAP-${anio}-001-01`;
            if (inputClase) inputClase.value = "1";
            return;
        }

        const { data, error } = await db.from("capacitaciones").select("id_cap");

        if (error || !data || data.length === 0) {
            if (inputIdCap) inputIdCap.value = `CAP-${anio}-001-01`;
            if (inputClase) inputClase.value = "1";
            return;
        }

        let maxCurso = 0;
        data.forEach(item => {
            if (item.id_cap) {
                const partes = item.id_cap.split("-");
                if (partes.length >= 3) {
                    const num = parseInt(partes[2], 10);
                    if (!isNaN(num) && num > maxCurso) maxCurso = num;
                }
            }
        });

        const nuevoNum = maxCurso + 1;
        const cursoPadded = String(nuevoNum).padStart(3, "0");

        if (inputIdCap) inputIdCap.value = `CAP-${anio}-${cursoPadded}-01`;
        if (inputClase) inputClase.value = "1";

    } catch (err) {
        console.error("Error al generar ID:", err);
        if (inputIdCap) inputIdCap.value = `CAP-${anio}-001-01`;
        if (inputClase) inputClase.value = "1";
    }
}

function limpiarFormulario() {
    localStorage.removeItem("capacitacion_activa");
    ["programa", "curso", "tema", "fecha", "horaInicio", "horaFin", "lugar", "centro", "instructor1", "instructor2", "observaciones"].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = "";
    });
    if (document.getElementById("clase")) document.getElementById("clase").value = "1";
    if (document.getElementById("estado")) document.getElementById("estado").value = "Programado";
    evaluarEstadoFormulario();
}

// BOTÓN: Guardar
document.getElementById("btnGuardar")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const datos = obtenerObjetoFormulario();

    if (!datos.nombre_curso || !datos.fecha) {
        alert("Atención: Seleccioná un Curso y una Fecha antes de guardar.");
        return;
    }

    const db = window.supabaseClient || window.supabase;
    if (db) {
        const { error } = await db.from("capacitaciones").upsert([datos]);
        if (error) {
            alert("Error al guardar en Supabase: " + error.message);
            return;
        }
    }

    alert(`Capacitación ${datos.id_cap} guardada con éxito con estado '${datos.estado}'.`);
    limpiarFormulario();
    window.location.href = "actividades.html";
});

// BOTÓN: Registrar Asistentes
document.getElementById("btnAsistentes")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const datos = obtenerObjetoFormulario();

    if (datos.estado === "Programado") {
        alert("Las capacitaciones en estado 'Programado' no admiten la toma de asistencia. Cambiá el estado a 'En curso' o 'Finalizado'.");
        return;
    }

    if (!datos.nombre_curso || !datos.fecha) {
        alert("Completá los datos requeridos (Curso y Fecha) antes de continuar.");
        return;
    }

    localStorage.setItem("capacitacion_activa", JSON.stringify(datos));

    const db = window.supabaseClient || window.supabase;
    if (db) {
        try {
            await db.from("capacitaciones").upsert([datos]);
        } catch (err) {
            console.warn("Aviso al actualizar capacitación previa a asistencia:", err);
        }
    }

    window.location.href = "asistentes.html";
});

// BOTÓN: Volver
document.getElementById("btnVolver")?.addEventListener("click", (e) => {
    e.preventDefault();
    limpiarFormulario();
    window.location.href = "actividades.html";
});
