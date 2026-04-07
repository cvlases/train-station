/**
 * core/loader.js
 * Loads the train station GLB. Uses a Vite ?url import so the path
 * is always resolved correctly regardless of server config.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Vite resolves this to the correct served URL at build + dev time
import stationUrl from '../../assets/train_station.glb?url';

const COLUMN_NAME_PATTERNS = [/column/i, /pillar/i, /post/i, /support/i, /col_/i];

/**
 * Loads the GLB, centers it, auto-fits the camera, and adds it to the scene.
 * Resolves with { model, columnPositions, modelSize }.
 */
export function loadStation(scene, camera) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    console.log('[GLB] Loading from:', stationUrl);

    loader.load(
      stationUrl,

      (gltf) => {
        const model = gltf.scene;

        // ── Print every object name for debugging ─────────────────
        console.group('[Station GLB] Scene graph:');
        model.traverse((obj) => {
          console.log(`  [${obj.type}] "${obj.name}"${obj.isMesh ? ' (mesh)' : ''}`);
        });
        console.groupEnd();

        // ── Replace all materials with light grey, DoubleSide for reliable raycasting ──
        const stationMat = new THREE.MeshStandardMaterial({
          color: 0xe8e8e8,
          roughness: 0.85,
          metalness: 0.0,
          side: THREE.DoubleSide,  // needed so floor/stair rays hit from any angle
        });
        const meshes = [];
        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.material      = stationMat;
            obj.castShadow    = true;
            obj.receiveShadow = true;
            meshes.push(obj);
          }
        });

        // ── Compute bounding box BEFORE modifying position ────────
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        console.log('[GLB] Size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
        console.log('[GLB] Center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));

        // ── Center on XZ, sit floor at y = 0 ─────────────────────
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -box.min.y;

        scene.add(model);

        // ── Place camera on the upper level, far end of the station ─
        // y = 65% of height (upper floor/mezzanine)
        // z = +40% of depth (far end, facing inward toward -Z)
        const upperLevel = size.y * 0.65;
        const farEnd     = size.z * -0.40;
        camera.position.set(0, upperLevel, farEnd);
        camera.updateProjectionMatrix();

        console.log(`[GLB] Camera: y=${upperLevel.toFixed(2)}, z=${farEnd.toFixed(2)} (model: ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)})`);

        // ── Extract column world positions ────────────────────────
        // (after scene.add so world matrices are valid)
        const columnPositions = [];
        model.traverse((obj) => {
          if (!obj.isMesh) return;
          if (COLUMN_NAME_PATTERNS.some((re) => re.test(obj.name))) {
            const wp = new THREE.Vector3();
            obj.getWorldPosition(wp);
            wp.y = 0;
            columnPositions.push(wp);
          }
        });

        console.log(`[GLB] Columns found: ${columnPositions.length}`);
        resolve({ model, meshes, columnPositions, modelSize: size });
      },

      (xhr) => {
        if (xhr.total) console.log(`[GLB] ${Math.round(xhr.loaded / xhr.total * 100)}%`);
      },

      (err) => {
        console.error('[GLB] Load error:', err);
        reject(err);
      }
    );
  });
}
