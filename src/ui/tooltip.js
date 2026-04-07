/**
 * ui/tooltip.js
 * Handles hover detection over sensor meshes and shows/hides the tooltip.
 */

import * as THREE from 'three';

/**
 * Sets up raycasting for sensor hover tooltips.
 *
 * @param {THREE.Camera}  camera
 * @param {HTMLElement}   tooltipEl   #sensor-tooltip DOM element
 * @returns {{ update(sensorMeshes): void }}
 */
export function createTooltipSystem(camera, tooltipEl) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('mousemove', (e) => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Position tooltip near cursor
    tooltipEl.style.left = `${e.clientX + 14}px`;
    tooltipEl.style.top  = `${e.clientY - 8}px`;
  });

  /**
   * Call each frame with the current list of sensor meshes.
   * Shows tooltip if hovering a sensor, hides otherwise.
   */
  function update(sensorMeshes) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(sensorMeshes, false);

    if (hits.length > 0) {
      const { label, description } = hits[0].object.userData;
      tooltipEl.textContent = `${label} — ${description}`;
      tooltipEl.style.display = 'block';
    } else {
      tooltipEl.style.display = 'none';
    }
  }

  return { update };
}
