document.addEventListener("DOMContentLoaded", async () => {
    await cargarDatosTransferencia();
    configurarEnvioFormulario();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

async function cargarDatosTransferencia() {
    const params = new URLSearchParams(window.location.search);
    const idCap = params.get("id_cap");
    const jefaturaParam = params.get("jefatura");

    if (!idCap) {
        alert("No se especificó el ID de capacitación.");
        return;
    }

    const db = obtenerDB();
    if (!db) return;

    try {
        // 1. Datos de la capacitación
        const { data: cap, error: errCap } = await db
            .from("capacitaciones")
            .select("nombre_curso, fecha")
            .eq("id_cap", idCap)
            .maybeSingle();

        if (cap) {
            document.getElementById("lblCurso").textContent = cap.nombre_curso || idCap;
            document.getElementById("lblFecha").textContent = cap.fecha || "-";
        }

        // 2. Asistentes filtrados por ID y Jefatura
        let query = db.from("asistentes").select("apellido, nombre, legajo").eq("id_cap", idCap);
        if (jefaturaParam) {
            query = query.eq("jefatura", jefaturaParam);
        }

        const { data: asistentes, error: errAsis } = await query;

        if (asistentes && asistentes.length > 0) {
            const nombres = asistentes.map(a => `${a.apellido}, ${a.nombre}`).join(" | ");
            const legajos = asistentes.map(a => a.legajo).join(" | ");

            document.getElementById("lblParticipante").textContent = nombres;
            document.getElementById("lblLegajo").textContent = legajos;
        } else {
            document.getElementById("lblParticipante").textContent = "Sin participantes registrados";
            document.getElementById("lblLegajo").textContent = "-";
        }
    } catch (err) {
        console.error("Error al cargar datos:", err);
    }
}

function configurarEnvioFormulario() {
    const form = document.getElementById("formTransferencia");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const params = new URLSearchParams(window.location.search);
        const idCap = params.get("id_cap");
        const jefaturaParam = params.get("jefatura");

        const respuestaAplica = document.getElementById("selectAplica")?.value;
        const nombreEvaluador = document.getElementById("txtEvaluador")?.value;

        if (!respuestaAplica || !nombreEvaluador) {
            alert("Por favor completá todos los campos requeridos.");
            return;
        }

        const db = obtenerDB();
        if (db) {
            try {
                // Registrar respuesta en BD (opcional/según tu tabla de respuestas)
                await db.from("capacitaciones").update({ estado_tra: "Recibida" }).eq("id_cap", idCap);
                alert("¡Evaluación enviada con éxito!");
                window.location.reload();
            } catch (err) {
                console.error("Error al guardar evaluación:", err);
            }
        }
    });
}
