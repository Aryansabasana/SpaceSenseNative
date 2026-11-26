/**
 * Mobile Room Geometry Builder, Validator, and Unit Converter
 * Internally all room dimensions and geometry coordinates use meters.
 */

const METERS_TO_FEET = 3.28084;
const WALL_THICKNESS_METERS = 0.15;

export const WALL_OPTIONS = [
  { id: 'north', label: 'North (Top)' },
  { id: 'east', label: 'East (Right)' },
  { id: 'south', label: 'South (Bottom)' },
  { id: 'west', label: 'West (Left)' },
];

export function inputToMeters(value, unit = 'meters') {
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return unit === 'feet' ? num / METERS_TO_FEET : num;
}

export function metersToInputString(meters, unit = 'meters') {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return '';
  const converted = unit === 'feet' ? meters * METERS_TO_FEET : meters;
  return String(Number(converted.toFixed(2)));
}

function roundMeters(value) {
  return Number(Number(value).toFixed(3));
}

function buildWallsFromRect(length, width, height) {
  return [
    {
      id: 'north',
      label: 'North Wall',
      start: { x: 0, z: 0 },
      end: { x: length, z: 0 },
      length: roundMeters(length),
      height: roundMeters(height),
      thickness: WALL_THICKNESS_METERS,
      normal: { x: 0, z: 1 },
    },
    {
      id: 'east',
      label: 'East Wall',
      start: { x: length, z: 0 },
      end: { x: length, z: width },
      length: roundMeters(width),
      height: roundMeters(height),
      thickness: WALL_THICKNESS_METERS,
      normal: { x: -1, z: 0 },
    },
    {
      id: 'south',
      label: 'South Wall',
      start: { x: length, z: width },
      end: { x: 0, z: width },
      length: roundMeters(length),
      height: roundMeters(height),
      thickness: WALL_THICKNESS_METERS,
      normal: { x: 0, z: -1 },
    },
    {
      id: 'west',
      label: 'West Wall',
      start: { x: 0, z: width },
      end: { x: 0, z: 0 },
      length: roundMeters(width),
      height: roundMeters(height),
      thickness: WALL_THICKNESS_METERS,
      normal: { x: 1, z: 0 },
    },
  ];
}

export function validateAndBuildRoomGeometry({ length, width, height, openings = [] }) {
  const errors = [];
  const numLength = Number(length);
  const numWidth = Number(width);
  const numHeight = Number(height);

  if (!Number.isFinite(numLength) || numLength < 1 || numLength > 30) {
    errors.push('Room length must be between 1.0 m and 30.0 m (3.3–98 ft).');
  }
  if (!Number.isFinite(numWidth) || numWidth < 1 || numWidth > 30) {
    errors.push('Room width must be between 1.0 m and 30.0 m (3.3–98 ft).');
  }
  if (!Number.isFinite(numHeight) || numHeight < 1.8 || numHeight > 8) {
    errors.push('Ceiling height must be between 1.8 m and 8.0 m (5.9–26 ft).');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const cleanLength = roundMeters(numLength);
  const cleanWidth = roundMeters(numWidth);
  const cleanHeight = roundMeters(numHeight);

  const walls = buildWallsFromRect(cleanLength, cleanWidth, cleanHeight);
  const wallMap = new Map(walls.map((w) => [w.id, w]));
  const openingsByWall = { north: [], east: [], south: [], west: [] };
  const validatedOpenings = [];

  openings.forEach((raw, index) => {
    const label = `Opening #${index + 1}`;
    const type = raw?.type === 'window' ? 'window' : 'door';
    const wall = wallMap.get(raw?.wallId);
    if (!wall) {
      errors.push(`${label}: invalid wall selected.`);
      return;
    }

    const opWidth = Number(raw?.width);
    const opHeight = Number(raw?.height);
    const offset = Number(raw?.offsetFromStart);
    const sillHeight = type === 'door' ? 0 : Number(raw?.sillHeight ?? 0.9);

    if (!Number.isFinite(opWidth) || opWidth < 0.4 || opWidth > wall.length) {
      errors.push(`${label} (${type}): width must fit within ${wall.label}.`);
      return;
    }
    if (!Number.isFinite(opHeight) || opHeight < 0.4 || opHeight > cleanHeight) {
      errors.push(`${label} (${type}): height cannot exceed ceiling height.`);
      return;
    }
    if (!Number.isFinite(offset) || offset < 0 || offset + opWidth > wall.length + 0.001) {
      errors.push(`${label} (${type}): offset + width exceeds ${wall.label} length.`);
      return;
    }
    if (!Number.isFinite(sillHeight) || sillHeight < 0 || sillHeight + opHeight > cleanHeight + 0.001) {
      errors.push(`${label} (${type}): sill + height exceeds ceiling height.`);
      return;
    }

    const cleanOpening = {
      id: raw?.id || `${type}-${index + 1}`,
      type,
      wallId: wall.id,
      offsetFromStart: roundMeters(offset),
      width: roundMeters(opWidth),
      height: roundMeters(opHeight),
      sillHeight: roundMeters(sillHeight),
    };

    openingsByWall[wall.id].push(cleanOpening);
    validatedOpenings.push(cleanOpening);
  });

  Object.entries(openingsByWall).forEach(([wallId, list]) => {
    const sorted = [...list].sort((a, b) => a.offsetFromStart - b.offsetFromStart);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.offsetFromStart < prev.offsetFromStart + prev.width - 0.01) {
        errors.push(`Openings on ${wallMap.get(wallId).label} overlap each other.`);
      }
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    dimensions: {
      length: cleanLength,
      width: cleanWidth,
      height: cleanHeight,
      floorArea: Number((cleanLength * cleanWidth).toFixed(2)),
      volume: Number((cleanLength * cleanWidth * cleanHeight).toFixed(2)),
      unit: 'meters',
    },
    geometry: {
      origin: { x: 0, y: 0, z: 0 },
      floorPolygon: [
        { x: 0, z: 0 },
        { x: cleanLength, z: 0 },
        { x: cleanLength, z: cleanWidth },
        { x: 0, z: cleanWidth },
      ],
      walls,
      openings: validatedOpenings,
    },
  };
}
