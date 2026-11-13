/** Reflect a projectile at arena walls. Return true only when it leaves with no bounce remaining. */
export function bounceAtWalls(shot: { x: number; y: number; vx: number; vy: number; bounces: number }, width: number, height: number): boolean {
  const hitX = shot.x < 10 || shot.x > width - 10;
  const hitY = shot.y < 10 || shot.y > height - 10;
  if (!hitX && !hitY) return false;
  if (shot.bounces <= 0) return true;
  shot.bounces -= 1;
  if (hitX) shot.vx *= -1;
  if (hitY) shot.vy *= -1;
  shot.x = Math.min(width - 10, Math.max(10, shot.x));
  shot.y = Math.min(height - 10, Math.max(10, shot.y));
  return false;
}

export function attractPickup(pickup: {x: number; y: number}, x: number, y: number, dt: number): number {
  const distance = Math.hypot(x - pickup.x, y - pickup.y);
  if (distance > 0 && distance < 90) {
    const step = Math.min(distance, 260 * dt);
    pickup.x += ((x - pickup.x) / distance) * step;
    pickup.y += ((y - pickup.y) / distance) * step;
  }
  return Math.hypot(x - pickup.x, y - pickup.y);
}
