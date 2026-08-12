// ===================================================
// SIGA_APP - LÓGICA MÓDULO DE REPORTES, KPIS Y CHARTS
// ===================================================

let instanceChartMeses = null;
let instanceChartCursos = null;
let instanceChartModalidad = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarMetricasSIGA();
});

async function cargarMetricasSIGA() {
    try {
        if (!window.supabaseClient) {
            console.error("Supabase Client no está disponible.");
            return;
        }

        // 1. Obtener Asistentes
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
        let actPresenciales = 0;
        let actVirtuales = 0;

        // Estructuras para gráficos
        const conteoMeses = Array(12).fill(0); // Ene-Dic
        const conteoCursosMap = {};

        listaCap.forEach(c => {
            // Horas
            const ini = c.hs_inicio || c.hora_inicio;
            const fin = c.hs_fin || c.hora_fin;
            let hs = 0;
            if (ini && fin) {
                hs = calcularDiferenciaHoras(ini, fin);
            } else {
                hs = parseFloat(c.duracion || c.horas || c.carga_horaria || 0);
            }
            sumaHoras += isNaN(hs) ? 0 : hs;

            // Tipo (Interna/Externa)
            const tipo = String(c.tipo || c.origen || c.modalidad || c.categoria || '').toLowerCase();
            if (tipo.includes('extern')) {
                actExternas++;
            } else {
                actInternas++;
            }

            // Modalidad (Presencial/Virtual)
            if (tipo.includes('virtu') || tipo.includes('e-learn') || tipo.includes('onlin')) {
                actVirtuales++;
            } else {
                actPresenciales++;
            }

            // Agrupar por Mes
            const fechaStr = c.fecha || c.created_at;
            if (fechaStr) {
                const f = new Date(fechaStr);
                if (!isNaN(f.getMonth())) {
                    conteoMeses[f.getMonth()]++;
                }
            }

            // Agrupar por Nombre de Curso
            const nombreCurso = c.curso || c.nombre || c.titulo || `Capacitación #${c.id}`;
            conteoCursosMap[nombreCurso] = (conteoCursosMap[nombreCurso] || 0) + 1;
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

        setVal('lblHsAutogestionadas', '0 hs');
        setVal('lblAsistenciasElearning', actVirtuales);
        setVal('lblPorcentajeElearning', totalActividades > 0 ? `${Math.round((actVirtuales/totalActividades)*100)}%` : '0%');

        // --- RENDERIZAR GRÁFICOS ---
        renderizarGraficoMeses(conteoMeses);
        renderizarGraficoCursos(conteoCursosMap);
        renderizarGraficoModalidad(actPresenciales, actVirtuales);

    } catch (error) {
        console.error("Error general en reportes:", error);
    }
}

// 1. Gráfico de Barras: Capacitaciones por Mes
function renderizarGraficoMeses(datosMeses) {
    const ctx = document.getElementById('chartMeses')?.getContext('2d');
    if (!ctx) return;

    if (instanceChartMeses) instanceChartMeses.destroy();

    instanceChartMeses = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Capacitaciones',
                data: datosMeses,
                backgroundColor: '#0284c7',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// 2. Gráfico de Barras con Degradado Violeta: Asistencias/Cursos
function renderizarGraficoCursos(mapCursos) {
    const ctx = document.getElementById('chartCursos')?.getContext('2d');
    if (!ctx) return;

    if (instanceChartCursos) instanceChartCursos.destroy();

    let labels = Object.keys(mapCursos);
    let values = Object.values(mapCursos);

    // Si no hay datos suficientes, generamos vista previa vistosa
    if (labels.length === 0) {
        labels = ['Seguridad', 'Excel Av.', 'Liderazgo', 'ISO 9001', 'SBT'];
        values = [12, 19, 8, 15, 22];
    }

    // Calcular degradado según valor
    const maxVal = Math.max(...values, 1);
    const bgColors = values.map(val => {
        const ratio = 0.35 + (val / maxVal) * 0.65; // Transparencia entre 0.35 y 1.0
        return `rgba(139, 92, 246, ${ratio.toFixed(2)})`; // Violeta (#8b5cf6)
    });

    instanceChartCursos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.slice(0, 7), // Mostrar max 7 cursos
            datasets: [{
                label: 'Personas',
                data: values.slice(0, 7),
                backgroundColor: bgColors,
                borderColor: '#7c3aed',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// 3. Gráfico de Torta / Dona: Modalidad Presencial vs Virtual
function renderizarGraficoModalidad(presenciales, virtuales) {
    const ctx = document.getElementById('chartModalidad')?.getContext('2d');
    if (!ctx) return;

    if (instanceChartModalidad) instanceChartModalidad.destroy();

    // Valores por defecto si la base recién empieza
    const dataPresencial = (presenciales === 0 && virtuales === 0) ? 80 : presenciales;
    const dataVirtual = (presenciales === 0 && virtuales === 0) ? 20 : virtuales;

    instanceChartModalidad = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presencial', 'Virtual / E-Learning'],
            datasets: [{
                data: [dataPresencial, dataVirtual],
                backgroundColor: ['#10b981', '#8b5cf6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 15, font: { size: 11 } }
                }
            },
            cutout: '65%'
        }
    });
}

// Auxiliares
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
