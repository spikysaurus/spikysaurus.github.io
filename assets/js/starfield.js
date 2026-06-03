// Canvas setup
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.zIndex = "-1"; // behind HTML

// Load flare image
const flareImg = new Image();
flareImg.src = "https://opengameart.org/sites/default/files/styles/medium/public/flare_0_0.png";

// Particle class
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.size = Math.random() * 24 + 8;

    // Twinkle animation properties
    this.opacity = Math.random(); // start at random brightness
    this.fadeSpeed = 0.01 + Math.random() * 0.02; // random fade speed
    this.fadeDirection = Math.random() < 0.5 ? -1 : 1; // fade in or out first
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    // Update opacity for twinkle
    this.opacity += this.fadeSpeed * this.fadeDirection;
    if (this.opacity <= 0) {
      this.opacity = 0;
      this.fadeDirection = 1; // switch to fade in
    } else if (this.opacity >= 1) {
      this.opacity = 1;
      this.fadeDirection = -1; // switch to fade out
    }
  }
  draw() {
    if (flareImg.complete) {
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(flareImg, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
      ctx.globalAlpha = 1.0; // reset alpha
    }
  }
}

// Particle system
const particles = [];
for (let i = 0; i < 100; i++) {
  particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
}

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animate);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
