const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});



let obstaculos = []

obstaculos.push({x:1024*.22, y:200, width:10, length:200, lives:3})
obstaculos.push({x:1024*.77, y:200, width:10, length:200, lives:3})

console.log(obstaculos)

const backEndPlayers = {};
const backEndProjectiles = {};
const SPEED = 5;
const RADIUS = 10;
const PROJECTILE_RADIUS = 5;
let projectileId = 0;

io.on('connection', (socket) => {
  console.log('a user connected');

  // Enviar el estado inicial de los jugadores
  io.emit('updatePlayers', backEndPlayers);

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
        height,
      },
    };
    console.log('Jugadores después de la inicialización:', backEndPlayers);
    io.emit('updatePlayers', backEndPlayers);
  });

  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++;
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5,
    };
    const playerColor = backEndPlayers[socket.id]?.color || '#FFFFFF'; // Usa blanco si el color no se encuentra

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id,
      color: playerColor, // Asigna el color directamente
    };

    // Emitir los proyectiles actualizados a todos los jugadores
    io.emit('updateProjectiles', backEndProjectiles);
  });

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id];
    if (!backEndPlayer) return;

    backEndPlayer.sequenceNumber = sequenceNumber;

    switch (keycode) {
      case 'KeyW':
        backEndPlayer.y = Math.max(backEndPlayer.y - SPEED, backEndPlayer.radius);
        break;
      case 'KeyA':
        backEndPlayer.x = Math.max(backEndPlayer.x - SPEED, backEndPlayer.radius);
        break;
      case 'KeyS':
        backEndPlayer.y = Math.min(backEndPlayer.y + SPEED, backEndPlayer.canvas.height - backEndPlayer.radius);
        break;
      case 'KeyD':
        backEndPlayer.x = Math.min(backEndPlayer.x + SPEED, backEndPlayer.canvas.width - backEndPlayer.radius);
        break;
    }
  });

  socket.on('disconnect', () => {
    delete backEndPlayers[socket.id];
    io.emit('updatePlayers', backEndPlayers);
  });
});

// Backend ticker para actualizar las posiciones de los proyectiles
setInterval(() => {
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y;

    if (
      backEndProjectiles[id].x < 0 || backEndProjectiles[id].x > 1024 ||
      backEndProjectiles[id].y < 0 || backEndProjectiles[id].y > 576
    ) {
      delete backEndProjectiles[id];
      continue;
    }
    continuar = true
    for (o of obstaculos){
      if (!backEndProjectiles[id]) continue
      if(
        (backEndProjectiles[id].x > o.x && backEndProjectiles[id].x < o.x + o.width) &&
        (backEndProjectiles[id].y > o.y && backEndProjectiles[id].y < o.y + o.length)
      ){
        delete backEndProjectiles[id]
        o.lives --;

        if(o.lives <=0){
          // lo elimina de la lista
          obstaculos = obstaculos.filter((a)=>{
            return a != o
          })
        }
        continuar = false
        continue
      }
    }
    if (!continuar) continue
    
    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId];
      if (!backEndPlayer) {
        console.warn(`Jugador ${playerId} no encontrado en backEndPlayers`);
        continue; // Salta este jugador si no existe
      }
      
      const distance = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y
      );
    
      if (
        distance < PROJECTILE_RADIUS + backEndPlayer.radius &&
        backEndProjectiles[id].playerId !== playerId
      ) {
        console.log(`Impacto: ${playerId} ha sido golpeado por un proyectil`);
        backEndPlayers[playerId].lives -= 1 ;
        io.to(playerId).emit('updateLives', backEndPlayers[playerId].lives);
    
        if (backEndPlayers[playerId].lives <= 0) {
          console.log(`Jugador ${playerId} se ha quedado sin vidas`);
          delete backEndPlayers[playerId];
          io.emit('playerDisconnected', playerId);
        }
    
        delete backEndProjectiles[id];
        break;
      }
    }
  }

  io.emit('updateObstaculos', JSON.stringify(obstaculos));
  io.emit('updateProjectiles', backEndProjectiles);
  io.emit('updatePlayers', backEndPlayers);
}, 15);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
