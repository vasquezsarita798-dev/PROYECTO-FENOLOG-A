export type ViewMode = 'valve' | 'table' | 'shoots';
export type GrowthChartMetric = 'longitud' | 'diametro' | 'brotes' | 'flujos';
export type FlushKey = 'flujo1' | 'flujo2' | 'flujo3';

export interface ShootMeasurement {
  num: number;
  longitud: number;
  diametro: number;
}

export type GrowthRateBasis = 'global' | 'flujo1' | 'flujo2' | 'flujo3';

export interface PlantData {
  id: string;
  nombre: string;
  cant_flujo1?: number;
  cant_flujo2?: number;
  cant_flujo3?: number;
  prev_long_f1?: number;
  prev_long_f2?: number;
  prev_long_f3?: number;
  induccion: number;
  inactivos: number;
  vigorosos: number;
  no_vigorosos: number;
  basales: number;
  retonos: number;
  dias: number;
  observaciones: string;
  flujo1: ShootMeasurement[];
  flujo2?: ShootMeasurement[];
  flujo3: ShootMeasurement[];
  customFields?: Record<string, string | number>;
}

export interface ValveData {
  id: string;
  nombre: string;
  modulo: string;
  turno?: string;
  fundo: string;
  variedad: string;
  plantas: PlantData[];
}

export interface WeeklyModuleStats {
  long_global: number;
  diam_global: number;
  brotes_planta: number;
  f1_long: number;
  f2_long: number;
  f3_long: number;
  induccion: number;
  inactivos: number;
  vigorosos: number;
  no_vigorosos: number;
  basales: number;
  retonos: number;
  tasa_global?: number;
  tasa_f1?: number;
  tasa_f2?: number;
  tasa_f3?: number;
}

export type WeeklyModuleData = Record<string, Record<string, WeeklyModuleStats>>;

export interface WeeklyTurnoStats {
  modulo: string;
  turno: string;
  long_global: number;
  f1_long: number;
  f2_long: number;
  f3_long: number;
  tasa_global?: number;
  tasa_f1?: number;
  tasa_f2?: number;
  tasa_f3?: number;
  diam_global?: number;
  brotes_planta?: number;
  induccion?: number;
  inactivos?: number;
  vigorosos?: number;
  no_vigorosos?: number;
  basales?: number;
  retonos?: number;
}

export type WeeklyTurnoData = Record<string, Record<string, WeeklyTurnoStats>>;

export interface TableColumn {
  id: string;
  title: string;
  type: 'text' | 'number';
  deletable: boolean;
  calcAvg?: boolean;
}

export interface KpiCard {
  id: string;
  title: string;
  value: string;
  unit: string;
  desc: string;
  icon: string;
  color: string;
  boundKey?: string;
}

export interface MasterCatalogItem {
  modulo: string;
  turno: string;
  valvula: string;
  variedad: string;
}

export interface ChecklistItem {
  id: string;
  checked: boolean;
  text: string;
}

export interface CustomSection {
  id: string;
  title: string;
  notes: string;
}

export interface FlattenedPlantRow {
  vIdx: number;
  pIdx: number;
  fundo: string;
  modulo: string;
  valvula: string;
  variedad: string;
  planta: string;
  cant_f1: number;
  long_f1: number;
  diam_f1: number;
  prev_long_f1: number;
  tasa_f1: number;
  cant_f2: number;
  long_f2: number;
  diam_f2: number;
  prev_long_f2: number;
  tasa_f2: number;
  cant_f3: number;
  long_f3: number;
  diam_f3: number;
  prev_long_f3: number;
  tasa_f3: number;
  long_prom: number;
  prev_long_prom: number;
  diam_prom: number;
  dias_eval: number;
  tasa: number;
  induccion: number;
  inactivos: number;
  vigorosos: number;
  no_vigorosos: number;
  basales: number;
  retonos: number;
  total_brotes: number;
  observaciones: string;
  [key: string]: string | number;
}

export interface AppState {
  companyTitle: string;
  reportTitle: string;
  fundo: string;
  modulo: string;
  turno?: string;
  valvula: string;
  variedad: string;
  semana: string;
  fechaEvaluacion: string;
  fechaAnterior: string;
  growthRateBasis: GrowthRateBasis;
  weeklyDates: Record<string, string>;
  evaluador: string;
  notes: string;
  valves: ValveData[];
  weeklyModuleData: WeeklyModuleData;
  weeklyTurnoData?: WeeklyTurnoData;
  activeWeek: string;
  kpis: KpiCard[];
  columns: TableColumn[];
  titleTable?: string;
  titleCharts?: string;
  titleGrowthSummary?: string;
  titleKpis?: string;
  titleAgronomia?: string;
  checklist?: ChecklistItem[];
  customSections?: CustomSection[];
}
