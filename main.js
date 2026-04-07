/**
 * main.js — GLB + first-person navigation with floor/wall collision
 * Mouse steers. Camera auto-walks. Click to pause/resume.
 */

import * as THREE from 'three';
import { createScene }               from './src/core/scene.js';
import { loadStation }               from './src/core/loader.js';
import { createFirstPersonControls } from './src/simulation/firstperson.js';
import { createCompass }             from './src/ui/compass.js';

async function init() {
  const container = document.getElementById('canvas-container');
  const { scene, camera, renderer } = createScene(container);

  const fp      = createFirstPersonControls(camera);
  const compass = createCompass();

  // Pause status pill
  const status = document.createElement('div');
  Object.assign(status.style, {
    position: 'fixed', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
    fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.08em',
    background: 'rgba(0,0,0,0.5)', color: '#fff',
    padding: '5px 12px', borderRadius: '4px', pointerEvents: 'none', zIndex: '20',
  });
  status.textContent = 'Click to pause';
  document.body.appendChild(status);

  window.addEventListener('click', () => {
    status.textContent = fp.isPaused() ? '⏸ Paused — click to resume' : 'Click to pause';
  });

  let meshes = [], modelSize = new THREE.Vector3(60, 20, 60);

  try {
    const result = await loadStation(scene, camera);
    meshes     = result.meshes;
    modelSize  = result.modelSize;
  } catch (err) {
    console.error('[main] GLB failed:', err);
  }

  // Give the controls the mesh list so raycasting works
  fp.setMeshes(meshes, modelSize);

  const loaderEl = document.getElementById('loader');
  loaderEl.classList.add('hidden');
  setTimeout(() => loaderEl.remove(), 700);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    fp.update(clock.getDelta());
    compass.update(fp.getMouseAngle());
    renderer.render(scene, camera);
  }
  animate();
}

init();
