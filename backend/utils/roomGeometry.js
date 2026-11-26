/**
 * Room Geometry Builder & Validator (Meters)
 * Converts rectangular room dimensions and wall openings into a consistent
 * 2D/3D coordinate representation and checks physical placement constraints.
 */

const WALL_THICKNESS_METERS = 0.15;

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

function validateAndBuildRoomGeometry({ length, width, height, openings = [] }) {
  const errors = [];

  const numLength = Number(length);
  const numWidth = Number(width);
  const numHeight = Number(height);

  if (!Number.isFinite(numLength) || numLength < 1 || numLength > 30) {
    errors.push('Room length must be between 1.0 m and 30.0 m.');
  }
  if (!Number.isFinite(numWidth) || numWidth < 1 || numWidth > 30) {
    errors.push('Room width must be between 1.0 m and 30.0 m.');
  }
  if (!Number.isFinite(numHeight) || numHeight < 1.8 || numHeight > 8) {
    errors.push('Ceiling height must be between 1.8 m and 8.0 m.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const cleanLength = roundMeters(numLength);
  const cleanWidth = roundMeters(numWidth);
  const cleanHeight = roundMeters(numHeight);

  const walls = buildWallsFromRect(cleanLength, cleanWidth, cleanHeight);
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  const validatedOpenings = [];
  const openingsByWall = { north: [], east: [], south: [], west: [] };

  if (!Array.isArray(openings)) {
    return { valid: false, errors: ['Openings must be an array.'] };
  }

  openings.forEach((raw, index) => {
    const label = `Opening #${index + 1}`;
    const type = raw?.type === 'window' ? 'window' : raw?.type === 'door' ? 'door' : null;
    if (!type) {
      errors.push(`${label}: type must be "door" or "window".`);
      return;
    }

    const wall = wallMap.get(raw?.wallId);
    if (!wall) {
      errors.push(`${label}: wallId must be north, east, south, or west.`);
      return;
    }

    const opWidth = Number(raw?.width);
    const opHeight = Number(raw?.height);
    const offset = Number(raw?.offsetFromStart);
    const sillHeight = type === 'door' ? 0 : Number(raw?.sillHeight ?? 0.9);

    if (!Number.isFinite(opWidth) || opWidth < 0.4 || opWidth > wall.length) {
      errors.push(`${label} (${type}): width must be between 0.4 m and ${wall.length} m.`);
      return;
    }

    if (!Number.isFinite(opHeight) || opHeight < 0.4 || opHeight > cleanHeight) {
      errors.push(`${label} (${type}): height must be between 0.4 m and ${cleanHeight} m.`);
      return;
    }

    if (!Number.isFinite(offset) || offset < 0 || offset + opWidth > wall.length + 0.001) {
      errors.push(
        `${label} (${type}): position along ${wall.label} exceeds wall length (${wall.length} m).`
      );
      return;
    }

    if (!Number.isFinite(sillHeight) || sillHeight < 0 || sillHeight + opHeight > cleanHeight + 0.001) {
      errors.push(
        `${label} (${type}): sill height + height exceeds ceiling height (${cleanHeight} m).`
      );
      return;
    }

    const cleanOpening = {
      id: raw?.id ? String(raw.id) : `${type}-${index + 1}`,
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

  // Check for horizontal overlap between openings placed on the same wall
  Object.entries(openingsByWall).forEach(([wallId, list]) => {
    const sorted = [...list].sort((a, b) => a.offsetFromStart - b.offsetFromStart);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.offsetFromStart < prev.offsetFromStart + prev.width - 0.01) {
        errors.push(
          `Two openings on the ${wallMap.get(wallId).label} overlap (${prev.type} and ${curr.type}).`
        );
      }
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const floorArea = Number((cleanLength * cleanWidth).toFixed(2));
  const volume = Number((cleanLength * cleanWidth * cleanHeight).toFixed(2));

  return {
    valid: true,
    errors: [],
    dimensions: {
      length: cleanLength,
      width: cleanWidth,
      height: cleanHeight,
      floorArea,
      volume,
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

module.exports = {
  validateAndBuildRoomGeometry,
};
