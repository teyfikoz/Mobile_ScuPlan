export interface CompartmentData {
  halfTime: number;
  aValue: number;
  bValue: number;
  n2Pressure: number;
  hePressure: number;
}

export interface DecompressionStop {
  depth: number;
  duration: number;
}

export interface DecompressionPlan {
  stops: DecompressionStop[];
  totalRuntime: number;
  noDecoLimit: number;
  ceilingDepth: number;
}

const ZHL16C_COMPARTMENTS = [
  { halfTime: 5.0, aValue: 1.1696, bValue: 0.5578 },
  { halfTime: 8.0, aValue: 1.0, bValue: 0.6514 },
  { halfTime: 12.5, aValue: 0.8618, bValue: 0.7222 },
  { halfTime: 18.5, aValue: 0.7562, bValue: 0.7825 },
  { halfTime: 27.0, aValue: 0.6667, bValue: 0.8126 },
  { halfTime: 38.3, aValue: 0.5933, bValue: 0.8434 },
  { halfTime: 54.3, aValue: 0.5282, bValue: 0.8693 },
  { halfTime: 77.0, aValue: 0.4701, bValue: 0.8910 },
  { halfTime: 109.0, aValue: 0.4187, bValue: 0.9092 },
  { halfTime: 146.0, aValue: 0.3798, bValue: 0.9222 },
  { halfTime: 187.0, aValue: 0.3497, bValue: 0.9319 },
  { halfTime: 239.0, aValue: 0.3223, bValue: 0.9403 },
  { halfTime: 305.0, aValue: 0.2971, bValue: 0.9477 },
  { halfTime: 390.0, aValue: 0.2737, bValue: 0.9544 },
  { halfTime: 498.0, aValue: 0.2523, bValue: 0.9602 },
  { halfTime: 635.0, aValue: 0.2327, bValue: 0.9653 },
];

export function calculateAmbientPressure(depthMeters: number): number {
  return 1.0 + depthMeters / 10.0;
}

export function calculateInspiredPressure(
  ambientPressure: number,
  gasO2Fraction: number,
  gasHeFraction: number,
  isN2: boolean
): number {
  const gasN2Fraction = 1.0 - gasO2Fraction - gasHeFraction;
  const waterVaporPressure = 0.0627;
  const alveolarPressure = (ambientPressure - waterVaporPressure);

  if (isN2) {
    return alveolarPressure * gasN2Fraction;
  } else {
    return alveolarPressure * gasHeFraction;
  }
}

export function haldaneEquation(
  initialPressure: number,
  inspiredPressure: number,
  halfTime: number,
  timeMinutes: number
): number {
  const k = Math.log(2) / halfTime;
  return initialPressure + (inspiredPressure - initialPressure) * (1 - Math.exp(-k * timeMinutes));
}

export function schreinerEquation(
  initialPressure: number,
  inspiredPressureStart: number,
  inspiredPressureEnd: number,
  halfTime: number,
  timeMinutes: number
): number {
  const k = Math.log(2) / halfTime;
  const R = (inspiredPressureEnd - inspiredPressureStart) / timeMinutes;

  return (
    initialPressure * Math.exp(-k * timeMinutes) +
    (inspiredPressureStart - initialPressure - R / k) *
      (1 - Math.exp(-k * timeMinutes)) +
    (R * timeMinutes / k)
  );
}

export function calculateMValue(
  aValue: number,
  bValue: number,
  depthMeters: number
): number {
  const ambientPressure = calculateAmbientPressure(depthMeters);
  return aValue + ambientPressure / bValue;
}

export function calculateCeiling(
  tissuePressure: number,
  aValue: number,
  bValue: number,
  gfHigh: number
): number {
  const adjustedA = aValue * gfHigh;
  const adjustedB = bValue * gfHigh;

  const ceiling = (tissuePressure - adjustedA) * adjustedB;
  const ceilingDepth = (ceiling - 1.0) * 10.0;

  return Math.max(0, ceilingDepth);
}

export class BuhlmannModel {
  private compartments: CompartmentData[];
  private gfLow: number;
  private gfHigh: number;

  constructor(gfLow: number = 0.3, gfHigh: number = 0.85) {
    this.gfLow = gfLow;
    this.gfHigh = gfHigh;

    this.compartments = ZHL16C_COMPARTMENTS.map(c => ({
      ...c,
      n2Pressure: 0.79,
      hePressure: 0.0,
    }));
  }

  updateCompartments(
    depthMeters: number,
    timeMinutes: number,
    gasO2: number,
    gasHe: number
  ): void {
    const ambientPressure = calculateAmbientPressure(depthMeters);
    const inspiredN2 = calculateInspiredPressure(ambientPressure, gasO2, gasHe, true);
    const inspiredHe = calculateInspiredPressure(ambientPressure, gasO2, gasHe, false);

    this.compartments.forEach(comp => {
      comp.n2Pressure = haldaneEquation(
        comp.n2Pressure,
        inspiredN2,
        comp.halfTime,
        timeMinutes
      );
      comp.hePressure = haldaneEquation(
        comp.hePressure,
        inspiredHe,
        comp.halfTime * 0.4,
        timeMinutes
      );
    });
  }

  getCeiling(): number {
    let maxCeiling = 0;

    this.compartments.forEach(comp => {
      const totalInertGas = comp.n2Pressure + comp.hePressure;
      const ceiling = calculateCeiling(
        totalInertGas,
        comp.aValue,
        comp.bValue,
        this.gfHigh
      );
      maxCeiling = Math.max(maxCeiling, ceiling);
    });

    return Math.ceil(maxCeiling);
  }

  calculateDecompressionStops(
    currentDepth: number,
    gasO2: number,
    gasHe: number
  ): DecompressionStop[] {
    const stops: DecompressionStop[] = [];
    let depth = currentDepth;

    while (depth > 0) {
      const ceiling = this.getCeiling();

      if (ceiling > 0) {
        const stopDepth = Math.ceil(ceiling / 3) * 3;

        this.updateCompartments(stopDepth, 1, gasO2, gasHe);

        const existingStop = stops.find(s => s.depth === stopDepth);
        if (existingStop) {
          existingStop.duration += 1;
        } else {
          stops.push({ depth: stopDepth, duration: 1 });
        }
      } else {
        depth -= 3;
        if (depth > 0) {
          this.updateCompartments(depth, 0.5, gasO2, gasHe);
        }
      }

      if (stops.reduce((sum, s) => sum + s.duration, 0) > 300) {
        break;
      }
    }

    return stops.filter(s => s.duration > 0);
  }
}

export function calculateSimplePlan(
  maxDepth: number,
  bottomTime: number,
  gasO2: number = 21,
  gasHe: number = 0,
  gfLow: number = 0.3,
  gfHigh: number = 0.85
): DecompressionPlan {
  const model = new BuhlmannModel(gfLow, gfHigh);

  model.updateCompartments(maxDepth, bottomTime, gasO2 / 100, gasHe / 100);

  const stops = model.calculateDecompressionStops(maxDepth, gasO2 / 100, gasHe / 100);

  const safetyStop: DecompressionStop = { depth: 5, duration: 3 };
  if (maxDepth > 10 && stops.length === 0) {
    stops.push(safetyStop);
  }

  const totalRuntime = bottomTime + stops.reduce((sum, s) => sum + s.duration, 0);

  return {
    stops,
    totalRuntime,
    noDecoLimit: stops.length === 1 && stops[0].depth === 5 ? bottomTime : 0,
    ceilingDepth: model.getCeiling(),
  };
}
