import { createDefaultShoots } from '../data/defaults';
import type {
  FlattenedPlantRow,
  GrowthRateBasis,
  KpiCard,
  MasterCatalogItem,
  PlantData,
  ShootMeasurement,
  ValveData,
  WeeklyModuleData,
  WeeklyModuleStats,
  WeeklyTurnoData,
  WeeklyTurnoStats,
} from '../types/phenology';

export function normalizeWeekKey(week: string): string {
  const cleaned = (week || '').replace(/^\s*semana\s+/i, '').trim();
  return cleaned || '47';
}

export function normalizeModuleNumber(raw?: string): string {
  const str = (raw || '').trim();
  const base = str.replace(/\([^)]*\)/g, '').trim();
  const digits = base.replace(/\D+/g, '');
  if (digits) return digits;
  const cleaned = base.replace(/^\s*(m[oó]dulo|mod\.?|m\.?)\s*#?-?/i, '').trim();
  return cleaned || '1';
}

export function normalizeTurnoNumber(raw?: string): string {
  const str = (raw || '').trim();
  if (!str) return '1';
  const digits = str.replace(/\D+/g, '');
  if (digits) return digits;
  const letterMatch = str.replace(/^\s*turno\s+/i, '').trim().toUpperCase();
  if (/^[A-Z]$/.test(letterMatch)) {
    return String(letterMatch.charCodeAt(0) - 64);
  }
  return '1';
}

