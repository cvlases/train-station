/**
 * audio/obstacles.js
 * Defines obstacle (column) positions for spatial audio feedback simulation.
 * If the GLB loader finds named column meshes, those world positions are used.
 * Otherwise we fall back to COLUMN_FALLBACK defined below.
 *
 * The "audio feedback" here is purely visual — animated arc sonar rings that
 * emanate from obstacles when the user approaches them, simulating what a
 * real spatial audio system would communicate to a BLV user.
 */

import * as THREE from 'three';

// ── CONFIG ────────────────────────────────────────────────────────────────────
export const OBSTACLE_CONFIG = {
  // Proximity radius at which audio feedback arcs begin (world units)
  proximityRadius: 14,

  // Arc animation
  arc: {
    maxRadius: 10,
    speed: 5.0,        // Expansion speed (world units/sec)
    count: 3,          // Number of concurrent arc rings per obstacle
    spread: 0.38,      // Angular spread of each arc (radians, < 2π = partial arc)
    baseOpacity: 0.7,
    color: 0xf59e0b,   // Amber — warm, distinct from sensor rings
    lineWidth: 1,
  },

  // Fallback column positions if GLB has no named column meshes
  // These are approximate positions for a typical rectangular train station
  fallback: [
    { x: -14, z:  -6 },
    { x:  14, z:  -6 },
    { x: -14, z:   8 },
    { x:  14, z:   8 },
    { x: -14, z:  22 },
    { x:  14, z:  22 },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the obstacle positions to use.
 * If columnPositions (from GLB) has entries, use those; otherwise use fallback.
 *
 * @param {THREE.Vector3[]} columnPositions  Extracted from GLB loader
 * @returns {THREE.Vector3[]}
 */
export function resolveObstaclePositions(columnPositions) {
  if (columnPositions && columnPositions.length > 0) {
    console.log('[Obstacles] Using GLB column positions:', columnPositions.length);
    return columnPositions;
  }
  console.log('[Obstacles] Using fallback column positions.');
  return OBSTACLE_CONFIG.fallback.map(
    ({ x, z }) => new THREE.Vector3(x, 0, z)
  );
}
