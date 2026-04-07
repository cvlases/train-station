/**
 * simulation/mouse.js
 * Tracks mouse movement and projects it onto the floor plane (y = 0).
 * Returns a reactive targetPosition that the avatar lerps toward.
 */

import * as THREE from 'three';
import { mouseToFloor } from '../utils/math.js';

/**
 * Attaches a mousemove listener and returns a getter for the
 * current floor-plane intersection point.
 *
 * @param {THREE.Camera} camera
 * @returns {{ getTarget: () => THREE.Vector3 | null, dispose: () => void }}
 */
export function createMouseTracker(camera) {
  // The floor sits at y = 0
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  let target = null;

  function onMouseMove(event) {
    target = mouseToFloor(event, camera, floorPlane);
  }

  window.addEventListener('mousemove', onMouseMove);

  function getTarget() {
    return target;
  }

  function dispose() {
    window.removeEventListener('mousemove', onMouseMove);
  }

  return { getTarget, dispose };
}
