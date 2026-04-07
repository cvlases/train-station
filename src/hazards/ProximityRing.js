/**
 * hazards/ProximityRing.js
 *
 * Visible ring around the user at floor level.
 * When the ring edge touches solid geometry (wall, column, stair edge),
 * a brief notification appears at the collision point and fades away.
 */

import * as THREE from 'three';
import warningSoundUrl from '../../assets/warning_sound.mp4?url';

const CONFIG = {
  ringRadius:        0.75,   // world units
  nRays:             32,     // horizontal rays cast outward
  indicatorLifetime: 1.8,    // seconds before fade completes
  cooldownTime:      3.0,    // seconds before same zone fires again
  cooldownGridSize:  1.5,    // grid cell size for cooldown keys
};

const warningAudio = new Audio(warningSoundUrl);
warningAudio.volume = 0.6;

export function createProximityRing(scene, meshes) {
  const { ringRadius, nRays, indicatorLifetime, cooldownTime, cooldownGridSize } = CONFIG;

  // ── Ring mesh ─────────────────────────────────────────────────────────────
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(ringRadius - 0.07, ringRadius, 64),
    new THREE.MeshBasicMaterial({
      color:       0x00E5FF,
      transparent: true,
      opacity:     0.65,
      side:        THREE.DoubleSide,
      depthWrite:  false,
      depthTest:   false,
    })
  );
  ring.rotation.x  = -Math.PI / 2;
  ring.renderOrder = 10;
  scene.add(ring);

  // ── Notification overlay ──────────────────────────────────────────────────
  // A small HUD pill that appears top-centre, not in 3D space
  const notifEl = document.createElement('div');
  Object.assign(notifEl.style, {
    position:      'fixed',
    top:           '60px',
    left:          '50%',
    transform:     'translateX(-50%)',
    fontFamily:    'monospace',
    fontSize:      '12px',
    letterSpacing: '0.1em',
    color:         '#ff44aa',
    background:    'rgba(0,0,0,0.55)',
    padding:       '5px 14px',
    borderRadius:  '4px',
    pointerEvents: 'none',
    zIndex:        '50',
    opacity:       '0',
    transition:    'opacity 0.15s ease',
  });
  notifEl.textContent = '⚠ obstacle nearby';
  document.body.appendChild(notifEl);

  // ── 3D indicator sphere at hit point ──────────────────────────────────────
  const activeIndicators = [];

  function spawnIndicator(hitPoint, floorY) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 1.0 })
    );
    sphere.position.set(hitPoint.x, floorY + 0.25, hitPoint.z);
    sphere.renderOrder = 10;
    scene.add(sphere);

    // Flash the HUD pill
    notifEl.style.opacity = '1';

    activeIndicators.push({ sphere, age: 0, startY: floorY + 0.25 });
  }

  // ── Raycasting state ──────────────────────────────────────────────────────
  const raycaster   = new THREE.Raycaster();
  const downDir     = new THREE.Vector3(0, -1, 0);
  const cooldowns   = new Map();
  let   notifFadeTimer = 0;
  let   floorY = 0; // updated each frame via downward raycast

  // ── Per-frame update ──────────────────────────────────────────────────────
  function update(delta, cameraPos) {

    // Find floor Y by casting a ray straight down from the camera
    if (meshes.length > 0) {
      raycaster.set(cameraPos, downDir);
      raycaster.far = 30;
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) floorY = hits[0].point.y;
    }

    // Move ring to floor level, rotate oval to always face camera forward direction
    ring.position.set(cameraPos.x, floorY + 0.35, cameraPos.z);

    // Tick cooldowns
    for (const [key, t] of cooldowns.entries()) {
      const next = t - delta;
      if (next <= 0) cooldowns.delete(key);
      else           cooldowns.set(key, next);
    }

    // Cast horizontal rays outward from camera
    if (meshes.length > 0) {
      for (let i = 0; i < nRays; i++) {
        const angle = (i / nRays) * Math.PI * 2;
        const dir   = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

        raycaster.set(cameraPos, dir);
        raycaster.far = ringRadius + 0.5;

        const hits = raycaster.intersectObjects(meshes, false);
        if (hits.length > 0 && hits[0].distance <= ringRadius) {
          const gx  = Math.round(hits[0].point.x / cooldownGridSize);
          const gz  = Math.round(hits[0].point.z / cooldownGridSize);
          const key = `${gx},${gz}`;

          if (!cooldowns.has(key)) {
            spawnIndicator(hits[0].point, floorY);
            cooldowns.set(key, cooldownTime);
            notifFadeTimer = 1.5;

            warningAudio.currentTime = 0;
            warningAudio.play().catch(() => {});
            setTimeout(() => {
              warningAudio.pause();
              warningAudio.currentTime = 0;
            }, 1000);
          }
        }
      }
    }

    // Fade HUD pill
    if (notifFadeTimer > 0) {
      notifFadeTimer -= delta;
      if (notifFadeTimer <= 0) notifEl.style.opacity = '0';
    }

    // Age, float, and fade 3D indicator spheres
    for (let i = activeIndicators.length - 1; i >= 0; i--) {
      const ind     = activeIndicators[i];
      ind.age      += delta;
      const t       = ind.age / indicatorLifetime;
      const opacity = Math.max(0, 1.0 - t);

      ind.sphere.material.opacity = opacity;
      ind.sphere.position.y       = ind.startY + t * 0.6;

      if (ind.age >= indicatorLifetime) {
        scene.remove(ind.sphere);
        ind.sphere.geometry.dispose();
        ind.sphere.material.dispose();
        activeIndicators.splice(i, 1);
      }
    }
  }

  return { update };
}
