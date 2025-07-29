'use client'

import { useEffect, useRef, useState } from 'react'

// --- Game Configuration ---
const TILE_SIZE = 20
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 0, 0, 1, 4, 4, 4, 1, 0, 0, 2, 2, 2, 2, 2],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
// 0: Empty, 1: Wall, 2: Pellet, 3: Power Pellet, 4: Ghost Spawn

// --- Game Entities ---
class Character {
  x: number
  y: number
  speed: number
  direction: number // 0: Right, 1: Down, 2: Left, 3: Up
  nextDirection: number

  constructor(x: number, y: number, speed: number, direction: number) {
    this.x = x
    this.y = y
    this.speed = speed
    this.direction = direction
    this.nextDirection = direction
  }

  getGridPos(tileSize: number) {
    return {
      row: Math.floor(this.y / tileSize),
      col: Math.floor(this.x / tileSize),
    }
  }

  isAtGridCenter(tileSize: number) {
    return this.x % tileSize === tileSize / 2 && this.y % tileSize === tileSize / 2
  }

  move(map: number[][], tileSize: number) {
    if (this.isAtGridCenter(tileSize)) {
      const nextMove = this.getNewPosition(this.nextDirection)
      if (!this.checkWallCollision(nextMove.x, nextMove.y, map, tileSize)) {
        this.direction = this.nextDirection
      }
    }

    const currentMove = this.getNewPosition(this.direction)
    if (!this.checkWallCollision(currentMove.x, currentMove.y, map, tileSize)) {
      this.x = currentMove.x
      this.y = currentMove.y
    }
  }

  getNewPosition(direction: number) {
    let newX = this.x
    let newY = this.y
    switch (direction) {
      case 0:
        newX += this.speed
        break // Right
      case 1:
        newY += this.speed
        break // Down
      case 2:
        newX -= this.speed
        break // Left
      case 3:
        newY -= this.speed
        break // Up
    }
    return { x: newX, y: newY }
  }

  checkWallCollision(x: number, y: number, map: number[][], tileSize: number) {
    const corners = [
      { x: x - tileSize / 2 + 1, y: y - tileSize / 2 + 1 },
      { x: x + tileSize / 2 - 1, y: y - tileSize / 2 + 1 },
      { x: x - tileSize / 2 + 1, y: y + tileSize / 2 - 1 },
      { x: x + tileSize / 2 - 1, y: y + tileSize / 2 - 1 },
    ]

    for (const corner of corners) {
      const gridCol = Math.floor(corner.x / tileSize)
      const gridRow = Math.floor(corner.y / tileSize)
      if (map[gridRow] && map[gridRow][gridCol] === 1) {
        return true
      }
    }
    return false
  }
}

class Pacman extends Character {
  mouthOpenValue: number
  mouthDirection: number

  constructor(x: number, y: number, speed: number, direction: number) {
    super(x, y, speed, direction)
    this.mouthOpenValue = 10
    this.mouthDirection = 1 // 1 for opening, -1 for closing
  }

  draw(ctx: CanvasRenderingContext2D, tileSize: number) {
    const angle = (this.direction * Math.PI) / 2
    const mouthAngle = (this.mouthOpenValue / 20) * (Math.PI / 4)

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(angle)

    ctx.fillStyle = '#FFFFFF' // Pacman color
    ctx.beginPath()
    ctx.arc(0, 0, tileSize / 2, mouthAngle, 2 * Math.PI - mouthAngle)
    ctx.lineTo(0, 0)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  update(map: number[][], tileSize: number) {
    this.mouthOpenValue += this.mouthDirection
    if (this.mouthOpenValue > 10 || this.mouthOpenValue < 0) {
      this.mouthDirection *= -1
    }
    this.move(map, tileSize)
  }
}

class Ghost extends Character {
  color: string
  isFrightened: boolean
  isEaten: boolean
  spawnPoint: { x: number; y: number }

  constructor(x: number, y: number, speed: number, direction: number, color: string) {
    super(x, y, speed, direction)
    this.color = color
    this.isFrightened = false
    this.isEaten = false
    this.spawnPoint = { x, y }
  }

  draw(ctx: CanvasRenderingContext2D, tileSize: number) {
    const bodyColor = this.isFrightened ? '#A0A0A0' : this.color
    const eyeColor = '#000000'

    ctx.fillStyle = this.isEaten ? '#E0E0E0' : bodyColor
    ctx.beginPath()
    ctx.arc(this.x, this.y, tileSize / 2, Math.PI, 0)
    ctx.lineTo(this.x + tileSize / 2, this.y + tileSize / 2)
    ctx.lineTo(this.x + tileSize / 3, this.y + tileSize / 4)
    ctx.lineTo(this.x, this.y + tileSize / 2)
    ctx.lineTo(this.x - tileSize / 3, this.y + tileSize / 4)
    ctx.lineTo(this.x - tileSize / 2, this.y + tileSize / 2)
    ctx.closePath()
    ctx.fill()

    // Eyes
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.arc(this.x - tileSize / 4, this.y - tileSize / 6, tileSize / 8, 0, 2 * Math.PI)
    ctx.arc(this.x + tileSize / 4, this.y - tileSize / 6, tileSize / 8, 0, 2 * Math.PI)
    ctx.fill()
  }

