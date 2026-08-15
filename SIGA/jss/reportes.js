// ===================================================
// SIGA_APP - V0.2 LÓGICA MÓDULO DE REPORTES (ESTRUCTURA MODULAR)
// ===================================================

let instanceChartMeses = null;
let instanceChartCurs2os = null;
let instanceChartModalidad = null;

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    cargarMetricasSIGA();
});

// 2. FUNCIÓN PRINCIPAL ORQUESTADORA
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
        const asistenciasData = listaAsistentes || [];

        // 2. Obtener Capacitaciones
        const { data: capacitaciones, error: errCap } = await window.supabaseClient
            .from('capacitaciones')
            .select('*');

        if (errCap) console.error("Error al obtener capacitaciones:", errCap);
        let capacitacionesData = capacitaciones || [];

        // 3. Obtener Cursos para cruzar modalidad por el nombre del curso
        const { data: listaCursos, error: errCur } = await window.supabaseClient
            .from('cursos')
            .select('*');

        if (errCur) console.error("Error al obtener cursos:", errCur);

        // Mapa auxiliar: Nombre del curso -> Modalidad
        const mapaModalidad = {};
        if (listaCursos) {
            listaCursos.forEach(cur => {
                if (cur.nombre) {
                    const nombreClean = String(cur.nombre).trim().toLowerCase();
                    mapaModalidad[nombreClean] = cur.modalidad || cur.tipo || '';
                }
            });
        }

        // Asociar la modalidad a cada capacitación comparando 'nombre_curso' con 'nombre'
        capacitacionesData = capacitacionesData.map(c => {
            const nombreCapClean = String(c.nombre_curso || c.nombre || '').trim().toLowerCase();
            const modCurso = mapaModalidad[nombreCapClean] || '';
            return {
                ...c,
                modalidad: c.modalidad || modCurso
            };
        });

        // 4. EJECUCIÓN DE MÓDULOS INDEPENDIENTES
        calcularModuloGenerales(capacitacionesData, asistenciasData);
        calcularModuloHoraria(capacitacionesData, asistenciasData);
        calcularModuloOrigen(capacitacionesData);
        calcularModuloGraficos(capacitacionesData, asistenciasData);

    } catch (error) {
        console.error("Error general al procesar reportes:", error);
    }
}

// Función auxiliar para leer la modalidad en cualquier estructura de Supabase
function obtenerModalidad(c) {
    let mod = '';
    if (c.cursos) {
        if (Array.isArray(c.cursos) && c.cursos.length > 0) {
            mod = c.cursos[0].modalidad || '';
        } else if (typeof c.cursos === 'object') {
            mod = c.cursos.modalidad || '';
        }
    }
    if (!mod) {
        mod = c.modalidad || c.tipo || c.origen || c.categoria || '';
    }
    return String(mod).toLowerCase();
}

// ===================================================
// MÓDULO 1: INDICADORES GENERALES DE GESTIÓN
// ===================================================
function calcularModuloGenerales(capacitaciones, asistentes) {
    const totalActividades = capacitaciones.length;

    const legajosUnicos = new Set(
        asistentes
            .map(a => a.legajo || a.dni || a.empleado_id)
            .filter(val => val !== null && val !== undefined && val !== '')
    );
    const personasCapacitadas = legajosUnicos.size;

    const totalAsistencias = asistentes.length;

    setVal('lblTotalActividades', totalActividades);
    setVal('lblPersonasCapacitadas', personasCapacitadas);
    setVal('lblTotalAsistencias', totalAsistencias);
    setVal('lblAsistenciasMes', totalAsistencias);
}

// ===================================================
// MÓDULO 2: CARGA HORARIA E INTENSIDAD
// ===================================================
function calcularModuloHoraria(capacitaciones, asistentes) {
    let sumaHoras = 0;

    capacitaciones.forEach(c => {
        const ini = c.hs_inicio || c.hora_inicio;
        const fin = c.hs_fin || c.hora_fin;
        let hs = 0;

        if (ini && fin) {
            hs = calcularDiferenciaHoras(ini, fin);
        } else {
            hs = parseFloat(c.duracion || c.horas || c.carga_horaria || 0);
        }
        sumaHoras += isNaN(hs) ? 0 : hs;
    });

    const legajosUnicos = new Set(
        asistentes
            .map(a => a.legajo || a.dni || a.empleado_id)
            .filter(val => val !== null && val !== undefined && val !== '')
    );
    const totalPersonasUnicas = legajosUnicos.size;

    const totalActividades = capacitaciones.length;
    const hsPromedio = totalActividades > 0 ? (sumaHoras / totalActividades).toFixed(1) : '0.0';
    const hsPerCapita = totalPersonasUnicas > 0 ? (sumaHoras / totalPersonasUnicas).toFixed(1) : '0.0';

    setVal('lblHsPromedioCurso', `${hsPromedio} hs`);
    setVal('lblHsPerCapita', `${hsPerCapita} hs`);
}

