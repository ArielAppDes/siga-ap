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

        // ESTRUCTURAS PARA GRÁFICOS
        const programadasPorMes = Array(12).fill(0);
        const enCursoPorMes = Array(12).fill(0);
        const finalizadasPorMes = Array(12).fill(0);
        const asistenciasPorMes = Array(12).fill(0);

        let sumaHoras = 0;
        let actInternas = 0;
        let actExternas = 0;
        let actPresenciales = 0;
        let actVirtuales = 0;

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

            // Mapeo por Mes y Estado
            const fechaStr = c.fecha || c.created_at;
            let numMes = -1;
            if (fechaStr) {
                const f = new Date(fechaStr);
                if (!isNaN(f.getMonth())) numMes = f.getMonth();
            }

            if (numMes >= 0 && numMes < 12) {
                const estadoStr = String(c.estado || c.status || '').toLowerCase();

                if (estadoStr.includes('program')) {
                    programadasPorMes[numMes]++;
                } else if (estadoStr.includes('curso')) {
                    enCursoPorMes[numMes]++;
                } else {
                    finalizadasPorMes[numMes]++;
                }

                asistenciasPorMes[numMes] += 1;
            }
        });

        // Promedios
        const hsPromedio = totalActividades > 0 ? (sumaHoras / totalActividades).toFixed(1) : 0;
        const hsPerCapita = totalAsistentes > 0 ? (sumaHoras / totalAsistentes).toFixed(1) : 0;

        // --- VOLCADO A TARJETAS (DOM) ---
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
        renderizarGraficoEstadosMes(programadasPorMes, enCursoPorMes, finalizadasPorMes);
        renderizarGraficoAsistenciasMes(asistenciasPorMes);
        renderizarGraficoModalidad(actPresenciales, actVirtuales);

    } catch (error) {
        console.error("Error general en reportes:", error);
    }
}

// 1. Gráfico: Capacitaciones por Mes agrupado por Estado (Naranja, Azul, Verde)
function renderizarGraficoEstadosMes(prog, curso, fin) {
    const ctx = document.getElementById('chartMeses')?.getContext('2d');
    if (!ctx) return;

    if (instanceChartMeses) instanceChartMeses.destroy();

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    instanceChartMeses = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Programadas',
                    data: prog,
                    backgroundColor: '#f97316', // Naranja
                    borderRadius: 4
                },
                {
                    label: 'En curso',
                    data: curso,
                    backgroundColor: '#0284c7', // Azul
                    borderRadius: 4
                },
                {
                    label: 'Finalizadas',
                    data: fin,
                    backgroundColor: '#10b981', // Verde
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11 } }
                }
            }
        }
    });
}

// 2. Gráfico: Asistencias por Mes (Corrige el #undefined mostrando Ene..Dic)
function renderizarGraficoAsistenciasMes(datosAsistencias) {
    const ctx = document.getElementById('chartCursos')?.getContext('2d');
    if (!ctx) return;

    if (instanceChartCursos) instanceChartCursos.destroy();

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    instanceChartCursos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Capacitaciones acumuladas',
                data: datosAsistencias,
                backgroundColor: '#8b5cf6', // Violeta
                borderRadius: 4
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

// 3. Gráfico: Modalidad (Presencial vs Virtual)
function renderizarGraficoModalidad(presenciales, virtuales) {
    const ctx = document.getElementById('chartModalidad')?.getContext('2d');
    if (!ctx) return;

    if (instanceChartModalidad) instanceChartModalidad.destroy();

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
                    labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
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
function abrirReporte(idSeccion) {
    // Ocultar HUB y mostrar contenedor de detalle
    document.getElementById('reportesHubGrid').style.display = 'none';
    document.getElementById('vistaDetalleReporte').style.display = 'block';

    // Ocultar todas las secciones internas
    const secciones = document.querySelectorAll('.seccion-reporte');
    secciones.forEach(sec => sec.style.display = 'none');

    // Mostrar solo la sección seleccionada
    if (idSeccion === 'generales') document.getElementById('secGenerales').style.display = 'block';
    if (idSeccion === 'horaria') document.getElementById('secHoraria').style.display = 'block';
    if (idSeccion === 'origen') document.getElementById('secOrigen').style.display = 'block';
    if (idSeccion === 'graficos') document.getElementById('secGraficos').style.display = 'block';
}

function volverAlHub() {
    // Ocultar vista de detalle y mostrar el HUB
    document.getElementById('vistaDetalleReporte').style.display = 'none';
    document.getElementById('reportesHubGrid').style.display = 'grid';
}
