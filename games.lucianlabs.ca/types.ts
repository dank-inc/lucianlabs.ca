type TouchMove = {
  startX: number // updated on touchstart
  startY: number // updated on touchstart
  lastX: number | null // updated on touchmove
  lastY: number | null // updated on touchmove
  vx: number | null // written on touchend
  vy: number | null // written on touchend
  dist: number | null
}
