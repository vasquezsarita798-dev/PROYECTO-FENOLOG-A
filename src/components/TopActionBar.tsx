import React, { useState } from 'react';

interface TopActionBarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddNewValve: () => void;
  onOpenNewMetric: () => void;
  onOpenNewColumn: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onOpenMasterCatalog: () => void;
  onOpenFirebaseConfig: () => void;
  onResetDefaults: () => void;
}

export const TopActionBar: React.FC<TopActionBarProps> = ({
  isEditMode,
  onToggleEditMode,
  onAddNewValve,
  onOpenNewMetric,
  onOpenNewColumn,
  onExportExcel,
  onPrint,
  onOpenMasterCatalog,
  onOpenFirebaseConfig,
  onResetDefaults,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="top-action-bar">
      <div className="top-bar-brand-row">
        <div className="brand-badge">
          <div className="brand-icon">
            <i className="fa-solid fa-seedling" />
          </div>
          <div>
            <div className="brand-title">REITER PERUVIAN BERRY</div>
            <div className="brand-subtitle">Fenología &amp; Fisiología del Arándano</div>
          </div>
        </div>

        <div className="mobile-bar-quick-actions">
          <button
            className="btn btn-success btn-sm"
            onClick={onExportExcel}
            title="Descargar como archivo Excel (.xlsx)"
          >
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            title="Mostrar u ocultar herramientas"
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-chevron-up' : 'fa-bars'}`} />{' '}
            {mobileMenuOpen ? 'Ocultar' : 'Menú'}
          </button>
        </div>
      </div>

      <div className={`bar-buttons ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <button
          className={`btn btn-edit-mode ${isEditMode ? 'active' : ''}`}
          id="btnToggleEdit"
          onClick={onToggleEditMode}
          title="Permite agregar, editar y quitar títulos, tarjetas, columnas y módulos"
        >
          <i className="fa-solid fa-pen-to-square" />
          <span>
            Modo Edición:{' '}
            <b id="editModeStatus">
              {isEditMode ? 'ACTIVADO (Clic en textos para editar)' : 'Desactivado'}
            </b>
          </span>
        </button>

        <button
          className="btn btn-primary"
          onClick={onAddNewValve}
          title="Agregar nueva válvula con 3 plantas y 3 flujos"
        >
          <i className="fa-solid fa-faucet-drip" /> + Válvula
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenNewMetric}
          title="Agregar una nueva tarjeta de métrica"
        >
          <i className="fa-solid fa-circle-plus" /> + Métrica
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenNewColumn}
          title="Agregar nueva columna a la tabla consolidada"
        >
          <i className="fa-solid fa-table-columns" /> + Columna
        </button>

        <button
          className="btn btn-success desktop-excel-btn"
          onClick={onExportExcel}
          title="Descargar como archivo Excel (.xlsx) con hojas detalladas"
        >
          <i className="fa-solid fa-file-excel" /> Descargar Excel
        </button>

        <button
          className="btn btn-secondary"
          onClick={onPrint}
          title="Imprimir o exportar en PDF"
        >
          <i className="fa-solid fa-print" /> Imprimir/PDF
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenMasterCatalog}
          title="Catálogo Maestro: Módulos, Turnos, Válvulas y Variedades automáticas"
        >
          <i className="fa-solid fa-book-bookmark" style={{ color: '#0284c7' }} /> Catálogo
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenFirebaseConfig}
          title="Configuración de Cloud Firestore (do-proyecto-fenologia)"
        >
          <i className="fa-solid fa-fire" style={{ color: '#ea580c' }} /> Firebase
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onResetDefaults}
          title="Restablecer datos originales de ejemplo"
        >
          <i className="fa-solid fa-arrow-rotate-left" />
        </button>
      </div>
    </header>
  );
};
