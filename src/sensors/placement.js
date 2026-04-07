/**
 * sensors/placement.js
 * Builds sensor meshes from SENSOR_CONFIGS and places them in the scene.
 * Each sensor is a small glowing sphere with a floating label on hover.
 *
 * All spatial values in this file are authored at a "reference scale" of 1.0
 * (designed for a ~60×60 unit station). Pass positionScale to adapt them to
 * the real GLB's world-unit footprint.
 */

import * as THREE from 'three';
import { SENSOR_TYPES, SENSOR_CONFIGS } from './types.js';
import { distanceXZ } from '../utils/math.js';

// ── CONFIG (reference scale = 1.0) ───────────────────────────────────────────
export const SENSOR_VISUAL_CONFIG = {
  radius: 0.5,              // Sphere radius at reference scale
  yOffset: 3.5,             // Float height above floor (absolute, not scaled)
  emissiveIntensity: 0.8,
  activeEmissiveIntensity: 2.5,
  activePulseSpeed: 3.0,

  // Proximity radius at which a sensor activates (reference scale)
  proximityRadius: 12,

  // Expanding ring emitted when active
  ring: {
    maxRadius: 8,           // Reference scale
    speed: 5.0,             // World units/sec at reference scale
    opacity: 0.65,
  },
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates all sensor meshes and adds them to the scene.
 *
 * @param {THREE.Scene} scene
 * @param {number}      positionScale  Scales x/z positions and spatial radii
 *                                     to match the actual GLB world-unit size.
 */
export function createSensors(scene, positionScale = 1) {
  const vcfg = SENSOR_VISUAL_CONFIG;

  // Scale spatial values to match the real model footprint
  const scaledRadius     = vcfg.radius          * Math.max(positionScale, 1);
  const scaledProximity  = vcfg.proximityRadius  * positionScale;
  const scaledRingMax    = vcfg.ring.maxRadius   * positionScale;
  const scaledRingSpeed  = vcfg.ring.speed       * positionScale;

  const sensors = SENSOR_CONFIGS.map((rawCfg, index) => {
    const cfg     = { ...rawCfg, x: rawCfg.x * positionScale, z: rawCfg.z * positionScale };
    const typeDef = SENSOR_TYPES[cfg.type];

    // Core glowing sphere
    const geo = new THREE.SphereGeometry(scaledRadius, 12, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: typeDef.color,
      emissive: typeDef.emissiveColor,
      emissiveIntensity: vcfg.emissiveIntensity,
      roughness: 0.3,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cfg.x, vcfg.yOffset, cfg.z);

    // Metadata used by the tooltip raycaster
    mesh.userData = {
      sensorId:    cfg.id,
      sensorType:  cfg.type,
      label:       `${typeDef.label} · ${cfg.id}`,
      description: typeDef.description,
    };

    scene.add(mesh);

    // Expanding activation ring (flat ring on the floor)
    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: typeDef.ringColor,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cfg.x, 0.15, cfg.z);
    scene.add(ring);

    return {
      cfg,
      typeDef,
      mesh,
      ring,
      active:      false,
      ringRadius:  0,
      pulseTime:   index * 0.4,   // stagger pulse phase per sensor
      // Scaled spatial values stored so updateSensors can use them
      scaledProximity,
      scaledRingMax,
      scaledRingSpeed,
    };
  });

  return sensors;
}

/**
 * Updates all sensors each frame.
 * Activates sensors near the avatar; animates pulse and expanding ring.
 *
 * @param {Array}          sensors    Sensor state objects from createSensors()
 * @param {THREE.Vector3}  avatarPos  Current avatar world position
 * @param {number}         elapsed    Total elapsed time (seconds)
 * @param {number}         delta      Frame delta (seconds)
 */
export function updateSensors(sensors, avatarPos, elapsed, delta) {
  const vcfg = SENSOR_VISUAL_CONFIG;

  for (const sensor of sensors) {
    const dist   = distanceXZ(avatarPos, sensor.mesh.position);
    const isNear = dist < sensor.scaledProximity;

    // ── Activation ───────────────────────────────────────────────
    if (isNear && !sensor.active) {
      sensor.active     = true;
      sensor.ringRadius = 0;
    } else if (!isNear) {
      sensor.active = false;
    }

    // ── Emissive pulse ────────────────────────────────────────────
    sensor.pulseTime += delta;
    const pulse = Math.sin(sensor.pulseTime * vcfg.activePulseSpeed) * 0.5 + 0.5;
    sensor.mesh.material.emissiveIntensity = sensor.active
      ? vcfg.activeEmissiveIntensity * (0.7 + 0.3 * pulse)
      : vcfg.emissiveIntensity;

    // Gentle bob
    sensor.mesh.position.y = vcfg.yOffset + Math.sin(elapsed * 1.2 + sensor.cfg.x * 0.1) * 0.25;

    // ── Expanding ring ────────────────────────────────────────────
    if (sensor.active) {
      sensor.ringRadius += sensor.scaledRingSpeed * delta;
      if (sensor.ringRadius > sensor.scaledRingMax) sensor.ringRadius = 0;

      const t     = sensor.ringRadius / sensor.scaledRingMax;
      const scale = sensor.ringRadius + 0.1;
      sensor.ring.scale.set(scale, scale, 1);
      sensor.ring.material.opacity = vcfg.ring.opacity * (1 - t);
    } else {
      sensor.ring.material.opacity = 0;
      sensor.ringRadius = 0;
    }
  }
}

/** Returns sensor meshes for raycasting (hover tooltip). */
export function getSensorMeshes(sensors) {
  return sensors.map((s) => s.mesh);
}
