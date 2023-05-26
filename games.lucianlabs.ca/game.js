const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const SHOOT_THRESHOLD = 10
const DANK_LASER_JUICE = 5000 // Assuming this is the initial value for each laser
const DANK_SHIP_JUICE = 0.1
const NEW_ENEMY_THRESHOLD = 1000 // ms
const DANK_ENEMY_RADIUS = 20
const DANK_SHIP_RADIUS = 10
const DANK_LASER_TIMEOUT = 500

const shipAngle = 0 // The direction the ship is facing, in radians
// get vx and vy from angle
const shipVx = Math.cos(shipAngle)
const shipVy = Math.sin(shipAngle)

const state = {
  ship: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: shipVx,
    vy: shipVy,
    angle: 0, // The direction the ship is facing, in radians
    deathTime: null,
  },
  shipPieces: genArray(10),
  enemies: [{ id: 0, x: canvas.width / 3, y: canvas.height / 3 }], // list of ships
  lasers: [], // list of lasers
  gems: [], // list of gems
  touch: null, // { ux, uy, distance }
  lastMove: null,
  startTime: performance.now(),
  lastEnemy: performance.now(),
  gameOver: false,
  score: 0,
}

canvas.addEventListener('mousedown', (event) => {
  if (state.touch !== null) return

  const x = event.clientX - canvas.getBoundingClientRect().left
  const y = event.clientY - canvas.getBoundingClientRect().top

  state.touch = {
    startX: x,
    startY: y,
    lastX: null,
    lastY: null,
    vx: null,
    vy: null,
    dist: null,
  }
})

canvas.addEventListener('mousemove', (event) => {
  if (state.touch === null) return

  const x = event.clientX - canvas.getBoundingClientRect().left
  const y = event.clientY - canvas.getBoundingClientRect().top

  state.touch.lastX = x
  state.touch.lastY = y
})

canvas.addEventListener('mouseup', () => {
  if (state.touch === null) return

  const { startX, startY, lastX, lastY } = state.touch
  if (lastX === null || lastY === null) return

  const dx = lastX - startX
  const dy = lastY - startY
  const dist = dx * dx + dy * dy

  if (!dist > SHOOT_THRESHOLD * SHOOT_THRESHOLD) return (state.touch = null)

  const angle = Math.atan2(dy, dx)
  const vx = Math.cos(angle)
  const vy = Math.sin(angle)

  addLaser({ x: startX, y: startY, vx, vy, dist, t: performance.now() })

  state.touch = null
})

canvas.addEventListener(
  'touchstart',
  (e) => {
    const touch = e.touches[0]
    state.touch = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      vx: null,
      vy: null,
    }
  },
  { passive: false },
)

canvas.addEventListener(
  'touchmove',
  (e) => {
    if (!state.touch) return

    const touch = e.touches[0]
    state.touch.lastX = touch.clientX
    state.touch.lastY = touch.clientY
  },
  { passive: false },
)

canvas.addEventListener('mouseleave', () => {
  // if state is dragging
})

canvas.addEventListener(
  'touchend',
  () => {
    if (
      !state.touch ||
      state.touch.lastX === null ||
      state.touch.lastY === null
    )
      return

    const dx = state.touch.lastX - state.touch.startX
    const dy = state.touch.lastY - state.touch.startY

    dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < SHOOT_THRESHOLD) return

    // play sound
    addLaser({
      x: state.touch.startX,
      y: state.touch.startY,
      vx: dx,
      vy: dy,
      dist,
      created: performance.now(),
    })

    state.touch = null
  },
  { passive: false },
)

const addLaser = (laser) => {
  if (state.gameOver) return
  // console.log('added laser', laser)

  state.lasers.push({
    ...laser,
    x: state.ship.x,
    y: state.ship.y,
    life: DANK_LASER_JUICE,
  })
  state.ship.vx -= laser.vx
  state.ship.vy -= laser.vy
}

