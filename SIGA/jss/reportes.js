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
            // 1. Calcular Horas (restando hora_fin - hora_inicio)
            let hs = 0;
            if (c.hora_inicio && c.hora_fin) {
                hs = calcularDiferenciaHoras(c.hora_inicio, c.hora_fin);
            } else {
                // Fallback por si existe una columna directa
                hs = parseFloat(c.duracion || c.horas || c.carga_horaria || 0);
            }

            sumaHoras += isNaN(hs) ? 0 : hs;

            // 2. Identificar si es interna o externa
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

// Función auxiliar para calcular la diferencia en horas entre "HH:MM" o "HH:MM:SS"
function calcularDiferenciaHoras(inicioStr, finStr) {
    if (!inicioStr || !finStr) return 0;

    const [hIni, mIni] = inicioStr.split(':').map(Number);
    const [hFin, mFin] = finStr.split(':').map(Number);

    if (isNaN(hIni) || isNaN(mIni) || isNaN(hFin) || isNaN(mFin)) return 0;

    const minInicio = hIni * 60 + mIni;
    const minFin = hFin * 60 + mFin;

    const diffMinutos = minFin - minInicio;
    return diffMinutos > 0 ? diffMinutos / 60 : 0;
}

function setVal(idElemento, valor) {
    const el = document.getElementById(idElemento);
    if (el) el.textContent = valor;
}
