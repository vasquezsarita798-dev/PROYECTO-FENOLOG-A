import React, { useEffect, useState } from 'react';
import type { MasterCatalogItem } from '../types/phenology';
import { parseCatalogFromExcelText } from '../utils/calculations';

interface NewMetricModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, value: string, unit: string, desc: string) => void;
}

export const NewMetricModal: React.FC<NewMetricModalProps> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [desc, setDesc] = useState('');

  if (!open) return null;

  const handleCreate = () => {
    onCreate(
      title.trim() || 'Nueva Métrica',
      value.trim() || '0',
      unit.trim() || '',
      desc.trim() || 'Evaluación en campo',
    );
    setTitle('');
    setValue('');
    setUnit('');
    setDesc('');
    onClose();
  };

  return (
    <div className="modal-overlay active" id="modalMetric">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <i className="fa-solid fa-chart-pie" /> Nueva Métrica Personalizada
          </div>
          <button
            style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Nombre / Título de la Métrica:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Entrenudos Promedio, N° Hojas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Valor Inicial:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. 12.5 o Automático"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Unidad de Medida:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. cm, mm, %, und/planta"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Descripción / Observación:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Medición en tercio apical"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Crear Tarjeta
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewColumnModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, type: 'text' | 'number') => void;
}

export const NewColumnModal: React.FC<NewColumnModalProps> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'text' | 'number'>('text');

  if (!open) return null;

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), type);
    setTitle('');
    setType('text');
    onClose();
  };

  return (
    <div className="modal-overlay active" id="modalColumn">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <i className="fa-solid fa-table-columns" /> Agregar Nueva Columna
          </div>
          <button
            style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Título de la Columna:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Clorofila SPAD, Poda, Sustrato"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Tipo de Dato:</label>
            <select
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value as 'text' | 'number')}
            >
              <option value="text">Texto (Observación / Estado)</option>
              <option value="number">Numérico (Calcula promedio)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Crear Columna
          </button>
        </div>
      </div>
    </div>
  );
};

interface FirebaseModalProps {
  open: boolean;
  firestoreOnline: boolean;
  firestoreStatusText: string;
  initialApiKey: string;
  onClose: () => void;
  onForceSync: () => void;
  onForceReload: () => void;
  onSaveSettings: (rawApiKey: string) => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  open,
  firestoreOnline,
  firestoreStatusText,
  initialApiKey,
  onClose,
  onForceSync,
  onForceReload,
  onSaveSettings,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(initialApiKey);

  useEffect(() => {
    if (open) {
      setApiKeyInput(initialApiKey);
    }
  }, [open, initialApiKey]);

  if (!open) return null;

  return (
    <div className="modal-overlay active" id="modalFirebase">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div
            className="modal-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-fire" style={{ color: '#ea580c' }} />
            <span>Conexión Firebase Cloud Firestore</span>
          </div>
          <button
            style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ marginBottom: '6px' }}>
              <strong>Proyecto Firebase:</strong>{' '}
              <code style={{ color: '#ea580c', fontWeight: 700 }}>do-proyecto-fenologia</code>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <strong>Colección Principal:</strong> <code>evaluaciones</code> / Documento:{' '}
              <code>reiter_fenologia</code>
            </div>
            <div>
              <strong>Estado de Conexión:</strong>{' '}
              <span
                id="modalFirestoreStatus"
                style={{
                  fontWeight: 700,
                  color: firestoreOnline ? '#059669' : '#dc2626',
                }}
              >
                {firestoreStatusText}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Firebase Web API Key (opcional / configurable):</label>
            <input
              type="text"
              id="cfgFirebaseApiKey"
              className="form-input"
              placeholder="AIzaSy... (o dejar en blanco para usar la clave por defecto)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
              Si registraste una Web App en la consola de Firebase, puedes ingresar tu API Key aquí.
            </small>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-primary" onClick={onForceSync}>
              <i className="fa-solid fa-cloud-arrow-up" /> Forzar Guardado a Firestore
            </button>
            <button className="btn btn-sm btn-secondary" onClick={onForceReload}>
              <i className="fa-solid fa-cloud-arrow-down" /> Recargar desde Firestore
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn-success" onClick={() => onSaveSettings(apiKeyInput)}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

interface MasterCatalogModalProps {
  open: boolean;
  catalog: MasterCatalogItem[];
  onClose: () => void;
  onSaveCatalog: (updatedCatalog: MasterCatalogItem[]) => void;
  onNotify: (msg: string) => void;
}

