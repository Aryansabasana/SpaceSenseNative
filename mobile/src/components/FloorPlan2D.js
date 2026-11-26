/**
 * 2D Architectural Floor Plan Renderer (SVG)
 * Converts room floorPolygon, walls, and openings (in meters) into a scaled 2D blueprint.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { COLORS, RADIUS } from '../constants/theme';
import { formatArea, formatLength } from '../utils/units';

export default function FloorPlan2D({
  geometry,
  dimensions,
  unit = 'meters',
  canvasWidth = 320,
  canvasHeight = 280,
  zoom = 1,
  showGrid = true,
  showLabels = true,
}) {
  const polygon = geometry?.floorPolygon || [];
  const walls = geometry?.walls || [];
  const openings = geometry?.openings || [];

  if (polygon.length < 3) {
    return null;
  }

  // Compute bounding box in world meters
  const xs = polygon.map((p) => p.x);
  const zs = polygon.map((p) => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  const worldWidth = Math.max(maxX - minX, 0.5);
  const worldDepth = Math.max(maxZ - minZ, 0.5);

  const padding = 44;
  const availableW = Math.max(canvasWidth - padding * 2, 40);
  const availableH = Math.max(canvasHeight - padding * 2, 40);
  const baseScale = Math.min(availableW / worldWidth, availableH / worldDepth);
  const scale = baseScale * zoom;

  const drawW = worldWidth * scale;
  const drawH = worldDepth * scale;
  const offsetX = (canvasWidth - drawW) / 2;
  const offsetY = (canvasHeight - drawH) / 2;

  const toSvgX = (x) => offsetX + (x - minX) * scale;
  const toSvgY = (z) => offsetY + (z - minZ) * scale;

  const polygonPoints = polygon
    .map((p) => `${toSvgX(p.x)},${toSvgY(p.z)}`)
    .join(' ');

  const wallLookup = new Map(walls.map((w) => [w.id, w]));

  // Subtle 0.5m grid lines inside the canvas
  const gridLines = [];
  if (showGrid) {
    const stepMeters = 0.5;
    for (let gx = Math.floor(minX); gx <= Math.ceil(maxX); gx += stepMeters) {
      const sx = toSvgX(gx);
      gridLines.push(
        <Line
          key={`gx-${gx}`}
          x1={sx}
          y1={offsetY}
          x2={sx}
          y2={offsetY + drawH}
          stroke={COLORS.border}
          strokeWidth={0.7}
          strokeDasharray="3,3"
        />
      );
    }
    for (let gz = Math.floor(minZ); gz <= Math.ceil(maxZ); gz += stepMeters) {
      const sy = toSvgY(gz);
      gridLines.push(
        <Line
          key={`gz-${gz}`}
          x1={offsetX}
          y1={sy}
          x2={offsetX + drawW}
          y2={sy}
          stroke={COLORS.border}
          strokeWidth={0.7}
          strokeDasharray="3,3"
        />
      );
    }
  }

  return (
    <View style={styles.wrapper}>
      <Svg width={canvasWidth} height={canvasHeight}>
        {/* Floor surface */}
        <Polygon
          points={polygonPoints}
          fill="#FFFFFF"
          stroke="none"
        />

        {/* Optional metric grid */}
        <G>{gridLines}</G>

        {/* Walls */}
        {walls.map((wall) => (
          <Line
            key={wall.id}
            x1={toSvgX(wall.start.x)}
            y1={toSvgY(wall.start.z)}
            x2={toSvgX(wall.end.x)}
            y2={toSvgY(wall.end.z)}
            stroke={COLORS.textMain}
            strokeWidth={6}
            strokeLinecap="square"
          />
        ))}

        {/* Doors & Windows positioned along their wall vector */}
        {openings.map((opening) => {
          const wall = wallLookup.get(opening.wallId);
          if (!wall || !wall.length) return null;

          const dx = (wall.end.x - wall.start.x) / wall.length;
          const dz = (wall.end.z - wall.start.z) / wall.length;
          const nx = wall.normal?.x ?? 0;
          const nz = wall.normal?.z ?? 0;

          const startWorldX = wall.start.x + dx * opening.offsetFromStart;
          const startWorldZ = wall.start.z + dz * opening.offsetFromStart;
          const endWorldX = startWorldX + dx * opening.width;
          const endWorldZ = startWorldZ + dz * opening.width;

          const x1 = toSvgX(startWorldX);
          const y1 = toSvgY(startWorldZ);
          const x2 = toSvgX(endWorldX);
          const y2 = toSvgY(endWorldZ);

          if (opening.type === 'window') {
            return (
              <G key={opening.id}>
                <Line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={COLORS.surface}
                  strokeWidth={7}
                />
                <Line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={COLORS.accent}
                  strokeWidth={3.5}
                />
              </G>
            );
          }

          // Door: draw wall gap, door leaf into room interior, and 90-degree swing arc
          const doorLenPx = opening.width * scale;
          const leafEndX = x1 + nx * doorLenPx;
          const leafEndY = y1 + nz * doorLenPx;

          // Determine arc sweep so the curve connects leaf tip (leafEnd) to latch (x2, y2)
          const cross = (leafEndX - x1) * (y2 - y1) - (leafEndY - y1) * (x2 - x1);
          const sweepFlag = cross >= 0 ? 1 : 0;

          return (
            <G key={opening.id}>
              <Line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLORS.surface}
                strokeWidth={7}
              />
              <Line
                x1={x1}
                y1={y1}
                x2={leafEndX}
                y2={leafEndY}
                stroke={COLORS.primary}
                strokeWidth={2.5}
              />
              <Path
                d={`M ${leafEndX} ${leafEndY} A ${doorLenPx} ${doorLenPx} 0 0 ${sweepFlag} ${x2} ${y2}`}
                fill="none"
                stroke={COLORS.secondary}
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
            </G>
          );
        })}

        {/* Dimension labels */}
        {showLabels && dimensions ? (
          <G>
            {/* Top (Length) callout */}
            <Line
              x1={offsetX}
              y1={offsetY - 18}
              x2={offsetX + drawW}
              y2={offsetY - 18}
              stroke={COLORS.primary}
              strokeWidth={1.2}
            />
            <Rect
              x={offsetX + drawW / 2 - 34}
              y={offsetY - 28}
              width={68}
              height={18}
              rx={4}
              fill={COLORS.primarySoft}
            />
            <SvgText
              x={offsetX + drawW / 2}
              y={offsetY - 15}
              fontSize={11}
              fontWeight="700"
              fill={COLORS.primary}
              textAnchor="middle"
            >
              {formatLength(dimensions.length, unit)}
            </SvgText>

            {/* Left (Width) callout */}
            <Line
              x1={offsetX - 18}
              y1={offsetY}
              x2={offsetX - 18}
              y2={offsetY + drawH}
              stroke={COLORS.primary}
              strokeWidth={1.2}
            />
            <SvgText
              x={offsetX - 22}
              y={offsetY + drawH / 2}
              fontSize={11}
              fontWeight="700"
              fill={COLORS.primary}
              textAnchor="middle"
              transform={`rotate(-90, ${offsetX - 22}, ${offsetY + drawH / 2})`}
            >
              {formatLength(dimensions.width, unit)}
            </SvgText>

            {/* Center Area Label */}
            <SvgText
              x={offsetX + drawW / 2}
              y={offsetY + drawH / 2 - 4}
              fontSize={14}
              fontWeight="700"
              fill={COLORS.textMain}
              textAnchor="middle"
            >
              {formatArea(dimensions.floorArea, unit)}
            </SvgText>
            <SvgText
              x={offsetX + drawW / 2}
              y={offsetY + drawH / 2 + 13}
              fontSize={10}
              fontWeight="600"
              fill={COLORS.textSecondary}
              textAnchor="middle"
            >
              Ceiling {formatLength(dimensions.height, unit)}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
