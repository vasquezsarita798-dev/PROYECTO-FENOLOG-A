import React from 'react';
import type { ChecklistItem, CustomSection } from '../types/phenology';

interface AgronomySectionsProps {
  isEditMode: boolean;
  showAgronomiaSection: boolean;
  titleAgronomia: string;
  notes: string;
  checklist: ChecklistItem[];
  customSections: CustomSection[];
  onUpdateTitleAgronomia: (title: string) => void;
  onUpdateNotes: (notes: string) => void;
  onToggleChecklistItem: (id: string) => void;
  onUpdateChecklistText: (id: string, text: string) => void;
  onAddChecklistItem: () => void;
  onRemoveChecklistItem: (id: string) => void;
  onHideAgronomiaSection: () => void;
  onAddCustomSection: () => void;
  onUpdateCustomSectionTitle: (id: string, title: string) => void;
  onUpdateCustomSectionNotes: (id: string, notes: string) => void;
  onRemoveCustomSection: (id: string) => void;
}

export const AgronomySections: React.FC<AgronomySectionsProps> = ({
  isEditMode,
  showAgronomiaSection,
  titleAgronomia,
  notes,
  checklist,
  customSections,
  onUpdateTitleAgronomia,
  onUpdateNotes,
  onToggleChecklistItem,
  onUpdateChecklistText,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onHideAgronomiaSection,
  onAddCustomSection,
  onUpdateCustomSectionTitle,
  onUpdateCustomSectionNotes,
  onRemoveCustomSection,
}) => {
  return (
    <>
      <div id="dynamicSectionsContainer">
        {showAgronomiaSection && (
          <section className="custom-section-card" id="section-agronomia">
            <button
              className="btn btn-danger btn-sm section-delete-btn"
              onClick={onHideAgronomiaSection}
            >
              <i className="fa-solid fa-trash" /> Eliminar Sección
            </button>

            <div className="section-header" style={{ marginBottom: '12px' }}>
              <div className="section-title-wrap">
                <span style={{ color: '#0284c7', fontSize: '1.25rem' }}>
                  <i className="fa-solid fa-clipboard-check" />
                </span>
                <h2
                  className="section-title"
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateTitleAgronomia(e.currentTarget.innerText.trim())}
                >
                  {titleAgronomia}
                </h2>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  <i className="fa-solid fa-pen" /> Diagnóstico de Flujos y Vigor por Módulo:
                </label>
                <textarea
                  className="notes-textarea"
                  id="notesVegetative"
                  value={notes}
                  onChange={(e) => onUpdateNotes(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  <i className="fa-solid fa-list-check" /> Tareas y Recomendaciones de Manejo:
                </label>
                <div id="checklistItems">
                  {checklist.map((item) => (
                    <div key={item.id} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggleChecklistItem(item.id)}
                      />
                      <div
                        className="checklist-text"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          onUpdateChecklistText(item.id, e.currentTarget.innerText.trim())
                        }
                      >
                        {item.text}
                      </div>
                      {isEditMode && (
                        <button
                          className="action-icon-btn"
                          onClick={() => onRemoveChecklistItem(item.id)}
                          title="Quitar"
                        >
                          <i className="fa-solid fa-times" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ marginTop: '8px' }}
                  onClick={onAddChecklistItem}
                >
                  <i className="fa-solid fa-plus" /> Agregar Tarea
                </button>
              </div>
            </div>
          </section>
        )}

        {customSections.map((sec) => (
          <section key={sec.id} className="custom-section-card" id={sec.id}>
            <button
              className="btn btn-danger btn-sm section-delete-btn"
              onClick={() => onRemoveCustomSection(sec.id)}
            >
              <i className="fa-solid fa-trash" /> Eliminar Sección
            </button>
            <div className="section-header">
              <div className="section-title-wrap">
                <span style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}>
                  <i className="fa-solid fa-folder-open" />
                </span>
                <h2
                  className="section-title"
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    onUpdateCustomSectionTitle(sec.id, e.currentTarget.innerText.trim())
                  }
                >
                  {sec.title}
                </h2>
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <textarea
                className="notes-textarea"
                placeholder="Escribe aquí las observaciones o anotaciones..."
                value={sec.notes}
                onChange={(e) => onUpdateCustomSectionNotes(sec.id, e.target.value)}
              />
            </div>
          </section>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0' }} className="add-section-zone">
        <button
          className="btn btn-secondary"
          style={{ padding: '10px 22px', fontSize: '0.95rem', borderStyle: 'dashed', borderWidth: '2px' }}
          onClick={onAddCustomSection}
        >
          <i className="fa-solid fa-folder-plus" /> + Agregar Nueva Sección Personalizada a la
          Página
        </button>
      </div>
    </>
  );
};