export const MasterCatalogModal: React.FC<MasterCatalogModalProps> = ({
  open,
  catalog,
  onClose,
  onSaveCatalog,
  onNotify,
}) => {
  const [draftCatalog, setDraftCatalog] = useState<MasterCatalogItem[]>(catalog);
  const [modInput, setModInput] = useState('');
  const [turnoInput, setTurnoInput] = useState('');
  const [valvInput, setValvInput] = useState('');
  const [varInput, setVarInput] = useState('');
  const [excelPaste, setExcelPaste] = useState('');

  useEffect(() => {
    if (open) {
      setDraftCatalog(catalog);
    }
  }, [open, catalog]);

  if (!open) return null;

  const handleAddSingle = () => {
    if (!valvInput.trim() || !varInput.trim()) {
      onNotify('Por favor ingresa al menos el número de Válvula y la Variedad.');
      return;
    }
    setDraftCatalog((prev) => [
      ...prev,
      {
        modulo: modInput.trim() || '1',
        turno: turnoInput.trim() || '1',
        valvula: valvInput.trim(),
        variedad: varInput.trim(),
      },
    ]);
    setValvInput('');
    setVarInput('');
  };

  const handleImportExcel = () => {
    const txt = excelPaste.trim();
    if (!txt) {
      onNotify('Pega primero el texto con columnas desde Excel.');
      return;
    }
    const items = parseCatalogFromExcelText(txt);
    setDraftCatalog((prev) => [...prev, ...items]);
    setExcelPaste('');
    onNotify(
      `Se procesaron ${items.length} registros desde Excel. Haz clic en 'Guardar Catálogo' para confirmar.`,
    );
  };

  return (
    <div className="modal-overlay active" id="modalMasterCatalog">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div
            className="modal-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-book-bookmark" style={{ color: '#0284c7' }} />
            <span>Catálogo Maestro: Válvulas y Variedades Automáticas</span>
          </div>
          <button
            style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '12px' }}>
            Define la correspondencia entre <strong>Módulo</strong>, <strong>Turno</strong>,{' '}
            <strong>Válvula</strong> y <strong>Variedad</strong>. Al registrar o cambiar una válvula
            en campo, la variedad se asignará en automático sin tener que escribirla.
          </p>

          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '14px',
            }}
          >
            <table
              style={{
                width: '100%',
                fontSize: '0.8rem',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>
                    Módulo
                  </th>
                  <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>Turno</th>
                  <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>
                    Válvula
                  </th>
                  <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>
                    Variedad
                  </th>
                  <th
                    style={{
                      padding: '6px 10px',
                      borderBottom: '1px solid #cbd5e1',
                      textAlign: 'center',
                    }}
                  >
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody id="catalogTableBody">
                {draftCatalog.map((item, idx) => (
                  <tr key={`${item.valvula}-${idx}`}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <b>{item.modulo || '-'}</b>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      {item.turno || '-'}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        color: 'var(--primary)',
                        fontWeight: 700,
                      }}
                    >
                      {item.valvula || '-'}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        color: 'var(--secondary)',
                        fontWeight: 700,
                      }}
                    >
                      {item.variedad || '-'}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        className="action-icon-btn"
                        onClick={() =>
                          setDraftCatalog((prev) => prev.filter((_, i) => i !== idx))
                        }
                        title="Quitar"
                      >
                        <i className="fa-solid fa-times" style={{ color: '#dc2626' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '6px',
              }}
            >
              <i className="fa-solid fa-plus-circle" /> Agregar Válvula Individual al Catálogo:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                gap: '6px',
                alignItems: 'end',
              }}
            >
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  N° Módulo:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  style={{ height: '30px', padding: '2px 6px', fontSize: '0.8rem' }}
                  placeholder="Ej. 1"
                  value={modInput}
                  onChange={(e) => setModInput(e.target.value.replace(/\D+/g, ''))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  N° Turno:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  style={{ height: '30px', padding: '2px 6px', fontSize: '0.8rem' }}
                  placeholder="Ej. 1"
                  value={turnoInput}
                  onChange={(e) => setTurnoInput(e.target.value.replace(/\D+/g, ''))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  N° Válvula:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  style={{ height: '30px', padding: '2px 6px', fontSize: '0.8rem' }}
                  placeholder="Ej. 01"
                  value={valvInput}
                  onChange={(e) => setValvInput(e.target.value.replace(/\D+/g, ''))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  Variedad:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '30px', padding: '2px 6px', fontSize: '0.8rem' }}
                  placeholder="Ej. Ventura"
                  value={varInput}
                  onChange={(e) => setVarInput(e.target.value)}
                />
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAddSingle}
                style={{ height: '30px', padding: '0 10px' }}
              >
                <i className="fa-solid fa-plus" />
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
              <i className="fa-solid fa-paste" /> O Pega tu lista masiva desde Excel:
            </label>
            <textarea
              className="form-input"
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                height: '75px',
                resize: 'vertical',
              }}
              placeholder="Copia de Excel y pega aquí columnas: Módulo [Tab] Turno [Tab] Válvula [Tab] Variedad"
              value={excelPaste}
              onChange={(e) => setExcelPaste(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-sm btn-secondary" onClick={handleImportExcel}>
                <i className="fa-solid fa-file-import" /> Procesar Texto Pegado
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="btn btn-success"
            onClick={() => {
              onSaveCatalog(draftCatalog);
              onClose();
            }}
          >
            Guardar Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};

export interface DialogRequest {
  mode: 'confirm' | 'prompt-week' | 'prompt-valve' | 'prompt-section';
  title: string;
  message?: string;
  defaultValue?: string;
  defaultModule?: string;
  defaultVariety?: string;
  defaultTurno?: string;
  onConfirm: (values: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
  }) => void;
}