function updateLasers(deltaTime) {
  state.lasers.forEach((laser) => {
    const speedMultiplier = Math.max(Math.min(laser.dist / 100000, 2), 0.2) // normalize distance to the threshold

    laser.x += laser.vx * deltaTime * speedMultiplier
    laser.y += laser.vy * deltaTime * speedMultiplier

    // keep laser in bounds
    if (laser.x < 0) laser.x = canvas.width
    if (laser.x > canvas.width) laser.x = 0
    if (laser.y < 0) laser.y = canvas.height
    if (laser.y > canvas.height) laser.y = 0

    laser.life -= deltaTime

    if (laser.life <= 0) {
      state.lasers = state.lasers.filter((l) => l !== laser)
      // play sound
    }

    state.enemies.forEach((enemy) => {
      const dx = enemy.x - laser.x
      const dy = enemy.y - laser.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < DANK_ENEMY_RADIUS) {
        // play sound
        increaseScore()
        state.enemies = state.enemies.filter((e) => e !== enemy)
        state.lasers = state.lasers.filter((l) => l !== laser)
      }
    })

    if (state.gameOver) return

    // Check if laser hits the ship
    const dx = state.ship.x - laser.x
    const dy = state.ship.y - laser.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < DANK_SHIP_RADIUS) {
      //   // play sound
      if (laser.life > DANK_LASER_JUICE - DANK_LASER_TIMEOUT) return
      // console.log("You're dead", dist, DANK_LASER_JUICE - DANK_LASER_TIMEOUT)
      state.ship.deathTime = performance.now()
      setGameOver()
      state.lasers = state.lasers.filter((l) => l !== laser)
    }
  })
}

function updateShip(deltaTime) {
  // Update position based on velocity
  state.ship.x += state.ship.vx * deltaTime * DANK_SHIP_JUICE
  state.ship.y += state.ship.vy * deltaTime * DANK_SHIP_JUICE
  if (state.ship.deathTime) return

  // if ship is out of bounds, move it to the other side
  if (state.ship.x < 0) state.ship.x = canvas.width
  if (state.ship.x > canvas.width) state.ship.x = 0
  if (state.ship.y < 0) state.ship.y = canvas.height
  if (state.ship.y > canvas.height) state.ship.y = 0
  state.ship.angle = Math.atan2(state.ship.vy, state.ship.vx)
}

// game update function
function update(deltaTime) {
  // TODO: Update game state
  updateLasers(deltaTime)
  updateShip(deltaTime)
}

function drawShipPieces() {
  // draw ever epanding ship pieces
  // 5 pieces

  const timeSinceDeath = performance.now() - state.ship.deathTime

  // TODO make ship pieces independent vectors and bounce off things
  state.shipPieces.map((v, i) => {
    // const i = 0
    ctx.save()
    ctx.translate(state.ship.x, state.ship.y)
    ctx.rotate(10 * v * i + timeSinceDeath * 0.000001)
    ctx.translate(0, 10 * timeSinceDeath * 0.001 + v * 10)
    ctx.rotate(i + timeSinceDeath * 0.003 * v)
    // rotate by index + some algo
    // draw a line 10 long and 2 wide
    ctx.beginPath()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2

    const size = 10 * v + 2

    ctx.moveTo(size, 0)
    ctx.lineTo(-size, 0)
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  })
}

function drawShip() {
  if (state.gameOver) return drawShipPieces()

  const size = 20 // The size of the ship

  ctx.save()
  ctx.translate(state.ship.x, state.ship.y)
  ctx.rotate(state.ship.angle)

  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.moveTo(size, 0)
  ctx.lineTo(-size / 2, size / 2)
  ctx.lineTo(-size / 2, -size / 2)
  ctx.closePath()

  ctx.strokeStyle = 'white'
  ctx.stroke()

  ctx.restore()
}

// game draw function
function draw() {
  // clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawShip()
  drawDebug()

  // Draw each laser
  state.lasers.forEach((laser) => {
    ctx.beginPath()
    ctx.arc(laser.x + r(), laser.y + r(), 5, 0, Math.PI * 2, false)

    // Give the laser a random color
    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`
    ctx.fill()
  })

  // draw enemies
  state.enemies.forEach((enemy) => {
    ctx.beginPath()
    ctx.arc(
      enemy.x + r(2),
      enemy.y + r(2),
      DANK_ENEMY_RADIUS,
      0,
      Math.PI * 2,
      false,
    )

    // Give the laser a random color
    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`
    ctx.fill()
  })
}

function drawDebug() {
  if (!state.touch) return

  const { startX, startY, lastX, lastY } = state.touch
  if (lastX !== null && lastY !== null) {
    // Draw circle at touch start
    ctx.strokeStyle = 'red'
    ctx.beginPath()
    ctx.arc(startX, startY, 10, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw line from start to current position
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(lastX, lastY)
    ctx.stroke()
  }
}

// game loop
function loop(timestamp) {
  const deltaTime = timestamp - (lastTimestamp || timestamp)
  lastTimestamp = timestamp

  // update and draw the game
  update(deltaTime)
  draw()

  // schedule the next frame
  requestAnimationFrame(loop)
}

// start the game loop
let lastTimestamp
requestAnimationFrame(loop)

function increaseScore(amount = 1) {
  state.score += amount
  document.getElementById('score').innerText = state.score
}

function setGameOver() {
  state.gameOver = true
  const el = document.getElementById('game-message')
  el.className = 'visible'
}

function resetGame() {
  console.log('resetting game')
}
