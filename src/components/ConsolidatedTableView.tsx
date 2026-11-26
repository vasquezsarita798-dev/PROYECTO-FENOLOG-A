import React, { useMemo, useState } from 'react';
import type {
  GrowthRateBasis,
  TableColumn,
  ValveData,
  WeeklyModuleData,
} from '../types/phenology';
import { getFlattenedPlantRows } from '../utils/calculations';

interface ConsolidatedTableViewProps {
  valvesData: ValveData[];
  currentColumns: TableColumn[];
  weeklyModuleData: WeeklyModuleData;
  activeWeek: string;
  fechaEvaluacion: string;
  fechaAnterior: string;
  growthRateBasis: GrowthRateBasis;
  titleTable: string;
  isEditMode: boolean;
  onUpdateTitleTable: (title: string) => void;
  onAddNewValve: () => void;
  onOpenNewColumn: () => void;
  onDeleteColumn: (colId: string) => void;
  onUpdateColumnTitle: (colId: string, newTitle: string) => void;
  onUpdateFlatCell: (vIdx: number, pIdx: number, colId: string, value: string) => void;
  onOpenPlantDetail: (vIdx: number) => void;
}

export const ConsolidatedTableView: React.FC<ConsolidatedTableViewProps> = ({
  valvesData,
  currentColumns,
  weeklyModuleData,
  activeWeek,
  fechaEvaluacion,
  fechaAnterior,
  growthRateBasis,
  titleTable,
  isEditMode,
  onUpdateTitleTable,
  onAddNewValve,
  onOpenNewColumn,
  onDeleteColumn,
  onUpdateColumnTitle,
  onUpdateFlatCell,
  onOpenPlantDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const flatRows = useMemo(
    () =>
      getFlattenedPlantRows(valvesData, {
        weeklyModuleData,
        activeWeek,
        fechaEvaluacion,
        fechaAnterior,
        growthRateBasis,
      }),
    [valvesData, weeklyModuleData, activeWeek, fechaEvaluacion, fechaAnterior, growthRateBasis],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return flatRows;
    return flatRows.filter((row) =>
      currentColumns.some((col) =>
        String(row[col.id] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [flatRows, searchQuery, currentColumns]);

  return (
    <section className="table-container-card" id="viewTableSection">
      <div className="table-controls">
        <div className="section-title-wrap">
          <span style={{ color: 'var(--secondary)', fontSize: '1.3rem' }}>
            <i className="fa-solid fa-table" />
          </span>
          <h2
            className="section-title"
            contentEditable={isEditMode}
            suppressContentEditableWarning
            id="titleTable"
            onBlur={(e) => onUpdateTitleTable(e.currentTarget.innerText.trim())}
          >
            {titleTable}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" style={{ color: '#94a3b8' }} />
            <input
              type="text"
              id="tblSearch"
              placeholder="Filtrar por módulo, válvula, variedad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-sm btn-primary" onClick={onAddNewValve}>
            <i className="fa-solid fa-plus" /> + Válvula
          </button>
          <button className="btn btn-sm btn-secondary" onClick={onOpenNewColumn}>
            <i className="fa-solid fa-table-columns" /> + Columna
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table id="phenologyTable">
          <thead>
            <tr id="tableHeaderRow">
              {currentColumns.map((col) => (
                <th key={col.id} data-col-id={col.id}>
                  <div className="th-content">
                    <span
                      className="th-title"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        onUpdateColumnTitle(col.id, e.currentTarget.innerText.trim())
                      }
                    >
                      {col.title}
                    </span>
                    {col.deletable && (
                      <span
                        className="th-delete-col"
                        onClick={() => onDeleteColumn(col.id)}
                        title="Eliminar columna"
                      >
                        &times;
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ width: '75px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>

          <tbody id="tableBody">
            {filteredRows.map((row) => (
              <tr key={`${row.vIdx}-${row.pIdx}`}>
                {currentColumns.map((col) => {
                  const val = row[col.id] !== undefined ? row[col.id] : '';
                  const isNum = col.type === 'number';
                  return (
                    <td key={col.id}>
                      <input
                        type={isNum ? 'number' : 'text'}
                        step="any"
                        className={`cell-input ${isNum ? 'number' : ''}`}
                        value={val}
                        onChange={(e) =>
                          onUpdateFlatCell(row.vIdx, row.pIdx, col.id, e.target.value)
                        }
                      />
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center' }}>
                  <div className="row-actions">
                    <button
                      className="action-icon-btn"
                      onClick={() => onOpenPlantDetail(row.vIdx)}
                      title="Ver en ficha de válvula"
                    >
                      <i className="fa-solid fa-up-right-from-square" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot id="tableFoot">
            <tr className="table-footer-row" id="summaryRow">
              {currentColumns.map((col, idx) => {
                if (idx === 0) {
                  return (
                    <td key={col.id} style={{ fontWeight: 800 }}>
                      PROMEDIO:
                    </td>
                  );
                }
                if (col.calcAvg && flatRows.length > 0) {
                  let sum = 0;
                  flatRows.forEach((r) => {
                    sum += parseFloat(String(r[col.id])) || 0;
                  });
                  const avg = sum / flatRows.length;
                  return (
                    <td key={col.id} style={{ textAlign: 'right' }}>
                      {col.id === 'tasa' ? avg.toFixed(2) : avg.toFixed(1)}
                    </td>
                  );
                }
                return (
                  <td key={col.id} style={{ color: '#94a3b8' }}>
                    -
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '0.8rem',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          <i className="fa-solid fa-circle-info" /> Cada cambio en los 3 flujos recalcula
          inmediatamente los promedios globales y los gráficos por módulo y semana.
        </span>
        <span>
          Total plantas registradas: <strong id="lblTotalRows">{flatRows.length}</strong>
        </span>
      </div>
    </section>
  );
};
