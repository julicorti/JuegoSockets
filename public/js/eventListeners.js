
let shootMode = "single"

addEventListener("keydown", (e)=>{
  if (e.key == "1"){
    shootMode = "single"
  } 
  else if (e.key == "2"){
    shootMode = "burst"
  } 
  else if (e.key == "3"){
    shootMode = "shotgun"
  } 
})

let canShoot = true;
addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas')
  const { top, left } = canvas.getBoundingClientRect()
  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  }

  const angle = Math.atan2(
    event.clientY - top - playerPosition.y,
    event.clientX - left - playerPosition.x
  )

  // const velocity = {
  //   x: Math.cos(angle) * 5,
  //   y: Math.sin(angle) * 5
  // }
  switch (shootMode) {
    case "burst":
      if (canShoot){
        canShoot = false;
        setTimeout(() => {
          canShoot = true;
        }, 750);
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            socket.emit('shoot', {
              x: playerPosition.x,
              y: playerPosition.y,
              angle
            })
          }, i * 100)
        }
        
      }
      
      break;
    case "shotgun":
      if (canShoot){
        canShoot = false;
        setTimeout(() => {
          canShoot = true;
        }, 500);
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            socket.emit('shoot', {
              x: playerPosition.x,
              y: playerPosition.y,
              angle : angle - .5 + i*.5
            })
          }, i)
        }
        
      }
      
      break;
  
    default:
      if(canShoot){
        canShoot = false;
        setTimeout(()=>{
          canShoot= true;
        }, 400)
        socket.emit('shoot', {
          x: playerPosition.x,
          y: playerPosition.y,
          angle
        })
      }
      break;
  }

  // socket.emit('shoot', {
  //   x: playerPosition.x,
  //   y: playerPosition.y,
  //   angle
  // })
  // frontEndProjectiles.push(
  //   new Projectile({
  //     x: playerPosition.x,
  //     y: playerPosition.y,
  //     radius: 5,
  //     color: 'white',
  //     velocity
  //   })
  // )

  console.log(frontEndProjectiles)
})
