import React from 'react';
import { createDefaultShoots } from '../data/defaults';
import type { FlushKey, ValveData } from '../types/phenology';

interface ShootsMatrixViewProps {
  valvesData: ValveData[];
  onUpdateShootDirect: (
    vIdx: number,
    pIdx: number,
    flushKey: FlushKey,
    bIdx: number,
    prop: 'longitud' | 'diametro',
    val: number,
  ) => void;
}

export const ShootsMatrixView: React.FC<ShootsMatrixViewProps> = ({
  valvesData,
  onUpdateShootDirect,
}) => {
  return (
    <section className="table-container-card" id="viewShootsSection">
      <div className="section-header">
        <div className="section-title-wrap">
          <span style={{ color: 'var(--accent)', fontSize: '1.3rem' }}>
            <i className="fa-solid fa-list-ol" />
          </span>
          <h2 className="section-title">
            Matriz Detallada Brote a Brote (1er, 2do y 3er Flujo - 15 Brotes por Planta)
          </h2>
        </div>
      </div>

      <div className="table-responsive">
        <table id="shootsFullTable">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th rowSpan={2} style={{ verticalAlign: 'middle' }}>
                Módulo
              </th>
              <th rowSpan={2} style={{ verticalAlign: 'middle' }}>
                Válvula
              </th>
              <th rowSpan={2} style={{ verticalAlign: 'middle' }}>
                Planta
              </th>
              <th
                colSpan={10}
                style={{
                  textAlign: 'center',
                  background: '#eff6ff',
                  borderLeft: '2px solid #bfdbfe',
                  borderRight: '2px solid #bfdbfe',
                  color: '#1e40af',
                }}
              >
                1er FLUJO (5 Brotes: Long cm / Diám mm)
              </th>
              <th
                colSpan={10}
                style={{
                  textAlign: 'center',
                  background: '#ecfdf5',
                  borderRight: '2px solid #a7f3d0',
                  color: '#065f46',
                }}
              >
                2do FLUJO (5 Brotes: Long cm / Diám mm)
              </th>
              <th
                colSpan={10}
                style={{
                  textAlign: 'center',
                  background: '#f5f3ff',
                  borderRight: '2px solid #ddd6fe',
                  color: '#5b21b6',
                }}
              >
                3er FLUJO (5 Brotes: Long cm / Diám mm)
              </th>
            </tr>
            <tr style={{ fontSize: '0.73rem' }}>
              {/* 1er Flujo */}
              <th style={{ background: '#eff6ff' }}>L1</th>
              <th style={{ background: '#eff6ff' }}>D1</th>
              <th style={{ background: '#eff6ff' }}>L2</th>
              <th style={{ background: '#eff6ff' }}>D2</th>
              <th style={{ background: '#eff6ff' }}>L3</th>
              <th style={{ background: '#eff6ff' }}>D3</th>
              <th style={{ background: '#eff6ff' }}>L4</th>
              <th style={{ background: '#eff6ff' }}>D4</th>
              <th style={{ background: '#eff6ff' }}>L5</th>
              <th style={{ background: '#eff6ff' }}>D5</th>
              {/* 2do Flujo */}
              <th style={{ background: '#ecfdf5' }}>L1</th>
              <th style={{ background: '#ecfdf5' }}>D1</th>
              <th style={{ background: '#ecfdf5' }}>L2</th>
              <th style={{ background: '#ecfdf5' }}>D2</th>
              <th style={{ background: '#ecfdf5' }}>L3</th>
              <th style={{ background: '#ecfdf5' }}>D3</th>
              <th style={{ background: '#ecfdf5' }}>L4</th>
              <th style={{ background: '#ecfdf5' }}>D4</th>
              <th style={{ background: '#ecfdf5' }}>L5</th>
              <th style={{ background: '#ecfdf5' }}>D5</th>
              {/* 3er Flujo */}
              <th style={{ background: '#f5f3ff' }}>L1</th>
              <th style={{ background: '#f5f3ff' }}>D1</th>
              <th style={{ background: '#f5f3ff' }}>L2</th>
              <th style={{ background: '#f5f3ff' }}>D2</th>
              <th style={{ background: '#f5f3ff' }}>L3</th>
              <th style={{ background: '#f5f3ff' }}>D3</th>
              <th style={{ background: '#f5f3ff' }}>L4</th>
              <th style={{ background: '#f5f3ff' }}>D4</th>
              <th style={{ background: '#f5f3ff' }}>L5</th>
              <th style={{ background: '#f5f3ff' }}>D5</th>
            </tr>
          </thead>

          <tbody id="shootsFullTableBody">
            {valvesData.map((v, vIdx) =>
              v.plantas.map((p, pIdx) => {
                const f2 = p.flujo2 || createDefaultShoots(25.0, 4.5);
                return (
                  <tr key={`${v.id}-${vIdx}-${p.id}-${pIdx}`}>
                    <td style={{ fontWeight: 700, background: '#f8fafc' }}>{v.modulo}</td>
                    <td style={{ fontWeight: 700 }}>{v.nombre}</td>
                    <td style={{ fontWeight: 700 }}>{p.nombre}</td>

                    {[0, 1, 2, 3, 4].map((i) => {
                      const b = p.flujo1[i] || { longitud: 0, diametro: 0 };
                      return (
                        <React.Fragment key={`f1-${i}`}>
                          <td style={{ background: '#eff6ff', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="shoot-input"
                              style={{ width: '58px' }}
                              value={b.longitud}
                              onChange={(e) =>
                                onUpdateShootDirect(
                                  vIdx,
                                  pIdx,
                                  'flujo1',
                                  i,
                                  'longitud',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td style={{ background: '#eff6ff', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="shoot-input"
                              style={{ width: '58px' }}
                              value={b.diametro}
                              onChange={(e) =>
                                onUpdateShootDirect(
                                  vIdx,
                                  pIdx,
                                  'flujo1',
                                  i,
                                  'diametro',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {[0, 1, 2, 3, 4].map((i) => {
                      const b = f2[i] || { longitud: 0, diametro: 0 };
                      return (
                        <React.Fragment key={`f2-${i}`}>
                          <td style={{ background: '#ecfdf5', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="shoot-input"
                              style={{ width: '58px' }}
                              value={b.longitud}
                              onChange={(e) =>
                                onUpdateShootDirect(
                                  vIdx,
                                  pIdx,
                                  'flujo2',
                                  i,
                                  'longitud',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td style={{ background: '#ecfdf5', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="shoot-input"
                              style={{ width: '58px' }}
                              value={b.diametro}
                              onChange={(e) =>
                                onUpdateShootDirect(
                                  vIdx,
                                  pIdx,
                                  'flujo2',
                                  i,
                                  'diametro',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {[0, 1, 2, 3, 4].map((i) => {
                      const b = p.flujo3[i] || { longitud: 0, diametro: 0 };
                      return (
                        <React.Fragment key={`f3-${i}`}>
                          <td style={{ background: '#f5f3ff', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="shoot-input"
                              style={{ width: '58px' }}
                              value={b.longitud}
                              onChange={(e) =>
                                onUpdateShootDirect(
                                  vIdx,
                                  pIdx,
                                  'flujo3',
                                  i,
                                  'longitud',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td style={{ background: '#f5f3ff', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="shoot-input"
                              style={{ width: '58px' }}
                              value={b.diametro}
                              onChange={(e) =>
                                onUpdateShootDirect(
                                  vIdx,
                                  pIdx,
                                  'flujo3',
                                  i,
                                  'diametro',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
