//======================================================
// BASES DE DATOS - IMPORTAR Y EXPORTAR
//======================================================

const archivoBase = document.getElementById("archivoBase");
const btnGenerarBase = document.getElementById("btnGenerarBase");
const estadoBase = document.getElementById("estadoBase");

let archivoSeleccionado = null;

//======================================================
// EVENTOS DE IMPORTACIÓN
//======================================================

if (archivoBase) {
    archivoBase.addEventListener("change", function (e) {
        archivoSeleccionado = e.target.files[0];
        if (archivoSeleccionado) {
            estadoBase.value = "Archivo seleccionado";
        } else {
            estadoBase.value = "Esperando archivo...";
        }
    });
}

if (btnGenerarBase) {
    btnGenerarBase.addEventListener("click", generarBase);
}

//======================================================
// GENERAR / CARGAR BASE A SUPABASE (IMPORTACIÓN)
//======================================================

async function generarBase(){

    if(!archivoSeleccionado){
        alert("Seleccione un archivo Excel.");
        return;
    }

    estadoBase.value = "Leyendo Excel...";

    const lector = new FileReader();

    lector.onload = async function(evento){

        try{

            const datos = new Uint8Array(evento.target.result);
            const libro = XLSX.read(datos, {type: "array"});
            const hoja = libro.Sheets[libro.SheetNames[0]];
            const filas = XLSX.utils.sheet_to_json(hoja, {header: 1});

            const empleados = [];

            // Procesar desde la fila 3 (saltando encabezados)
            for(let i = 3; i < filas.length; i++){

                const fila = filas[i];

                if(!fila || fila.length === 0){
                    continue;
                }

                empleados.push({
                    legajo: String(fila[0] || "").padStart(5, "0"),
                    apellido: String(fila[1] || ""),
                    nombre: String(fila[2] || ""),
                    puesto: String(fila[4] || ""),
                    categoria: String(fila[8] || ""),
                    direccion: String(fila[13] || ""),
                    gerencia: String(fila[14] || ""),
                    jefatura: String(fila[16] || ""),
                    manager: String(fila[19] || ""),
                    email: String(fila[37] || "")
                });

            }

            if (empleados.length === 0) {
                estadoBase.value = "Sin datos para procesar";
                alert("No se encontraron registros de empleados en el archivo.");
                return;
            }

            estadoBase.value = `Guardando ${empleados.length} empleados en Supabase...`;

            // Enviar datos a la tabla 'asistentes' en Supabase
            const { data, error } = await window.supabaseClient
                .from('asistentes')
                .upsert(empleados, { onConflict: 'legajo' });

            if (error) {
                throw error;
            }

            estadoBase.value = "Base actualizada en Supabase";
            alert(`¡Éxito! Se cargaron/actualizaron ${empleados.length} empleados correctamente en Supabase.`);

        }
        catch(error){

            console.error(error);
            estadoBase.value = "Error al guardar en Supabase";
            alert("Ocurrió un error al procesar el Excel o guardarlo en la base de datos.");

        }

    };

    lector.readAsArrayBuffer(archivoSeleccionado);

}

//======================================================
// EXPORTAR BASES DE SUPABASE A EXCEL (.XLSX)
//======================================================

async function exportarBaseExcel() {
    const selector = document.getElementById('selectTablaExportar');
    const estado = document.getElementById('estadoExportacion');
    const opcion = selector ? selector.value : 'TODAS';

    if (typeof XLSX === 'undefined') {
        alert('La librería para generar Excel no está disponible.');
        return;
    }

    if (estado) estado.value = 'Consultando Supabase...';

    try {
        const libro = XLSX.utils.book_new();
        const fechaActual = new Date().toISOString().split('T')[0];

        if (opcion === 'TODAS') {
            // Backup Completo
            const [prog, inst, cur, cap, asis] = await Promise.all([
                window.supabaseClient.from('programas').select('*'),
                window.supabaseClient.from('instructores').select('*'),
                window.supabaseClient.from('cursos').select('*'),
                window.supabaseClient.from('capacitaciones').select('*'),
                window.supabaseClient.from('asistentes').select('*')
            ]);

            XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(asis.data || []), 'Dotacion_Asistentes');
            XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(cap.data || []), 'Capacitaciones');
            XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(cur.data || []), 'Cursos');
            XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(inst.data || []), 'Instructores');
            XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(prog.data || []), 'Programas');

            XLSX.writeFile(libro, `SIGA_Backup_Completo_${fechaActual}.xlsx`);
            if (estado) estado.value = '¡Backup completo descargado con éxito!';

        } else {
            // Exportación individual
            const { data, error } = await window.supabaseClient.from(opcion).select('*');

            if (error) throw error;

            if (!data || data.length === 0) {
                if (estado) estado.value = 'La tabla no contiene datos.';
                alert(`La tabla '${opcion}' no tiene registros para exportar.`);
                return;
            }

            const hoja = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(libro, hoja, opcion);

            XLSX.writeFile(libro, `SIGA_Export_${opcion}_${fechaActual}.xlsx`);
            if (estado) estado.value = `¡Tabla '${opcion}' exportada con éxito!`;
        }

    } catch (error) {
        console.error('Error al exportar:', error);
        if (estado) estado.value = 'Error durante la exportación';
        alert('Ocurrió un error al intentar exportar los datos desde Supabase.');
    }
}
