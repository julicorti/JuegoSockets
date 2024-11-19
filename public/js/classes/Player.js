class Player {
  constructor({ x, y, radius, color, username }) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.username = username
  }

  draw() {
    c.font = '12px sans-serif';
    c.fillStyle = 'white';
    c.fillText(this.username, this.x - 10, this.y + 20);
    c.save();
    c.shadowColor = this.color;
    c.shadowBlur = 20;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update(obstacles) {
    this.draw();
    // Chequear colisiones con cada obstáculo
    for (const obstacle of obstacles) {
      if (
        this.x + this.radius > obstacle.x &&
        this.x - this.radius < obstacle.x + obstacle.width &&
        this.y + this.radius > obstacle.y &&
        this.y - this.radius < obstacle.y + obstacle.height
      ) {
        // Detener movimiento (puedes personalizarlo)
        console.log("Colisión detectada");
        return;
      }
    }
  }
}
