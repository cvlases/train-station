/**
 * core/scene.js
 * Scene, renderer, camera, and lighting.
 * Camera starts at a standing eye-level position; first-person controls take over after.
 */

import * as THREE from 'three';

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Wide FOV feels more natural for first-person
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  // Positioned at a rough standing height; loadStation will correct this after reading model size
  camera.position.set(0, 10, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // Low ambient so shadows are visible and the scene has contrast
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  // Strong directional from above-left — casts hard shadows for depth
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(80, 200, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far  = 1000;
  sun.shadow.camera.left   = -300;
  sun.shadow.camera.right  =  300;
  sun.shadow.camera.top    =  300;
  sun.shadow.camera.bottom = -300;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Soft fill from the opposite side so deep shadows aren't pitch black
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-60, 80, -80);
  scene.add(fill);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
