//======================================================
// BASES DE DATOS
//======================================================

const archivoBase = document.getElementById("archivoBase");
const btnGenerarBase = document.getElementById("btnGenerarBase");
const estadoBase = document.getElementById("estadoBase");

let archivoSeleccionado = null;

//======================================================
// EVENTOS
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
// GENERAR BASE
//======================================================

function generarBase(){

    if(!archivoSeleccionado){

        alert("Seleccione un archivo Excel.");
        return;

    }

    estadoBase.value = "Leyendo Excel...";

    const lector = new FileReader();

    lector.onload = function(evento){

        try{

            const datos = new Uint8Array(evento.target.result);

            const libro = XLSX.read(datos,{type:"array"});

            const hoja = libro.Sheets[libro.SheetNames[0]];

            const filas = XLSX.utils.sheet_to_json(hoja,{header:1});

            const empleados = [];

            for(let i = 3; i < filas.length; i++){

                const fila = filas[i];

                if(!fila || fila.length === 0){
                    continue;
                }

                empleados.push({

                    legajo: String(fila[0] || "").padStart(5,"0"),
                    apellido: fila[1] || "",
                    nombre: fila[2] || "",
                    puesto: fila[4] || "",
                    categoria: fila[8] || "",
                    direccion: fila[13] || "",
                    gerencia: fila[14] || "",
                    jefatura: fila[16] || "",
                    manager: fila[19] || "",
                    email: fila[37] || ""

                });

            }
            
            //======================================================
            // GENERAR CONTENIDO DE empleados.js
            //======================================================

            let contenido = "";
            contenido += "//======================================================\n";
            contenido += "// BASE DE DATOS DE EMPLEADOS\n";
            contenido += "//======================================================\n\n";

            contenido += "const empleados = ";
            contenido += JSON.stringify(empleados, null, 4);
            contenido += ";\n\n";

            contenido += "function buscarEmpleadoPorLegajo(legajo){\n\n";
            contenido += "    legajo = String(legajo).padStart(5,\"0\");\n\n";
            contenido += "    return empleados.find(e => e.legajo === legajo);\n\n";
            contenido += "}\n";

            //======================================================
            // DESCARGAR ARCHIVO
            //======================================================

            const blob = new Blob([contenido], {
                type: "application/javascript"
            });

            const enlace = document.createElement("a");

            enlace.href = URL.createObjectURL(blob);
            enlace.download = "empleados.js";
            enlace.click();

            URL.revokeObjectURL(enlace.href);

            estadoBase.value = "Base generada correctamente";

            alert("Base generada correctamente.");

        }
        catch(error){

            console.error(error);

            estadoBase.value = "Error al generar la base";

            alert("Ocurrió un error al procesar el Excel.");

        }

    };

    lector.readAsArrayBuffer(archivoSeleccionado);

}

