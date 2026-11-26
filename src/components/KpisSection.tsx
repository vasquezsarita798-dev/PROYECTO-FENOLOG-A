import React, { useEffect, useMemo, useState } from 'react';
import type {
  GrowthRateBasis,
  KpiCard,
  MasterCatalogItem,
  ValveData,
  WeeklyModuleData,
  WeeklyTurnoData,
} from '../types/phenology';
import { computeSegmentedKpis } from '../utils/calculations';

interface KpisSectionProps {
  kpis: KpiCard[];
  valvesData: ValveData[];
  masterCatalog: MasterCatalogItem[];
  weeklyModuleData: WeeklyModuleData;
  weeklyTurnoData: WeeklyTurnoData;
  weeklyDates: Record<string, string>;
  activeWeek: string;
  fechaEvaluacion: string;
  fechaAnterior: string;
  growthRateBasis: GrowthRateBasis;
  titleKpis: string;
  isEditMode: boolean;
  onUpdateTitleKpis: (title: string) => void;
  onOpenNewMetric: () => void;
  onUpdateKpiField: (
    idx: number,
    field: 'title' | 'value' | 'unit' | 'desc',
    value: string,
  ) => void;
  onRemoveKpi: (id: string) => void;
}

export const KpisSection: React.FC<KpisSectionProps> = ({
  kpis,
  valvesData,
  masterCatalog,
  weeklyModuleData,
  weeklyTurnoData,
  weeklyDates,
  activeWeek,
  fechaEvaluacion,
  fechaAnterior,
  growthRateBasis,
  titleKpis,
  isEditMode,
  onUpdateTitleKpis,
  onOpenNewMetric,
  onUpdateKpiField,
  onRemoveKpi,
}) => {
  const [filterWeek, setFilterWeek] = useState<string>(activeWeek);
  const [filterModulo, setFilterModulo] = useState<string>('ALL');
  const [filterTurno, setFilterTurno] = useState<string>('ALL');

  useEffect(() => {
    setFilterWeek(activeWeek);
  }, [activeWeek]);

  const segmented = useMemo(
    () =>
      computeSegmentedKpis({
        kpis,
        valvesData,
        masterCatalog,
        weeklyModuleData,
        weeklyTurnoData,
        weeklyDates,
        activeWeek,
        fechaEvaluacion,
        fechaAnterior,
        growthRateBasis,
        filterWeek,
        filterModulo,
        filterTurno,
      }),
    [
      kpis,
      valvesData,
      masterCatalog,
      weeklyModuleData,
      weeklyTurnoData,
      weeklyDates,
      activeWeek,
      fechaEvaluacion,
      fechaAnterior,
      growthRateBasis,
      filterWeek,
      filterModulo,
      filterTurno,
    ],
  );

  useEffect(() => {
    if (filterModulo !== 'ALL' && !segmented.availableModules.includes(filterModulo)) {
      setFilterModulo('ALL');
    }
  }, [segmented.availableModules, filterModulo]);

  useEffect(() => {
    if (filterTurno !== 'ALL' && !segmented.availableTurnos.includes(filterTurno)) {
      setFilterTurno('ALL');
    }
  }, [segmented.availableTurnos, filterTurno]);

  const isCustomFiltered =
    filterWeek !== activeWeek || filterModulo !== 'ALL' || filterTurno !== 'ALL';

  const contextDetail =
    segmented.sourceType === 'sin_datos'
      ? 'Sin muestras para la combinación seleccionada'
      : segmented.sourceType === 'plantas'
        ? `${segmented.sampleCount} ${segmented.sampleCount === 1 ? 'planta evaluada' : 'plantas evaluadas'}`
        : segmented.sourceType === 'turno_historico'
          ? `Histórico por turno (${segmented.sampleCount} ${segmented.sampleCount === 1 ? 'módulo' : 'módulos'})`
          : `Histórico semanal (${segmented.sampleCount} ${segmented.sampleCount === 1 ? 'módulo' : 'módulos'})`;

  return (
    <section id="sectionKPIs" style={{ marginTop: '24px' }}>
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div className="section-title-wrap">
          <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>
            <i className="fa-solid fa-chart-simple" />
          </span>
          <h2
            className="section-title"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="titleKpis"
            onBlur={(e) => onUpdateTitleKpis(e.currentTarget.innerText.trim())}
          >
            {titleKpis}
          </h2>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={onOpenNewMetric}>
          <i className="fa-solid fa-plus" /> + Métrica
        </button>
      </div>

      {/* Segmentadores de Módulo, Turno y Semana */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          {/* Segmentador de Módulo */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                marginRight: '2px',
              }}
            >
              <i className="fa-solid fa-cubes" /> Módulo:
            </span>
            <button
              className={`chart-pill-btn ${filterModulo === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterModulo('ALL')}
            >
              Todos
            </button>
            {segmented.availableModules.map((m) => (
              <button
                key={m}
                className={`chart-pill-btn ${filterModulo === m ? 'active' : ''}`}
                onClick={() => setFilterModulo(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Segmentador de Turno */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                marginRight: '2px',
              }}
            >
              <i className="fa-solid fa-sliders" /> Turno:
            </span>
            <button
              className={`chart-pill-btn ${filterTurno === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTurno('ALL')}
            >
              Todos
            </button>
            {segmented.availableTurnos.map((t) => (
              <button
                key={t}
                className={`chart-pill-btn ${filterTurno === t ? 'active' : ''}`}
                onClick={() => setFilterTurno(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            paddingTop: '8px',
            borderTop: '1px dashed #e2e8f0',
          }}
        >
          {/* Segmentador de Semana */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                marginRight: '2px',
              }}
            >
              <i className="fa-regular fa-calendar-days" /> Semana:
            </span>
            {segmented.weeks.map((w) => (
              <button
                key={w}
                className={`chart-pill-btn ${filterWeek === w ? 'active' : ''}`}
                onClick={() => setFilterWeek(w)}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Indicador de ámbito filtrado + botón Restablecer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#1e40af',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '4px 10px',
              }}
            >
              Sem. {filterWeek} ·{' '}
              {filterModulo === 'ALL' ? 'Todos los Módulos' : `Módulo ${filterModulo}`} ·{' '}
              {filterTurno === 'ALL' ? 'Todos los Turnos' : `Turno ${filterTurno}`} (
              {contextDetail})
            </span>

            {isCustomFiltered && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setFilterWeek(activeWeek);
                  setFilterModulo('ALL');
                  setFilterTurno('ALL');
                }}
                title="Restablecer segmentadores del resumen ejecutivo"
              >
                <i className="fa-solid fa-rotate-left" /> Restablecer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="metrics-grid" id="metricsContainer">
        {segmented.kpis.map((kpi, idx) => (
          <div key={kpi.id} className="metric-card" id={kpi.id}>
            <div className="card-actions">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onRemoveKpi(kpi.id)}
                title="Quitar métrica"
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>

            <div className="metric-top">
              <div
                className="metric-title"
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateKpiField(idx, 'title', e.currentTarget.innerText.trim())}
              >
                {kpi.title}
              </div>
              <div className={`metric-icon-wrap ${kpi.color}`}>
                <i className={`fa-solid ${kpi.icon}`} />
              </div>
            </div>

            <div className="metric-value-box">
              <span
                className="metric-value"
                id={`val-${kpi.id}`}
                contentEditable={!kpi.boundKey && isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateKpiField(idx, 'value', e.currentTarget.innerText.trim())}
              >
                {kpi.value}
              </span>
              <span
                className="metric-unit"
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateKpiField(idx, 'unit', e.currentTarget.innerText.trim())}
              >
                {kpi.unit}
              </span>
            </div>

            <div
              className="metric-desc"
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateKpiField(idx, 'desc', e.currentTarget.innerText.trim())}
            >
              {kpi.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