interface ActionDialogModalProps {
  dialog: DialogRequest | null;
  onClose: () => void;
  lookupAutoCatalog: (
    modulo: string,
    valvula: string,
  ) => { variedad?: string; turno?: string } | null;
}

export const ActionDialogModal: React.FC<ActionDialogModalProps> = ({
  dialog,
  onClose,
  lookupAutoCatalog,
}) => {
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [tertiary, setTertiary] = useState('');
  const [quaternary, setQuaternary] = useState('');
  const [autoMatchedVar, setAutoMatchedVar] = useState<string | null>(null);

  useEffect(() => {
    if (dialog) {
      setPrimary(dialog.defaultValue || '');
      setSecondary(dialog.defaultModule || '');
      setTertiary(dialog.defaultVariety || '');
      setQuaternary(dialog.defaultTurno || '1');
      if (dialog.mode === 'prompt-valve') {
        const matched = lookupAutoCatalog(
          dialog.defaultModule || '1',
          dialog.defaultValue || '',
        );
        setAutoMatchedVar(matched?.variedad || null);
        if (matched?.variedad) setTertiary(matched.variedad);
        if (matched?.turno) setQuaternary(matched.turno);
      } else {
        setAutoMatchedVar(null);
      }
    }
  }, [dialog, lookupAutoCatalog]);

  if (!dialog) return null;

  const handleValveOrModuleChange = (nextValv: string, nextMod: string) => {
    setPrimary(nextValv);
    setSecondary(nextMod);
    if (dialog.mode === 'prompt-valve') {
      const matched = lookupAutoCatalog(nextMod, nextValv);
      setAutoMatchedVar(matched?.variedad || null);
      if (matched?.variedad) setTertiary(matched.variedad);
      if (matched?.turno) setQuaternary(matched.turno);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div className="modal-title">{dialog.title}</div>
          <button
            style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {dialog.message && (
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>{dialog.message}</p>
          )}

          {dialog.mode === 'prompt-week' && (
            <>
              <div className="form-group">
                <label>Número de la nueva semana de evaluación:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 48"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Fecha de Evaluación:</label>
                <input
                  type="date"
                  className="form-input"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                />
              </div>
            </>
          )}

          {dialog.mode === 'prompt-section' && (
            <div className="form-group">
              <label>Título de la nueva sección:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. 5. Parámetros de Riego, CE y pH"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {dialog.mode === 'prompt-valve' && (
            <>
              <div className="form-group">
                <label>Número de la nueva válvula:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-input"
                  placeholder="Ej. 04"
                  value={primary}
                  onChange={(e) =>
                    handleValveOrModuleChange(e.target.value.replace(/\D+/g, ''), secondary)
                  }
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>N° Módulo:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-input"
                    placeholder="Ej. 1"
                    value={secondary}
                    onChange={(e) =>
                      handleValveOrModuleChange(primary, e.target.value.replace(/\D+/g, ''))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>N° Turno:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-input"
                    placeholder="Ej. 1"
                    value={quaternary}
                    onChange={(e) => setQuaternary(e.target.value.replace(/\D+/g, ''))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  Variedad de arándano:{' '}
                  {autoMatchedVar && (
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      (Auto-detectada por Catálogo Maestro)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tertiary}
                  onChange={(e) => setTertiary(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`btn ${dialog.mode === 'confirm' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              dialog.onConfirm({ primary, secondary, tertiary, quaternary });
              onClose();
            }}
          >
            {dialog.mode === 'confirm' ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
};
