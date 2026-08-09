//======================================================
// GENERAR / CARGAR BASE A SUPABASE
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

            // Empezamos en la fila 3 como tenías definido para saltear encabezados
            for(let i = 3; i < filas.length; i++){

                const fila = filas[i];

                if(!fila || fila.length === 0){
                    continue;
                }

                // Armamos el objeto respetando tus posiciones de columna
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

            // Insertar / Actualizar directamente en la tabla 'asistentes' o 'empleados' de Supabase
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
