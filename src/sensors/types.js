/**
 * sensors/types.js
 * Defines sensor type constants and their visual properties.
 * All sensor definitions live here — easy to tweak for stakeholder demos.
 */

// ── SENSOR TYPE DEFINITIONS ───────────────────────────────────────────────────
export const SENSOR_TYPES = {
  BLE: {
    id: 'BLE',
    label: 'BLE',
    description: 'Bluetooth Low Energy — short range, blocked by concrete',
    color: 0x3b82f6,      // blue
    ringColor: 0x3b82f6,
    emissiveColor: 0x1d4ed8,
  },
  RTT: {
    id: 'RTT',
    label: 'RTT WiFi',
    description: 'Round-Trip Time WiFi — wide area coverage anchor',
    color: 0xeab308,      // yellow
    ringColor: 0xeab308,
    emissiveColor: 0x854d0e,
  },
  UWB: {
    id: 'UWB',
    label: 'UWB',
    description: 'Ultra-Wideband — precision positioning, high-risk zones',
    color: 0xf97316,      // orange
    ringColor: 0xf97316,
    emissiveColor: 0x9a3412,
  },
};

// ── SENSOR PLACEMENT CONFIG ───────────────────────────────────────────────────
// Positions are in world space (x, z). y is set automatically to float above floor.
// Adjust these freely — labeled clearly for stakeholder demos.
export const SENSOR_CONFIGS = [
  // BLE sensors — scattered, near columns (BLE can't pass through concrete)
  { type: 'BLE', id: 'BLE-01', x: -18, z: -10 },
  { type: 'BLE', id: 'BLE-02', x:  18, z: -10 },
  { type: 'BLE', id: 'BLE-03', x: -18, z:  12 },
  { type: 'BLE', id: 'BLE-04', x:  18, z:  12 },
  { type: 'BLE', id: 'BLE-05', x:  -6, z:  -8 },
  { type: 'BLE', id: 'BLE-06', x:   6, z:  -8 },
  { type: 'BLE', id: 'BLE-07', x:  -6, z:  20 },
  { type: 'BLE', id: 'BLE-08', x:   6, z:  20 },

  // RTT WiFi — wider coverage, 4 corners/center
  { type: 'RTT', id: 'RTT-01', x: -28, z: -20 },
  { type: 'RTT', id: 'RTT-02', x:  28, z: -20 },
  { type: 'RTT', id: 'RTT-03', x: -28, z:  28 },
  { type: 'RTT', id: 'RTT-04', x:  28, z:  28 },

  // UWB — precision, near platform edges and stairs (high-risk)
  { type: 'UWB', id: 'UWB-01', x:   0, z:  35 }, // platform edge
  { type: 'UWB', id: 'UWB-02', x: -22, z:  32 }, // stair zone left
  { type: 'UWB', id: 'UWB-03', x:  22, z:  32 }, // stair zone right
];
