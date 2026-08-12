// ===================================================
// SIGA_APP - LÓGICA MÓDULO DE REPORTES & KPIS
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    cargarMetricasSIGA();
});

async function cargarMetricasSIGA() {
    try {
        if (!window.supabaseClient) {
            console.error("Supabase Client no está disponible.");
            return;
        }

        // 1. Obtener Total de Asistentes / Personas Capacitadas
        const { data: listaAsistentes, error: errAsist } = await window.supabaseClient
            .from('asistentes')
            .select('*');

        if (errAsist) console.error("Error al obtener asistentes:", errAsist);

        const totalAsistentes = listaAsistentes ? listaAsistentes.length : 0;

        // 2. Obtener Capacitaciones
        const { data: capacitaciones, error: errCap } = await window.supabaseClient
            .from('capacitaciones')
            .select('*');

        if (errCap) console.error("Error al obtener capacitaciones:", errCap);

        const listaCap = capacitaciones || [];
        const totalActividades = listaCap.length;

        // --- CÁLCULO DE HORAS, INTERNAS Y EXTERNAS ---
        let sumaHoras = 0;
        let actInternas = 0;
        let actExternas = 0;

        listaCap.forEach(c => {
            // Mapeo exacto con las columnas hs_inicio y hs_fin
            const ini = c.hs_inicio || c.hora_inicio;
            const fin = c.hs_fin || c.hora_fin;

            let hs = 0;
            if (ini && fin) {
                hs = calcularDiferenciaHoras(ini, fin);
            } else {
                hs = parseFloat(c.duracion || c.horas || c.carga_horaria || 0);
            }

            sumaHoras += isNaN(hs) ? 0 : hs;

            // Clasificación por tipo o modalidad
            const tipo = String(c.tipo || c.origen || c.modalidad || c.categoria || '').toLowerCase();
            if (tipo.includes('extern')) {
                actExternas++;
            } else {
                actInternas++;
            }
        });

        // Promedios
        const hsPromedio = totalActividades > 0 ? (sumaHoras / totalActividades).toFixed(1) : 0;
        const hsPerCapita = totalAsistentes > 0 ? (sumaHoras / totalAsistentes).toFixed(1) : 0;

        // --- VOLCADO A LAS TARJETAS (DOM) ---
        setVal('lblTotalActividades', totalActividades);
        setVal('lblPersonasCapacitadas', totalAsistentes);
        setVal('lblAsistenciasMes', totalAsistentes);
        setVal('lblHsPerCapita', `${hsPerCapita} hs`);

        setVal('lblHsPromedioCurso', `${hsPromedio} hs`);
        
        setVal('lblActividadesInternas', actInternas);
        setVal('lblActividadesExternas', actExternas);

        // e-Learning pendiente
        setVal('lblHsAutogestionadas', '0 hs');
        setVal('lblAsistenciasElearning', 0);
        setVal('lblPorcentajeElearning', '0%');

    } catch (error) {
        console.error("Error general en reportes:", error);
    }
}

// Diferencia exacta en horas decimales (compatible con HH:MM:SS)
function calcularDiferenciaHoras(inicioStr, finStr) {
    if (!inicioStr || !finStr) return 0;

    const partesIni = String(inicioStr).split(':').map(Number);
    const partesFin = String(finStr).split(':').map(Number);

    if (partesIni.length < 2 || partesFin.length < 2) return 0;

    const minInicio = partesIni[0] * 60 + partesIni[1];
    const minFin = partesFin[0] * 60 + partesFin[1];

    const diffMinutos = minFin - minInicio;
    return diffMinutos > 0 ? diffMinutos / 60 : 0;
}

function setVal(idElemento, valor) {
    const el = document.getElementById(idElemento);
    if (el) el.textContent = valor;
}
