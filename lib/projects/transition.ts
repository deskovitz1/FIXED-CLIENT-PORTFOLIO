/** Shared by the opening portfolio surface and every following film surface. */
export function pageAdvance(top: number, viewportHeight: number) {
  const progress = Math.min(1, Math.max(0, (viewportHeight - top) / Math.max(1, viewportHeight - 145)))
  return { progress, eased: progress * progress * (3 - 2 * progress) }
}
