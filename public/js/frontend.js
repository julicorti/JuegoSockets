const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const socket = io()
const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1
canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio
c.scale(devicePixelRatio, devicePixelRatio)

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]

    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: backEndProjectile.color || '#FFFFFF', // Asigna un color por defecto si no hay
        velocity: backEndProjectile.velocity
      })
    } else {
      frontEndProjectiles[id].x = backEndProjectile.x // Actualiza la posición
      frontEndProjectiles[id].y = backEndProjectile.y
    }
  }

  // Elimina proyectiles que ya no están
  for (const frontEndProjectileId in frontEndProjectiles) {
    if (!backEndProjectiles[frontEndProjectileId]) {
      delete frontEndProjectiles[frontEndProjectileId]
    }
  }
})

// Manejo del clic en el canvas para disparar proyectiles
canvas.addEventListener('click', (event) => {
  const player = frontEndPlayers[socket.id]
  if (!player) {
    console.warn(`Player with id ${socket.id} is not defined.`)
    return // Salir si el jugador no está definido
  }

  let shootMode = 'burst'

  const { top, left } = canvas.getBoundingClientRect()
  const playerPosition = { x: player.x, y: player.y }

  const angle = Math.atan2(
    event.clientY - top - playerPosition.y,
    event.clientX - left - playerPosition.x
  )

  // switch (shootMode) {
  //   case "burst":
  //     console.log("Hola soy gay")
  //     for (let i = 0; i < 4; i++){
  //        setTimeout(()=>{
  //          socket.emit('shoot', {
  //            x: playerPosition.x,
  //            y: playerPosition.y,
  //            angle,
  //          });
  //       }, i*15)

  //     }

  //     break;

  //   default:

  //   socket.emit('shoot', {
  //     x: playerPosition.x,
  //      y: playerPosition.y,
  //        angle,
  //        color: player.color
  //     });
  //     break;
  // }
})

let obstaculos = []

const updateObstaculos = () => {
  for (const o of obstaculos) {
    // Si el obstáculo está dañado, dibuja un efecto
    // if (o.damaged) {
    //   c.fillStyle = "red"; // Color de efecto de daño
    //   c.globalAlpha = 0.5; // Transparencia del efecto
    //   c.fillRect(o.x, o.y, o.width, o.length);
    //   c.globalAlpha = 1; // Restaurar la opacidad después del efecto

    //   // Restaura el estado del daño después de un tiempo
    //   setTimeout(() => {
    //     o.damaged = false;
    //   }, 300); // El efecto durará 300ms
    // }

    // Dibujar el obstáculo normalmente

    switch (o.lives) {
      case 2:
        c.fillStyle = 'orange'
        break
      case 1:
        c.fillStyle = 'red'
        break
      default:
        c.fillStyle = 'white'
        break
    }
    c.fillRect(o.x, o.y, o.width, o.length)

    // Dibujar las vidas encima del obstáculo
    c.fillStyle = 'red'
    c.font = '12px Arial'
    c.fillText(`Lives: ${o.lives}`, o.x + 5, o.y - 10)
  }
}

const checkProjectileCollisions = () => {
  for (const id in frontEndProjectiles) {
    const projectile = frontEndProjectiles[id]

    for (const o of obstaculos) {
      if (
        projectile.x > o.x &&
        projectile.x < o.x + o.width &&
        projectile.y > o.y &&
        projectile.y < o.y + o.length
      ) {
        // La bala impactó el obstáculo
        o.damaged = true // Marca el obstáculo como dañado

        // Decrementar vidas del obstáculo
        o.lives -= 1

        if (o.lives <= 0) {
          // Si las vidas del obstáculo llegan a 0, puedes eliminarlo o hacer algo más
          obstaculos = obstaculos.filter((obst) => obst !== o)
        }

        // Elimina el proyectil después de la colisión
        delete frontEndProjectiles[id]
      }
    }
  }
}

// Llamar a esta función en tu ciclo de animación
function animate() {
  animationId = requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  // Actualiza obstáculos
  updateObstaculos()

  // Verificar colisiones de proyectiles
  checkProjectileCollisions()

  // Dibuja jugadores y proyectiles
  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]
    if (frontEndPlayer.target) {
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
    }
    frontEndPlayer.draw()
  }

  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]
    c.fillStyle = frontEndProjectile.color
    frontEndProjectile.draw()
  }
}
socket.on('updateObstaculos', (data) => {
  data = JSON.parse(data)
  obstaculos = data
})

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
        username: backEndPlayer.username,
        lives: backEndPlayer.lives // Asegúrate de que las vidas también se asignen
      })
      document.querySelector(
        '#playerLabels'
      ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username}: ${backEndPlayer.score}</div>`
    } else {
      const playerLabel = document.querySelector(`div[data-id="${id}"]`)
      playerLabel.innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`
      playerLabel.setAttribute('data-score', backEndPlayer.score)

      // Ordenar los divs de jugadores
      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))
        return scoreB - scoreA
      })

      // Eliminar elementos antiguos
      childDivs.forEach((div) => {
        parentDiv.removeChild(div)
      })

      // Agregar elementos ordenados
      childDivs.forEach((div) => {
        parentDiv.appendChild(div)
      })

      frontEndPlayers[id].target = {
        x: backEndPlayer.x,
        y: backEndPlayer.y
      }

      if (id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber
        })

        if (lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach((input) => {
          frontEndPlayers[id].target.x += input.dx
          frontEndPlayers[id].target.y += input.dy
        })
      }
    }
  }

  // Eliminar jugadores que ya no están
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)

      if (id === socket.id) {
        document.querySelector('#usernameForm').style.display = 'block'
      }

      delete frontEndPlayers[id]
    }
  }
})

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  updateObstaculos()

  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]

    // Interpolación lineal
    if (frontEndPlayer.target) {
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
    }

    frontEndPlayer.draw()
  }

  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]
    c.fillStyle = frontEndProjectile.color
    frontEndProjectile.draw()
  }
}

animate()

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false }
}

const SPEED = 5
const playerInputs = []
let sequenceNumber = 0

setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber })
  }

  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber })
  }

  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber })
  }

  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 })
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber })
  }
}, 15)

window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
  }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()

  const username = document.querySelector('#usernameInput').value
  const color = document.querySelector('#colorInput').value
  if (!username || !color) {
    alert('Por favor, introduce tu nombre y selecciona un color.')
    return
  }

  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    width: canvas.width,
    height: canvas.height,
    username,
    color // Envía el color seleccionado
  })
})
