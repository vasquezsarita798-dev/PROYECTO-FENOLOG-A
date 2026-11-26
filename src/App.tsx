import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgronomySections } from './components/AgronomySections';
import { ChartsSection } from './components/ChartsSection';
import { ConsolidatedTableView } from './components/ConsolidatedTableView';
import { GrowthRateSummarySection } from './components/GrowthRateSummarySection';
import { HeaderSection } from './components/HeaderSection';
import { KpisSection } from './components/KpisSection';
import {
  ActionDialogModal,
  FirebaseModal,
  MasterCatalogModal,
  NewColumnModal,
  NewMetricModal,
  type DialogRequest,
} from './components/Modals';
import { ShootsMatrixView } from './components/ShootsMatrixView';
import { TopActionBar } from './components/TopActionBar';
import { ValveView } from './components/ValveView';
import {
  createDefaultShoots,
  DEFAULT_CHECKLIST,
  DEFAULT_COLUMNS,
  DEFAULT_HEADER_METADATA,
  DEFAULT_KPIS,
  DEFAULT_MASTER_CATALOG,
  DEFAULT_NOTES,
  DEFAULT_VALVES_DATA,
  DEFAULT_WEEKLY_DATES,
  DEFAULT_WEEKLY_MODULE_DATA,
  STORAGE_KEY_CATALOG,
  STORAGE_KEY_STATE,
} from './data/defaults';
import {
  deleteEvaluationDocFromFirestore,
  extractAndSaveCustomFirebaseKey,
  getActiveFirebaseApiKey,
  hasConfiguredFirebaseKey,
  initFirestoreClient,
  reloadStateFromFirestore,
  saveStateToFirestore,
  subscribeToEvaluationDoc,
} from './services/firebase';
import type {
  AppState,
  ChecklistItem,
  CustomSection,
  FlushKey,
  GrowthRateBasis,
  KpiCard,
  MasterCatalogItem,
  PlantData,
  TableColumn,
  ValveData,
  ViewMode,
  WeeklyModuleData,
} from './types/phenology';
import {
  addDaysToYmd,
  calculateMetricsAndWeeklyUpdate,
  getAutoCatalogMatch,
  getPreviousWeekKey,
  getShootsAvg,
  getSortedWeekKeys,
  normalizeMasterCatalog,
  normalizeModuleNumber,
  normalizeTurnoNumber,
  normalizeValveNumber,
  normalizeValvesList,
  normalizeWeekKey,
  normalizeWeeklyDates,
  normalizeWeeklyModuleData,
  normalizeWeeklyTurnoData,
  resolveValveTurno,
} from './utils/calculations';
import { exportToExcel } from './utils/excelExport';

function loadInitialMasterCatalog(): MasterCatalogItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CATALOG);
    if (saved) {
      return normalizeMasterCatalog(JSON.parse(saved) as MasterCatalogItem[]);
    }
  } catch (e) {
    console.warn('No se pudo cargar catálogo maestro:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_MASTER_CATALOG));
}

function buildInitialAppState(catalog: MasterCatalogItem[]): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_STATE);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppState>;
      const rawValves =
        parsed.valves && parsed.valves.length > 0
          ? parsed.valves
          : JSON.parse(JSON.stringify(DEFAULT_VALVES_DATA));
      const valves = normalizeValvesList(rawValves, catalog);
      const weekly = normalizeWeeklyModuleData(
        parsed.weeklyModuleData || JSON.parse(JSON.stringify(DEFAULT_WEEKLY_MODULE_DATA)),
      );
      const weeklyTurno = normalizeWeeklyTurnoData(parsed.weeklyTurnoData || {});
      const weeklyDates = normalizeWeeklyDates(
        parsed.weeklyDates || { ...DEFAULT_WEEKLY_DATES },
      );
      const activeWeek = normalizeWeekKey(parsed.activeWeek || '47');
      const prevWeek = getPreviousWeekKey(weekly, activeWeek);
      const fechaEvaluacion =
        parsed.fechaEvaluacion ||
        weeklyDates[activeWeek] ||
        DEFAULT_HEADER_METADATA.fechaEvaluacion;
      const fechaAnterior =
        parsed.fechaAnterior ||
        (prevWeek ? weeklyDates[prevWeek] : '') ||
        DEFAULT_HEADER_METADATA.fechaAnterior;
      const growthRateBasis: GrowthRateBasis = parsed.growthRateBasis || 'global';
      const kpis =
        parsed.kpis && parsed.kpis.length > 0
          ? parsed.kpis
          : JSON.parse(JSON.stringify(DEFAULT_KPIS));

      const { updatedWeeklyData, updatedWeeklyTurnoData, updatedKpis } =
        calculateMetricsAndWeeklyUpdate(
          valves,
          weekly,
          activeWeek,
          kpis,
          fechaEvaluacion,
          fechaAnterior,
          growthRateBasis,
          weeklyTurno,
          catalog,
        );

      const firstValve = valves[0];
      if (
        firstValve &&
        parsed.variedad &&
        parsed.variedad.trim() &&
        parsed.variedad !== 'Ventura' &&
        firstValve.variedad === 'Ventura' &&
        (!parsed.valvula || normalizeValveNumber(parsed.valvula) === firstValve.nombre)
      ) {
        firstValve.variedad = parsed.variedad.trim();
      }

      return {
        companyTitle: parsed.companyTitle || DEFAULT_HEADER_METADATA.companyTitle,
        reportTitle: parsed.reportTitle || DEFAULT_HEADER_METADATA.reportTitle,
        fundo: parsed.fundo || DEFAULT_HEADER_METADATA.fundo,
        modulo: firstValve ? firstValve.modulo : normalizeModuleNumber(parsed.modulo),
        turno: firstValve
          ? firstValve.turno !== undefined
            ? firstValve.turno
            : resolveValveTurno(firstValve, catalog)
          : normalizeTurnoNumber(parsed.turno),
        valvula: firstValve ? firstValve.nombre : normalizeValveNumber(parsed.valvula),
        variedad: firstValve ? firstValve.variedad : parsed.variedad || DEFAULT_HEADER_METADATA.variedad,
        semana: normalizeWeekKey(parsed.semana || activeWeek),
        fechaEvaluacion,
        fechaAnterior,
        growthRateBasis,
        weeklyDates: { ...weeklyDates, [activeWeek]: fechaEvaluacion },
        evaluador: parsed.evaluador || DEFAULT_HEADER_METADATA.evaluador,
        notes: parsed.notes ?? DEFAULT_NOTES,
        valves,
        weeklyModuleData: updatedWeeklyData,
        weeklyTurnoData: updatedWeeklyTurnoData,
        activeWeek,
        kpis: updatedKpis,
        columns:
          parsed.columns && parsed.columns.length > 0
            ? parsed.columns
            : JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
        titleTable: parsed.titleTable || DEFAULT_HEADER_METADATA.titleTable,
        titleCharts: parsed.titleCharts || DEFAULT_HEADER_METADATA.titleCharts,
        titleGrowthSummary:
          parsed.titleGrowthSummary || DEFAULT_HEADER_METADATA.titleGrowthSummary,
        titleKpis: parsed.titleKpis || DEFAULT_HEADER_METADATA.titleKpis,
        titleAgronomia: parsed.titleAgronomia || DEFAULT_HEADER_METADATA.titleAgronomia,
        checklist:
          parsed.checklist && parsed.checklist.length > 0
            ? parsed.checklist
            : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
        customSections: parsed.customSections || [],
      };
    }
  } catch (e) {
    console.error('Error al cargar localStorage fallback', e);
  }

  const valves: ValveData[] = JSON.parse(JSON.stringify(DEFAULT_VALVES_DATA));
  const weekly: WeeklyModuleData = JSON.parse(JSON.stringify(DEFAULT_WEEKLY_MODULE_DATA));
  const kpis: KpiCard[] = JSON.parse(JSON.stringify(DEFAULT_KPIS));
  const { updatedWeeklyData, updatedWeeklyTurnoData, updatedKpis } =
    calculateMetricsAndWeeklyUpdate(
      valves,
      weekly,
      '47',
      kpis,
      DEFAULT_HEADER_METADATA.fechaEvaluacion,
      DEFAULT_HEADER_METADATA.fechaAnterior,
      DEFAULT_HEADER_METADATA.growthRateBasis,
      {},
      catalog,
    );

  return {
    ...DEFAULT_HEADER_METADATA,
    weeklyDates: { ...DEFAULT_WEEKLY_DATES },
    notes: DEFAULT_NOTES,
    valves,
    weeklyModuleData: updatedWeeklyData,
    weeklyTurnoData: updatedWeeklyTurnoData,
    activeWeek: '47',
    kpis: updatedKpis,
    columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
    checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
    customSections: [],
  };
}