  update(map: number[][], tileSize: number) {
    if (this.isEaten) {
      const dx = this.spawnPoint.x - this.x
      const dy = this.spawnPoint.y - this.y
      if (Math.abs(dx) < this.speed && Math.abs(dy) < this.speed) {
        this.x = this.spawnPoint.x
        this.y = this.spawnPoint.y
        this.isEaten = false
        this.isFrightened = false
      } else {
        const angle = Math.atan2(dy, dx)
        this.x += Math.cos(angle) * this.speed * 2
        this.y += Math.sin(angle) * this.speed * 2
      }
      return
    }

    if (this.isAtGridCenter(tileSize)) {
      this.changeDirectionRandomly(map, tileSize)
    }
    this.move(map, tileSize)
  }

  changeDirectionRandomly(map: number[][], tileSize: number) {
    const possibleDirections = []
    for (let i = 0; i < 4; i++) {
      const move = this.getNewPosition(i)
      if (!this.checkWallCollision(move.x, move.y, map, tileSize)) {
        possibleDirections.push(i)
      }
    }
    const oppositeDirection = (this.direction + 2) % 4
    if (possibleDirections.length > 1 && possibleDirections.includes(oppositeDirection)) {
      const index = possibleDirections.indexOf(oppositeDirection)
      possibleDirections.splice(index, 1)
    }

    if (possibleDirections.length > 0) {
      this.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
    }
  }
}

export function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const gameLoopId = useRef<number | null>(null)
  const pacmanRef = useRef<Pacman | null>(null)
  const [tileSize, setTileSize] = useState(20)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let map = JSON.parse(JSON.stringify(MAP))
    let pelletCount = 0

