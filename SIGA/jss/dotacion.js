//======================================
// SGA - Dotación
//======================================

// La variable empleados ahora proviene de data/empleados.js
//let empleados = [];

//======================================
// ELEMENTOS
//======================================

const archivoExcel = document.getElementById("archivoExcel");

const txtLegajoEmp = document.getElementById("legajo");
const txtApellidoEmp = document.getElementById("apellido");
const txtNombreEmp = document.getElementById("nombreEmpleado");


console.log("Módulo Dotación iniciado");

//======================================
// EVENTOS
//======================================

if (archivoExcel) {
    archivoExcel.addEventListener("change", cargarExcel);
}

if (txtLegajoEmp) {
    txtLegajoEmp.addEventListener("keyup", function(e){

    if(e.key === "Enter"){
        buscarEmpleado();
    }

    if(this.value.trim().length === 5){
        buscarEmpleado();
    }

});
}

//======================================
// IMPORTAR EXCEL
//======================================

function cargarExcel(e){

    console.log("Entró a cargarExcel");

    const archivo = e.target.files[0];

    if(!archivo){
        alert("No se seleccionó ningún archivo.");
        return;
    }

    const lector = new FileReader();

    lector.onload = function(evento){

        try{

            const datos = new Uint8Array(evento.target.result);

            const libro = XLSX.read(datos,{type:"array"});

            const hoja = libro.Sheets[libro.SheetNames[0]];

           // empleados = XLSX.utils.sheet_to_json(hoja,{header:1});
           empleados.length = 0;

          const filas = XLSX.utils.sheet_to_json(hoja, { header: 1 });

          for (let i = 1; i < filas.length; i++) {

          const fila = filas[i];

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
           

            console.log(empleados);

            alert("Se importaron " + empleados.length + " empleados.");

        }
        catch(error){

            console.error(error);

            alert("Error al leer el archivo Excel.");

        }

    };

    lector.readAsArrayBuffer(archivo);

}

//======================================
// BUSCAR EMPLEADO
//======================================

function buscarEmpleado(){

    const legajo = txtLegajoEmp.value.trim().padStart(5,"0");

    if(legajo.length < 5){
        limpiarCampos();
        return;
    }

    const empleado = buscarEmpleadoPorLegajo(legajo);

    if(!empleado){
        limpiarCampos();
        return;
    }

    txtApellidoEmp.value  = empleado.apellido;
    txtNombreEmp.value    = empleado.nombre;

    document.getElementById("puesto").value     = empleado.puesto;
    document.getElementById("categoria").value  = empleado.categoria;
    document.getElementById("direccion").value  = empleado.direccion;
    document.getElementById("gerencia").value   = empleado.gerencia;
    document.getElementById("jefatura").value   = empleado.jefatura;
    document.getElementById("manager").value    = empleado.manager;
    document.getElementById("email").value      = empleado.email;

}

//======================================
// LIMPIAR CAMPOS
//======================================

function limpiarCampos(){

    txtApellidoEmp.value = "";
    txtNombreEmp.value = "";

    document.getElementById("puesto").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("direccion").value = "";
    document.getElementById("gerencia").value = "";
    document.getElementById("jefatura").value = "";
    document.getElementById("manager").value = "";
    document.getElementById("email").value = "";

}

//======================================
// BOTÓN NUEVA BÚSQUEDA
//======================================

const btnNuevoEmpleado = document.getElementById("btnNuevoEmpleado");

if(btnNuevoEmpleado){

    btnNuevoEmpleado.addEventListener("click", function(){

        txtLegajoEmp.value = "";

        limpiarCampos();

        txtLegajoEmp.focus();

    });

}