// ===================================================
// SIGA_APP - CAPACITACIONES (Versión Supabase Integrada)
// ===================================================

document.addEventListener("DOMContentLoaded", async () => {
    await generarProximoIdCap();
    await cargarSelectoresDesdeSupabase();
});

// 1. Generar ID_CAP automático desde Supabase (CAP-2026-001-1)
async function generarProximoIdCap() {
    const inputIdCap = document.getElementById("idCap");
    const inputClase = document.getElementById("clase");

    try {
        if (typeof window.supabaseClient === "undefined") {
            console.warn("Supabase no está inicializado en supaBaseClient.js");
            if (inputIdCap) inputIdCap.value = "CAP-2026-001-1";
            if (inputClase) inputClase.value = "1";
            return;
        }

        const { data, error } = await window.supabaseClient
            .from("capacitaciones")
            .select("id_cap, estado, clase_nro")
            .order("created_at", { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            if (inputIdCap) inputIdCap.value = "CAP-2026-001-1";
            if (inputClase) inputClase.value = "1";
            return;
        }

        const ultimaCap = data[0];
        const partes = ultimaCap.id_cap ? ultimaCap.id_cap.split("-") : [];
        let numCurso = parseInt(partes[2], 10) || 1;
        let numClase = parseInt(partes[3] || ultimaCap.clase_nro || "1", 10);

        if (ultimaCap.estado === "Finalizado") {
            numCurso += 1;
            numClase = 1;
        } else {
            numClase += 1;
        }

        const cursoPadded = String(numCurso).padStart(3, "0");
        const nuevoId = `CAP-2026-${cursoPadded}-${numClase}`;

        if (inputIdCap) inputIdCap.value = nuevoId;
        if (inputClase) inputClase.value = numClase;
    } catch (err) {
        console.error("Error al calcular próximo ID_CAP:", err);
        if (inputIdCap) inputIdCap.value = "CAP-2026-001-1";
        if (inputClase) inputClase.value = "1";
    }
}

// 2. Cargar desplegables dinámicamente desde Supabase (con fallback a data/*.js)
async function cargarSelectoresDesdeSupabase() {
    if (typeof window.supabaseClient === "undefined") {
        cargarSelectoresDesdeJSFallback();
        return;
    }

    // Cargar Cursos desde la tabla 'cursos' en Supabase
    const { data: cursos } = await window.supabaseClient.from("cursos").select("nombre").eq("estado", "Activo");
    if (cursos && cursos.length > 0) {
        poblarSelect("curso", cursos.map(c => c.nombre));
    } else if (typeof cursosData !== "undefined") {
        poblarSelect("curso", cursosData);
    }

    // Cargar Instructores (Fallback a data/*.js si no existe la tabla aún)
    if (typeof instructoresData !== "undefined") {
        poblarSelect("instructor1", instructoresData);
        poblarSelect("instructor2", instructoresData);
    }

    // Cargar Centros
    if (typeof centrosData !== "undefined") {
        poblarSelect("centro", centrosData);
    }
}

function cargarSelectoresDesdeJSFallback() {
    if (typeof cursosData !== "undefined") poblarSelect("curso", cursosData);
    if (typeof instructoresData !== "undefined") {
        poblarSelect("instructor1", instructoresData);
        poblarSelect("instructor2", instructoresData);
    }
    if (typeof centrosData !== "undefined") poblarSelect("centro", centrosData);
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

// 3. Capturar todos los datos del formulario
function obtenerObjetoFormulario() {
    return {
        id_cap: document.getElementById("idCap")?.value || "",
        programa: document.getElementById("programa")?.value || "",
        nombre_curso: document.getElementById("curso")?.value || "",
        clase_nro: document.getElementById("clase")?.value || "1",
        estado: document.getElementById("estado")?.value || "Programado",
        tema: document.getElementById("tema")?.value || "",
        fecha: document.getElementById("fecha")?.value || null,
        hs_inicio: document.getElementById("horaInicio")?.value || null,
        hs_fin: document.getElementById("horaFin")?.value || null,
        lugar: document.getElementById("lugar")?.value || "",
        centro: document.getElementById("centro")?.value || "",
        instructor_1: document.getElementById("instructor1")?.value || "",
        instructor_2: document.getElementById("instructor2")?.value || "",
        observaciones: document.getElementById("observaciones")?.value || ""
    };
}

// 4. Limpiar formulario
function limpiarFormulario() {
    ["programa", "curso", "tema", "fecha", "horaInicio", "horaFin", "lugar", "centro", "instructor1", "instructor2", "observaciones"].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = "";
    });
    if (document.getElementById("clase")) document.getElementById("clase").value = "1";
    if (document.getElementById("estado")) document.getElementById("estado").value = "Programado";
}

// 5. BOTÓN GUARDAR
document.getElementById("btnGuardar")?.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        const datos = obtenerObjetoFormulario();

        if (datos.estado === "Finalizado") {
            alert("No se puede guardar una capacitación finalizada sin asistentes. Utilizá el botón 'Registrar asistentes'.");
            return;
        }

        if (!datos.nombre_curso || !datos.fecha) {
            alert("Por favor completá al menos el Curso y la Fecha antes de guardar.");
            return;
        }

        if (typeof window.supabaseClient === "undefined") {
            alert("Atención: Supabase no está conectado correctamente. Revisá supaBaseClient.js");
            return;
        }

        const { error } = await window.supabaseClient.from("capacitaciones").insert([datos]);

        if (error) {
            alert("Error de Supabase al guardar: " + error.message);
        } else {
            alert("Capacitación guardada con éxito en la nube. ID: " + datos.id_cap);
            limpiarFormulario();
            await generarProximoIdCap();
        }
    } catch (err) {
        alert("Ocurrió un error al procesar el guardado: " + err.message);
        console.error(err);
    }
});

// 6. BOTÓN REGISTRAR ASISTENTES
document.getElementById("btnAsistentes")?.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        const datos = obtenerObjetoFormulario();

        if (!datos.nombre_curso || !datos.fecha) {
            alert("Por favor completá los datos básicos (Curso y Fecha) antes de continuar.");
            return;
        }

        localStorage.setItem("capacitacion_activa", JSON.stringify(datos));

        if (typeof window.supabaseClient !== "undefined") {
            const { error } = await window.supabaseClient.from("capacitaciones").upsert([datos]);
            if (error) {
                console.warn("Aviso de Supabase:", error.message);
            }
        }

        window.location.href = "asistentes.html";
    } catch (err) {
        alert("Ocurrió un error al intentar navegar: " + err.message);
        console.error(err);
    }
});

// 7. BOTÓN CANCELAR / VOLVER
document.getElementById("btnVolver")?.addEventListener("click", (e) => {
    e.preventDefault();
    limpiarFormulario();
    window.location.href = "actividades.html";
});
