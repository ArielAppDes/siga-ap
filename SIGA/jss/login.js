document
.getElementById("btnIngresar")
.addEventListener("click",function(){

const usuario =
document.getElementById("usuario").value;

localStorage.setItem("usuario",usuario);

window.location.href="dashboard.html";

});