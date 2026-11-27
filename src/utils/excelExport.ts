import * as XLSX from 'xlsx';
import { createDefaultShoots } from '../data/defaults';
import type {
  GrowthRateBasis,
  MasterCatalogItem,
  TableColumn,
  ValveData,
  WeeklyModuleData,
  WeeklyTurnoData,
} from '../types/phenology';
import {
  buildGrowthRateComparisonMatrix,
  getFlattenedPlantRows,
  toNumericValue,
} from './calculations';

export function exportToExcel(
  valvesData: ValveData[],
  currentColumns: TableColumn[],
  weeklyModuleData: WeeklyModuleData,
  weeklyTurnoData: WeeklyTurnoData,
  weeklyDates: Record<string, string>,
  masterCatalog: MasterCatalogItem[],
  activeWeek: string,
  fechaEvaluacion: string,
  fechaAnterior: string,
  growthRateBasis: GrowthRateBasis,
): void {
  const flatRows = getFlattenedPlantRows(valvesData, {
    weeklyModuleData,
    activeWeek,
    fechaEvaluacion,
    fechaAnterior,
    growthRateBasis,
    masterCatalog,
  });

  // 1. Hoja Resumen por Planta y Válvula
  const wsSummaryData: Record<string, string | number>[] = flatRows.map((r) => {
    const rowObj: Record<string, string | number> = {
      Semana: activeWeek,
      'Fecha Evaluación': fechaEvaluacion,
      'Fecha Anterior': fechaAnterior,
      Turno: String(r.turno || ''),
    };
    currentColumns.forEach((c) => {
      rowObj[c.title] = r[c.id] ?? '';
    });
    return rowObj;
  });

  const avgRow: Record<string, string | number> = {
    Semana: activeWeek,
    'Fecha Evaluación': fechaEvaluacion,
    'Fecha Anterior': fechaAnterior,
    Turno: '-',
  };
  currentColumns.forEach((c, idx) => {
    if (idx === 0) {
      avgRow[c.title] = 'PROMEDIO GENERAL';
    } else if (c.calcAvg && flatRows.length > 0) {
      let sum = 0;
      flatRows.forEach((r) => {
        sum += parseFloat(String(r[c.id])) || 0;
      });
      avgRow[c.title] = +(sum / flatRows.length).toFixed(c.id === 'tasa' ? 2 : 1);
    } else {
      avgRow[c.title] = '-';
    }
  });
  wsSummaryData.push(avgRow);

  // 2. Hoja Detalle Brote a Brote (15 brotes: 5 de 1er flujo, 5 de 2do flujo y 5 de 3er flujo)
  const wsShootsData: Record<string, string | number | undefined>[] = [];
  valvesData.forEach((v) => {
    v.plantas.forEach((p) => {
      const f2 = p.flujo2 || createDefaultShoots(25.0, 4.5);
      const cantF1 = p.cant_flujo1 !== undefined ? toNumericValue(p.cant_flujo1, 0) : 5;
      const cantF2 = p.cant_flujo2 !== undefined ? toNumericValue(p.cant_flujo2, 0) : 5;
      const cantF3 = p.cant_flujo3 !== undefined ? toNumericValue(p.cant_flujo3, 0) : 5;
      wsShootsData.push({
        Semana: activeWeek,
        Fecha_Evaluacion: fechaEvaluacion,
        Fecha_Anterior: fechaAnterior,
        Módulo: v.modulo,
        Turno: v.turno || '',
        Válvula: v.nombre,
        Variedad: v.variedad,
        Planta: p.nombre,
        Total_Brotes_Planta: cantF1 + cantF2 + cantF3,
        Cant_Brotes_F1: cantF1,
        Cant_Brotes_F2: cantF2,
        Cant_Brotes_F3: cantF3,
        'F1_B1_Long(cm)': p.flujo1[0]?.longitud,
        'F1_B1_Diam(mm)': p.flujo1[0]?.diametro,
        'F1_B2_Long(cm)': p.flujo1[1]?.longitud,
        'F1_B2_Diam(mm)': p.flujo1[1]?.diametro,
        'F1_B3_Long(cm)': p.flujo1[2]?.longitud,
        'F1_B3_Diam(mm)': p.flujo1[2]?.diametro,
        'F1_B4_Long(cm)': p.flujo1[3]?.longitud,
        'F1_B4_Diam(mm)': p.flujo1[3]?.diametro,
        'F1_B5_Long(cm)': p.flujo1[4]?.longitud,
        'F1_B5_Diam(mm)': p.flujo1[4]?.diametro,
        'F2_B1_Long(cm)': f2[0]?.longitud,
        'F2_B1_Diam(mm)': f2[0]?.diametro,
        'F2_B2_Long(cm)': f2[1]?.longitud,
        'F2_B2_Diam(mm)': f2[1]?.diametro,
        'F2_B3_Long(cm)': f2[2]?.longitud,
        'F2_B3_Diam(mm)': f2[2]?.diametro,
        'F2_B4_Long(cm)': f2[3]?.longitud,
        'F2_B4_Diam(mm)': f2[3]?.diametro,
        'F2_B5_Long(cm)': f2[4]?.longitud,
        'F2_B5_Diam(mm)': f2[4]?.diametro,
        'F3_B1_Long(cm)': p.flujo3[0]?.longitud,
        'F3_B1_Diam(mm)': p.flujo3[0]?.diametro,
        'F3_B2_Long(cm)': p.flujo3[1]?.longitud,
        'F3_B2_Diam(mm)': p.flujo3[1]?.diametro,
        'F3_B3_Long(cm)': p.flujo3[2]?.longitud,
        'F3_B3_Diam(mm)': p.flujo3[2]?.diametro,
        'F3_B4_Long(cm)': p.flujo3[3]?.longitud,
        'F3_B4_Diam(mm)': p.flujo3[3]?.diametro,
        'F3_B5_Long(cm)': p.flujo3[4]?.longitud,
        'F3_B5_Diam(mm)': p.flujo3[4]?.diametro,
      });
    });
  });

  // 3. Hoja Histórico Semanal por Módulo
  const wsWeeklyData: Record<string, string | number>[] = [];
  Object.keys(weeklyModuleData).forEach((w) => {
    const wObj = weeklyModuleData[w];
    Object.keys(wObj).forEach((m) => {
      const row = wObj[m];
      wsWeeklyData.push({
        Semana: w,
        Módulo: m,
        'Longitud Global (cm)': row.long_global,
        'Diámetro Global (mm)': row.diam_global,
        'Brotes por Planta': row.brotes_planta,
        '1er Flujo Long (cm)': row.f1_long,
        '2do Flujo Long (cm)': row.f2_long,
        '3er Flujo Long (cm)': row.f3_long,
        'Con Inducción': row.induccion,
        Inactivos: row.inactivos,
        Vigorosos: row.vigorosos,
        'No Vigorosos': row.no_vigorosos,
        Basales: row.basales,
        Retoños: row.retonos,
      });
    });
  });

  // 4. Hoja Comparativa Tasa de Crecimiento por Módulo y Semana
  const { weeks, rows: rateRows } = buildGrowthRateComparisonMatrix(
    valvesData,
    masterCatalog,
    weeklyModuleData,
    weeklyTurnoData,
    weeklyDates,
    activeWeek,
    growthRateBasis,
    'ALL',
  );
  const wsRatesData: Record<string, string | number>[] = rateRows.map((r) => {
    const obj: Record<string, string | number> = {
      Módulo: r.modulo,
    };
    weeks.forEach((w) => {
      obj[`Sem_${w}_(cm/d)`] = r.ratesByWeek[w] ?? '-';
    });
    obj['Var_vs_Sem_Ant'] = r.deltaVsPrev ?? '-';
    obj['Promedio_Historico'] = r.avgRate ?? '-';
    return obj;
  });

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(wsSummaryData);
  const wsShoots = XLSX.utils.json_to_sheet(wsShootsData);
  const wsWeekly = XLSX.utils.json_to_sheet(wsWeeklyData);
  const wsRates = XLSX.utils.json_to_sheet(wsRatesData);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Plantas_Valvula');
  XLSX.utils.book_append_sheet(wb, wsShoots, '15_Brotes_Individuales');
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Historico_Semanal_Modulo');
  XLSX.utils.book_append_sheet(wb, wsRates, 'Tasa_Crec_Modulo');

  const fileName = `Reiter_Fenologia_Sem${activeWeek}_${fechaEvaluacion || new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
