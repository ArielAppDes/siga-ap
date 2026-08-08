// ===================================================
// SIGA_APP - REGISTRO DE ASISTENTES (Estado Respetado)
// ===================================================

let listaAsistentes = [];
let capacitacionActiva = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosCapacitacion();
});

function obtenerDB() {
    return window.supabaseClient || window.supabase || null;
}

function cargarDatosCapacitacion() {
    const dataGuardada = localStorage.getItem("capacitacion_activa");

    if (!dataGuardada) {
        alert("No se encontró ninguna capacitación activa.");
        window.location.href = "actividades.html";
        return;
    }

    capacitacionActiva = JSON.parse(dataGuardada);

    if (document.getElementById("idcap")) document.getElementById("idcap").value = capacitacionActiva.id_cap || "";
    if (document.getElementById("curso")) document.getElementById("curso").value = capacitacionActiva.nombre_curso || "";
    if (document.getElementById("clase")) document.getElementById("clase").value = capacitacionActiva.clase_nro || "";
    if (document.getElementById("fecha")) document.getElementById("fecha").value = capacitacionActiva.fecha || "";
    if (document.getElementById("instructor")) document.getElementById("instructor").value = capacitacionActiva.instructor_1 || "";
}

document.getElementById("btnAgregar")?.addEventListener("click", (e) => {
    e.preventDefault();

    const inputLegajo = document.getElementById("legajo");
    const inputCalificacion = document.getElementById("calificacion");
    const inputObs = document.getElementById("observaciones");

    const legajoVal = inputLegajo?.value.trim();
    const calificacionVal = inputCalificacion?.value.trim();
    const obsVal = inputObs?.value.trim();

    if (!legajoVal) {
        alert("Por favor ingrese un número de legajo.");
        return;
    }

    let emp = null;
    if (typeof empleados !== "undefined" && Array.isArray(empleados)) {
        emp = empleados.find(item => String(item.legajo).trim() === legajoVal);
    }

    const idNumerico = Date.now() + Math.floor(Math.random() * 1000);

    const nuevoParticipante = {
        id: idNumerico,
        id_cap: capacitacionActiva.id_cap,
        legajo: legajoVal,
        apellido: emp ? emp.apellido : "No Registrado",
        nombre: emp ? emp.nombre : "Empleado",
        puesto: emp ? emp.puesto : "",
        categoria: emp ? emp.categoria : "",
        direccion: emp ? emp.direccion : "",
        gerencia: emp ? emp.gerencia : "",
        jefatura: emp ? emp.jefatura : "",
        manager: emp ? emp.manager : "",
        email: emp ? emp.email : "",
        calificacion: calificacionVal || "-",
        observaciones: obsVal || "-"
    };

    listaAsistentes.push(nuevoParticipante);
    renderizarTabla();

    if (inputLegajo) inputLegajo.value = "";
    if (inputCalificacion) inputCalificacion.value = "";
    if (inputObs) inputObs.value = "";
});

function renderizarTabla() {
    const tbody = document.getElementById("tablaAsistentes");
    if (!tbody) return;

    tbody.innerHTML = "";

    listaAsistentes.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.legajo}</td>
            <td>${item.apellido}</td>
            <td>${item.nombre}</td>
            <td>${item.calificacion}</td>
            <td>${item.observaciones}</td>
            <td></td>
            <td>
                <button type="button" onclick="eliminarAsistente(${index})" style="background:none; border:none; cursor:pointer;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarAsistente(index) {
    listaAsistentes.splice(index, 1);
    renderizarTabla();
}

// Botón CERRAR REGISTRO
document.getElementById("btnCerrarRegistro")?.addEventListener("click", async (e) => {
    e.preventDefault();

    if (listaAsistentes.length === 0) {
        alert("Debe agregar al menos un asistente a la tabla antes de cerrar el registro.");
        return;
    }

    const db = obtenerDB();

    if (!db || typeof db.from !== "function") {
        alert("Error de conexión: Verificá supabaseClient.js");
        return;
    }

    try {
        // Mantiene el estado seleccionado previamente (o 'Finalizado' si no fue especificado)
        capacitacionActiva.estado = capacitacionActiva.estado || "Finalizado";

        const { error: errCap } = await db
            .from("capacitaciones")
            .upsert([capacitacionActiva]);

        if (errCap) {
            alert("Error al actualizar capacitación: " + errCap.message);
            return;
        }

        const { error: errAsist } = await db
            .from("asistentes")
            .insert(listaAsistentes);

        if (errAsist) {
            alert("Error al guardar asistentes: " + errAsist.message);
            return;
        }

        alert(`Registro guardado con éxito con ID ${capacitacionActiva.id_cap} y estado '${capacitacionActiva.estado}'.`);
        localStorage.removeItem("capacitacion_activa");
        window.location.href = "actividades.html";

    } catch (err) {
        alert("Ocurrió un error inesperado: " + err.message);
        console.error(err);
    }
});

document.getElementById("btnImprimir")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.print();
});

document.getElementById("btnCancelar")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("capacitacion_activa");
    window.location.href = "actividades.html";
});