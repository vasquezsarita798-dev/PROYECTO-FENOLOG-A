import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import type { GrowthChartMetric, ValveData, WeeklyModuleData } from '../types/phenology';
import { getSortedWeekKeys } from '../utils/calculations';

interface ChartsSectionProps {
  valvesData: ValveData[];
  weeklyModuleData: WeeklyModuleData;
  titleCharts: string;
  isEditMode: boolean;
  onUpdateTitleCharts: (title: string) => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  valvesData,
  weeklyModuleData,
  titleCharts,
  isEditMode,
  onUpdateTitleCharts,
}) => {
  const [currentGrowthMetric, setCurrentGrowthMetric] = useState<GrowthChartMetric>('longitud');
  const [selectedPhenoModule, setSelectedPhenoModule] = useState<string>('ALL');

  const growthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const phenoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const growthChartRef = useRef<Chart | null>(null);
  const phenoChartRef = useRef<Chart | null>(null);

  const modules = useMemo(
    () => Array.from(new Set(valvesData.map((v) => v.modulo || '1'))),
    [valvesData],
  );

  // Initialize Chart.js instances once
  useEffect(() => {
    if (growthCanvasRef.current && !growthChartRef.current) {
      growthChartRef.current = new Chart(growthCanvasRef.current, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Longitud Promedio (cm)' },
            },
          },
        },
      });
    }

    if (phenoCanvasRef.current && !phenoChartRef.current) {
      phenoChartRef.current = new Chart(phenoCanvasRef.current, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Brotes por Planta (und)' },
            },
          },
        },
      });
    }

    return () => {
      growthChartRef.current?.destroy();
      growthChartRef.current = null;
      phenoChartRef.current?.destroy();
      phenoChartRef.current = null;
    };
  }, []);

  // Update Weekly Growth Chart
  useEffect(() => {
    const chart = growthChartRef.current;
    if (!chart) return;

    const weeks = getSortedWeekKeys(weeklyModuleData);
    const palette = ['#1e3a8a', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0891b2'];
    let datasets: any[] = [];
    let yAxisTitle = '';

    const getGlobalFlushAvg = (
      weekName: string,
      prop: 'f1_long' | 'f2_long' | 'f3_long',
    ): number | null => {
      const wObj = weeklyModuleData[weekName];
      if (!wObj) return null;
      const mods = Object.keys(wObj);
      if (mods.length === 0) return null;
      let sum = 0;
      let count = 0;
      mods.forEach((m) => {
        if (wObj[m] && wObj[m][prop] !== undefined) {
          sum += wObj[m][prop];
          count++;
        }
      });
      return count > 0 ? +(sum / count).toFixed(1) : null;
    };

    if (currentGrowthMetric === 'longitud') {
      yAxisTitle = 'Longitud Promedio (cm)';
      datasets = modules.map((mod, idx) => {
        const color = palette[idx % palette.length];
        return {
          label: `Módulo ${mod} - Longitud (cm)`,
          data: weeks.map((w) => {
            const modObj = weeklyModuleData[w] ? weeklyModuleData[w][mod] : null;
            return modObj ? modObj.long_global : null;
          }),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          pointRadius: 6,
          pointHoverRadius: 8,
        };
      });
    } else if (currentGrowthMetric === 'diametro') {
      yAxisTitle = 'Diámetro Promedio (mm)';
      datasets = modules.map((mod, idx) => {
        const color = palette[idx % palette.length];
        return {
          label: `Módulo ${mod} - Diámetro (mm)`,
          data: weeks.map((w) => {
            const modObj = weeklyModuleData[w] ? weeklyModuleData[w][mod] : null;
            return modObj ? modObj.diam_global : null;
          }),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          pointRadius: 6,
          pointHoverRadius: 8,
        };
      });
    } else if (currentGrowthMetric === 'brotes') {
      yAxisTitle = 'Cantidad de Brotes / Planta (und)';
      datasets = modules.map((mod, idx) => {
        const color = palette[idx % palette.length];
        return {
          label: `Módulo ${mod} - Brotes/Planta`,
          data: weeks.map((w) => {
            const modObj = weeklyModuleData[w] ? weeklyModuleData[w][mod] : null;
            return modObj ? modObj.brotes_planta : null;
          }),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          pointRadius: 6,
          pointHoverRadius: 8,
        };
      });
    } else {
      yAxisTitle = 'Longitud de Brotes por Flujo (cm)';
      datasets = [
        {
          label: '1er Flujo (cm)',
          data: weeks.map((w) => getGlobalFlushAvg(w, 'f1_long')),
          borderColor: '#1e40af',
          backgroundColor: '#1e40af',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 6,
        },
        {
          label: '2do Flujo (cm)',
          data: weeks.map((w) => getGlobalFlushAvg(w, 'f2_long')),
          borderColor: '#059669',
          backgroundColor: '#059669',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 6,
        },
        {
          label: '3er Flujo (cm)',
          data: weeks.map((w) => getGlobalFlushAvg(w, 'f3_long')),
          borderColor: '#7c3aed',
          backgroundColor: '#7c3aed',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 6,
        },
      ];
    }

    chart.data.labels = weeks;
    chart.data.datasets = datasets;
    const yScale = chart.options.scales?.y as { title?: { text?: string } } | undefined;
    if (yScale?.title) {
      yScale.title.text = yAxisTitle;
    }
    chart.update();
  }, [weeklyModuleData, modules, currentGrowthMetric]);

  // Update Weekly Phenology Chart
  useEffect(() => {
    const chart = phenoChartRef.current;
    if (!chart) return;

    const weeks = getSortedWeekKeys(weeklyModuleData);

    const getWeeklyPhenoValue = (
      weekName: string,
      prop: 'induccion' | 'inactivos' | 'vigorosos' | 'no_vigorosos' | 'basales' | 'retonos',
    ): number => {
      const wObj = weeklyModuleData[weekName];
      if (!wObj) return 0;
      if (selectedPhenoModule !== 'ALL') {
        return wObj[selectedPhenoModule] ? wObj[selectedPhenoModule][prop] || 0 : 0;
      }
      const mods = Object.keys(wObj);
      if (mods.length === 0) return 0;
      let sum = 0;
      let c = 0;
      mods.forEach((m) => {
        if (wObj[m] && wObj[m][prop] !== undefined) {
          sum += wObj[m][prop];
          c++;
        }
      });
      return c > 0 ? +(sum / c).toFixed(1) : 0;
    };

    chart.data.labels = weeks;
    chart.data.datasets = [
      {
        label: 'Con Inducción',
        data: weeks.map((w) => getWeeklyPhenoValue(w, 'induccion')),
        borderColor: '#e11d48',
        backgroundColor: '#e11d48',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
      },
      {
        label: 'Brotes Inactivos',
        data: weeks.map((w) => getWeeklyPhenoValue(w, 'inactivos')),
        borderColor: '#0891b2',
        backgroundColor: '#0891b2',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
      },
      {
        label: 'Vigorosos',
        data: weeks.map((w) => getWeeklyPhenoValue(w, 'vigorosos')),
        borderColor: '#059669',
        backgroundColor: '#059669',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'No Vigorosos',
        data: weeks.map((w) => getWeeklyPhenoValue(w, 'no_vigorosos')),
        borderColor: '#d97706',
        backgroundColor: '#d97706',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Basales y Retoños',
        data: weeks.map(
          (w) => +(getWeeklyPhenoValue(w, 'basales') + getWeeklyPhenoValue(w, 'retonos')).toFixed(1),
        ),
        borderColor: '#7c3aed',
        backgroundColor: '#7c3aed',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
      },
    ];
    chart.update();
  }, [weeklyModuleData, selectedPhenoModule]);

  const renderGrowthChartTitle = () => {
    if (currentGrowthMetric === 'longitud') {
      return (
        <>
          <i className="fa-solid fa-ruler-vertical" style={{ color: 'var(--primary)' }} />{' '}
          Evolución Semanal de Longitud Promedio (cm) por Módulo
        </>
      );
    }
    if (currentGrowthMetric === 'diametro') {
      return (
        <>
          <i className="fa-solid fa-circle-dot" style={{ color: 'var(--secondary)' }} />{' '}
          Evolución Semanal de Diámetro Promedio (mm) por Módulo
        </>
      );
    }
    if (currentGrowthMetric === 'brotes') {
      return (
        <>
          <i className="fa-solid fa-spa" style={{ color: 'var(--warning)' }} /> Evolución Semanal
          de Cantidad de Brotes por Planta por Módulo
        </>
      );
    }
    return (
      <>
        <i className="fa-solid fa-layer-group" style={{ color: 'var(--accent)' }} /> Evolución
        Semanal de Longitud: 1er vs 2do vs 3er Flujo (cm)
      </>
    );
  };

  return (
    <section id="sectionCharts">
      <div className="section-header">
        <div className="section-title-wrap">
          <span style={{ color: 'var(--accent)', fontSize: '1.3rem' }}>
            <i className="fa-solid fa-chart-line" />
          </span>
          <h2
            className="section-title"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="titleCharts"
            onBlur={(e) => onUpdateTitleCharts(e.currentTarget.innerText.trim())}
          >
            {titleCharts}
          </h2>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h4
              style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}
              id="growthChartTitle"
            >
              {renderGrowthChartTitle()}
            </h4>

            <div className="chart-metric-selector-bar">
              <button
                className={`chart-pill-btn ${currentGrowthMetric === 'longitud' ? 'active' : ''}`}
                id="btnMetricLong"
                onClick={() => setCurrentGrowthMetric('longitud')}
              >
                <i className="fa-solid fa-ruler-vertical" /> Longitud (cm)
              </button>
              <button
                className={`chart-pill-btn ${currentGrowthMetric === 'diametro' ? 'active' : ''}`}
                id="btnMetricDiam"
                onClick={() => setCurrentGrowthMetric('diametro')}
              >
                <i className="fa-solid fa-circle-dot" /> Diámetro (mm)
              </button>
              <button
                className={`chart-pill-btn ${currentGrowthMetric === 'brotes' ? 'active' : ''}`}
                id="btnMetricBrotes"
                onClick={() => setCurrentGrowthMetric('brotes')}
              >
                <i className="fa-solid fa-spa" /> Cantidad Brotes/Pta
              </button>
              <button
                className={`chart-pill-btn ${currentGrowthMetric === 'flujos' ? 'active' : ''}`}
                id="btnMetricFlujos"
                onClick={() => setCurrentGrowthMetric('flujos')}
              >
                <i className="fa-solid fa-layer-group" /> 1er vs 2do vs 3er Flujo
              </button>
            </div>
          </div>

          <div className="chart-wrapper">
            <canvas ref={growthCanvasRef} id="weeklyGrowthChart" />
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            <i className="fa-solid fa-circle-info" /> Cada línea muestra la evolución semanal de la
            variable elegida por Módulo (escala independiente y limpia).
          </div>
        </div>

        <div className="chart-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
              <i className="fa-solid fa-chart-line" style={{ color: 'var(--secondary)' }} />{' '}
              Evolución Semanal de Estados Fenológicos de los Brotes
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                Módulo:
              </span>
              <select
                id="selectPhenoModule"
                className="filter-select"
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                value={selectedPhenoModule}
                onChange={(e) => setSelectedPhenoModule(e.target.value)}
              >
                <option value="ALL">Promedio Todos los Módulos</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    Módulo {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-wrapper">
            <canvas ref={phenoCanvasRef} id="weeklyPhenologyChart" />
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            <i className="fa-solid fa-circle-info" /> Monitoreo temporal de Inducción, Inactivos,
            Vigorosos, No Vigorosos y Basales a través de las semanas.
          </div>
        </div>
      </div>
    </section>
  );
};
