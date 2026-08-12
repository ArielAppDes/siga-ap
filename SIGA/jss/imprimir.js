document.addEventListener('DOMContentLoaded', () => {
    const btnImprimir = document.getElementById('btnImprimir');

    if (!btnImprimir) return;

    btnImprimir.addEventListener('click', (e) => {
        // Detener cualquier otra acción o evento de impresión nativo en la página actual
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try {
            // 1. Recopilar datos de la capacitación (Ajusta los IDs si en tu HTML difieren)
            const datosCapacitacion = {
                fecha: document.getElementById('fecha')?.value || new Date().toLocaleDateString('es-AR'),
                horario: document.getElementById('horario')?.value || '',
                programa: document.getElementById('programa')?.value || document.getElementById('actividad')?.value || '',
                modulo: document.getElementById('modulo')?.value || '-',
                temas: document.getElementById('temas')?.value || document.getElementById('descripcion')?.value || '',
                capacitador: document.getElementById('capacitador')?.value || '',
                lugar: document.getElementById('lugar')?.value || 'Planta General'
            };

            // 2. Extraer participantes de la tabla
            const asistentes = [];
            const filas = document.querySelectorAll('table tbody tr');

            filas.forEach(fila => {
                const c = fila.children;
                if (c.length >= 3 && !fila.textContent.includes('No hay participantes')) {
                    asistentes.push({
                        legajo: c[0]?.textContent?.trim() || '',
                        apellido: c[1]?.textContent?.trim() || '',
                        nombre: c[2]?.textContent?.trim() || '',
                        sector: c[3]?.textContent?.trim() || '-',
                        linea: c[4]?.textContent?.trim() || '-'
                    });
                }
            });

            // 3. Guardar temporalmente en el navegador
            localStorage.setItem('siga_impresion_cabecera', JSON.stringify(datosCapacitacion));
            localStorage.setItem('siga_impresion_asistentes', JSON.stringify(asistentes));

            // 4. Abrir la planilla A4 en una nueva pestaña
            window.open('planilla_asistencia.html', '_blank');

        } catch (error) {
            console.error('Error al preparar la impresión:', error);
            alert('Ocurrió un error al preparar la impresión.');
        }
    }, true); // Captura prioritaria para bloquear otros scripts
});