    const resizeCanvas = () => {
      const newTileSize = Math.min(window.innerWidth / MAP[0].length, window.innerHeight / MAP.length)
      setTileSize(newTileSize)
      if (canvasRef.current) {
        canvasRef.current.width = newTileSize * MAP[0].length
        canvasRef.current.height = newTileSize * MAP.length
      }
      pelletCount = 0
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
          if (map[row][col] === 2 || map[row][col] === 3) {
            pelletCount++
          }
        }
      }
    }

    pacmanRef.current = new Pacman(9.5 * tileSize, 17.5 * tileSize, 2, 2)
    const ghosts = [
      new Ghost(8.5 * tileSize, 9.5 * tileSize, 1.5, 0, '#E0E0E0'),
      new Ghost(9.5 * tileSize, 9.5 * tileSize, 1.5, 3, '#C0C0C0'),
      new Ghost(10.5 * tileSize, 9.5 * tileSize, 1.5, 1, '#A0A0A0'),
      new Ghost(9.5 * tileSize, 8.5 * tileSize, 1.5, 2, '#808080'),
    ]

    let powerPelletActive = false
    let powerPelletTimer = 0

    function drawP(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.fillStyle = '#1A1A1A'
      ctx.beginPath()
      ctx.arc(x, y, size / 2, -Math.PI / 2, Math.PI / 2)
      ctx.lineTo(x - size / 4, y + size / 2)
      ctx.lineTo(x - size / 4, y - size / 2)
      ctx.closePath()
      ctx.fill()
    }

    function drawR(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.fillStyle = '#1A1A1A'
      ctx.beginPath()
      ctx.arc(x, y - size / 4, size / 4, -Math.PI / 2, Math.PI / 2)
      ctx.lineTo(x, y)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.lineTo(x + size / 4, y + size / 2)
      ctx.lineTo(x - size / 4, y)
      ctx.lineTo(x - size / 4, y - size / 2)
      ctx.closePath()
      ctx.fill()
    }

    function drawT(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.fillStyle = '#1A1A1A'
      ctx.fillRect(x - size / 2, y - size / 2, size, size / 4)
      ctx.fillRect(x - size / 8, y - size / 2, size / 4, size)
    }

    function drawO(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.fillStyle = '#1A1A1A'
      ctx.beginPath()
      ctx.arc(x, y, size / 2, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
    }

    function drawBackgroundShapes(ctx: CanvasRenderingContext2D) {
      if (gameStarted || !canvasRef.current) return
      const x = canvasRef.current.width / 2
      const y = canvasRef.current.height / 2 + tileSize * 2.5
      const size = tileSize * 2
      const spacing = size * 1.5

      drawP(ctx, x - spacing * 1.5, y, size)
      drawR(ctx, x - spacing * 0.5, y, size)
      drawT(ctx, x + spacing * 0.5, y, size)
      drawO(ctx, x + spacing * 1.5, y, size)
    }

    function drawMap(ctx: CanvasRenderingContext2D) {
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
          const tile = map[row][col]
          const x = col * tileSize
          const y = row * tileSize

          if (tile === 1) {
            ctx.fillStyle = '#333333'
            ctx.fillRect(x, y, tileSize, tileSize)
          } else if (tile === 2) {
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 8, 0, 2 * Math.PI)
            ctx.fill()
          } else if (tile === 3) {
            ctx.fillStyle = '#E0E0E0'
            ctx.beginPath()
            ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 4, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
      }
    }

    function update() {
      if (pacmanRef.current) {
        pacmanRef.current.update(map, tileSize)
      }
      ghosts.forEach(ghost => ghost.update(map, tileSize))
      checkCollisions()
      updatePowerPellet()
      checkLevelClear()
    }

    function draw(ctx: CanvasRenderingContext2D) {
      if (!canvasRef.current) return
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      drawBackgroundShapes(ctx)
      drawMap(ctx)
      if (pacmanRef.current) {
        pacmanRef.current.draw(ctx, tileSize)
      }
      ghosts.forEach(ghost => ghost.draw(ctx, tileSize))
    }

    function gameLoop() {
      update()
      if (ctx) {
        draw(ctx)
      }
      gameLoopId.current = requestAnimationFrame(gameLoop)
    }

    function checkCollisions() {
      if (!pacmanRef.current) return
      const pacmanGrid = pacmanRef.current.getGridPos(tileSize)

      if (map[pacmanGrid.row] && map[pacmanGrid.row][pacmanGrid.col] === 2) {
        map[pacmanGrid.row][pacmanGrid.col] = 0
        setScore(prev => prev + 10)
        pelletCount--
      }

      if (map[pacmanGrid.row] && map[pacmanGrid.row][pacmanGrid.col] === 3) {
        map[pacmanGrid.row][pacmanGrid.col] = 0
        setScore(prev => prev + 50)
        pelletCount--
        activatePowerPellet()
      }

      ghosts.forEach(ghost => {
        if (!pacmanRef.current) return
        const dx = pacmanRef.current.x - ghost.x
        const dy = pacmanRef.current.y - ghost.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < tileSize / 1.5) {
          if (ghost.isFrightened && !ghost.isEaten) {
            ghost.isEaten = true
            setScore(prev => prev + 200)
          } else if (!ghost.isFrightened && !ghost.isEaten) {
            handleCapture()
          }
        }
      })
    }

    function activatePowerPellet() {
      powerPelletActive = true
      powerPelletTimer = 300 // 5 seconds at 60fps
      ghosts.forEach(ghost => {
        if (!ghost.isEaten) {
          ghost.isFrightened = true
        }
      })
    }

    function updatePowerPellet() {
      if (powerPelletActive) {
        powerPelletTimer--
        if (powerPelletTimer <= 0) {
          powerPelletActive = false
          ghosts.forEach(ghost => (ghost.isFrightened = false))
        }
      }
    }

    function handleCapture() {
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current)
      setTimeout(() => {
        resetPositions()
        gameLoop()
      }, 500)
    }

    function resetPositions() {
      if (pacmanRef.current) {
        pacmanRef.current.x = 9.5 * tileSize
        pacmanRef.current.y = 17.5 * tileSize
        pacmanRef.current.direction = 2
        pacmanRef.current.nextDirection = 2
      }

      ghosts.forEach(g => {
        g.x = g.spawnPoint.x
        g.y = g.spawnPoint.y
        g.isEaten = false
        g.isFrightened = false
      })
    }

    function checkLevelClear() {
      if (pelletCount <= 0) {
        resetLevel()
      }
    }

    function resetLevel() {
      map = JSON.parse(JSON.stringify(MAP))
      pelletCount = 0
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
          if (map[row][col] === 2 || map[row][col] === 3) {
            pelletCount++
          }
        }
      }
      resetPositions()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) {
        setGameStarted(true)
      }
      if (!pacmanRef.current) return
      switch (e.key) {
        case 'ArrowRight':
        case 'd':
          pacmanRef.current.nextDirection = 0
          break
        case 'ArrowDown':
        case 's':
          pacmanRef.current.nextDirection = 1
          break
        case 'ArrowLeft':
        case 'a':
          pacmanRef.current.nextDirection = 2
          break
        case 'ArrowUp':
        case 'w':
          pacmanRef.current.nextDirection = 3
          break
      }
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    gameLoop()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', resizeCanvas)
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current)
    }
  }, [tileSize])

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center font-sans">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-black"
        />
      </div>
    </div>
  )
}
