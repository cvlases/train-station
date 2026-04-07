/**
 * simulation/firstperson.js
 *
 * Joystick-style steering: mouse distance from screen center sets rotation speed.
 * Center = straight, edge = fast spin. No range limits — complete control.
 * Click to pause/resume. While paused, drag to free-look.
 */

import * as THREE from 'three';

const CONFIG = {
  walkSpeed:       1.5,          // world units per second
  maxTurnRate:     4.5,
  maxPitchRate:    0.25,         // very subtle vertical — reduces motion sickness
  deadZone:        0.04,         // ignore tiny mouse wobble near center
  panSensitivity:  0.003,        // drag sensitivity while paused
};

const _raycaster = new THREE.Raycaster();
const _down      = new THREE.Vector3(0, -1, 0);
const _fwd       = new THREE.Vector3();

export function createFirstPersonControls(camera) {
  let yaw   = 0;
  let pitch = 0;
  let mouseX = 0, mouseY = 0;
  let paused = false;
  let pendingDX = 0, pendingDY = 0;
  let meshes = [];
  let eyeHeight = 5, stepHeight = 3, wallRadius = 2, floorCastDown = 15;

  window.addEventListener('mousemove', (e) => {
    mouseX =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    if (paused) { pendingDX += e.movementX; pendingDY += e.movementY; }
  });

  window.addEventListener('click', () => { paused = !paused; });

  function setMeshes(modelMeshes, modelSize) {
    meshes        = modelMeshes;
    eyeHeight     = modelSize.y * 0.095;
    stepHeight    = eyeHeight   * 0.6;
    wallRadius    = eyeHeight   * 0.4;
    floorCastDown = eyeHeight   * 3;
  }

  function applyDeadZone(v) {
    if (Math.abs(v) < CONFIG.deadZone) return 0;
    return Math.sign(v) * (Math.abs(v) - CONFIG.deadZone) / (1 - CONFIG.deadZone);
  }

  const pitchMin = -Math.PI * 0.1;  // only a tiny tilt down
  const pitchMax =  Math.PI * 0.1;  // only a tiny tilt up

  function update(delta) {
    camera.rotation.order = 'YXZ';

    if (paused) {
      yaw   -= pendingDX * CONFIG.panSensitivity;
      pitch -= pendingDY * CONFIG.panSensitivity;
      pitch  = Math.max(pitchMin, Math.min(pitchMax, pitch));
      pendingDX = 0; pendingDY = 0;
    } else {
      // Mouse offset from center drives rotation speed (joystick-style)
      const turnX = applyDeadZone(mouseX);
      const turnY = applyDeadZone(mouseY);

      yaw   -= turnX * CONFIG.maxTurnRate  * delta;
      pitch += turnY * CONFIG.maxPitchRate * delta;
      pitch  = Math.max(pitchMin, Math.min(pitchMax, pitch));

      // Move forward in flat look direction
      camera.rotation.y = yaw;
      camera.rotation.x = 0;
      camera.getWorldDirection(_fwd);
      _fwd.y = 0;
      _fwd.normalize();

      // Wall collision
      if (meshes.length > 0) {
        _raycaster.set(camera.position, _fwd);
        _raycaster.far = wallRadius;
        const hits = _raycaster.intersectObjects(meshes, false);
        if (hits.length === 0) camera.position.addScaledVector(_fwd, CONFIG.walkSpeed * delta);
      } else {
        camera.position.addScaledVector(_fwd, CONFIG.walkSpeed * delta);
      }

      // Floor following
      if (meshes.length > 0) {
        const origin = camera.position.clone();
        origin.y += stepHeight;
        _raycaster.set(origin, _down);
        _raycaster.far = floorCastDown + stepHeight;
        const hits = _raycaster.intersectObjects(meshes, false);
        if (hits.length > 0) camera.position.y = hits[0].point.y + eyeHeight;
      }
    }

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  function isPaused() { return paused; }

  // Mouse angle for compass — reflects actual turn direction
  function getMouseAngle() {
    const x = applyDeadZone(mouseX);
    const y = applyDeadZone(mouseY);
    return Math.atan2(x, Math.max(y, 0.01)); // always point at least fwd
  }

  return { update, isPaused, setMeshes, getMouseAngle };
}
