// ===================================================
// SIGA_APP - LÓGICA MÓDULO DE REPORTES (SUPABASE)
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    cargarMétricasReportes();
});

async function cargarMétricasReportes() {
    try {
        if (!window.supabaseClient) {
            console.error("Supabase no está inicializado.");
            return;
        }

        // 1. Obtener total de asistentes registrados
        const { count: totalAsistentes, error: errAsistentes } = await window.supabaseClient
            .from('asistentes')
            .select('*', { count: 'exact', head: true });

        if (errAsistentes) console.error("Error al contar asistentes:", errAsistentes);

        // 2. Obtener capacitaciones finalizadas y totales
        const { data: capacitaciones, error: errCapacitaciones } = await window.supabaseClient
            .from('capacitaciones')
            .select('estado');

        if (errCapacitaciones) console.error("Error al consultar capacitaciones:", errCapacitaciones);

        // 3. Procesar los números
        const totalCap = capacitaciones ? capacitaciones.length : 0;
        const finalizadas = capacitaciones ? capacitaciones.filter(c => String(c.estado).toLowerCase() === 'finalizada' || String(c.estado).toLowerCase() === 'cerrada').length : 0;
        
        // Calcular porcentaje de cumplimiento
        const porcentaje = totalCap > 0 ? Math.round((finalizadas / totalCap) * 100) : 0;

        // 4. Volcar datos en el DOM
        renderizarMétricas({
            asistentes: totalAsistentes || 0,
            capacitacionesTotal: totalCap,
            porcentajeCumplimiento: porcentaje
        });

    } catch (error) {
        console.error("Error al cargar reportes:", error);
    }
}

function renderizarMétricas(datos) {
    // Actualizar números simples
    const lblAsistentes = document.getElementById('lblTotalAsistentes');
    const lblCapacitaciones = document.getElementById('lblTotalCapacitaciones');
    const lblPorcentaje = document.getElementById('lblPorcentajeCumplimiento');
    const svgCircle = document.getElementById('svgCircleCumplimiento');

    if (lblAsistentes) lblAsistentes.textContent = datos.asistentes;
    if (lblCapacitaciones) lblCapacitaciones.textContent = datos.capacitacionesTotal;
    if (lblPorcentaje) lblPorcentaje.textContent = `${datos.porcentajeCumplimiento}%`;

    // Animar gráfico de dona/torta en SVG
    if (svgCircle) {
        svgCircle.setAttribute('stroke-dasharray', `${datos.porcentajeCumplimiento}, 100`);
    }
}