// ===================================================
// MÓDULO 3: ORIGEN Y E-LEARNING
// ===================================================
function calcularModuloOrigen(capacitaciones) {
    let actInternas = 0;
    let actExternas = 0;
    let actVirtuales = 0;

    const totalActividades = capacitaciones.length;

    capacitaciones.forEach(c => {
        const tipo = String(c.tipo || c.origen || c.categoria || '').toLowerCase();
        const modalidad = obtenerModalidad(c);

        if (tipo.includes('extern')) {
            actExternas++;
        } else {
            actInternas++;
        }

        if (modalidad.includes('virtu') || modalidad.includes('e-learn') || modalidad.includes('onlin')) {
            actVirtuales++;
        }
    });

    const pctElearning = totalActividades > 0 ? Math.round((actVirtuales / totalActividades) * 100) : 0;

    setVal('lblActInternas', actInternas);
    setVal('lblActividadesInternas', actInternas);
    setVal('lblActExternas', actExternas);
    setVal('lblActividadesExternas', actExternas);
    setVal('lblPctElearning', `${pctElearning}%`);
    setVal('lblPorcentajeElearning', `${pctElearning}%`);
    setVal('lblAsistenciasElearning', actVirtuales);
    setVal('lblHsAutogestionadas', '0 hs');
}

// ===================================================
// MÓDULO 4: TENDENCIAS Y GRÁFICOS
// ===================================================
function calcularModuloGraficos(capacitaciones, asistentes) {
    const programadasPorMes = Array(12).fill(0);
    const enCursoPorMes = Array(12).fill(0);
    const finalizadasPorMes = Array(12).fill(0);
    const asistenciasPorMes = Array(12).fill(0);

    let actPresenciales = 0;
    let actVirtuales = 0;

    capacitaciones.forEach(c => {
        const modalidad = obtenerModalidad(c);
        
        if (modalidad.includes('virtu') || modalidad.includes('e-learn') || modalidad.includes('onlin')) {
            actVirtuales++;
        } else {
            actPresenciales++;
        }

        const fechaStr = c.fecha || c.created_at;
        let numMes = -1;
        if (fechaStr) {
            const f = new Date(fechaStr);
            if (!isNaN(f.getTime())) numMes = f.getMonth();
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

    renderizarGraficoEstadosMes(programadasPorMes, enCursoPorMes, finalizadasPorMes);
    renderizarGraficoAsistenciasMes(asistenciasPorMes);
    renderizarGraficoModalidad(actPresenciales, actVirtuales);
}

// ===================================================
// FUNCIONES DE RENDERIZADO DE GRÁFICOS (CHART.JS)
// ===================================================
function renderizarGraficoEstadosMes(prog, curso, fin) {
    const ctx = (document.getElementById('chartEvolucionMensual') || document.getElementById('chartMeses'))?.getContext('2d');
    if (!ctx) return;

    if (instanceChartMeses) instanceChartMeses.destroy();

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    instanceChartMeses = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                { label: 'Programadas', data: prog, backgroundColor: '#f97316', borderRadius: 3 },
                { label: 'En curso', data: curso, backgroundColor: '#0284c7', borderRadius: 3 },
                { label: 'Finalizadas', data: fin, backgroundColor: '#10b981', borderRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: false, grid: { display: false } },
                y: { stacked: false, beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}

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
                backgroundColor: '#8b5cf6',
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
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } }
            },
            cutout: '65%'
        }
    });
}

// ===================================================
// NAVEGACIÓN Y CONTROL DEL HUB
// ===================================================
function abrirReporte(idSeccion) {
    const hub = document.getElementById('reportesHubGrid');
    const vistaDetalle = document.getElementById('vistaDetalleReporte');

    if (hub) hub.style.display = 'none';
    if (vistaDetalle) vistaDetalle.style.display = 'block';

    const secciones = document.querySelectorAll('.seccion-reporte');
    secciones.forEach(sec => sec.style.display = 'none');

    if (idSeccion === 'generales') setDisplay('secGenerales', 'block');
    if (idSeccion === 'horaria') setDisplay('secHoraria', 'block');
    if (idSeccion === 'origen') setDisplay('secOrigen', 'block');
    if (idSeccion === 'graficos') setDisplay('secGraficos', 'block');
}

function volverAlHub() {
    const vistaDetalle = document.getElementById('vistaDetalleReporte');
    const hub = document.getElementById('reportesHubGrid');

    if (vistaDetalle) vistaDetalle.style.display = 'none';
    if (hub) hub.style.display = 'grid';
}

// ===================================================
// FUNCIONES AUXILIARES
// ===================================================
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

function setDisplay(idElemento, displayValue) {
    const el = document.getElementById(idElemento);
    if (el) el.style.display = displayValue;
}
