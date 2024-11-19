const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')

const server = http.createServer(app)
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })
const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

let obstaculos = []

const preset = (number) => {
  if (number == 0) {
    obstaculos.push({
      x: 1024 * 0.22,  // Primera posición
      y: 200,
      width: 10,
      length: 200,
      lives: 3
  });
  obstaculos.push({
      x: 1024 * 0.40,  // Segunda posición (espacio añadido)
      y: 200,
      width: 10,
      length: 200,
      lives: 3
  });
  obstaculos.push({
      x: 1024 * 0.58,  // Tercera posición (más espacio)
      y: 200,
      width: 10,
      length: 200,
      lives: 3
  });
  obstaculos.push({
      x: 1024 * 0.76,  // Cuarta posición (más espacio)
      y: 200,
      width: 10,
      length: 200,
      lives: 3
  });

  } else if (number == 1) {
    obstaculos.push({
      x: 1024 * 0.33,
      y: 576 * 0.2,
      width: 1024 * 0.33,
      length: 10,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.33,
      y: 576 * 0.8,
      width: 1024 * 0.33,
      length: 10,
      lives: 3
    })
  } else if (number == 2) {
    obstaculos.push({
      x: 1024 * 0.33,
      y: 576 * 0.2,
      width: 1024 * 0.33,
      length: 10,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.33,
      y: 576 * 0.8,
      width: 1024 * 0.33,
      length: 10,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.5,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
  } else if (number == 3) {
    obstaculos.push({
      x: 1024 * 0.5,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.7,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.3,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
  } else if (number == 4) {
    obstaculos.push({
      x: 1024 * 0.25,
      y: 576 * 0.8,
      width: 1024 * 0.5,
      length: 10,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.25,
      y: 576 * 0.2,
      width: 1024 * 0.5,
      length: 10,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.5,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.7,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
    obstaculos.push({
      x: 1024 * 0.3,
      y: 576 * 0.33,
      width: 10,
      length: 200,
      lives: 3
    })
  }
}

setInterval(() => {
  obstaculos = []
  preset(Math.floor(Math.random() * 5))
}, 5000)

const backEndPlayers = {}
const backEndProjectiles = {}
const SPEED = 5
const RADIUS = 10
const PROJECTILE_RADIUS = 5
let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user connected')

  // Enviar el estado inicial de los jugadores
  io.emit('updatePlayers', backEndPlayers)

  socket.on('initGame', ({ username, color, width, height }) => {
    backEndPlayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color,
      sequenceNumber: 0,
      score: 0,
      username,
      lives: 3, // Inicializa las vidas
      radius: RADIUS,
      canvas: {
        width,
        height
      }
    }
    console.log('Jugadores después de la inicialización:', backEndPlayers)
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    const playerColor = backEndPlayers[socket.id]?.color || '#FFFFFF' // Usa blanco si el color no se encuentra

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id,
      color: playerColor // Asigna el color directamente
    }

    // Emitir los proyectiles actualizados a todos los jugadores
    io.emit('updateProjectiles', backEndProjectiles)
  })

  // Detectar impacto de bala en los obstáculos y emitir la grieta
  /*   setInterval(() => {
    for (const id in backEndProjectiles) {
      backEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
      backEndProjectiles[id].y += backEndProjectiles[id].velocity.y;
  
      for (let o of obstaculos) {
        if (backEndProjectiles[id].x > o.x && backEndProjectiles[id].x < o.x + o.width &&
          backEndProjectiles[id].y > o.y && backEndProjectiles[id].y < o.y + o.length) {
          
          // Si el proyectil impacta el obstáculo
          o.lives--;
          io.emit('obstacleHit', { id: o.id, x: backEndProjectiles[id].x, y: backEndProjectiles[id].y });
  
          if (o.lives <= 0) {
            obstaculos = obstaculos.filter((a) => a !== o);
            io.emit('obstacleDestroyed', o);
          }
  
          delete backEndProjectiles[id];
        }
      }
    }
  }, 15); */
  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id]
    if (!backEndPlayer) return

    backEndPlayer.sequenceNumber = sequenceNumber

    // Guarda la posición actual
    const previousPosition = { x: backEndPlayer.x, y: backEndPlayer.y }

    // Calcula el nuevo destino según la tecla presionada
    let newX = backEndPlayer.x
    let newY = backEndPlayer.y

    switch (keycode) {
      case 'KeyW':
        newY -= SPEED
        break
      case 'KeyA':
        newX -= SPEED
        break
      case 'KeyS':
        newY += SPEED
        break
      case 'KeyD':
        newX += SPEED
        break
    }

    let collisionDetected = false

    // Ajusta la posición para mantener al jugador dentro de los límites
    if (newX - backEndPlayer.radius < 0) {
      backEndPlayer.x = backEndPlayer.radius // Asegura que no salga del borde izquierdo
      collisionDetected = true
    } else if (newX + backEndPlayer.radius > 1024) {
      backEndPlayer.x = 1024 - backEndPlayer.radius // Asegura que no salga del borde derecho
      collisionDetected = true
    }
    if (newY - backEndPlayer.radius < 0) {
      backEndPlayer.y = backEndPlayer.radius // Asegura que no salga del borde superior
      collisionDetected = true
    } else if (newY + backEndPlayer.radius > 576) {
      backEndPlayer.y = 576 - backEndPlayer.radius // Asegura que no salga del borde inferior
      collisionDetected = true
    }

    for (const obstacle of obstaculos) {
      const playerLeft = newX - backEndPlayer.radius
      const playerRight = newX + backEndPlayer.radius
      const playerTop = newY - backEndPlayer.radius
      const playerBottom = newY + backEndPlayer.radius

      const obstacleLeft = obstacle.x
      const obstacleRight = obstacle.x + obstacle.width
      const obstacleTop = obstacle.y
      const obstacleBottom = obstacle.y + obstacle.length

      // Detecta si hay superposición (colisión)
      if (
        playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom
      ) {
        collisionDetected = true
        break
      }
    }

    // Si hay colisión, no actualiza la posición
    if (!collisionDetected) {
      backEndPlayer.x = newX
      backEndPlayer.y = newY
    }

    // Emite las actualizaciones de los jugadores
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('disconnect', () => {
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })
})

// Backend ticker para actualizar las posiciones de los proyectiles
setInterval(() => {
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    if (
      backEndProjectiles[id].x < 0 ||
      backEndProjectiles[id].x > 1024 ||
      backEndProjectiles[id].y < 0 ||
      backEndProjectiles[id].y > 576
    ) {
      delete backEndProjectiles[id]
      continue
    }
    continuar = true
    for (o of obstaculos) {
      if (!backEndProjectiles[id]) continue
      if (
        backEndProjectiles[id].x > o.x &&
        backEndProjectiles[id].x < o.x + o.width &&
        backEndProjectiles[id].y > o.y &&
        backEndProjectiles[id].y < o.y + o.length
      ) {
        delete backEndProjectiles[id]
        o.lives--

        if (o.lives <= 0) {
          // Eliminar el obstáculo de la lista
          obstaculos = obstaculos.filter((a) => a !== o)
          io.emit('obstacleDestroyed', o) // Emite el evento de destrucción del obstáculo
        }

        continuar = false
        continue
      }
    }
    if (!continuar) continue

    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]
      if (!backEndPlayer) {
        console.warn(`Jugador ${playerId} no encontrado en backEndPlayers`)
        continue // Salta este jugador si no existe
      }

      const distance = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y
      )

      if (
        distance < PROJECTILE_RADIUS + backEndPlayer.radius &&
        backEndProjectiles[id].playerId !== playerId
      ) {
        console.log(`Impacto: ${playerId} ha sido golpeado por un proyectil`)
        backEndPlayers[playerId].lives -= 1
        io.to(playerId).emit('updateLives', backEndPlayers[playerId].lives)

        if (backEndPlayers[playerId].lives <= 0) {
          console.log(`Jugador ${playerId} se ha quedado sin vidas`)
          delete backEndPlayers[playerId]
          io.emit('playerDisconnected', playerId)
        }

        delete backEndProjectiles[id]
        break
      }
    }
  }

  io.emit('updateObstaculos', JSON.stringify(obstaculos))
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
