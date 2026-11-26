import React from 'react';
import type { GrowthRateBasis } from '../types/phenology';
import { formatDisplayDate, getDaysBetweenDates } from '../utils/calculations';

interface HeaderSectionProps {
  isEditMode: boolean;
  companyTitle: string;
  reportTitle: string;
  fundo: string;
  modulo: string;
  turno: string;
  valvula: string;
  variedad: string;
  semana: string;
  fechaEvaluacion: string;
  fechaAnterior: string;
  growthRateBasis: GrowthRateBasis;
  evaluador: string;
  activeWeek: string;
  weeks: string[];
  firestoreOnline: boolean;
  firestoreStatusText: string;
  onUpdateField: (
    field:
      | 'companyTitle'
      | 'reportTitle'
      | 'fundo'
      | 'modulo'
      | 'turno'
      | 'valvula'
      | 'variedad'
      | 'semana'
      | 'evaluador',
    value: string,
  ) => void;
  onUpdateFechaEvaluacion: (dateStr: string) => void;
  onUpdateFechaAnterior: (dateStr: string) => void;
  onUpdateGrowthRateBasis: (basis: GrowthRateBasis) => void;
  onChangeActiveWeek: (weekName: string) => void;
  onAddNewWeek: () => void;
  onOpenFirebaseConfig: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  isEditMode,
  companyTitle,
  reportTitle,
  fundo,
  modulo,
  turno,
  valvula,
  variedad,
  semana,
  fechaEvaluacion,
  fechaAnterior,
  growthRateBasis,
  evaluador,
  activeWeek,
  weeks,
  firestoreOnline,
  firestoreStatusText,
  onUpdateField,
  onUpdateFechaEvaluacion,
  onUpdateFechaAnterior,
  onUpdateGrowthRateBasis,
  onChangeActiveWeek,
  onAddNewWeek,
  onOpenFirebaseConfig,
}) => {
  const diasTranscurridos = getDaysBetweenDates(fechaAnterior, fechaEvaluacion);

  return (
    <section className="header-card" id="headerSection">
      <div className="header-top">
        <div>
          <div
            className="main-company-title"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="companyTitle"
            onBlur={(e) => onUpdateField('companyTitle', e.currentTarget.innerText.trim())}
          >
            {companyTitle}
          </div>
          <br />
          <div
            className="main-report-subtitle"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="reportTitle"
            onBlur={(e) => onUpdateField('reportTitle', e.currentTarget.innerText.trim())}
          >
            {reportTitle}
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
          <div>
            <i className="fa-regular fa-calendar-check" /> Evaluación:{' '}
            <span id="lblLastUpdate">{formatDisplayDate(fechaEvaluacion)}</span>
          </div>
          <div
            id="firestoreStatusBadge"
            style={{
              color: firestoreOnline ? '#059669' : '#ea580c',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              marginTop: '4px',
            }}
            onClick={onOpenFirebaseConfig}
            title="Clic para ver estado de Cloud Firestore"
          >
            <i className="fa-solid fa-fire" />{' '}
            <span id="firestoreStatusText">
              Cloud Firestore: <strong>{firestoreStatusText}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="week-control-bar">
        <label>
          <i className="fa-solid fa-calendar-week" /> Semana:
        </label>
        <select
          className="week-select"
          id="weekSelector"
          value={activeWeek}
          onChange={(e) => onChangeActiveWeek(e.target.value)}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        <button
          className="btn btn-sm btn-primary"
          onClick={onAddNewWeek}
          title="Registrar una nueva semana para ver la evolución en el gráfico"
        >
          <i className="fa-solid fa-plus" /> + Nueva Semana
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginLeft: '8px',
            paddingLeft: '10px',
            borderLeft: '1px solid #93c5fd',
          }}
        >
          <label style={{ fontSize: '0.78rem' }}>
            <i className="fa-regular fa-calendar" /> Fecha Anterior:
          </label>
          <input
            type="date"
            className="week-select"
            style={{ padding: '4px 8px', fontSize: '0.82rem' }}
            value={fechaAnterior}
            onChange={(e) => onUpdateFechaAnterior(e.target.value)}
          />

          <label style={{ fontSize: '0.78rem' }}>
            <i className="fa-solid fa-calendar-day" /> Fecha Evaluación:
          </label>
          <input
            type="date"
            className="week-select"
            style={{ padding: '4px 8px', fontSize: '0.82rem' }}
            value={fechaEvaluacion}
            onChange={(e) => onUpdateFechaEvaluacion(e.target.value)}
          />

          <span
            style={{
              background: diasTranscurridos > 0 ? '#dcfce7' : '#fef3c7',
              color: diasTranscurridos > 0 ? '#166534' : '#92400e',
              border: `1px solid ${diasTranscurridos > 0 ? '#86efac' : '#fde68a'}`,
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
            title="Días transcurridos entre la fecha anterior y la fecha de evaluación actual"
          >
            {diasTranscurridos} días entre eval.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.78rem' }}>
            <i className="fa-solid fa-bolt" /> Base Tasa:
          </label>
          <select
            className="week-select"
            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            value={growthRateBasis}
            onChange={(e) => onUpdateGrowthRateBasis(e.target.value as GrowthRateBasis)}
            title="Elige qué flujo usar para el cálculo principal de la Tasa de Crecimiento: (Prom. Actual - Prom. Anterior) / Días"
          >
            <option value="global">Global (3 Flujos)</option>
            <option value="flujo1">1er Flujo</option>
            <option value="flujo2">2do Flujo</option>
            <option value="flujo3">3er Flujo</option>
          </select>
        </div>
      </div>

      <div className="report-metadata-grid" id="metadataGrid">
        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-location-dot" /> Fundo
          </span>
          <div
            className="meta-value"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="metaFundo"
            onBlur={(e) => onUpdateField('fundo', e.currentTarget.innerText.trim())}
          >
            {fundo}
          </div>
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-cubes-stacked" /> N° Módulo
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            id="metaModulo"
            className="meta-value"
            style={{ background: 'transparent', width: '100%' }}
            placeholder="1"
            value={modulo}
            onChange={(e) => onUpdateField('modulo', e.target.value.replace(/\D+/g, ''))}
            title="Ingresa solo el número de módulo"
          />
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-sliders" /> N° Turno
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            id="metaTurno"
            className="meta-value"
            style={{ background: 'transparent', width: '100%' }}
            placeholder="1"
            value={turno}
            onChange={(e) => onUpdateField('turno', e.target.value.replace(/\D+/g, ''))}
            title="Ingresa solo el número de turno"
          />
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-faucet-drip" /> N° Válvula
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            id="metaValvula"
            className="meta-value"
            style={{ background: 'transparent', width: '100%' }}
            placeholder="01"
            value={valvula}
            onChange={(e) => onUpdateField('valvula', e.target.value.replace(/\D+/g, ''))}
            title="Ingresa solo el número de válvula"
          />
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-leaf" /> Variedad
          </span>
          <input
            type="text"
            id="metaVariedad"
            className="meta-value"
            style={{ background: 'transparent', width: '100%' }}
            placeholder="Ventura"
            value={variedad}
            onChange={(e) => onUpdateField('variedad', e.target.value)}
            title="Variedad sincronizada con la válvula activa"
          />
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-calendar-days" /> Semana
          </span>
          <div
            className="meta-value"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="metaSemana"
            onBlur={(e) =>
              onUpdateField(
                'semana',
                e.currentTarget.innerText.replace(/^\s*semana\s+/i, '').trim(),
              )
            }
          >
            {semana}
          </div>
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-calendar-check" /> Fecha de Evaluación
          </span>
          <input
            type="date"
            id="metaFechaEvaluacion"
            className="meta-value"
            style={{ background: 'transparent', cursor: 'pointer' }}
            value={fechaEvaluacion}
            onChange={(e) => onUpdateFechaEvaluacion(e.target.value)}
          />
        </div>

        <div className="meta-item">
          <span className="meta-label">
            <i className="fa-solid fa-user-check" /> Evaluador(a)
          </span>
          <div
            className="meta-value"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="metaEvaluador"
            onBlur={(e) => onUpdateField('evaluador', e.currentTarget.innerText.trim())}
          >
            {evaluador}
          </div>
        </div>
      </div>
    </section>
  );
};
