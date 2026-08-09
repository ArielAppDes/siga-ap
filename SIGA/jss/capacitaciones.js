// ===================================================
// SIGA_APP - CAPACITACIONES (Sincronizado con Supabase)
// ===================================================

document.addEventListener("DOMContentLoaded", async () => {
    await cargarSelectoresDesdeJS();

    const dataGuardada = localStorage.getItem("capacitacion_activa");

    if (dataGuardada) {
        // Cargar datos existentes si venimos de Actividades o Asistentes
        const cap = JSON.parse(dataGuardada);
        poblarFormulario(cap);
    } else {
        // Generar nuevo ID solo si es una capacitación creada desde cero
        await generarProximoIdCap();
    }

    evaluarEstadoFormulario();
});

// Rellenar todos los campos del formulario
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

// Extrae los datos limpios alineados exactamente con la tabla public.capacitaciones
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

// Evalúa el estado para habilitar o bloquear el botón de Asistentes
function evaluarEstadoFormulario() {
    const estado = getValor("estado");
    const btnAsistentes = document.getElementById("btnAsistentes");

    if (btnAsistentes) {
        if (estado === "Programado") {
            btnAsistentes.style.opacity = "0.4";
            btnAsistentes.style.cursor = "not-allowed";
            btnAsistentes.title = "Las capacitaciones programadas no permiten registrar asistentes.";
        } else {
            btnAsistentes.style.opacity = "1";
            btnAsistentes.style.cursor = "pointer";
            btnAsistentes.title = "";
        }
    }
}

// Evento cambio de estado
document.getElementById("estado")?.addEventListener("change", evaluarEstadoFormulario);

// Actualizar idCap cuando el usuario cambia manualmente el campo 'Clase Nº'
document.getElementById("clase")?.addEventListener("input", () => {
    const inputIdCap = document.getElementById("idCap");
    const numClase = getValor("clase") || "1";
    
    if (inputIdCap && inputIdCap.value) {
        const partes = inputIdCap.value.split("-");
        // Reemplazar o añadir la clase al final (CAP-2026-001 -> CAP-2026-001-2)
        if (partes.length >= 3) {
            inputIdCap.value = `${partes[0]}-${partes[1]}-${partes[2]}-${numClase}`;
        }
    }
});

// Generación automática del ID secuencial correlativo
async function generarProximoIdCap() {
    const inputIdCap = document.getElementById("idCap");
    const inputClase = document.getElementById("clase");
    const db = window.supabaseClient;

    try {
        if (!db) {
            if (inputIdCap) inputIdCap.value = "CAP-2026-001-1";
            if (inputClase) inputClase.value = "1";
            return;
        }

        const { data, error } = await db.from("capacitaciones").select("id_cap");

        if (error || !data || data.length === 0) {
            if (inputIdCap) inputIdCap.value = "CAP-2026-001-1";
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

        if (inputIdCap) inputIdCap.value = `CAP-2026-${cursoPadded}-1`;
        if (inputClase) inputClase.value = "1";

    } catch (err) {
        console.error("Error al generar ID:", err);
        if (inputIdCap) inputIdCap.value = "CAP-2026-001-1";
        if (inputClase) inputClase.value = "1";
    }
}

// Carga de selectores consultando directamente a Supabase (columnas existentes)
async function cargarSelectoresDesdeJS() {
    const db = window.supabaseClient;
    if (!db) return;

    try {
        const { data: progs } = await db.from("programas").select("nombre");
        if (progs) poblarSelect("programa", progs.map(p => p.nombre));

        const { data: cursos } = await db.from("cursos").select("nombre");
        if (cursos) poblarSelect("curso", cursos.map(c => c.nombre));

        const { data: insts } = await db.from("instructores").select("nombre, apellido");
        if (insts) {
            const listaNombres = insts.map(i => `${i.nombre} ${i.apellido}`);
            poblarSelect("instructor1", listaNombres);
            poblarSelect("instructor2", listaNombres);
        }
    } catch (err) {
        console.warn("Aviso al cargar selectores:", err);
    }
}

function poblarSelect(idElemento, listaDatos) {
    const select = document.getElementById(idElemento);
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione...</option>';
    listaDatos.forEach(item => {
        const option = document.createElement("option");
        const valor = typeof item === "object" ? (item.nombre || item.titulo || item.id) : item;
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
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

// Botón Guardar
document.getElementById("btnGuardar")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const datos = obtenerObjetoFormulario();

    if (!datos.nombre_curso || !datos.fecha) {
        alert("Por favor seleccioná un Curso y una Fecha antes de guardar.");
        return;
    }

    const db = window.supabaseClient;
    if (db) {
        const { error } = await db.from("capacitaciones").upsert([datos]);
        if (error) {
            alert("Error al guardar en Supabase: " + error.message);
            return;
        }
    }

    alert(`Capacitación ${datos.id_cap} guardada con éxito en estado '${datos.estado}'.`);
    limpiarFormulario();
    window.location.href = "actividades.html";
});

// Botón Registrar Asistentes
document.getElementById("btnAsistentes")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const datos = obtenerObjetoFormulario();

    if (datos.estado === "Programado") {
        alert("Una capacitación en estado 'Programado' no admite la carga de asistentes.");
        return;
    }

    if (!datos.nombre_curso || !datos.fecha) {
        alert("Completá los datos básicos (Curso y Fecha) antes de pasar a la pantalla de asistentes.");
        return;
    }

    localStorage.setItem("capacitacion_activa", JSON.stringify(datos));

    const db = window.supabaseClient;
    if (db) {
        try {
            await db.from("capacitaciones").upsert([datos]);
        } catch (err) {
            console.warn("Aviso Supabase:", err);
        }
    }

    window.location.href = "asistentes.html";
});

// Botón Volver
document.getElementById("btnVolver")?.addEventListener("click", (e) => {
    e.preventDefault();
    limpiarFormulario();
    window.location.href = "actividades.html";
});
