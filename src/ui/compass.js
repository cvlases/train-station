/**
 * ui/compass.js
 * Compass dot that points toward where the mouse is pulling the camera.
 * The cone rotates to match the mouse direction in real time.
 */

export function createCompass() {
  const SIZE = 88;
  const cx = SIZE / 2, cy = SIZE / 2;

  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  Object.assign(canvas.style, {
    position:      'fixed',
    bottom:        '36px',
    left:          '50%',
    transform:     'translateX(-50%)',
    pointerEvents: 'none',
    zIndex:        '20',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  /**
   * @param {number} mouseAngle  radians from getMouseAngle() — 0=up, +CW
   */
  function update(mouseAngle) {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // ── Direction cone pointing toward the mouse ──────────────────
    // canvas angle: 0 = right, so subtract π/2 to make 0 = up
    const angle     = mouseAngle - Math.PI / 2;
    const coneLen   = 30;
    const halfSpan  = Math.PI / 6; // 30° half-angle

    const tip   = { x: cx + Math.cos(angle) * coneLen,      y: cy + Math.sin(angle) * coneLen };
    const left  = { x: cx + Math.cos(angle + halfSpan + Math.PI) * 11, y: cy + Math.sin(angle + halfSpan + Math.PI) * 11 };
    const right = { x: cx + Math.cos(angle - halfSpan + Math.PI) * 11, y: cy + Math.sin(angle - halfSpan + Math.PI) * 11 };

    // Gradient cone — brighter near center, fades at tip
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coneLen);
    grad.addColorStop(0,   'rgba(66, 133, 244, 0.7)');
    grad.addColorStop(1,   'rgba(66, 133, 244, 0.0)');

    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // ── White outer ring ──────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur  = 6;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // ── Blue inner dot ────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#4285F4';
    ctx.fill();

    // ── Subtle accuracy ring ──────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(66,133,244,0.35)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  return { update };
}
