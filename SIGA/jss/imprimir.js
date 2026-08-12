// Función global para guardar en localStorage y abrir la hoja A4
function prepararYAbrirPlanillaA4() {
    try {
        const datosCapacitacion = {
            fecha: document.getElementById('fecha')?.value || new Date().toLocaleDateString('es-AR'),
            horario: '-',
            programa: document.getElementById('curso')?.value || 'Capacitación General',
            modulo: document.getElementById('clase')?.value ? `Clase N° ${document.getElementById('clase').value}` : '-',
            temas: document.getElementById('idcap')?.value ? `ID Capacitación: ${document.getElementById('idcap').value}` : '-',
            capacitador: document.getElementById('instructor')?.value || '-',
            lugar: 'Planta General'
        };

        const asistentes = [];
        const filas = document.querySelectorAll('#tablaAsistentes tr');

        filas.forEach(fila => {
            const c = fila.children;
            if (c.length >= 3 && !fila.textContent.includes('No hay participantes')) {
                asistentes.push({
                    legajo: c[0]?.textContent?.trim() || '',
                    apellido: c[1]?.textContent?.trim() || '',
                    nombre: c[2]?.textContent?.trim() || '',
                    sector: '-',
                    linea: '-'
                });
            }
        });

        localStorage.setItem('siga_impresion_cabecera', JSON.stringify(datosCapacitacion));
        localStorage.setItem('siga_impresion_asistentes', JSON.stringify(asistentes));

        window.open('planilla_asistencia.html', '_blank');
    } catch (error) {
        console.error('Error al preparar planilla A4:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Evento Botón Imprimir Directo
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            prepararYAbrirPlanillaA4();
        });
    }

    // 2. Eventos del Modal post-guardado
    const btnModalImprimir = document.getElementById('btnModalImprimir');
    const btnModalFinalizar = document.getElementById('btnModalFinalizar');

    if (btnModalImprimir) {
        btnModalImprimir.addEventListener('click', () => {
            prepararYAbrirPlanillaA4();
            window.location.href = 'actividades.html';
        });
    }

    if (btnModalFinalizar) {
        btnModalFinalizar.addEventListener('click', () => {
            window.location.href = 'actividades.html';
        });
    }
});
