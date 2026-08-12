document.addEventListener('DOMContentLoaded', () => {
    const btnImprimir = document.getElementById('btnImprimir');

    if (!btnImprimir) return;

    btnImprimir.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // 1. Recopilar datos exactos del formulario de asistentes.html
            const datosCapacitacion = {
                fecha: document.getElementById('fecha')?.value || new Date().toLocaleDateString('es-AR'),
                horario: '-',
                programa: document.getElementById('curso')?.value || 'Capacitación General',
                modulo: document.getElementById('clase')?.value ? `Clase N° ${document.getElementById('clase').value}` : '-',
                temas: document.getElementById('idcap')?.value ? `ID Capacitación: ${document.getElementById('idcap').value}` : '-',
                capacitador: document.getElementById('instructor')?.value || '-',
                lugar: 'Planta General'
            };

            // 2. Extraer los participantes agregados a la tabla
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

            // 3. Guardar en memoria local
            localStorage.setItem('siga_impresion_cabecera', JSON.stringify(datosCapacitacion));
            localStorage.setItem('siga_impresion_asistentes', JSON.stringify(asistentes));

            // 4. Abrir la planilla A4 en una nueva pestaña
            window.open('planilla_asistencia.html', '_blank');

        } catch (error) {
            console.error('Error al preparar impresión:', error);
            alert('Ocurrió un error al preparar la planilla para impresión.');
        }
    });
});
