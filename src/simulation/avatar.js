/**
 * simulation/avatar.js
 * Creates and manages the user avatar — a small glowing dot
 * that follows the mouse cursor on the floor plane.
 */

import * as THREE from 'three';

// ── CONFIG ────────────────────────────────────────────────────────────────────
export const AVATAR_CONFIG = {
  radius: 0.8,           // Sphere radius in world units
  color: 0xffffff,       // Core color
  emissiveColor: 0xaaddff,
  emissiveIntensity: 1.2,

  // Point light attached to avatar — illuminates nearby floor
  pointLightColor: 0x88ccff,
  pointLightIntensity: 2.5,
  pointLightDistance: 18,

  lerpSpeed: 0.09,       // Movement smoothing (0 = no movement, 1 = instant)
  yOffset: 0.8,          // Height above floor plane
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates the avatar mesh and adds it to the scene.
 * Returns { mesh, update(targetPosition) }.
 */
export function createAvatar(scene) {
  const cfg = AVATAR_CONFIG;

  // Outer glow ring (flat torus lying on floor)
  const ringGeo = new THREE.RingGeometry(cfg.radius * 1.4, cfg.radius * 2.0, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;

  // Core sphere
  const geo = new THREE.SphereGeometry(cfg.radius, 16, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    emissive: cfg.emissiveColor,
    emissiveIntensity: cfg.emissiveIntensity,
    roughness: 0.2,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = cfg.yOffset;

  // Soft point light that moves with the avatar
  const pointLight = new THREE.PointLight(
    cfg.pointLightColor,
    cfg.pointLightIntensity,
    cfg.pointLightDistance
  );

  // Group everything together
  const group = new THREE.Group();
  group.add(ring);
  group.add(mesh);
  group.add(pointLight);
  scene.add(group);

  // Current lerped position
  const current = new THREE.Vector3(0, 0, 0);

  /**
   * Call each frame.
   * @param {THREE.Vector3|null} targetPosition  World position to move toward
   * @param {number} delta  Frame delta time (seconds)
   */
  function update(targetPosition, _delta) {
    if (!targetPosition) return;

    // Smooth lerp toward target on XZ plane
    current.x = current.x + (targetPosition.x - current.x) * cfg.lerpSpeed;
    current.z = current.z + (targetPosition.z - current.z) * cfg.lerpSpeed;

    group.position.set(current.x, 0, current.z);
  }

  /**
   * Returns the avatar's current world position (on the floor plane).
   */
  function getPosition() {
    return new THREE.Vector3(current.x, 0, current.z);
  }

  return { group, update, getPosition };
}