export default function App() {
  const [masterCatalog, setMasterCatalog] = useState<MasterCatalogItem[]>(() =>
    loadInitialMasterCatalog(),
  );
  const [appState, setAppState] = useState<AppState>(() => buildInitialAppState(masterCatalog));

  const [currentValveIndex, setCurrentValveIndex] = useState<number>(0);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewMode>('valve');
  const [showAgronomiaSection, setShowAgronomiaSection] = useState<boolean>(true);

  const [firestoreOnline, setFirestoreOnline] = useState<boolean>(false);
  const [firestoreStatusText, setFirestoreStatusText] = useState<string>(
    'Conectando a Cloud Firestore...',
  );

  const [modalMetricOpen, setModalMetricOpen] = useState(false);
  const [modalColumnOpen, setModalColumnOpen] = useState(false);
  const [modalFirebaseOpen, setModalFirebaseOpen] = useState(false);
  const [modalCatalogOpen, setModalCatalogOpen] = useState(false);
  const [dialogRequest, setDialogRequest] = useState<DialogRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef<AppState>(appState);
  latestStateRef.current = appState;
  const masterCatalogRef = useRef<MasterCatalogItem[]>(masterCatalog);
  masterCatalogRef.current = masterCatalog;
  const currentValveIndexRef = useRef<number>(currentValveIndex);
  currentValveIndexRef.current = currentValveIndex;

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const persistState = useCallback((nextState: AppState) => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(nextState));
    } catch {
      // Ignore storage quota errors
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const res = await saveStateToFirestore(nextState);
      if (res.ok) {
        setFirestoreOnline(true);
        setFirestoreStatusText(res.statusText);
      } else if (res.statusText !== 'Modo Local') {
        setFirestoreOnline(false);
        setFirestoreStatusText(res.statusText);
      }
    }, 500);
  }, []);

  const applyRemoteState = useCallback((remote: Partial<AppState>) => {
    if (!remote) return;
    setAppState((prev) => {
      const rawValves = remote.valves && remote.valves.length > 0 ? remote.valves : prev.valves;
      const valves = normalizeValvesList(rawValves, masterCatalogRef.current);
      const weekly = remote.weeklyModuleData
        ? normalizeWeeklyModuleData(remote.weeklyModuleData)
        : prev.weeklyModuleData;
      const weeklyTurno = remote.weeklyTurnoData
        ? { ...(prev.weeklyTurnoData || {}), ...normalizeWeeklyTurnoData(remote.weeklyTurnoData) }
        : prev.weeklyTurnoData || {};
      const weeklyDates = remote.weeklyDates
        ? { ...prev.weeklyDates, ...normalizeWeeklyDates(remote.weeklyDates) }
        : prev.weeklyDates;
      const activeWeek = remote.activeWeek ? normalizeWeekKey(remote.activeWeek) : prev.activeWeek;
      const fechaEvaluacion =
        remote.fechaEvaluacion || weeklyDates[activeWeek] || prev.fechaEvaluacion;
      const fechaAnterior = remote.fechaAnterior || prev.fechaAnterior;
      const growthRateBasis = remote.growthRateBasis || prev.growthRateBasis;
      const kpis = remote.kpis && remote.kpis.length > 0 ? remote.kpis : prev.kpis;

      const { updatedWeeklyData, updatedWeeklyTurnoData, updatedKpis } =
        calculateMetricsAndWeeklyUpdate(
          valves,
          weekly,
          activeWeek,
          kpis,
          fechaEvaluacion,
          fechaAnterior,
          growthRateBasis,
          weeklyTurno,
          masterCatalogRef.current,
        );

      const safeIdx =
        currentValveIndexRef.current >= 0 && currentValveIndexRef.current < valves.length
          ? currentValveIndexRef.current
          : 0;
      const activeValve = valves[safeIdx] || valves[0];
      if (
        activeValve &&
        remote.variedad &&
        remote.variedad.trim() &&
        remote.variedad !== 'Ventura' &&
        activeValve.variedad === 'Ventura' &&
        (!remote.valvula || normalizeValveNumber(remote.valvula) === activeValve.nombre)
      ) {
        activeValve.variedad = remote.variedad.trim();
      }

      const merged: AppState = {
        ...prev,
        companyTitle: remote.companyTitle || prev.companyTitle,
        reportTitle: remote.reportTitle || prev.reportTitle,
        fundo: remote.fundo || prev.fundo,
        modulo: activeValve ? activeValve.modulo : normalizeModuleNumber(remote.modulo || prev.modulo),
        turno: activeValve
          ? activeValve.turno !== undefined
            ? activeValve.turno
            : resolveValveTurno(activeValve, masterCatalogRef.current)
          : normalizeTurnoNumber(remote.turno ?? prev.turno),
        valvula: activeValve ? activeValve.nombre : normalizeValveNumber(remote.valvula || prev.valvula),
        variedad: activeValve ? activeValve.variedad : remote.variedad || prev.variedad,
        semana: remote.semana ? normalizeWeekKey(remote.semana) : prev.semana,
        fechaEvaluacion,
        fechaAnterior,
        growthRateBasis,
        weeklyDates,
        evaluador: remote.evaluador || prev.evaluador,
        notes: remote.notes !== undefined ? remote.notes : prev.notes,
        valves,
        weeklyModuleData: updatedWeeklyData,
        weeklyTurnoData: updatedWeeklyTurnoData,
        activeWeek,
        kpis: updatedKpis,
        columns: remote.columns && remote.columns.length > 0 ? remote.columns : prev.columns,
        titleTable: remote.titleTable || prev.titleTable,
        titleCharts: remote.titleCharts || prev.titleCharts,
        titleGrowthSummary: remote.titleGrowthSummary || prev.titleGrowthSummary,
        titleKpis: remote.titleKpis || prev.titleKpis,
        titleAgronomia: remote.titleAgronomia || prev.titleAgronomia,
        checklist:
          remote.checklist && remote.checklist.length > 0 ? remote.checklist : prev.checklist,
        customSections: remote.customSections || prev.customSections,
      };
      try {
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  }, []);

  // Initialize Firestore & realtime listener on mount
  useEffect(() => {
    const init = initFirestoreClient();
    setFirestoreOnline(init.online);
    setFirestoreStatusText(init.statusText);

    const unsubscribe = subscribeToEvaluationDoc(
      (data) => {
        applyRemoteState(data);
      },
      () => {
        saveStateToFirestore(latestStateRef.current);
      },
      (online, text) => {
        setFirestoreOnline(online);
        setFirestoreStatusText(text);
      },
    );

    return () => {
      if (unsubscribe) unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [applyRemoteState]);

  const updateStateAndPersist = useCallback(
    (updater: (prev: AppState) => AppState, recalculate = false) => {
      setAppState((prev) => {
        let next = updater(prev);
        if (recalculate) {
          const { updatedWeeklyData, updatedWeeklyTurnoData, updatedKpis } =
            calculateMetricsAndWeeklyUpdate(
              next.valves,
              next.weeklyModuleData,
              next.activeWeek,
              next.kpis,
              next.fechaEvaluacion,
              next.fechaAnterior,
              next.growthRateBasis,
              next.weeklyTurnoData || {},
              masterCatalogRef.current,
            );
          next = {
            ...next,
            weeklyModuleData: updatedWeeklyData,
            weeklyTurnoData: updatedWeeklyTurnoData,
            kpis: updatedKpis,
          };
        }
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  const sortedWeeks = useMemo(
    () => getSortedWeekKeys(appState.weeklyModuleData),
    [appState.weeklyModuleData],
  );

  const lookupAutoCatalog = useCallback(
    (modulo: string, valvula: string) => getAutoCatalogMatch(masterCatalog, modulo, valvula),
    [masterCatalog],
  );

  const handleToggleEditMode = () => {
    setIsEditMode((prev) => {
      const next = !prev;
      if (!next) {
        persistState(latestStateRef.current);
      }
      return next;
    });
  };

  const handleAddNewValve = () => {
    const nextNum = appState.valves.length + 1;
    const formattedNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const activeValve = appState.valves[currentValveIndex];
    setDialogRequest({
      mode: 'prompt-valve',
      title: 'Agregar Nueva Válvula',
      defaultValue: formattedNum,
      defaultModule: activeValve?.modulo || '1',
      defaultVariety: activeValve?.variedad || 'Ventura',
      defaultTurno: activeValve?.turno || '1',
      onConfirm: ({ primary, secondary, tertiary, quaternary }) => {
        const valveName = primary.replace(/\D+/g, '').trim();
        if (!valveName) return;
        const modName = (secondary || '').replace(/\D+/g, '').trim() || '1';
        const match = getAutoCatalogMatch(masterCatalog, modName, valveName);
        const variedad = (tertiary || '').trim() || match?.variedad || 'Ventura';
        const turno =
          (quaternary || '').replace(/\D+/g, '').trim() ||
          (match?.turno ? normalizeTurnoNumber(match.turno) : '1');

        const makePlant = (num: number): PlantData => ({
          id: `P-${num}`,
          nombre: `Planta ${num}`,
          cant_flujo1: 5,
          cant_flujo2: 5,
          cant_flujo3: 5,
          induccion: 2,
          inactivos: 1,
          vigorosos: 7,
          no_vigorosos: 2,
          basales: 2,
          retonos: 1,
          dias: 7,
          observaciones: 'Nueva muestra agregada',
          flujo1: createDefaultShoots(28.0, 4.8),
          flujo2: createDefaultShoots(24.0, 4.4),
          flujo3: createDefaultShoots(20.0, 4.0),
        });

        const newValve: ValveData = {
          id: `V-${formattedNum}`,
          nombre: valveName,
          modulo: modName,
          turno,
          fundo: 'Fundo Don Luis',
          variedad,
          plantas: [makePlant(1), makePlant(2), makePlant(3)],
        };

        const nextIdx = appState.valves.length;
        updateStateAndPersist(
          (prev) => ({
            ...prev,
            modulo: modName,
            turno,
            valvula: valveName,
            variedad,
            valves: [...prev.valves, newValve],
          }),
          true,
        );
        setCurrentValveIndex(nextIdx);
        if (match?.variedad && variedad === match.variedad) {
          notify(
            `Variedad y turno asignados por Catálogo Maestro: ${match.variedad} (Turno ${turno})`,
          );
        }
      },
    });
  };

  const handleSelectValve = (idx: number) => {
    setCurrentValveIndex(idx);
    const v = appState.valves[idx];
    if (v) {
      updateStateAndPersist((prev) => ({
        ...prev,
        modulo: v.modulo,
        turno: v.turno !== undefined ? v.turno : resolveValveTurno(v, masterCatalog),
        valvula: v.nombre,
        variedad: v.variedad,
      }));
    }
  };

  const handleUpdateValveMeta = (
    vIdx: number,
    field: 'modulo' | 'turno' | 'nombre' | 'variedad',
    value: string,
  ) => {
    updateStateAndPersist((prev) => {
      const valves = prev.valves.map((v, idx) =>
        idx === vIdx ? { ...v, [field]: value } : v,
      );
      if (vIdx !== currentValveIndex) {
        return { ...prev, valves };
      }
      const headerPatch: Partial<AppState> = {};
      if (field === 'modulo') headerPatch.modulo = value;
      else if (field === 'turno') headerPatch.turno = value;
      else if (field === 'nombre') headerPatch.valvula = value;
      else if (field === 'variedad') headerPatch.variedad = value;
      return {
        ...prev,
        ...headerPatch,
        valves,
      };
    }, true);
  };

  const handleUpdateHeaderField = (
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
  ) => {
    const syncsValve =
      field === 'modulo' || field === 'turno' || field === 'valvula' || field === 'variedad';

    updateStateAndPersist((prev) => {
      if (!syncsValve) {
        return { ...prev, [field]: value };
      }
      const valveField: 'modulo' | 'turno' | 'nombre' | 'variedad' =
        field === 'valvula' ? 'nombre' : field;
      const valves = prev.valves.map((v, idx) =>
        idx === currentValveIndex ? { ...v, [valveField]: value } : v,
      );
      return {
        ...prev,
        [field]: value,
        valves,
      };
    }, syncsValve);
  };

  const handleDeleteValve = (idx: number) => {
    if (appState.valves.length <= 1) {
      notify('Debe mantenerse al menos una válvula registrada.');
      return;
    }
    const target = appState.valves[idx];
    if (!target) return;
    setDialogRequest({
      mode: 'confirm',
      title: 'Eliminar Válvula',
      message: `¿Estás seguro de eliminar Válvula ${target.nombre}?`,
      onConfirm: () => {
        const nextIdx =
          currentValveIndex >= appState.valves.length - 1
            ? Math.max(0, appState.valves.length - 2)
            : currentValveIndex;
        updateStateAndPersist((prev) => {
          const nextValves = prev.valves.filter((_, i) => i !== idx);
          const nextActive = nextValves[nextIdx] || nextValves[0];
          return {
            ...prev,
            modulo: nextActive ? nextActive.modulo : prev.modulo,
            turno: nextActive ? resolveValveTurno(nextActive, masterCatalog) : prev.turno,
            valvula: nextActive ? nextActive.nombre : prev.valvula,
            variedad: nextActive ? nextActive.variedad : prev.variedad,
            valves: nextValves,
          };
        }, true);
        setCurrentValveIndex(nextIdx);
      },
    });
  };

  const handleAddPlantToCurrentValve = () => {
    updateStateAndPersist((prev) => {
      const valves = prev.valves.map((v, idx) => {
        if (idx !== currentValveIndex) return v;
        const nextPNum = v.plantas.length + 1;
        const newPlant: PlantData = {
          id: `P-${nextPNum}`,
          nombre: `Planta ${nextPNum}`,
          cant_flujo1: 5,
          cant_flujo2: 5,
          cant_flujo3: 5,
          induccion: 2,
          inactivos: 1,
          vigorosos: 6,
          no_vigorosos: 1,
          basales: 2,
          retonos: 1,
          dias: 7,
          observaciones: 'Nueva planta agregada',
          flujo1: createDefaultShoots(28.0, 4.8),
          flujo2: createDefaultShoots(24.0, 4.4),
          flujo3: createDefaultShoots(20.0, 4.0),
        };
        return { ...v, plantas: [...v.plantas, newPlant] };
      });
      return { ...prev, valves };
    }, true);
  };

  const handleDeletePlantFromCurrentValve = (pIdx: number) => {
    const v = appState.valves[currentValveIndex];
    if (!v) return;
    if (v.plantas.length <= 1) {
      notify('Debe haber al menos 1 planta en la válvula.');
      return;
    }
    setDialogRequest({
      mode: 'confirm',
      title: 'Eliminar Planta',
      message: `¿Eliminar la ${v.plantas[pIdx].nombre}?`,
      onConfirm: () => {
        updateStateAndPersist((prev) => {
          const valves = prev.valves.map((valve, idx) => {
            if (idx !== currentValveIndex) return valve;
            return { ...valve, plantas: valve.plantas.filter((_, i) => i !== pIdx) };
          });
          return { ...prev, valves };
        }, true);
      },
    });
  };

  const handleUpdatePlantField = <K extends keyof PlantData>(
    pIdx: number,
    field: K,
    value: PlantData[K],
  ) => {
    updateStateAndPersist((prev) => {
      const valves = prev.valves.map((v, vIdx) => {
        if (vIdx !== currentValveIndex) return v;
        const plantas = v.plantas.map((p, i) => (i === pIdx ? { ...p, [field]: value } : p));
        return { ...v, plantas };
      });
      return { ...prev, valves };
    }, true);
  };

  const handleUpdateShootValue = (
    vIdx: number,
    pIdx: number,
    flushKey: FlushKey,
    bIdx: number,
    prop: 'longitud' | 'diametro',
    value: number,
  ) => {
    updateStateAndPersist((prev) => {
      const valves = prev.valves.map((v, vi) => {
        if (vi !== vIdx) return v;
        const plantas = v.plantas.map((p, pi) => {
          if (pi !== pIdx) return p;
          const baseFlush = p[flushKey] || createDefaultShoots(25.0, 4.5);
          const updatedFlush = baseFlush.map((shoot, si) =>
            si === bIdx ? { ...shoot, [prop]: value } : shoot,
          );
          return { ...p, [flushKey]: updatedFlush };
        });
        return { ...v, plantas };
      });
      return { ...prev, valves };
    }, true);
  };

  const handleUpdateFlatCell = (vIdx: number, pIdx: number, colId: string, value: string) => {
    updateStateAndPersist((prev) => {
      const cleanDigits = value.replace(/\D+/g, '');
      const valves = prev.valves.map((v, vi) => {
        if (vi !== vIdx) return v;
        if (colId === 'modulo') return { ...v, modulo: cleanDigits };
        if (colId === 'turno') return { ...v, turno: cleanDigits };
        if (colId === 'variedad') return { ...v, variedad: value };
        if (colId === 'valvula') return { ...v, nombre: cleanDigits };

        const numVal = parseFloat(value) || 0;
        const plantas = v.plantas.map((p, pi) => {
          if (pi !== pIdx) return p;
          if (
            colId === 'induccion' ||
            colId === 'inactivos' ||
            colId === 'vigorosos' ||
            colId === 'no_vigorosos' ||
            colId === 'basales' ||
            colId === 'retonos'
          ) {
            return { ...p, [colId]: parseInt(String(numVal), 10) };
          }
          if (colId === 'cant_f1') return { ...p, cant_flujo1: parseInt(String(numVal), 10) };
          if (colId === 'cant_f2') return { ...p, cant_flujo2: parseInt(String(numVal), 10) };
          if (colId === 'cant_f3') return { ...p, cant_flujo3: parseInt(String(numVal), 10) };
          if (colId === 'prev_long_prom') {
            return {
              ...p,
              prev_long_f1: numVal,
              prev_long_f2: numVal,
              prev_long_f3: numVal,
            };
          }
          if (colId === 'planta') return { ...p, nombre: value };
          if (colId === 'observaciones') return { ...p, observaciones: value };
          return {
            ...p,
            customFields: {
              ...(p.customFields || {}),
              [colId]: value,
            },
          };
        });
        return { ...v, plantas };
      });

      if (
        vIdx === currentValveIndex &&
        (colId === 'modulo' || colId === 'turno' || colId === 'variedad' || colId === 'valvula')
      ) {
        const headerVal = colId === 'variedad' ? value : cleanDigits;
        return { ...prev, [colId]: headerVal, valves };
      }

      return { ...prev, valves };
    }, true);
  };

  const handleFilterValvesByModule = (modVal: string) => {
    setSelectedModuleFilter(modVal);
    if (modVal === 'ALL') {
      if (appState.valves.length > 0) handleSelectValve(0);
      return;
    }
    const idx = appState.valves.findIndex((v) => v.modulo === modVal);
    if (idx !== -1) handleSelectValve(idx);
  };

  const handleChangeActiveWeek = (weekName: string) => {
    const normWeek = normalizeWeekKey(weekName);
    updateStateAndPersist((prev) => {
      const nextEvalDate = prev.weeklyDates[normWeek] || prev.fechaEvaluacion;
      const prevWeek = getPreviousWeekKey(prev.weeklyModuleData, normWeek);
      const nextPrevDate =
        prevWeek && prev.weeklyDates[prevWeek] ? prev.weeklyDates[prevWeek] : prev.fechaAnterior;
      return {
        ...prev,
        activeWeek: normWeek,
        semana: normWeek,
        fechaEvaluacion: nextEvalDate,
        fechaAnterior: nextPrevDate,
      };
    }, true);
  };

  const handleAddNewWeek = () => {
    const numericActive = parseInt(normalizeWeekKey(appState.activeWeek), 10);
    const nextWeekNum = !Number.isNaN(numericActive)
      ? String(numericActive + 1)
      : String(sortedWeeks.length + 44);
    const suggestedDate = addDaysToYmd(appState.fechaEvaluacion, 7);

    setDialogRequest({
      mode: 'prompt-week',
      title: 'Registrar Nueva Semana',
      defaultValue: nextWeekNum,
      defaultModule: suggestedDate,
      onConfirm: ({ primary, secondary }) => {
        const wName = normalizeWeekKey(primary);
        if (!wName) return;
        const evalDate = (secondary || '').trim() || suggestedDate;

        updateStateAndPersist((prev) => {
          const snapshottedValves = prev.valves.map((v) => ({
            ...v,
            plantas: v.plantas.map((p) => {
              const flujo2 = p.flujo2 || createDefaultShoots(25.0, 4.5);
              return {
                ...p,
                prev_long_f1: getShootsAvg(p.flujo1, 'longitud'),
                prev_long_f2: getShootsAvg(flujo2, 'longitud'),
                prev_long_f3: getShootsAvg(p.flujo3, 'longitud'),
              };
            }),
          }));

          return {
            ...prev,
            valves: snapshottedValves,
            activeWeek: wName,
            semana: wName,
            fechaAnterior: prev.fechaEvaluacion,
            fechaEvaluacion: evalDate,
            weeklyDates: {
              ...prev.weeklyDates,
              [wName]: evalDate,
            },
            weeklyModuleData: {
              ...prev.weeklyModuleData,
              [wName]: prev.weeklyModuleData[wName] || {},
            },
          };
        }, true);
      },
    });
  };

  const handleUpdateFechaEvaluacion = (dateStr: string) => {
    if (!dateStr) return;
    updateStateAndPersist(
      (prev) => ({
        ...prev,
        fechaEvaluacion: dateStr,
        weeklyDates: {
          ...prev.weeklyDates,
          [prev.activeWeek]: dateStr,
        },
      }),
      true,
    );
  };

  const handleUpdateFechaAnterior = (dateStr: string) => {
    if (!dateStr) return;
    updateStateAndPersist(
      (prev) => ({
        ...prev,
        fechaAnterior: dateStr,
      }),
      true,
    );
  };

  const handleUpdateGrowthRateBasis = (basis: GrowthRateBasis) => {
    updateStateAndPersist(
      (prev) => ({
        ...prev,
        growthRateBasis: basis,
      }),
      true,
    );
  };

  const handleCreateCustomMetric = (title: string, value: string, unit: string, desc: string) => {
    const newKpi: KpiCard = {
      id: 'kpi-' + Date.now(),
      title,
      value,
      unit,
      desc,
      icon: 'fa-chart-line',
      color: 'icon-blue',
    };
    updateStateAndPersist((prev) => ({
      ...prev,
      kpis: [...prev.kpis, newKpi],
    }));
  };

  const handleRemoveKpi = (id: string) => {
    setDialogRequest({
      mode: 'confirm',
      title: 'Quitar Tarjeta de Métrica',
      message: '¿Deseas quitar esta tarjeta de métrica?',
      onConfirm: () => {
        updateStateAndPersist((prev) => ({
          ...prev,
          kpis: prev.kpis.filter((k) => k.id !== id),
        }));
      },
    });
  };

  const handleCreateCustomColumn = (title: string, type: 'text' | 'number') => {
    const newCol: TableColumn = {
      id: 'col_' + Date.now(),
      title,
      type,
      deletable: true,
      calcAvg: type === 'number',
    };
    updateStateAndPersist((prev) => ({
      ...prev,
      columns: [...prev.columns, newCol],
    }));
  };

  const handleDeleteColumn = (colId: string) => {
    const col = appState.columns.find((c) => c.id === colId);
    if (!col) return;
    setDialogRequest({
      mode: 'confirm',
      title: 'Eliminar Columna',
      message: `¿Eliminar la columna "${col.title}"?`,
      onConfirm: () => {
        updateStateAndPersist((prev) => ({
          ...prev,
          columns: prev.columns.filter((c) => c.id !== colId),
        }));
      },
    });
  };

  const handleAddCustomSection = () => {
    setDialogRequest({
      mode: 'prompt-section',
      title: 'Nueva Sección Personalizada',
      defaultValue: '',
      onConfirm: ({ primary }) => {
        const secTitle = primary.trim();
        if (!secTitle) return;
        const newSection: CustomSection = {
          id: 'section-custom-' + Date.now(),
          title: secTitle,
          notes: '',
        };
        updateStateAndPersist((prev) => ({
          ...prev,
          customSections: [...(prev.customSections || []), newSection],
        }));
      },
    });
  };

  const handleSaveMasterCatalog = (updated: MasterCatalogItem[]) => {
    setMasterCatalog(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(updated));
      notify(
        '¡Catálogo Maestro guardado con éxito! Las válvulas usarán estas variedades en automático.',
      );
    } catch (e) {
      console.error('Error al guardar catálogo maestro:', e);
    }
  };

  const handleForceSyncToFirestore = async () => {
    if (!hasConfiguredFirebaseKey()) {
      notify('Falta la API Key de Firebase para conectar con do-proyecto-fenologia.');
      return;
    }
    setFirestoreOnline(false);
    setFirestoreStatusText('Sincronizando...');
    const res = await saveStateToFirestore(appState);
    setFirestoreOnline(res.ok);
    setFirestoreStatusText(res.statusText);
    if (res.ok) {
      notify('¡Datos sincronizados exitosamente con Cloud Firestore en do-proyecto-fenologia!');
    } else {
      notify('Error al sincronizar con Firestore: ' + (res.errorMessage || res.statusText));
    }
  };

  const handleForceReloadFromFirestore = async () => {
    const res = await reloadStateFromFirestore();
    if (res.error) {
      notify('Error al obtener datos de Firestore: ' + res.error);
    } else if (res.exists && res.data) {
      applyRemoteState(res.data);
      notify('¡Datos actualizados exitosamente desde Cloud Firestore!');
    } else {
      notify('No se encontró ningún registro en Firestore para este proyecto.');
    }
  };

  const handleSaveFirebaseSettings = (rawApiKey: string) => {
    const res = extractAndSaveCustomFirebaseKey(rawApiKey);
    if (res.saved) {
      notify('¡API Key configurada correctamente! Se reiniciará la conexión a Cloud Firestore.');
    } else {
      notify('Configuración personalizada eliminada. Usando configuración por defecto.');
    }
    setModalFirebaseOpen(false);
    window.location.reload();
  };

  const handleResetDefaults = () => {
    setDialogRequest({
      mode: 'confirm',
      title: 'Restablecer Valores Iniciales',
      message:
        '¿Deseas restablecer todos los títulos, módulos y parámetros a los valores iniciales de ejemplo?',
      onConfirm: async () => {
        localStorage.removeItem(STORAGE_KEY_STATE);
        await deleteEvaluationDocFromFirestore();
        window.location.reload();
      },
    });
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(
        appState.valves,
        appState.columns,
        appState.weeklyModuleData,
        appState.weeklyTurnoData || {},
        appState.weeklyDates,
        masterCatalog,
        appState.activeWeek,
        appState.fechaEvaluacion,
        appState.fechaAnterior,
        appState.growthRateBasis,
      );
      notify('Archivo Excel (.xlsx) descargado correctamente.');
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      notify('Ocurrió un inconveniente al generar el archivo Excel.');
    }
  };

  return (
    <div id="appBody" className={isEditMode ? 'edit-mode-active' : ''}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '420px',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <TopActionBar
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
        onAddNewValve={handleAddNewValve}
        onOpenNewMetric={() => setModalMetricOpen(true)}
        onOpenNewColumn={() => setModalColumnOpen(true)}
        onExportExcel={handleExportExcel}
        onPrint={() => window.print()}
        onOpenMasterCatalog={() => setModalCatalogOpen(true)}
        onOpenFirebaseConfig={() => setModalFirebaseOpen(true)}
        onResetDefaults={handleResetDefaults}
      />

      <div className="container">
        <div className="edit-mode-banner">
          <div>
            <i className="fa-solid fa-wand-magic-sparkles" />{' '}
            <strong>Modo Edición Activado:</strong> Haz clic en cualquier título, texto, módulo,
            métrica o encabezado para editarlo. Usa los botones rojos para quitar tarjetas, columnas
            o secciones.
          </div>
          <button className="btn btn-sm btn-secondary" onClick={handleToggleEditMode}>
            Finalizar Edición
          </button>
        </div>

        <HeaderSection
          isEditMode={isEditMode}
          companyTitle={appState.companyTitle}
          reportTitle={appState.reportTitle}
          fundo={appState.fundo}
          modulo={
            appState.valves[currentValveIndex]?.modulo ??
            appState.valves[0]?.modulo ??
            appState.modulo
          }
          turno={
            appState.valves[currentValveIndex]?.turno ??
            appState.valves[0]?.turno ??
            appState.turno ??
            DEFAULT_HEADER_METADATA.turno
          }
          valvula={
            appState.valves[currentValveIndex]?.nombre ??
            appState.valves[0]?.nombre ??
            appState.valvula
          }
          variedad={
            appState.valves[currentValveIndex]?.variedad ??
            appState.valves[0]?.variedad ??
            appState.variedad
          }
          semana={appState.semana}
          fechaEvaluacion={appState.fechaEvaluacion}
          fechaAnterior={appState.fechaAnterior}
          growthRateBasis={appState.growthRateBasis}
          evaluador={appState.evaluador}
          activeWeek={appState.activeWeek}
          weeks={sortedWeeks}
          firestoreOnline={firestoreOnline}
          firestoreStatusText={firestoreStatusText}
          onUpdateField={handleUpdateHeaderField}
          onUpdateFechaEvaluacion={handleUpdateFechaEvaluacion}
          onUpdateFechaAnterior={handleUpdateFechaAnterior}
          onUpdateGrowthRateBasis={handleUpdateGrowthRateBasis}
          onChangeActiveWeek={handleChangeActiveWeek}
          onAddNewWeek={handleAddNewWeek}
          onOpenFirebaseConfig={() => setModalFirebaseOpen(true)}
        />

        <div className="view-selector-bar">
          <button
            className={`view-btn ${currentView === 'valve' ? 'active' : ''}`}
            id="btnViewValve"
            onClick={() => setCurrentView('valve')}
          >
            <i className="fa-solid fa-faucet-drip" /> 1. Vista por Válvula (3 Plantas &amp; 3
            Flujos)
          </button>
          <button
            className={`view-btn ${currentView === 'table' ? 'active' : ''}`}
            id="btnViewTable"
            onClick={() => setCurrentView('table')}
          >
            <i className="fa-solid fa-table" /> 2. Tabla Consolidada General (Módulos &amp;
            Válvulas)
          </button>
          <button
            className={`view-btn ${currentView === 'shoots' ? 'active' : ''}`}
            id="btnViewShoots"
            onClick={() => setCurrentView('shoots')}
          >
            <i className="fa-solid fa-list-ol" /> 3. Matriz Brote a Brote (15 Brotes / Planta)
          </button>
        </div>

        {currentView === 'valve' && (
          <ValveView
            valvesData={appState.valves}
            masterCatalog={masterCatalog}
            currentValveIndex={currentValveIndex}
            selectedModuleFilter={selectedModuleFilter}
            isEditMode={isEditMode}
            weeklyModuleData={appState.weeklyModuleData}
            activeWeek={appState.activeWeek}
            fechaEvaluacion={appState.fechaEvaluacion}
            fechaAnterior={appState.fechaAnterior}
            growthRateBasis={appState.growthRateBasis}
            onFilterByModule={handleFilterValvesByModule}
            onSelectValve={handleSelectValve}
            onAddNewValve={handleAddNewValve}
            onDeleteValve={handleDeleteValve}
            onUpdateValveMeta={handleUpdateValveMeta}
            onAddPlantToValve={handleAddPlantToCurrentValve}
            onDeletePlantFromValve={handleDeletePlantFromCurrentValve}
            onUpdatePlantField={handleUpdatePlantField}
            onUpdateShootValue={(pIdx, flushKey, bIdx, prop, val) =>
              handleUpdateShootValue(currentValveIndex, pIdx, flushKey, bIdx, prop, val)
            }
          />
        )}

        {currentView === 'table' && (
          <ConsolidatedTableView
            valvesData={appState.valves}
            currentColumns={appState.columns}
            weeklyModuleData={appState.weeklyModuleData}
            activeWeek={appState.activeWeek}
            fechaEvaluacion={appState.fechaEvaluacion}
            fechaAnterior={appState.fechaAnterior}
            growthRateBasis={appState.growthRateBasis}
            titleTable={appState.titleTable || DEFAULT_HEADER_METADATA.titleTable}
            isEditMode={isEditMode}
            onUpdateTitleTable={(title) =>
              updateStateAndPersist((prev) => ({ ...prev, titleTable: title }))
            }
            onAddNewValve={handleAddNewValve}
            onOpenNewColumn={() => setModalColumnOpen(true)}
            onDeleteColumn={handleDeleteColumn}
            onUpdateColumnTitle={(colId, newTitle) =>
              updateStateAndPersist((prev) => ({
                ...prev,
                columns: prev.columns.map((c) =>
                  c.id === colId ? { ...c, title: newTitle } : c,
                ),
              }))
            }
            onUpdateFlatCell={handleUpdateFlatCell}
            onOpenPlantDetail={(vIdx) => {
              handleSelectValve(vIdx);
              setCurrentView('valve');
            }}
          />
        )}

        {currentView === 'shoots' && (
          <ShootsMatrixView
            valvesData={appState.valves}
            onUpdateShootDirect={handleUpdateShootValue}
          />
        )}

        <ChartsSection
          valvesData={appState.valves}
          weeklyModuleData={appState.weeklyModuleData}
          titleCharts={appState.titleCharts || DEFAULT_HEADER_METADATA.titleCharts}
          isEditMode={isEditMode}
          onUpdateTitleCharts={(title) =>
            updateStateAndPersist((prev) => ({ ...prev, titleCharts: title }))
          }
        />

        <GrowthRateSummarySection
          valvesData={appState.valves}
          masterCatalog={masterCatalog}
          weeklyModuleData={appState.weeklyModuleData}
          weeklyTurnoData={appState.weeklyTurnoData || {}}
          weeklyDates={appState.weeklyDates}
          activeWeek={appState.activeWeek}
          initialBasis={appState.growthRateBasis}
          titleGrowthSummary={
            appState.titleGrowthSummary || DEFAULT_HEADER_METADATA.titleGrowthSummary
          }
          isEditMode={isEditMode}
          onUpdateTitle={(title) =>
            updateStateAndPersist((prev) => ({ ...prev, titleGrowthSummary: title }))
          }
        />

        <KpisSection
          kpis={appState.kpis}
          valvesData={appState.valves}
          masterCatalog={masterCatalog}
          weeklyModuleData={appState.weeklyModuleData}
          weeklyTurnoData={appState.weeklyTurnoData || {}}
          weeklyDates={appState.weeklyDates}
          activeWeek={appState.activeWeek}
          fechaEvaluacion={appState.fechaEvaluacion}
          fechaAnterior={appState.fechaAnterior}
          growthRateBasis={appState.growthRateBasis}
          titleKpis={appState.titleKpis || DEFAULT_HEADER_METADATA.titleKpis}
          isEditMode={isEditMode}
          onUpdateTitleKpis={(title) =>
            updateStateAndPersist((prev) => ({ ...prev, titleKpis: title }))
          }
          onOpenNewMetric={() => setModalMetricOpen(true)}
          onUpdateKpiField={(idx, field, val) =>
            updateStateAndPersist((prev) => ({
              ...prev,
              kpis: prev.kpis.map((k, i) => (i === idx ? { ...k, [field]: val } : k)),
            }))
          }
          onRemoveKpi={handleRemoveKpi}
        />

        <AgronomySections
          isEditMode={isEditMode}
          showAgronomiaSection={showAgronomiaSection}
          titleAgronomia={appState.titleAgronomia || DEFAULT_HEADER_METADATA.titleAgronomia}
          notes={appState.notes}
          checklist={appState.checklist || DEFAULT_CHECKLIST}
          customSections={appState.customSections || []}
          onUpdateTitleAgronomia={(title) =>
            updateStateAndPersist((prev) => ({ ...prev, titleAgronomia: title }))
          }
          onUpdateNotes={(notes) => updateStateAndPersist((prev) => ({ ...prev, notes }))}
          onToggleChecklistItem={(id) =>
            updateStateAndPersist((prev) => ({
              ...prev,
              checklist: (prev.checklist || DEFAULT_CHECKLIST).map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item,
              ),
            }))
          }
          onUpdateChecklistText={(id, text) =>
            updateStateAndPersist((prev) => ({
              ...prev,
              checklist: (prev.checklist || DEFAULT_CHECKLIST).map((item) =>
                item.id === id ? { ...item, text } : item,
              ),
            }))
          }
          onAddChecklistItem={() => {
            const newItem: ChecklistItem = {
              id: 'chk-' + Date.now(),
              checked: false,
              text: 'Nueva tarea agronómica o de manejo...',
            };
            updateStateAndPersist((prev) => ({
              ...prev,
              checklist: [...(prev.checklist || DEFAULT_CHECKLIST), newItem],
            }));
          }}
          onRemoveChecklistItem={(id) =>
            updateStateAndPersist((prev) => ({
              ...prev,
              checklist: (prev.checklist || DEFAULT_CHECKLIST).filter((item) => item.id !== id),
            }))
          }
          onHideAgronomiaSection={() => {
            setDialogRequest({
              mode: 'confirm',
              title: 'Eliminar Sección',
              message: '¿Estás seguro de eliminar esta sección?',
              onConfirm: () => setShowAgronomiaSection(false),
            });
          }}
          onAddCustomSection={handleAddCustomSection}
          onUpdateCustomSectionTitle={(id, title) =>
            updateStateAndPersist((prev) => ({
              ...prev,
              customSections: (prev.customSections || []).map((s) =>
                s.id === id ? { ...s, title } : s,
              ),
            }))
          }
          onUpdateCustomSectionNotes={(id, notes) =>
            updateStateAndPersist((prev) => ({
              ...prev,
              customSections: (prev.customSections || []).map((s) =>
                s.id === id ? { ...s, notes } : s,
              ),
            }))
          }
          onRemoveCustomSection={(id) => {
            setDialogRequest({
              mode: 'confirm',
              title: 'Eliminar Sección',
              message: '¿Estás seguro de eliminar esta sección?',
              onConfirm: () => {
                updateStateAndPersist((prev) => ({
                  ...prev,
                  customSections: (prev.customSections || []).filter((s) => s.id !== id),
                }));
              },
            });
          }}
        />
      </div>

      <NewMetricModal
        open={modalMetricOpen}
        onClose={() => setModalMetricOpen(false)}
        onCreate={handleCreateCustomMetric}
      />

      <NewColumnModal
        open={modalColumnOpen}
        onClose={() => setModalColumnOpen(false)}
        onCreate={handleCreateCustomColumn}
      />

      <FirebaseModal
        open={modalFirebaseOpen}
        firestoreOnline={firestoreOnline}
        firestoreStatusText={firestoreStatusText}
        initialApiKey={getActiveFirebaseApiKey()}
        onClose={() => setModalFirebaseOpen(false)}
        onForceSync={handleForceSyncToFirestore}
        onForceReload={handleForceReloadFromFirestore}
        onSaveSettings={handleSaveFirebaseSettings}
      />

      <MasterCatalogModal
        open={modalCatalogOpen}
        catalog={masterCatalog}
        onClose={() => setModalCatalogOpen(false)}
        onSaveCatalog={handleSaveMasterCatalog}
        onNotify={notify}
      />

      <ActionDialogModal
        dialog={dialogRequest}
        onClose={() => setDialogRequest(null)}
        lookupAutoCatalog={lookupAutoCatalog}
      />

      <footer>
        <p>
          <strong>Reiter Peruvian Berry S.A.C.</strong> &copy; 2026 - Control y Registro de
          Fenología de Arándanos
        </p>
        <p style={{ marginTop: '4px' }}>
          Página 100% editable: adapta títulos, módulos, válvulas, flujos y parámetros según tus
          evaluaciones de campo.
        </p>
      </footer>
    </div>
  );
}
