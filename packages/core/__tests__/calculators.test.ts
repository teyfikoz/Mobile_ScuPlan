import {
  calculateDistance,
  calculateBearing,
  metersToFeet,
  feetToMeters,
  calculateMOD,
  calculateEAD,
  roundToGrid,
  formatDuration,
  formatDistance,
} from '../calculators';

describe('Calculators', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { lat: 0, lon: 0, ts: Date.now() };
      const point2 = { lat: 0.1, lon: 0.1, ts: Date.now() };
      const distance = calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(15713, -2); // Approximately 15.7 km
    });

    it('should return 0 for same points', () => {
      const point = { lat: 37.7749, lon: -122.4194, ts: Date.now() };
      const distance = calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing between two points', () => {
      const from = { lat: 0, lon: 0, ts: Date.now() };
      const to = { lat: 1, lon: 0, ts: Date.now() };
      const bearing = calculateBearing(from, to);

      expect(bearing).toBeCloseTo(0, 0); // North
    });

    it('should return bearing between 0 and 360', () => {
      const from = { lat: 37.7749, lon: -122.4194, ts: Date.now() };
      const to = { lat: 40.7128, lon: -74.006, ts: Date.now() };
      const bearing = calculateBearing(from, to);

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('Unit conversions', () => {
    it('should convert meters to feet', () => {
      expect(metersToFeet(10)).toBeCloseTo(32.8084, 3);
      expect(metersToFeet(30)).toBeCloseTo(98.4252, 3);
    });

    it('should convert feet to meters', () => {
      expect(feetToMeters(32.8084)).toBeCloseTo(10, 1);
      expect(feetToMeters(100)).toBeCloseTo(30.48, 2);
    });

    it('should be reversible', () => {
      const meters = 25;
      const converted = feetToMeters(metersToFeet(meters));
      expect(converted).toBeCloseTo(meters, 1);
    });
  });

  describe('calculateMOD', () => {
    it('should calculate Maximum Operating Depth for air', () => {
      const mod = calculateMOD(21, 1.4);
      expect(mod).toBeCloseTo(56.7, 0);
    });

    it('should calculate MOD for EAN32', () => {
      const mod = calculateMOD(32, 1.4);
      expect(mod).toBeCloseTo(33.75, 1);
    });

    it('should calculate MOD for 100% O2', () => {
      const mod = calculateMOD(100, 1.6);
      expect(mod).toBeCloseTo(6, 0);
    });
  });

  describe('calculateEAD', () => {
    it('should calculate Equivalent Air Depth for nitrox', () => {
      const ead = calculateEAD(30, 32);
      expect(ead).toBeCloseTo(24.8, 0);
    });

    it('should return same depth for air', () => {
      const depth = 30;
      const ead = calculateEAD(depth, 21);
      expect(ead).toBeCloseTo(depth, 1);
    });
  });

  describe('roundToGrid', () => {
    it('should round coordinates to grid', () => {
      expect(roundToGrid(37.7749123, 0.01)).toBe(37.77);
      expect(roundToGrid(37.7751, 0.01)).toBe(37.78);
    });

    it('should use default grid size', () => {
      expect(roundToGrid(37.7749123)).toBe(37.77);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3665)).toBe('1h 1m');
    });
  });

  describe('formatDistance', () => {
    it('should format meters', () => {
      expect(formatDistance(150)).toBe('150 m');
    });

    it('should format kilometers', () => {
      expect(formatDistance(1500)).toBe('1.5 km');
      expect(formatDistance(2300)).toBe('2.3 km');
    });
  });
});
