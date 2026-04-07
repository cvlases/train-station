/**
 * utils/math.js
 * Shared math helpers used across the simulation.
 */

import * as THREE from 'three';

/**
 * Linear interpolation — used for smooth avatar movement.
 * @param {number} a  Start value
 * @param {number} b  Target value
 * @param {number} t  Interpolation factor (0–1)
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 2D distance between two THREE.Vector3 values, ignoring y.
 * Used for proximity checks on the floor plane.
 */
export function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a value from one range to another.
 * e.g. mapRange(0.5, 0, 1, 0, 100) → 50
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

/**
 * Projects a mouse event position to a point on the y=0 floor plane.
 * Returns a THREE.Vector3 (y = 0) or null if no intersection.
 */
export function mouseToFloor(event, camera, floorPlane) {
  const ndc = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const target = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(floorPlane, target);
  return hit ? target : null;
}