export function normalizeValveNumber(valvula?: string): string {
  const raw = (valvula || '').trim();
  const digits = raw.replace(/\D+/g, '');
  if (digits) return digits;
  const cleaned = raw.replace(/^\s*(v[aá]lvula|valv\.?|v\.?)\s*#?-?/i, '').trim();
  return cleaned || '01';
}

export function splitHeaderModuleAndTurno(
  rawModulo?: string,
  rawTurno?: string,
): { modulo: string; turno: string } {
  const modStr = (rawModulo || '').trim();
  const turnoStr = (rawTurno || '').trim();
  if (!turnoStr && modStr) {
    const match = modStr.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (match) {
      return {
        modulo: normalizeModuleNumber(match[1]),
        turno: normalizeTurnoNumber(match[2]),
      };
    }
  }
  return {
    modulo: normalizeModuleNumber(modStr),
    turno: normalizeTurnoNumber(turnoStr),
  };
}

export function normalizeMasterCatalog(catalog: MasterCatalogItem[]): MasterCatalogItem[] {
  return (catalog || []).map((item) => ({
    modulo: normalizeModuleNumber(item.modulo),
    turno: normalizeTurnoNumber(item.turno),
    valvula: normalizeValveNumber(item.valvula),
    variedad: (item.variedad || 'Ventura').trim(),
  }));
}

export function normalizeValvesList(
  valves: ValveData[],
  catalog: MasterCatalogItem[] = [],
): ValveData[] {
  return (valves || []).map((v) => {
    const mod = normalizeModuleNumber(v.modulo);
    const val = normalizeValveNumber(v.nombre);
    const catMatch = getAutoCatalogMatch(catalog, mod, val);
    const turnoRaw = v.turno || catMatch?.turno;
    return {
      ...v,
      nombre: val,
      modulo: mod,
      turno: normalizeTurnoNumber(turnoRaw),
    };
  });
}

export function normalizeWeeklyModuleData(data: WeeklyModuleData): WeeklyModuleData {
  const result: WeeklyModuleData = {};
  Object.keys(data || {}).forEach((k) => {
    const nk = normalizeWeekKey(k);
    const weekObj = data[k] || {};
    const normalizedMods: Record<string, WeeklyModuleStats> = { ...(result[nk] || {}) };
    Object.keys(weekObj).forEach((mKey) => {
      const nm = normalizeModuleNumber(mKey);
      normalizedMods[nm] = weekObj[mKey];
    });
    result[nk] = normalizedMods;
  });
  return result;
}

export function normalizeWeeklyTurnoData(data: WeeklyTurnoData): WeeklyTurnoData {
  const result: WeeklyTurnoData = {};
  Object.keys(data || {}).forEach((k) => {
    const nk = normalizeWeekKey(k);
    const weekMap = data[k] || {};
    const normalizedMap: Record<string, WeeklyTurnoStats> = { ...(result[nk] || {}) };
    Object.entries(weekMap).forEach(([, stats]) => {
      const nm = normalizeModuleNumber(stats.modulo);
      const nt = normalizeTurnoNumber(stats.turno);
      const nKey = `${nm}||${nt}`;
      normalizedMap[nKey] = {
        ...stats,
        modulo: nm,
        turno: nt,
      };
    });
    result[nk] = normalizedMap;
  });
  return result;
}

export function normalizeWeeklyDates(dates: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  Object.keys(dates || {}).forEach((k) => {
    const nk = normalizeWeekKey(k);
    if (dates[k]) result[nk] = dates[k];
  });
  return result;
}

export function getSortedWeekKeys(weeklyModuleData: WeeklyModuleData): string[] {
  return Object.keys(weeklyModuleData).sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

export function getPreviousWeekKey(
  weeklyModuleData: WeeklyModuleData,
  activeWeek: string,
): string | null {
  const keys = getSortedWeekKeys(weeklyModuleData);
  const normActive = normalizeWeekKey(activeWeek);
  const idx = keys.indexOf(normActive);
  if (idx > 0) return keys[idx - 1];
  return null;
}

export function getDaysBetweenDates(fechaAnterior?: string, fechaEvaluacion?: string): number {
  if (!fechaAnterior || !fechaEvaluacion) return 0;
  const parseYmd = (str: string) => {
    const parts = str.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  };
  const tPrev = parseYmd(fechaAnterior);
  const tCurr = parseYmd(fechaEvaluacion);
  if (tPrev === null || tCurr === null) return 0;
  const diff = Math.round((tCurr - tPrev) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function addDaysToYmd(ymd: string, days: number): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date().toISOString().slice(0, 10);
  }
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  return dt.toISOString().slice(0, 10);
}

export function formatDisplayDate(ymd?: string): string {
  if (!ymd) return '-';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getAutoCatalogMatch(
  masterCatalog: MasterCatalogItem[],
  modulo: string,
  valvula: string,
): MasterCatalogItem | null {
  if (!valvula) return null;
  const cleanV = String(parseInt(normalizeValveNumber(valvula), 10) || normalizeValveNumber(valvula));
  const cleanM = normalizeModuleNumber(modulo);

  let match = masterCatalog.find((item) => {
    const itemVNum = normalizeValveNumber(item.valvula);
    const itemV = String(parseInt(itemVNum, 10) || itemVNum);
    const itemM = normalizeModuleNumber(item.modulo);
    return itemV === cleanV && itemM === cleanM;
  });

  if (!match) {
    match = masterCatalog.find((item) => {
      const itemVNum = normalizeValveNumber(item.valvula);
      const itemV = String(parseInt(itemVNum, 10) || itemVNum);
      return itemV === cleanV;
    });
  }

  return match || null;
}

export function resolveValveTurno(
  valve: ValveData,
  masterCatalog: MasterCatalogItem[] = [],
): string {
  if (valve.turno && valve.turno.trim()) return normalizeTurnoNumber(valve.turno);
  const match = getAutoCatalogMatch(masterCatalog, valve.modulo, valve.nombre);
  if (match?.turno && match.turno.trim()) return normalizeTurnoNumber(match.turno);
  const parenMatch = (valve.modulo || '').match(/\(([^)]+)\)/);
  if (parenMatch) return normalizeTurnoNumber(parenMatch[1]);
  return '1';
}

export function getShootsAvg(
  shootsArr: ShootMeasurement[] | undefined,
  prop: 'longitud' | 'diametro',
): number {
  if (!shootsArr || shootsArr.length === 0) return 0;
  let sum = 0;
  shootsArr.forEach((s) => {
    sum += parseFloat(String(s[prop])) || 0;
  });
  return +(sum / shootsArr.length).toFixed(1);
}

export function resolvePlantPreviousLengths(
  plant: PlantData,
  modulo: string,
  f1Long: number,
  f2Long: number,
  f3Long: number,
  weeklyModuleData: WeeklyModuleData,
  activeWeek: string,
): { prevF1: number; prevF2: number; prevF3: number; prevProm: number } {
  const isUnmeasuredZero =
    f1Long === 0 &&
    f2Long === 0 &&
    f3Long === 0 &&
    plant.prev_long_f1 === undefined &&
    plant.prev_long_f2 === undefined &&
    plant.prev_long_f3 === undefined;

  if (isUnmeasuredZero) {
    return { prevF1: 0, prevF2: 0, prevF3: 0, prevProm: 0 };
  }

  const prevWeek = getPreviousWeekKey(weeklyModuleData, activeWeek);
  const prevModStats = prevWeek ? weeklyModuleData[prevWeek]?.[modulo] : undefined;

  const prevF1 =
    plant.prev_long_f1 !== undefined
      ? plant.prev_long_f1
      : prevModStats?.f1_long !== undefined
        ? prevModStats.f1_long
        : f1Long;

  const prevF2 =
    plant.prev_long_f2 !== undefined
      ? plant.prev_long_f2
      : prevModStats?.f2_long !== undefined
        ? prevModStats.f2_long
        : f2Long;

  const prevF3 =
    plant.prev_long_f3 !== undefined
      ? plant.prev_long_f3
      : prevModStats?.f3_long !== undefined
        ? prevModStats.f3_long
        : f3Long;

  const prevProm = +((prevF1 + prevF2 + prevF3) / 3).toFixed(1);
  return { prevF1, prevF2, prevF3, prevProm };
}

export interface CalcOptions {
  weeklyModuleData?: WeeklyModuleData;
  activeWeek?: string;
  fechaEvaluacion?: string;
  fechaAnterior?: string;
  growthRateBasis?: GrowthRateBasis;
  masterCatalog?: MasterCatalogItem[];
}

export function getFlattenedPlantRows(
  valvesData: ValveData[],
  options: CalcOptions = {},
): FlattenedPlantRow[] {
  const {
    weeklyModuleData = {},
    activeWeek = '47',
    fechaEvaluacion = '',
    fechaAnterior = '',
    growthRateBasis = 'global',
    masterCatalog = [],
  } = options;

  const diasEval = getDaysBetweenDates(fechaAnterior, fechaEvaluacion);
  const rows: FlattenedPlantRow[] = [];

  valvesData.forEach((valve, vIdx) => {
    const modulo = normalizeModuleNumber(valve.modulo);
    const turno = resolveValveTurno(valve, masterCatalog);
    const valvulaNum = normalizeValveNumber(valve.nombre);
    valve.plantas.forEach((plant, pIdx) => {
      const flujo2 = plant.flujo2 || createDefaultShoots(25.0, 4.5);
      const f1Long = getShootsAvg(plant.flujo1, 'longitud');
      const f1Diam = getShootsAvg(plant.flujo1, 'diametro');
      const f2Long = getShootsAvg(flujo2, 'longitud');
      const f2Diam = getShootsAvg(flujo2, 'diametro');
      const f3Long = getShootsAvg(plant.flujo3, 'longitud');
      const f3Diam = getShootsAvg(plant.flujo3, 'diametro');

      const longProm = +((f1Long + f2Long + f3Long) / 3).toFixed(1);
      const diamProm = +((f1Diam + f2Diam + f3Diam) / 3).toFixed(1);

      const { prevF1, prevF2, prevF3, prevProm } = resolvePlantPreviousLengths(
        plant,
        modulo,
        f1Long,
        f2Long,
        f3Long,
        weeklyModuleData,
        activeWeek,
      );

      const effectiveDays = diasEval > 0 ? diasEval : plant.dias || 0;
      const tasaF1 = effectiveDays > 0 ? +((f1Long - prevF1) / effectiveDays).toFixed(2) : 0;
      const tasaF2 = effectiveDays > 0 ? +((f2Long - prevF2) / effectiveDays).toFixed(2) : 0;
      const tasaF3 = effectiveDays > 0 ? +((f3Long - prevF3) / effectiveDays).toFixed(2) : 0;
      const tasaGlobal =
        effectiveDays > 0 ? +((longProm - prevProm) / effectiveDays).toFixed(2) : 0;

      let tasa = tasaGlobal;
      if (growthRateBasis === 'flujo1') tasa = tasaF1;
      else if (growthRateBasis === 'flujo2') tasa = tasaF2;
      else if (growthRateBasis === 'flujo3') tasa = tasaF3;

      const cantF1 = plant.cant_flujo1 !== undefined ? plant.cant_flujo1 : 5;
      const cantF2 = plant.cant_flujo2 !== undefined ? plant.cant_flujo2 : 5;
      const cantF3 = plant.cant_flujo3 !== undefined ? plant.cant_flujo3 : 5;
      const totalBrotes = cantF1 + cantF2 + cantF3;

      rows.push({
        ...(plant.customFields || {}),
        vIdx,
        pIdx,
        fundo: valve.fundo || 'Fundo Don Luis',
        modulo,
        turno,
        valvula: valvulaNum,
        variedad: valve.variedad ?? 'Ventura',
        planta: plant.nombre,
        cant_f1: cantF1,
        long_f1: f1Long,
        diam_f1: f1Diam,
        prev_long_f1: prevF1,
        tasa_f1: tasaF1,
        cant_f2: cantF2,
        long_f2: f2Long,
        diam_f2: f2Diam,
        prev_long_f2: prevF2,
        tasa_f2: tasaF2,
        cant_f3: cantF3,
        long_f3: f3Long,
        diam_f3: f3Diam,
        prev_long_f3: prevF3,
        tasa_f3: tasaF3,
        long_prom: longProm,
        prev_long_prom: prevProm,
        diam_prom: diamProm,
        dias_eval: effectiveDays,
        tasa,
        induccion: plant.induccion || 0,
        inactivos: plant.inactivos || 0,
        vigorosos: plant.vigorosos || 0,
        no_vigorosos: plant.no_vigorosos || 0,
        basales: plant.basales || 0,
        retonos: plant.retonos || 0,
        total_brotes: totalBrotes,
        observaciones: plant.observaciones || '',
      });
    });
  });

  return rows;
}

export function calculateMetricsAndWeeklyUpdate(
  valvesData: ValveData[],
  weeklyModuleData: WeeklyModuleData,
  activeWeek: string,
  kpis: KpiCard[],
  fechaEvaluacion = '',
  fechaAnterior = '',
  growthRateBasis: GrowthRateBasis = 'global',
  weeklyTurnoData: WeeklyTurnoData = {},
  masterCatalog: MasterCatalogItem[] = [],
): {
  updatedWeeklyData: WeeklyModuleData;
  updatedWeeklyTurnoData: WeeklyTurnoData;
  updatedKpis: KpiCard[];
} {
  const normWeek = normalizeWeekKey(activeWeek);
  const flatRows = getFlattenedPlantRows(valvesData, {
    weeklyModuleData,
    activeWeek: normWeek,
    fechaEvaluacion,
    fechaAnterior,
    growthRateBasis,
    masterCatalog,
  });

  if (flatRows.length === 0) {
    return {
      updatedWeeklyData: weeklyModuleData,
      updatedWeeklyTurnoData: weeklyTurnoData,
      updatedKpis: kpis,
    };
  }

  let sumLong = 0;
  let sumDiam = 0;
  let sumTasa = 0;
  let sumBrotes = 0;
  let sumInduccion = 0;
  let sumInactivos = 0;
  let sumVigor = 0;
  let sumNoVigor = 0;
  let sumBasales = 0;
  let sumRetonos = 0;

  const modSums: Record<
    string,
    {
      count: number;
      longSum: number;
      diamSum: number;
      brotesSum: number;
      f1LongSum: number;
      f2LongSum: number;
      f3LongSum: number;
      indSum: number;
      inactSum: number;
      vigSum: number;
      noVigSum: number;
      basSum: number;
      retSum: number;
      tasaGlobalSum: number;
      tasaF1Sum: number;
      tasaF2Sum: number;
      tasaF3Sum: number;
    }
  > = {};

  const turnoSums: Record<
    string,
    {
      modulo: string;
      turno: string;
      count: number;
      longSum: number;
      diamSum: number;
      brotesSum: number;
      f1LongSum: number;
      f2LongSum: number;
      f3LongSum: number;
      indSum: number;
      inactSum: number;
      vigSum: number;
      noVigSum: number;
      basSum: number;
      retSum: number;
      tasaGlobalSum: number;
      tasaF1Sum: number;
      tasaF2Sum: number;
      tasaF3Sum: number;
    }
  > = {};

  const diasEval = getDaysBetweenDates(fechaAnterior, fechaEvaluacion);

  flatRows.forEach((r) => {
    sumLong += r.long_prom;
    sumDiam += r.diam_prom;
    sumTasa += r.tasa;
    sumBrotes += r.total_brotes;
    sumInduccion += r.induccion;
    sumInactivos += r.inactivos;
    sumVigor += r.vigorosos;
    sumNoVigor += r.no_vigorosos;
    sumBasales += r.basales;
    sumRetonos += r.retonos;

    const m = r.modulo || '1';
    const t = String(r.turno || '1');
    const effDays = diasEval > 0 ? diasEval : r.dias_eval || 7;
    const tasaGlobalPlant =
      effDays > 0 ? +((r.long_prom - r.prev_long_prom) / effDays).toFixed(2) : 0;

    if (!modSums[m]) {
      modSums[m] = {
        count: 0,
        longSum: 0,
        diamSum: 0,
        brotesSum: 0,
        f1LongSum: 0,
        f2LongSum: 0,
        f3LongSum: 0,
        indSum: 0,
        inactSum: 0,
        vigSum: 0,
        noVigSum: 0,
        basSum: 0,
        retSum: 0,
        tasaGlobalSum: 0,
        tasaF1Sum: 0,
        tasaF2Sum: 0,
        tasaF3Sum: 0,
      };
    }

    modSums[m].count++;
    modSums[m].longSum += r.long_prom;
    modSums[m].diamSum += r.diam_prom;
    modSums[m].brotesSum += r.total_brotes;
    modSums[m].f1LongSum += r.long_f1;
    modSums[m].f2LongSum += r.long_f2;
    modSums[m].f3LongSum += r.long_f3;
    modSums[m].indSum += r.induccion;
    modSums[m].inactSum += r.inactivos;
    modSums[m].vigSum += r.vigorosos;
    modSums[m].noVigSum += r.no_vigorosos;
    modSums[m].basSum += r.basales;
    modSums[m].retSum += r.retonos;
    modSums[m].tasaGlobalSum += tasaGlobalPlant;
    modSums[m].tasaF1Sum += r.tasa_f1;
    modSums[m].tasaF2Sum += r.tasa_f2;
    modSums[m].tasaF3Sum += r.tasa_f3;

    const mtKey = `${m}||${t}`;
    if (!turnoSums[mtKey]) {
      turnoSums[mtKey] = {
        modulo: m,
        turno: t,
        count: 0,
        longSum: 0,
        diamSum: 0,
        brotesSum: 0,
        f1LongSum: 0,
        f2LongSum: 0,
        f3LongSum: 0,
        indSum: 0,
        inactSum: 0,
        vigSum: 0,
        noVigSum: 0,
        basSum: 0,
        retSum: 0,
        tasaGlobalSum: 0,
        tasaF1Sum: 0,
        tasaF2Sum: 0,
        tasaF3Sum: 0,
      };
    }

    turnoSums[mtKey].count++;
    turnoSums[mtKey].longSum += r.long_prom;
    turnoSums[mtKey].diamSum += r.diam_prom;
    turnoSums[mtKey].brotesSum += r.total_brotes;
    turnoSums[mtKey].f1LongSum += r.long_f1;
    turnoSums[mtKey].f2LongSum += r.long_f2;
    turnoSums[mtKey].f3LongSum += r.long_f3;
    turnoSums[mtKey].indSum += r.induccion;
    turnoSums[mtKey].inactSum += r.inactivos;
    turnoSums[mtKey].vigSum += r.vigorosos;
    turnoSums[mtKey].noVigSum += r.no_vigorosos;
    turnoSums[mtKey].basSum += r.basales;
    turnoSums[mtKey].retSum += r.retonos;
    turnoSums[mtKey].tasaGlobalSum += tasaGlobalPlant;
    turnoSums[mtKey].tasaF1Sum += r.tasa_f1;
    turnoSums[mtKey].tasaF2Sum += r.tasa_f2;
    turnoSums[mtKey].tasaF3Sum += r.tasa_f3;
  });

  const count = flatRows.length;
  const calculatedValues: Record<string, string> = {
    avgLongGlobal: (sumLong / count).toFixed(1),
    avgDiamGlobal: (sumDiam / count).toFixed(1),
    avgTasaGlobal: (sumTasa / count).toFixed(2),
    avgBrotesGlobal: (sumBrotes / count).toFixed(1),
    avgInduccion: (sumInduccion / count).toFixed(1),
    avgInactivos: (sumInactivos / count).toFixed(1),
    vigorRatio: `${(sumVigor / count).toFixed(1)} / ${(sumNoVigor / count).toFixed(1)}`,
    basalesRatio: `${(sumBasales / count).toFixed(1)} / ${(sumRetonos / count).toFixed(1)}`,
  };

  const activeWeekModules: Record<string, WeeklyModuleStats> = {};
  Object.keys(modSums).forEach((m) => {
    const mc = modSums[m];
    activeWeekModules[m] = {
      long_global: +(mc.longSum / mc.count).toFixed(1),
      diam_global: +(mc.diamSum / mc.count).toFixed(1),
      brotes_planta: +(mc.brotesSum / mc.count).toFixed(1),
      f1_long: +(mc.f1LongSum / mc.count).toFixed(1),
      f2_long: +(mc.f2LongSum / mc.count).toFixed(1),
      f3_long: +(mc.f3LongSum / mc.count).toFixed(1),
      induccion: +(mc.indSum / mc.count).toFixed(1),
      inactivos: +(mc.inactSum / mc.count).toFixed(1),
      vigorosos: +(mc.vigSum / mc.count).toFixed(1),
      no_vigorosos: +(mc.noVigSum / mc.count).toFixed(1),
      basales: +(mc.basSum / mc.count).toFixed(1),
      retonos: +(mc.retSum / mc.count).toFixed(1),
      tasa_global: +(mc.tasaGlobalSum / mc.count).toFixed(2),
      tasa_f1: +(mc.tasaF1Sum / mc.count).toFixed(2),
      tasa_f2: +(mc.tasaF2Sum / mc.count).toFixed(2),
      tasa_f3: +(mc.tasaF3Sum / mc.count).toFixed(2),
    };
  });

  const activeWeekTurnos: Record<string, WeeklyTurnoStats> = {};
  Object.keys(turnoSums).forEach((mtKey) => {
    const tc = turnoSums[mtKey];
    activeWeekTurnos[mtKey] = {
      modulo: tc.modulo,
      turno: tc.turno,
      long_global: +(tc.longSum / tc.count).toFixed(1),
      diam_global: +(tc.diamSum / tc.count).toFixed(1),
      brotes_planta: +(tc.brotesSum / tc.count).toFixed(1),
      f1_long: +(tc.f1LongSum / tc.count).toFixed(1),
      f2_long: +(tc.f2LongSum / tc.count).toFixed(1),
      f3_long: +(tc.f3LongSum / tc.count).toFixed(1),
      induccion: +(tc.indSum / tc.count).toFixed(1),
      inactivos: +(tc.inactSum / tc.count).toFixed(1),
      vigorosos: +(tc.vigSum / tc.count).toFixed(1),
      no_vigorosos: +(tc.noVigSum / tc.count).toFixed(1),
      basales: +(tc.basSum / tc.count).toFixed(1),
      retonos: +(tc.retSum / tc.count).toFixed(1),
      tasa_global: +(tc.tasaGlobalSum / tc.count).toFixed(2),
      tasa_f1: +(tc.tasaF1Sum / tc.count).toFixed(2),
      tasa_f2: +(tc.tasaF2Sum / tc.count).toFixed(2),
      tasa_f3: +(tc.tasaF3Sum / tc.count).toFixed(2),
    };
  });

  const updatedWeeklyData: WeeklyModuleData = {
    ...weeklyModuleData,
    [normWeek]: {
      ...(weeklyModuleData[normWeek] || {}),
      ...activeWeekModules,
    },
  };

  const updatedWeeklyTurnoData: WeeklyTurnoData = {
    ...weeklyTurnoData,
    [normWeek]: activeWeekTurnos,
  };

  const basisLabel =
    growthRateBasis === 'flujo1'
      ? '1er Flujo: (Actual - Ant.) / días'
      : growthRateBasis === 'flujo2'
        ? '2do Flujo: (Actual - Ant.) / días'
        : growthRateBasis === 'flujo3'
          ? '3er Flujo: (Actual - Ant.) / días'
          : '(Long. actual - Long. anterior) / días';

  const updatedKpis = kpis.map((kpi) => {
    if (kpi.boundKey && calculatedValues[kpi.boundKey] !== undefined) {
      if (kpi.boundKey === 'avgTasaGlobal') {
        return { ...kpi, value: calculatedValues[kpi.boundKey], desc: basisLabel };
      }
      return { ...kpi, value: calculatedValues[kpi.boundKey] };
    }
    return kpi;
  });

  return { updatedWeeklyData, updatedWeeklyTurnoData, updatedKpis };
}

export interface GrowthComparisonRow {
  key: string;
  modulo: string;
  label: string;
  ratesByWeek: Record<string, number | null>;
  deltaVsPrev: number | null;
  avgRate: number | null;
}

export function buildGrowthRateComparisonMatrix(
  valvesData: ValveData[],
  masterCatalog: MasterCatalogItem[],
  weeklyModuleData: WeeklyModuleData,
  weeklyTurnoData: WeeklyTurnoData,
  weeklyDates: Record<string, string>,
  activeWeek: string,
  basis: GrowthRateBasis,
  turnoFilter = 'ALL',
): {
  weeks: string[];
  availableTurnos: string[];
  rows: GrowthComparisonRow[];
  weekAverages: Record<string, number | null>;
} {
  const allWeeks = getSortedWeekKeys(weeklyModuleData);
  const weeks = allWeeks.length > 1 ? allWeeks.slice(1) : allWeeks;

  const turnoSet = new Set<string>();
  const modulesAll = new Set<string>();
  const modulesForTurno = new Set<string>();

  valvesData.forEach((v) => {
    const modulo = normalizeModuleNumber(v.modulo);
    const turno = resolveValveTurno(v, masterCatalog);
    turnoSet.add(turno);
    modulesAll.add(modulo);
    if (turnoFilter === 'ALL' || turno === turnoFilter) {
      modulesForTurno.add(modulo);
    }
  });

  Object.values(weeklyTurnoData || {}).forEach((weekMap) => {
    Object.values(weekMap || {}).forEach((stats) => {
      const m = stats.modulo ? normalizeModuleNumber(stats.modulo) : '';
      const t = stats.turno ? normalizeTurnoNumber(stats.turno) : '';
      if (t) turnoSet.add(t);
      if (m) {
        modulesAll.add(m);
        if (turnoFilter === 'ALL' || t === turnoFilter) {
          modulesForTurno.add(m);
        }
      }
    });
  });

  if (turnoFilter === 'ALL') {
    Object.values(weeklyModuleData || {}).forEach((weekObj) => {
      Object.keys(weekObj || {}).forEach((mod) => modulesAll.add(normalizeModuleNumber(mod)));
    });
  }

  const cmpNum = (a: string, b: string) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  const availableTurnos = Array.from(turnoSet).sort(cmpNum);
  const targetModules = Array.from(turnoFilter === 'ALL' ? modulesAll : modulesForTurno).sort(
    cmpNum,
  );

  const tasaProp: 'tasa_global' | 'tasa_f1' | 'tasa_f2' | 'tasa_f3' =
    basis === 'flujo1'
      ? 'tasa_f1'
      : basis === 'flujo2'
        ? 'tasa_f2'
        : basis === 'flujo3'
          ? 'tasa_f3'
          : 'tasa_global';

  const longProp: 'long_global' | 'f1_long' | 'f2_long' | 'f3_long' =
    basis === 'flujo1'
      ? 'f1_long'
      : basis === 'flujo2'
        ? 'f2_long'
        : basis === 'flujo3'
          ? 'f3_long'
          : 'long_global';

  const rows: GrowthComparisonRow[] = targetModules.map((modulo) => {
    const ratesByWeek: Record<string, number | null> = {};
    const validRates: number[] = [];

    weeks.forEach((w) => {
      const wIdx = allWeeks.indexOf(w);
      const prevW = wIdx > 0 ? allWeeks[wIdx - 1] : null;
      let rate: number | null = null;

      if (turnoFilter === 'ALL') {
        const modStats = weeklyModuleData?.[w]?.[modulo];
        if (modStats && modStats[tasaProp] !== undefined) {
          rate = modStats[tasaProp] ?? null;
        } else {
          const matchingTurnoEntries = Object.values(weeklyTurnoData?.[w] || {}).filter(
            (e) => e.modulo === modulo && e[tasaProp] !== undefined,
          );
          if (matchingTurnoEntries.length > 0) {
            const sum = matchingTurnoEntries.reduce((acc, e) => acc + (e[tasaProp] || 0), 0);
            rate = +(sum / matchingTurnoEntries.length).toFixed(2);
          } else if (prevW) {
            const prevModStats = weeklyModuleData?.[prevW]?.[modulo];
            if (modStats && prevModStats) {
              const days = getDaysBetweenDates(weeklyDates?.[prevW], weeklyDates?.[w]) || 7;
              rate = +((modStats[longProp] - prevModStats[longProp]) / days).toFixed(2);
            }
          }
        }
      } else {
        const mtKey = `${modulo}||${turnoFilter}`;
        const turnoStats = weeklyTurnoData?.[w]?.[mtKey];
        if (turnoStats && turnoStats[tasaProp] !== undefined) {
          rate = turnoStats[tasaProp] ?? null;
        } else if (prevW) {
          const currStats = turnoStats || weeklyModuleData?.[w]?.[modulo];
          const prevTurnoStats = weeklyTurnoData?.[prevW]?.[mtKey];
          const prevStats = prevTurnoStats || weeklyModuleData?.[prevW]?.[modulo];
          if (currStats && prevStats) {
            const days = getDaysBetweenDates(weeklyDates?.[prevW], weeklyDates?.[w]) || 7;
            rate = +((currStats[longProp] - prevStats[longProp]) / days).toFixed(2);
          }
        }
      }

      ratesByWeek[w] = rate;
      if (rate !== null) validRates.push(rate);
    });

    const normActive = normalizeWeekKey(activeWeek);
    const activeIdx = weeks.indexOf(normActive);
    const currWeekForDelta = activeIdx >= 0 ? normActive : weeks[weeks.length - 1];
    const prevWeekForDelta =
      activeIdx > 0
        ? weeks[activeIdx - 1]
        : weeks.length >= 2
          ? weeks[weeks.length - 2]
          : null;

    const currVal = currWeekForDelta ? ratesByWeek[currWeekForDelta] : null;
    const prevVal = prevWeekForDelta ? ratesByWeek[prevWeekForDelta] : null;
    const deltaVsPrev =
      currVal !== null && prevVal !== null ? +(currVal - prevVal).toFixed(2) : null;

    const avgRate =
      validRates.length > 0
        ? +(validRates.reduce((acc, v) => acc + v, 0) / validRates.length).toFixed(2)
        : null;

    return {
      key: modulo,
      modulo,
      label: modulo,
      ratesByWeek,
      deltaVsPrev,
      avgRate,
    };
  });

  const weekAverages: Record<string, number | null> = {};
  weeks.forEach((w) => {
    const vals = rows.map((r) => r.ratesByWeek[w]).filter((v): v is number => v !== null);
    weekAverages[w] =
      vals.length > 0 ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
  });

  return { weeks, availableTurnos, rows, weekAverages };
}

export interface SegmentedKpiResult {
  kpis: KpiCard[];
  sampleCount: number;
  sourceType: 'plantas' | 'turno_historico' | 'modulo_historico' | 'sin_datos';
  availableModules: string[];
  availableTurnos: string[];
  weeks: string[];
}

export function computeSegmentedKpis(params: {
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
  filterWeek: string;
  filterModulo: string;
  filterTurno: string;
}): SegmentedKpiResult {
  const {
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
  } = params;

  const weeks = getSortedWeekKeys(weeklyModuleData);
  const normActive = normalizeWeekKey(activeWeek);
  const targetWeek = normalizeWeekKey(filterWeek || normActive);

  const moduleSet = new Set<string>();
  const turnoSet = new Set<string>();
  const modulesForSelectedTurno = new Set<string>();

  valvesData.forEach((v) => {
    const m = normalizeModuleNumber(v.modulo);
    const t = resolveValveTurno(v, masterCatalog);
    moduleSet.add(m);
    turnoSet.add(t);
    if (filterTurno === 'ALL' || t === filterTurno) {
      modulesForSelectedTurno.add(m);
    }
  });

  Object.values(weeklyModuleData || {}).forEach((wObj) => {
    Object.keys(wObj || {}).forEach((m) => moduleSet.add(normalizeModuleNumber(m)));
  });

  Object.values(weeklyTurnoData || {}).forEach((wMap) => {
    Object.values(wMap || {}).forEach((s) => {
      const m = s.modulo ? normalizeModuleNumber(s.modulo) : '';
      const t = s.turno ? normalizeTurnoNumber(s.turno) : '';
      if (m) moduleSet.add(m);
      if (t) {
        turnoSet.add(t);
        if (filterTurno === 'ALL' || t === filterTurno) {
          if (m) modulesForSelectedTurno.add(m);
        }
      }
    });
  });

  const cmpNum = (a: string, b: string) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  const availableModules = Array.from(moduleSet).sort(cmpNum);
  const availableTurnos = Array.from(turnoSet).sort(cmpNum);

  const basisLabel =
    growthRateBasis === 'flujo1'
      ? '1er Flujo: (Actual - Ant.) / días'
      : growthRateBasis === 'flujo2'
        ? '2do Flujo: (Actual - Ant.) / días'
        : growthRateBasis === 'flujo3'
          ? '3er Flujo: (Actual - Ant.) / días'
          : '(Long. actual - Long. anterior) / días';

  const mapValuesToKpis = (vals: Record<string, string>): KpiCard[] =>
    kpis.map((kpi) => {
      if (kpi.boundKey && vals[kpi.boundKey] !== undefined) {
        if (kpi.boundKey === 'avgTasaGlobal') {
          return { ...kpi, value: vals[kpi.boundKey], desc: basisLabel };
        }
        return { ...kpi, value: vals[kpi.boundKey] };
      }
      return kpi;
    });

  const emptyValues: Record<string, string> = {
    avgLongGlobal: '-',
    avgDiamGlobal: '-',
    avgTasaGlobal: '-',
    avgBrotesGlobal: '-',
    avgInduccion: '-',
    avgInactivos: '-',
    vigorRatio: '- / -',
    basalesRatio: '- / -',
  };

  if (targetWeek === normActive) {
    const flatRows = getFlattenedPlantRows(valvesData, {
      weeklyModuleData,
      activeWeek: normActive,
      fechaEvaluacion,
      fechaAnterior,
      growthRateBasis,
      masterCatalog,
    });

    const filtered = flatRows.filter((r) => {
      const modMatch = filterModulo === 'ALL' || r.modulo === filterModulo;
      const turnoMatch = filterTurno === 'ALL' || String(r.turno || '1') === filterTurno;
      return modMatch && turnoMatch;
    });

    if (filtered.length === 0) {
      return {
        kpis: mapValuesToKpis(emptyValues),
        sampleCount: 0,
        sourceType: 'sin_datos',
        availableModules,
        availableTurnos,
        weeks,
      };
    }

    const c = filtered.length;
    const sum = (fn: (r: FlattenedPlantRow) => number) =>
      filtered.reduce((acc, r) => acc + fn(r), 0);

    const calculated: Record<string, string> = {
      avgLongGlobal: (sum((r) => r.long_prom) / c).toFixed(1),
      avgDiamGlobal: (sum((r) => r.diam_prom) / c).toFixed(1),
      avgTasaGlobal: (sum((r) => r.tasa) / c).toFixed(2),
      avgBrotesGlobal: (sum((r) => r.total_brotes) / c).toFixed(1),
      avgInduccion: (sum((r) => r.induccion) / c).toFixed(1),
      avgInactivos: (sum((r) => r.inactivos) / c).toFixed(1),
      vigorRatio: `${(sum((r) => r.vigorosos) / c).toFixed(1)} / ${(sum((r) => r.no_vigorosos) / c).toFixed(1)}`,
      basalesRatio: `${(sum((r) => r.basales) / c).toFixed(1)} / ${(sum((r) => r.retonos) / c).toFixed(1)}`,
    };

    return {
      kpis: mapValuesToKpis(calculated),
      sampleCount: c,
      sourceType: 'plantas',
      availableModules,
      availableTurnos,
      weeks,
    };
  }

  // Historical week calculation
  const tasaProp: 'tasa_global' | 'tasa_f1' | 'tasa_f2' | 'tasa_f3' =
    growthRateBasis === 'flujo1'
      ? 'tasa_f1'
      : growthRateBasis === 'flujo2'
        ? 'tasa_f2'
        : growthRateBasis === 'flujo3'
          ? 'tasa_f3'
          : 'tasa_global';

  const longProp: 'long_global' | 'f1_long' | 'f2_long' | 'f3_long' =
    growthRateBasis === 'flujo1'
      ? 'f1_long'
      : growthRateBasis === 'flujo2'
        ? 'f2_long'
        : growthRateBasis === 'flujo3'
          ? 'f3_long'
          : 'long_global';

  const wIdx = weeks.indexOf(targetWeek);
  const prevW = wIdx > 0 ? weeks[wIdx - 1] : null;
  const days = prevW ? getDaysBetweenDates(weeklyDates?.[prevW], weeklyDates?.[targetWeek]) || 7 : 0;

  if (filterTurno !== 'ALL') {
    const turnoEntries = Object.values(weeklyTurnoData?.[targetWeek] || {}).filter(
      (s) =>
        s.turno === filterTurno &&
        (filterModulo === 'ALL' || s.modulo === filterModulo) &&
        s.diam_global !== undefined,
    );

    if (turnoEntries.length > 0) {
      const c = turnoEntries.length;
      const tasaVals = turnoEntries
        .map((s) => {
          if (s[tasaProp] !== undefined) return s[tasaProp] as number;
          if (prevW) {
            const prevStats =
              weeklyTurnoData?.[prevW]?.[`${s.modulo}||${s.turno}`] ||
              weeklyModuleData?.[prevW]?.[s.modulo];
            if (prevStats && days > 0) {
              return +((s[longProp] - prevStats[longProp]) / days).toFixed(2);
            }
          }
          return null;
        })
        .filter((v): v is number => v !== null);

      const avg = (fn: (s: WeeklyTurnoStats) => number) =>
        (turnoEntries.reduce((acc, s) => acc + fn(s), 0) / c).toFixed(1);

      const calculated: Record<string, string> = {
        avgLongGlobal: avg((s) => s.long_global),
        avgDiamGlobal: avg((s) => s.diam_global || 0),
        avgTasaGlobal:
          tasaVals.length > 0
            ? (tasaVals.reduce((a, b) => a + b, 0) / tasaVals.length).toFixed(2)
            : '-',
        avgBrotesGlobal: avg((s) => s.brotes_planta || 0),
        avgInduccion: avg((s) => s.induccion || 0),
        avgInactivos: avg((s) => s.inactivos || 0),
        vigorRatio: `${avg((s) => s.vigorosos || 0)} / ${avg((s) => s.no_vigorosos || 0)}`,
        basalesRatio: `${avg((s) => s.basales || 0)} / ${avg((s) => s.retonos || 0)}`,
      };

      return {
        kpis: mapValuesToKpis(calculated),
        sampleCount: c,
        sourceType: 'turno_historico',
        availableModules,
        availableTurnos,
        weeks,
      };
    }
  }

  const weekModMap = weeklyModuleData?.[targetWeek] || {};
  const matchedModKeys = Object.keys(weekModMap).filter((mod) => {
    if (filterModulo !== 'ALL' && mod !== filterModulo) return false;
    if (filterTurno !== 'ALL' && modulesForSelectedTurno.size > 0 && !modulesForSelectedTurno.has(mod)) {
      return false;
    }
    return true;
  });

  if (matchedModKeys.length === 0) {
    return {
      kpis: mapValuesToKpis(emptyValues),
      sampleCount: 0,
      sourceType: 'sin_datos',
      availableModules,
      availableTurnos,
      weeks,
    };
  }

  const modEntries = matchedModKeys.map((mod) => ({ mod, stats: weekModMap[mod] }));
  const c = modEntries.length;
  const avgMod = (fn: (s: WeeklyModuleStats) => number) =>
    (modEntries.reduce((acc, item) => acc + fn(item.stats), 0) / c).toFixed(1);

  const tasaVals = modEntries
    .map(({ mod, stats }) => {
      if (stats[tasaProp] !== undefined) return stats[tasaProp] as number;
      if (prevW) {
        const prevStats = weeklyModuleData?.[prevW]?.[mod];
        if (prevStats && days > 0) {
          return +((stats[longProp] - prevStats[longProp]) / days).toFixed(2);
        }
      }
      return null;
    })
    .filter((v): v is number => v !== null);

  const calculated: Record<string, string> = {
    avgLongGlobal: avgMod((s) => s.long_global),
    avgDiamGlobal: avgMod((s) => s.diam_global),
    avgTasaGlobal:
      tasaVals.length > 0
        ? (tasaVals.reduce((a, b) => a + b, 0) / tasaVals.length).toFixed(2)
        : '-',
    avgBrotesGlobal: avgMod((s) => s.brotes_planta),
    avgInduccion: avgMod((s) => s.induccion),
    avgInactivos: avgMod((s) => s.inactivos),
    vigorRatio: `${avgMod((s) => s.vigorosos)} / ${avgMod((s) => s.no_vigorosos)}`,
    basalesRatio: `${avgMod((s) => s.basales)} / ${avgMod((s) => s.retonos)}`,
  };

  return {
    kpis: mapValuesToKpis(calculated),
    sampleCount: c,
    sourceType: 'modulo_historico',
    availableModules,
    availableTurnos,
    weeks,
  };
}

export function getAutoVariety(
  masterCatalog: MasterCatalogItem[],
  modulo: string,
  valvula: string,
): string | null {
  return getAutoCatalogMatch(masterCatalog, modulo, valvula)?.variedad || null;
}

export function parseCatalogFromExcelText(txt: string): MasterCatalogItem[] {
  const lines = txt.split('\n');
  const parsed: MasterCatalogItem[] = [];
  lines.forEach((line) => {
    const parts = line.split('\t').map((p) => p.trim());
    if (parts.length >= 4) {
      parsed.push({
        modulo: normalizeModuleNumber(parts[0]),
        turno: normalizeTurnoNumber(parts[1]),
        valvula: normalizeValveNumber(parts[2]),
        variedad: parts[3],
      });
    } else if (parts.length === 3) {
      parsed.push({
        modulo: normalizeModuleNumber(parts[0]),
        turno: '1',
        valvula: normalizeValveNumber(parts[1]),
        variedad: parts[2],
      });
    } else if (parts.length === 2) {
      parsed.push({
        modulo: '1',
        turno: '1',
        valvula: normalizeValveNumber(parts[0]),
        variedad: parts[1],
      });
    }
  });
  return parsed;
}
