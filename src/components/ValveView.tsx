import React from 'react';
import { createDefaultShoots } from '../data/defaults';
import type {
  FlushKey,
  GrowthRateBasis,
  MasterCatalogItem,
  NumericInput,
  PlantData,
  ValveData,
  WeeklyModuleData,
} from '../types/phenology';
import {
  getDaysBetweenDates,
  getShootsAvg,
  resolvePlantPreviousLengths,
  resolveValveTurno,
  toNumericValue,
} from '../utils/calculations';

interface ValveViewProps {
  valvesData: ValveData[];
  masterCatalog: MasterCatalogItem[];
  currentValveIndex: number;
  selectedModuleFilter: string;
  isEditMode: boolean;
  weeklyModuleData: WeeklyModuleData;
  activeWeek: string;
  fechaEvaluacion: string;
  fechaAnterior: string;
  growthRateBasis: GrowthRateBasis;
  onFilterByModule: (mod: string) => void;
  onSelectValve: (idx: number) => void;
  onAddNewValve: () => void;
  onDeleteValve: (idx: number) => void;
  onUpdateValveMeta: (
    vIdx: number,
    field: 'modulo' | 'turno' | 'nombre' | 'variedad',
    value: string,
  ) => void;
  onAddPlantToValve: () => void;
  onDeletePlantFromValve: (pIdx: number) => void;
  onUpdatePlantField: <K extends keyof PlantData>(
    pIdx: number,
    field: K,
    value: PlantData[K],
  ) => void;
  onUpdateShootValue: (
    pIdx: number,
    flushKey: FlushKey,
    bIdx: number,
    prop: 'longitud' | 'diametro',
    value: NumericInput,
  ) => void;
  onSubmitAndNextValve: () => void;
  onResetCurrentValveToZero: () => void;
  isSubmittingValve?: boolean;
  lastSubmissionNotice?: string | null;
  onDismissSubmissionNotice?: () => void;
}

