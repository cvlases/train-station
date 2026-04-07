/**
 * audio/arcs.js
 * Renders animated sonar-style arc rings around obstacles when the
 * user avatar is nearby — simulating directional spatial audio feedback
 * that a BLV navigation device would emit.
 *
 * Arcs are partial (not full circles) and oriented to face toward the user,
 * suggesting directionality. They expand outward from the obstacle and fade.
 */

import * as THREE from 'three';
import { distanceXZ } from '../utils/math.js';
import { OBSTACLE_CONFIG, resolveObstaclePositions } from './obstacles.js';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates points for a partial arc (chord of a circle) in the XZ plane.
 *
 * @param {number} radius        Circle radius
 * @param {number} startAngle    Start angle in radians
 * @param {number} endAngle      End angle in radians
 * @param {number} segments      Number of line segments
 * @returns {THREE.Vector3[]}
 */
function buildArcPoints(radius, startAngle, endAngle, segments = 32) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + t * (endAngle - startAngle);
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return points;
}

/**
 * Creates an arc Line object centered at (0,0,0), ready to be offset.
 * The arc geometry is rebuilt each frame as the radius expands.
 */
function createArcLine(color) {
  const geo = new THREE.BufferGeometry();
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.renderOrder = 1;
  return line;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates the arc feedback system for all obstacles.
 *
 * @param {THREE.Scene}      scene
 * @param {THREE.Vector3[]}  columnPositionsFromGLB  May be empty → fallback used
 * @param {number}           positionScale           Scales fallback positions and radii
 * @returns {{ update(avatarPos, delta): void, dispose(): void }}
 */
export function createArcSystem(scene, columnPositionsFromGLB, positionScale = 1) {
  const cfg    = OBSTACLE_CONFIG;
  const arcCfg = cfg.arc;

  // Scale spatial values to match the real model footprint
  const scaledProximity = cfg.proximityRadius * positionScale;
  const scaledMaxRadius = arcCfg.maxRadius    * positionScale;
  const scaledSpeed     = arcCfg.speed        * positionScale;

  // Resolve obstacle positions (GLB-extracted or scaled fallback)
  const rawPositions       = resolveObstaclePositions(columnPositionsFromGLB);
  // If using fallback positions, scale them; GLB positions are already in world units
  const obstaclePositions  = columnPositionsFromGLB.length > 0
    ? rawPositions
    : rawPositions.map((p) => new THREE.Vector3(p.x * positionScale, 0, p.z * positionScale));

  // One obstacle state per position
  const obstacles = obstaclePositions.map((pos) => {
    // Create N staggered arc rings per obstacle
    const rings = Array.from({ length: arcCfg.count }, (_, i) => {
      const line = createArcLine(arcCfg.color);
      scene.add(line);
      return {
        line,
        phase: i / arcCfg.count, // stagger 0..1
        radius: 0,
      };
    });

    return {
      pos,           // THREE.Vector3 (floor level)
      rings,
      active: false,
    };
  });

  /**
   * Called each frame.
   * @param {THREE.Vector3} avatarPos
   * @param {number}        delta     Frame delta (seconds)
   */
  function update(avatarPos, delta) {
    for (const obs of obstacles) {
      const dist = distanceXZ(avatarPos, obs.pos);
      obs.active = dist < scaledProximity;

      // Angle from obstacle toward avatar (so arcs face the user)
      const toUser = Math.atan2(
        avatarPos.z - obs.pos.z,
        avatarPos.x - obs.pos.x
      );

      // Intensity scales with proximity (closer = more intense arcs)
      const proximityT = obs.active
        ? 1 - dist / scaledProximity
        : 0;

      for (const ring of obs.rings) {
        if (obs.active) {
          // Advance ring phase using scaled speed and radius
          ring.phase = (ring.phase + delta * scaledSpeed / scaledMaxRadius) % 1;
          ring.radius = ring.phase * scaledMaxRadius;

          const t = ring.phase; // 0 (fresh) → 1 (fully expanded)
          const halfSpread = arcCfg.spread / 2;

          // Rebuild arc geometry for current radius
          const points = buildArcPoints(
            ring.radius,
            toUser - halfSpread,
            toUser + halfSpread,
            24
          );

          // Offset arc to obstacle world position
          for (const p of points) {
            p.x += obs.pos.x;
            p.z += obs.pos.z;
            p.y = 0.15; // just above floor
          }

          const geo = new THREE.BufferGeometry().setFromPoints(points);
          ring.line.geometry.dispose();
          ring.line.geometry = geo;
          ring.line.material.opacity =
            arcCfg.baseOpacity * (1 - t) * proximityT;
          ring.line.visible = ring.radius > 0.2;
        } else {
          ring.line.visible = false;
          // Reset so arcs restart immediately when user re-enters
          ring.radius = 0;
        }
      }
    }
  }

  function dispose() {
    for (const obs of obstacles) {
      for (const ring of obs.rings) {
        ring.line.geometry.dispose();
        ring.line.material.dispose();
        scene.remove(ring.line);
      }
    }
  }

  return { update, dispose };
}
