import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import type {
  GrowthRateBasis,
  MasterCatalogItem,
  ValveData,
  WeeklyModuleData,
  WeeklyTurnoData,
} from '../types/phenology';
import { buildGrowthRateComparisonMatrix } from '../utils/calculations';

interface GrowthRateSummarySectionProps {
  valvesData: ValveData[];
  masterCatalog: MasterCatalogItem[];
  weeklyModuleData: WeeklyModuleData;
  weeklyTurnoData: WeeklyTurnoData;
  weeklyDates: Record<string, string>;
  activeWeek: string;
  initialBasis: GrowthRateBasis;
  titleGrowthSummary: string;
  isEditMode: boolean;
  onUpdateTitle: (title: string) => void;
}

export const GrowthRateSummarySection: React.FC<GrowthRateSummarySectionProps> = ({
  valvesData,
  masterCatalog,
  weeklyModuleData,
  weeklyTurnoData,
  weeklyDates,
  activeWeek,
  initialBasis,
  titleGrowthSummary,
  isEditMode,
  onUpdateTitle,
}) => {
  const [basis, setBasis] = useState<GrowthRateBasis>(initialBasis);
  const [turnoFilter, setTurnoFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    setBasis(initialBasis);
  }, [initialBasis]);

  const { weeks, availableTurnos, rows } = useMemo(
    () =>
      buildGrowthRateComparisonMatrix(
        valvesData,
        masterCatalog,
        weeklyModuleData,
        weeklyTurnoData,
        weeklyDates,
        activeWeek,
        basis,
        turnoFilter,
      ),
    [
      valvesData,
      masterCatalog,
      weeklyModuleData,
      weeklyTurnoData,
      weeklyDates,
      activeWeek,
      basis,
      turnoFilter,
    ],
  );

  useEffect(() => {
    if (turnoFilter !== 'ALL' && !availableTurnos.includes(turnoFilter)) {
      setTurnoFilter('ALL');
    }
  }, [availableTurnos, turnoFilter]);

  const uniqueModules = useMemo(
    () => Array.from(new Set(rows.map((r) => r.modulo))),
    [rows],
  );

  useEffect(() => {
    if (moduleFilter !== 'ALL' && !uniqueModules.includes(moduleFilter)) {
      setModuleFilter('ALL');
    }
  }, [uniqueModules, moduleFilter]);

  const filteredRows = useMemo(
    () => (moduleFilter === 'ALL' ? rows : rows.filter((r) => r.modulo === moduleFilter)),
    [rows, moduleFilter],
  );

  const summaryHighlights = useMemo(() => {
    const activeVals: number[] = [];
    let bestRow: { label: string; rate: number } | null = null;
    let topDeltaRow: { label: string; delta: number } | null = null;

    for (const r of filteredRows) {
      const rate = r.ratesByWeek[activeWeek];
      if (rate !== null && rate !== undefined) {
        activeVals.push(rate);
        if (!bestRow || rate > bestRow.rate) {
          bestRow = { label: r.modulo, rate };
        }
      }
      if (r.deltaVsPrev !== null) {
        if (!topDeltaRow || r.deltaVsPrev > topDeltaRow.delta) {
          topDeltaRow = { label: r.modulo, delta: r.deltaVsPrev };
        }
      }
    }

    const activeWeekVal =
      activeVals.length > 0
        ? +(activeVals.reduce((a, b) => a + b, 0) / activeVals.length).toFixed(2)
        : null;

    return { activeWeekVal, bestRow, topDeltaRow };
  }, [filteredRows, activeWeek]);

  // Render Chart.js comparison chart grouped strictly by Módulo
  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const palette = ['#1e3a8a', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0891b2'];

    const datasets = filteredRows.map((row, idx) => {
      const color = palette[idx % palette.length];
      return {
        label: `Módulo ${row.modulo}`,
        data: weeks.map((w) => row.ratesByWeek[w] ?? 0),
        backgroundColor: chartType === 'bar' ? `${color}cc` : color,
        borderColor: color,
        borderWidth: chartType === 'bar' ? 1.5 : 3,
        borderRadius: chartType === 'bar' ? 6 : 0,
        tension: 0.3,
        pointRadius: 5,
        fill: false,
      };
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: chartType,
      data: {
        labels: weeks.map((w) => `Sem. ${w}`),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Tasa de Crecimiento (cm/día)' },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [filteredRows, weeks, chartType]);

  const basisText =
    basis === 'flujo1'
      ? '1er Flujo'
      : basis === 'flujo2'
        ? '2do Flujo'
        : basis === 'flujo3'
          ? '3er Flujo'
          : 'Global (3 Flujos)';

  const turnoSegmentLabel =
    turnoFilter === 'ALL' ? 'Todos los Turnos' : `Turno ${turnoFilter}`;

  return (
    <section className="table-container-card" id="sectionGrowthSummary" style={{ marginTop: '24px' }}>
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div className="section-title-wrap">
          <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>
            <i className="fa-solid fa-chart-column" />
          </span>
          <h2
            className="section-title"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="titleGrowthSummary"
            onBlur={(e) => onUpdateTitle(e.currentTarget.innerText.trim())}
          >
            {titleGrowthSummary}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            style={{ padding: '5px 10px', fontSize: '0.82rem' }}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            title="Filtrar resumen por módulo"
          >
            <option value="ALL">Todos los Módulos</option>
            {uniqueModules.map((m) => (
              <option key={m} value={m}>
                Módulo {m}
              </option>
            ))}
          </select>

          <button
            className={`chart-pill-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            <i className="fa-solid fa-chart-bar" /> Barras
          </button>
          <button
            className={`chart-pill-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            <i className="fa-solid fa-chart-line" /> Líneas
          </button>
        </div>
      </div>

      {/* Segmentador por Turno + Selector de Flujo */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          className="chart-metric-selector-bar"
          style={{ marginBottom: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#475569',
              marginRight: '4px',
              textTransform: 'uppercase',
            }}
          >
            <i className="fa-solid fa-sliders" /> Turno:
          </span>
          <button
            className={`chart-pill-btn ${turnoFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setTurnoFilter('ALL')}
          >
            Todos
          </button>
          {availableTurnos.map((t) => (
            <button
              key={t}
              className={`chart-pill-btn ${turnoFilter === t ? 'active' : ''}`}
              onClick={() => setTurnoFilter(t)}
            >
              Turno {t}
            </button>
          ))}
        </div>

        <div
          className="chart-metric-selector-bar"
          style={{ marginBottom: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}
        >
          <button
            className={`chart-pill-btn ${basis === 'global' ? 'active' : ''}`}
            onClick={() => setBasis('global')}
          >
            <i className="fa-solid fa-layer-group" /> Global (3 Flujos)
          </button>
          <button
            className={`chart-pill-btn ${basis === 'flujo1' ? 'active' : ''}`}
            onClick={() => setBasis('flujo1')}
          >
            1er Flujo
          </button>
          <button
            className={`chart-pill-btn ${basis === 'flujo2' ? 'active' : ''}`}
            onClick={() => setBasis('flujo2')}
          >
            2do Flujo
          </button>
          <button
            className={`chart-pill-btn ${basis === 'flujo3' ? 'active' : ''}`}
            onClick={() => setBasis('flujo3')}
          >
            3er Flujo
          </button>
        </div>
      </div>

      {/* Tarjetas rápidas de resumen */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
            Promedio Sem. {activeWeek} · {turnoSegmentLabel} ({basisText})
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#172554', marginTop: '2px' }}>
            {summaryHighlights.activeWeekVal !== null
              ? `${summaryHighlights.activeWeekVal.toFixed(2)} cm/día`
              : '-'}
          </div>
        </div>

        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
            Mayor Tasa en Sem. {activeWeek}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
            {summaryHighlights.bestRow
              ? `Módulo ${summaryHighlights.bestRow.label} (${summaryHighlights.bestRow.rate.toFixed(2)} cm/d)`
              : '-'}
          </div>
        </div>

        <div
          style={{
            background: '#f5f3ff',
            border: '1px solid #ddd6fe',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase' }}>
            Mayor Aceleración vs Sem. Ant.
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4c1d95', marginTop: '4px' }}>
            {summaryHighlights.topDeltaRow
              ? `Módulo ${summaryHighlights.topDeltaRow.label} (${summaryHighlights.topDeltaRow.delta >= 0 ? '+' : ''}${summaryHighlights.topDeltaRow.delta.toFixed(2)} cm/d)`
              : '-'}
          </div>
        </div>
      </div>

      {/* Tabla Comparativa por Módulo y Semanas */}
      <div className="table-responsive" style={{ marginBottom: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              {weeks.map((w) => (
                <th
                  key={w}
                  style={{
                    textAlign: 'right',
                    background: w === activeWeek ? '#eff6ff' : '#f8fafc',
                    color: w === activeWeek ? '#1e40af' : '#475569',
                  }}
                >
                  Sem. {w} (cm/d)
                </th>
              ))}
              <th style={{ textAlign: 'right' }}>Var. vs Sem. Ant.</th>
              <th style={{ textAlign: 'right' }}>Prom. Histórico</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.key}>
                <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Módulo {row.modulo}</td>

                {weeks.map((w) => {
                  const val = row.ratesByWeek[w];
                  const isActive = w === activeWeek;
                  return (
                    <td
                      key={w}
                      style={{
                        textAlign: 'right',
                        fontWeight: isActive ? 800 : 600,
                        background: isActive ? '#f8fbff' : undefined,
                        color:
                          val !== null && val < 0
                            ? '#dc2626'
                            : isActive
                              ? '#1e40af'
                              : '#1e293b',
                      }}
                    >
                      {val !== null && val !== undefined ? val.toFixed(2) : '-'}
                    </td>
                  );
                })}

                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {row.deltaVsPrev !== null ? (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        background: row.deltaVsPrev >= 0 ? '#dcfce7' : '#fee2e2',
                        color: row.deltaVsPrev >= 0 ? '#166534' : '#991b1b',
                      }}
                    >
                      {row.deltaVsPrev >= 0 ? '+' : ''}
                      {row.deltaVsPrev.toFixed(2)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>

                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--secondary)' }}>
                  {row.avgRate !== null ? `${row.avgRate.toFixed(2)} cm/d` : '-'}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="table-footer-row">
              <td>
                PROMEDIO ({turnoSegmentLabel} · {basisText}):
              </td>
              {weeks.map((w) => {
                const vals = filteredRows
                  .map((r) => r.ratesByWeek[w])
                  .filter((v): v is number => v !== null);
                const avg =
                  vals.length > 0
                    ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
                    : '-';
                return (
                  <td key={w} style={{ textAlign: 'right' }}>
                    {avg}
                  </td>
                );
              })}
              <td style={{ textAlign: 'right', color: '#64748b' }}>-</td>
              <td style={{ textAlign: 'right' }}>
                {(() => {
                  const allVals = filteredRows
                    .map((r) => r.avgRate)
                    .filter((v): v is number => v !== null);
                  if (allVals.length === 0) return '-';
                  return `${(allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(2)} cm/d`;
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Gráfico Comparativo */}
      <div className="chart-wrapper" style={{ height: '300px' }}>
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
};