export const ValveView: React.FC<ValveViewProps> = ({
  valvesData,
  masterCatalog,
  currentValveIndex,
  selectedModuleFilter,
  isEditMode,
  weeklyModuleData,
  activeWeek,
  fechaEvaluacion,
  fechaAnterior,
  growthRateBasis,
  onFilterByModule,
  onSelectValve,
  onAddNewValve,
  onDeleteValve,
  onUpdateValveMeta,
  onAddPlantToValve,
  onDeletePlantFromValve,
  onUpdatePlantField,
  onUpdateShootValue,
  onSubmitAndNextValve,
  onResetCurrentValveToZero,
  isSubmittingValve = false,
  lastSubmissionNotice = null,
  onDismissSubmissionNotice,
}) => {
  const modules = Array.from(new Set(valvesData.map((v) => v.modulo || '1')));
  const currentValve = valvesData[currentValveIndex];
  const diasTranscurridos = getDaysBetweenDates(fechaAnterior, fechaEvaluacion);
  const submittedCount = valvesData.filter((v) => Boolean(v.submittedAt)).length;

  const formatSubmittedTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const dt = new Date(iso);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const parseIntInput = (raw: string): NumericInput => {
    if (raw === '') return '';
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? '' : n;
  };

  const parseDecimalInput = (raw: string): NumericInput => {
    if (raw === '') return '';
    const n = parseFloat(raw);
    return Number.isNaN(n) ? '' : n;
  };

  return (
    <section id="viewValveSection">
      <div className="module-filter-bar">
        <div className="filter-item">
          <label>
            <i className="fa-solid fa-filter" /> Filtrar Módulo / Turno:
          </label>
          <select
            className="filter-select"
            id="selectModuleFilter"
            value={selectedModuleFilter}
            onChange={(e) => onFilterByModule(e.target.value)}
          >
            <option value="ALL">Todos los Módulos</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                Módulo {m}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {submittedCount > 0 && (
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
                padding: '2px 9px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              <i className="fa-solid fa-circle-check" /> {submittedCount} de {valvesData.length} enviadas
            </span>
          )}
          <span>Cada válvula registra 3 plantas y sus 3 flujos (5 brotes cada uno).</span>
        </div>
      </div>

      {lastSubmissionNotice && (
        <div
          style={{
            marginBottom: '12px',
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#065f46',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <span>
            <i className="fa-solid fa-circle-check" style={{ color: '#059669', marginRight: '6px' }} />
            {lastSubmissionNotice}
          </span>
          {onDismissSubmissionNotice && (
            <button
              onClick={onDismissSubmissionNotice}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#065f46',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 800,
              }}
              title="Cerrar aviso"
            >
              &times;
            </button>
          )}
        </div>
      )}

      <div className="valve-tabs-bar" id="valveTabsBar">
        {valvesData.map((valve, idx) => {
          if (selectedModuleFilter !== 'ALL' && valve.modulo !== selectedModuleFilter) {
            return null;
          }
          return (
            <div
              key={valve.id + '-' + idx}
              className={`valve-tab ${idx === currentValveIndex ? 'active' : ''}`}
              onClick={() => onSelectValve(idx)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="fa-solid fa-faucet-drip" /> Válvula {valve.nombre}
                {valve.submittedAt && (
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ color: '#059669', fontSize: '0.8rem' }}
                    title="Datos enviados"
                  />
                )}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  background: '#f1f5f9',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  color: '#475569',
                }}
              >
                Mód. {valve.modulo} · Turno {resolveValveTurno(valve, masterCatalog)}
              </span>
              <span
                className="valve-tab-del"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteValve(idx);
                }}
                title="Eliminar válvula"
              >
                &times;
              </span>
            </div>
          );
        })}

        <button
          className="btn btn-sm btn-secondary"
          style={{ whiteSpace: 'nowrap' }}
          onClick={onAddNewValve}
        >
          <i className="fa-solid fa-plus" /> Nueva Válvula
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h3
          style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)' }}
          id="currentValveHeader"
        >
          <i className="fa-solid fa-faucet-drip" style={{ color: 'var(--primary)' }} />{' '}
          {currentValve
            ? `Válvula ${currentValve.nombre} (Módulo ${currentValve.modulo} · Turno ${resolveValveTurno(currentValve, masterCatalog)}) - Variedad: ${currentValve.variedad} - ${currentValve.plantas.length} Plantas`
            : 'Sin válvula seleccionada'}
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {currentValve && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Módulo:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-input"
                  style={{ width: '58px', padding: '4px 6px', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}
                  value={currentValve.modulo}
                  onChange={(e) =>
                    onUpdateValveMeta(
                      currentValveIndex,
                      'modulo',
                      e.target.value.replace(/\D+/g, ''),
                    )
                  }
                  title="Número de módulo (sincronizado con la cabecera)"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Turno:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-input"
                  style={{ width: '58px', padding: '4px 6px', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}
                  value={
                    currentValve.turno !== undefined
                      ? currentValve.turno
                      : resolveValveTurno(currentValve, masterCatalog)
                  }
                  onChange={(e) =>
                    onUpdateValveMeta(
                      currentValveIndex,
                      'turno',
                      e.target.value.replace(/\D+/g, ''),
                    )
                  }
                  title="Número de turno (sincronizado con la cabecera)"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  N° Válv:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-input"
                  style={{ width: '62px', padding: '4px 6px', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}
                  value={currentValve.nombre}
                  onChange={(e) =>
                    onUpdateValveMeta(
                      currentValveIndex,
                      'nombre',
                      e.target.value.replace(/\D+/g, ''),
                    )
                  }
                  title="Número de válvula (sincronizado con la cabecera)"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Variedad:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '110px', padding: '4px 8px', fontSize: '0.82rem', fontWeight: 700 }}
                  value={currentValve.variedad}
                  onChange={(e) =>
                    onUpdateValveMeta(currentValveIndex, 'variedad', e.target.value)
                  }
                  title="Variedad de la válvula actual (sincronizada con la cabecera)"
                />
              </div>
            </>
          )}
          {currentValve?.submittedAt && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
              title="Los datos de esta válvula ya fueron guardados y enviados"
            >
              <i className="fa-solid fa-circle-check" /> Datos enviados{' '}
              {formatSubmittedTime(currentValve.submittedAt)
                ? `(${formatSubmittedTime(currentValve.submittedAt)})`
                : ''}
            </span>
          )}
          <button className="btn btn-sm btn-secondary" onClick={onAddPlantToValve}>
            <i className="fa-solid fa-plus" /> Agregar Planta a esta Válvula
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={onResetCurrentValveToZero}
            title="Dejar vacíos todos los espacios de esta válvula"
          >
            <i className="fa-solid fa-eraser" /> Vaciar Ficha
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onDeleteValve(currentValveIndex)}
          >
            <i className="fa-solid fa-trash" /> Eliminar Válvula
          </button>
        </div>
      </div>

      <div className="plants-valve-grid" id="plantsContainer">
        {currentValve?.plantas.map((plant, pIdx) => {
          const flujo2 = plant.flujo2 || createDefaultShoots(25.0, 4.5);
          const f1LongAvg = getShootsAvg(plant.flujo1, 'longitud');
          const f1DiamAvg = getShootsAvg(plant.flujo1, 'diametro');
          const f2LongAvg = getShootsAvg(flujo2, 'longitud');
          const f2DiamAvg = getShootsAvg(flujo2, 'diametro');
          const f3LongAvg = getShootsAvg(plant.flujo3, 'longitud');
          const f3DiamAvg = getShootsAvg(plant.flujo3, 'diametro');

          const plantLongAvg = +((f1LongAvg + f2LongAvg + f3LongAvg) / 3).toFixed(1);
          const { prevF1, prevF2, prevF3, prevProm } = resolvePlantPreviousLengths(
            plant,
            currentValve.modulo || 'Módulo 1',
            f1LongAvg,
            f2LongAvg,
            f3LongAvg,
            weeklyModuleData,
            activeWeek,
          );

          const effectiveDays = diasTranscurridos > 0 ? diasTranscurridos : plant.dias || 0;
          const tasaF1 = effectiveDays > 0 ? +((f1LongAvg - prevF1) / effectiveDays).toFixed(2) : 0;
          const tasaF2 = effectiveDays > 0 ? +((f2LongAvg - prevF2) / effectiveDays).toFixed(2) : 0;
          const tasaF3 = effectiveDays > 0 ? +((f3LongAvg - prevF3) / effectiveDays).toFixed(2) : 0;
          const tasaGlobal =
            effectiveDays > 0 ? +((plantLongAvg - prevProm) / effectiveDays).toFixed(2) : 0;

          let tasaCrec = tasaGlobal;
          if (growthRateBasis === 'flujo1') tasaCrec = tasaF1;
          else if (growthRateBasis === 'flujo2') tasaCrec = tasaF2;
          else if (growthRateBasis === 'flujo3') tasaCrec = tasaF3;

          const totalBrotes =
            (plant.cant_flujo1 !== undefined ? toNumericValue(plant.cant_flujo1, 0) : 5) +
            (plant.cant_flujo2 !== undefined ? toNumericValue(plant.cant_flujo2, 0) : 5) +
            (plant.cant_flujo3 !== undefined ? toNumericValue(plant.cant_flujo3, 0) : 5);

          const displayPrevF1 =
            plant.prev_long_f1 !== undefined ? plant.prev_long_f1 : prevF1 === 0 ? '' : prevF1;
          const displayPrevF2 =
            plant.prev_long_f2 !== undefined ? plant.prev_long_f2 : prevF2 === 0 ? '' : prevF2;
          const displayPrevF3 =
            plant.prev_long_f3 !== undefined ? plant.prev_long_f3 : prevF3 === 0 ? '' : prevF3;

          return (
            <div key={plant.id + '-' + pIdx} className="plant-evaluation-card">
              <div className="plant-card-header">
                <div className="plant-badge-title">
                  <i className="fa-solid fa-tree" style={{ color: 'var(--secondary)' }} />
                  <span
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onUpdatePlantField(pIdx, 'nombre', e.currentTarget.innerText.trim())
                    }
                  >
                    {plant.nombre}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    Mód. {currentValve.modulo} | Turno {resolveValveTurno(currentValve, masterCatalog)} | Válv. {currentValve.nombre}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                    }}
                    title="Suma total de brotes de 1er, 2do y 3er flujo en la planta"
                  >
                    <i className="fa-solid fa-leaf" /> Total Brotes: <b>{totalBrotes}</b>
                  </span>
                  <span
                    style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}
                    title={`Fórmula: (Long. Actual - Long. Anterior) / ${effectiveDays} días`}
                  >
                    Tasa: <b>{tasaCrec}</b> cm/d
                  </span>
                  <button
                    className="action-icon-btn"
                    onClick={() => onDeletePlantFromValve(pIdx)}
                    title="Eliminar planta"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }} /> Estados
                de los Brotes en la Planta:
              </div>

              <div className="parameters-subgrid">
                <div className="param-box">
                  <span className="param-label">
                    <i className="fa-solid fa-sun" style={{ color: '#e11d48' }} /> Con Inducción
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="param-input"
                    value={plant.induccion}
                    onChange={(e) =>
                      onUpdatePlantField(pIdx, 'induccion', parseIntInput(e.target.value))
                    }
                  />
                </div>
                <div className="param-box">
                  <span className="param-label">
                    <i className="fa-solid fa-moon" style={{ color: '#0891b2' }} /> Inactivos
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="param-input"
                    value={plant.inactivos}
                    onChange={(e) =>
                      onUpdatePlantField(pIdx, 'inactivos', parseIntInput(e.target.value))
                    }
                  />
                </div>
                <div className="param-box">
                  <span className="param-label">
                    <i className="fa-solid fa-arrow-trend-up" style={{ color: '#059669' }} />{' '}
                    Vigorosos
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="param-input"
                    value={plant.vigorosos}
                    onChange={(e) =>
                      onUpdatePlantField(pIdx, 'vigorosos', parseIntInput(e.target.value))
                    }
                  />
                </div>
                <div className="param-box">
                  <span className="param-label">
                    <i className="fa-solid fa-arrow-trend-down" style={{ color: '#d97706' }} /> No
                    Vigorosos
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="param-input"
                    value={plant.no_vigorosos}
                    onChange={(e) =>
                      onUpdatePlantField(pIdx, 'no_vigorosos', parseIntInput(e.target.value))
                    }
                  />
                </div>
                <div className="param-box">
                  <span className="param-label">
                    <i className="fa-solid fa-seedling" style={{ color: '#7c3aed' }} /> Basales
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="param-input"
                    value={plant.basales}
                    onChange={(e) =>
                      onUpdatePlantField(pIdx, 'basales', parseIntInput(e.target.value))
                    }
                  />
                </div>
                <div className="param-box">
                  <span className="param-label">
                    <i className="fa-solid fa-spa" style={{ color: '#2563eb' }} /> Retoños
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="param-input"
                    value={plant.retonos}
                    onChange={(e) =>
                      onUpdatePlantField(pIdx, 'retonos', parseIntInput(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* 1er FLUJO */}
              <div className="flush-section-box flush-box-1">
                <div
                  className="flush-header"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div className="flush-title">
                    <i className="fa-solid fa-layer-group" /> 1er Flujo (5 Brotes Evaluados)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>
                      Total Brotes:
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="param-input"
                      style={{
                        width: '58px',
                        height: '26px',
                        padding: '2px 4px',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: '#ffffff',
                      }}
                      value={plant.cant_flujo1 !== undefined ? plant.cant_flujo1 : 5}
                      onChange={(e) =>
                        onUpdatePlantField(pIdx, 'cant_flujo1', parseIntInput(e.target.value))
                      }
                      title="Cantidad total de brotes del 1er flujo en esta planta"
                    />
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af' }}>
                      Long. Ant:
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className="param-input"
                      style={{
                        width: '62px',
                        height: '26px',
                        padding: '2px 4px',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: '#ffffff',
                      }}
                      value={displayPrevF1}
                      onChange={(e) =>
                        onUpdatePlantField(pIdx, 'prev_long_f1', parseDecimalInput(e.target.value))
                      }
                      title="Longitud promedio del 1er flujo en la fecha anterior (cm)"
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#1e40af',
                        fontWeight: 700,
                        borderLeft: '1px solid #93c5fd',
                        paddingLeft: '8px',
                      }}
                    >
                      Prom: {f1LongAvg} cm | {f1DiamAvg} mm | Tasa: {tasaF1} cm/d
                    </span>
                  </div>
                </div>

                <table className="shoots-mini-table">
                  <thead>
                    <tr>
                      <th>Brote</th>
                      <th>Longitud (cm)</th>
                      <th>Diámetro (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plant.flujo1.map((b, bIdx) => (
                      <tr key={b.num}>
                        <td>
                          <b>Brote {b.num}</b>
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="shoot-input"
                            value={b.longitud}
                            onChange={(e) =>
                              onUpdateShootValue(
                                pIdx,
                                'flujo1',
                                bIdx,
                                'longitud',
                                parseDecimalInput(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="shoot-input"
                            value={b.diametro}
                            onChange={(e) =>
                              onUpdateShootValue(
                                pIdx,
                                'flujo1',
                                bIdx,
                                'diametro',
                                parseDecimalInput(e.target.value),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2do FLUJO */}
              <div className="flush-section-box flush-box-2">
                <div
                  className="flush-header"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div className="flush-title">
                    <i className="fa-solid fa-layer-group" /> 2do Flujo (5 Brotes Evaluados)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>
                      Total Brotes:
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="param-input"
                      style={{
                        width: '58px',
                        height: '26px',
                        padding: '2px 4px',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: '#ffffff',
                      }}
                      value={plant.cant_flujo2 !== undefined ? plant.cant_flujo2 : 5}
                      onChange={(e) =>
                        onUpdatePlantField(pIdx, 'cant_flujo2', parseIntInput(e.target.value))
                      }
                      title="Cantidad total de brotes del 2do flujo en esta planta"
                    />
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857' }}>
                      Long. Ant:
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className="param-input"
                      style={{
                        width: '62px',
                        height: '26px',
                        padding: '2px 4px',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: '#ffffff',
                      }}
                      value={displayPrevF2}
                      onChange={(e) =>
                        onUpdatePlantField(pIdx, 'prev_long_f2', parseDecimalInput(e.target.value))
                      }
                      title="Longitud promedio del 2do flujo en la fecha anterior (cm)"
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#047857',
                        fontWeight: 700,
                        borderLeft: '1px solid #6ee7b7',
                        paddingLeft: '8px',
                      }}
                    >
                      Prom: {f2LongAvg} cm | {f2DiamAvg} mm | Tasa: {tasaF2} cm/d
                    </span>
                  </div>
                </div>

                <table className="shoots-mini-table">
                  <thead>
                    <tr>
                      <th>Brote</th>
                      <th>Longitud (cm)</th>
                      <th>Diámetro (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flujo2.map((b, bIdx) => (
                      <tr key={b.num}>
                        <td>
                          <b>Brote {b.num}</b>
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="shoot-input"
                            value={b.longitud}
                            onChange={(e) =>
                              onUpdateShootValue(
                                pIdx,
                                'flujo2',
                                bIdx,
                                'longitud',
                                parseDecimalInput(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="shoot-input"
                            value={b.diametro}
                            onChange={(e) =>
                              onUpdateShootValue(
                                pIdx,
                                'flujo2',
                                bIdx,
                                'diametro',
                                parseDecimalInput(e.target.value),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 3er FLUJO */}
              <div className="flush-section-box flush-box-3">
                <div
                  className="flush-header"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div className="flush-title">
                    <i className="fa-solid fa-layer-group" /> 3er Flujo (5 Brotes Evaluados)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5b21b6' }}>
                      Total Brotes:
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="param-input"
                      style={{
                        width: '58px',
                        height: '26px',
                        padding: '2px 4px',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: '#ffffff',
                      }}
                      value={plant.cant_flujo3 !== undefined ? plant.cant_flujo3 : 5}
                      onChange={(e) =>
                        onUpdatePlantField(pIdx, 'cant_flujo3', parseIntInput(e.target.value))
                      }
                      title="Cantidad total de brotes del 3er flujo en esta planta"
                    />
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5b21b6' }}>
                      Long. Ant:
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      className="param-input"
                      style={{
                        width: '62px',
                        height: '26px',
                        padding: '2px 4px',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: '#ffffff',
                      }}
                      value={displayPrevF3}
                      onChange={(e) =>
                        onUpdatePlantField(pIdx, 'prev_long_f3', parseDecimalInput(e.target.value))
                      }
                      title="Longitud promedio del 3er flujo en la fecha anterior (cm)"
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#5b21b6',
                        fontWeight: 700,
                        borderLeft: '1px solid #c4b5fd',
                        paddingLeft: '8px',
                      }}
                    >
                      Prom: {f3LongAvg} cm | {f3DiamAvg} mm | Tasa: {tasaF3} cm/d
                    </span>
                  </div>
                </div>

                <table className="shoots-mini-table">
                  <thead>
                    <tr>
                      <th>Brote</th>
                      <th>Longitud (cm)</th>
                      <th>Diámetro (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plant.flujo3.map((b, bIdx) => (
                      <tr key={b.num}>
                        <td>
                          <b>Brote {b.num}</b>
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="shoot-input"
                            value={b.longitud}
                            onChange={(e) =>
                              onUpdateShootValue(
                                pIdx,
                                'flujo3',
                                bIdx,
                                'longitud',
                                parseDecimalInput(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="shoot-input"
                            value={b.diametro}
                            onChange={(e) =>
                              onUpdateShootValue(
                                pIdx,
                                'flujo3',
                                bIdx,
                                'diametro',
                                parseDecimalInput(e.target.value),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  className="cell-input"
                  placeholder="Observaciones de la planta..."
                  value={plant.observaciones || ''}
                  onChange={(e) => onUpdatePlantField(pIdx, 'observaciones', e.target.value)}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {currentValve && (
        <div
          style={{
            marginTop: '18px',
            background: currentValve.submittedAt ? '#f0fdf4' : '#ffffff',
            border: `1.5px solid ${currentValve.submittedAt ? '#86efac' : '#cbd5e1'}`,
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {currentValve.submittedAt ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#16a34a',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                }}
              >
                <i className="fa-solid fa-circle-check" /> Datos enviados{' '}
                {formatSubmittedTime(currentValve.submittedAt)
                  ? `· ${formatSubmittedTime(currentValve.submittedAt)}`
                  : ''}
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <i className="fa-solid fa-clipboard-check" /> Válvula {currentValve.nombre} lista para enviar
              </span>
            )}
            <span style={{ fontSize: '0.82rem', color: '#475569' }}>
              Al enviar, se guarda esta válvula en la nube y se abre la siguiente ficha con los{' '}
              <strong>espacios vacíos</strong> para llenar rápido en celular.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={onResetCurrentValveToZero}
              title="Dejar vacíos todos los espacios de la válvula actual"
            >
              <i className="fa-solid fa-eraser" /> Vaciar esta Ficha
            </button>
            <button
              className="btn btn-success"
              onClick={onSubmitAndNextValve}
              disabled={isSubmittingValve}
              style={{ fontWeight: 800, padding: '10px 18px' }}
            >
              <i className="fa-solid fa-paper-plane" />{' '}
              {isSubmittingValve
                ? 'Enviando...'
                : 'Datos Enviados → Siguiente Válvula (Vacía)'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
