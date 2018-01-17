const canvas = document.querySelector('.canvas');
const context = canvas.getContext("2d");

let width;
let height;

let waypoints;
let velocities;
let particles;
let mouse = [0, 0];

let voronoi;
let gradient;

function createParticles(count) {
  waypoints = [];
  velocities = [];
  particles = [];
  for (let i = 0; i < count; i++) {
    // Each particle follows a waypoint which moves around using velocities
    const wx = Math.random() * width;
    const wy = Math.random() * height;
    waypoints.push([wx, wy]);
    particles.push([wx, wy]);
    velocities.push([Math.random() - 0.5, Math.random() - 0.5]);
  }

  particles.push(mouse);
}

function updateParticles() {
  for (let i = 0; i < particles.length - 1; i++) {
    const waypoint = waypoints[i];
    const velocity = velocities[i];
    const particle = particles[i];

    // Update particle's waypoint
    waypoint[0] += velocity[0];
    waypoint[1] += velocity[1];

    // Bounce waypoint within bounds
    if (waypoint[0] < 0) {
      waypoint[0] = 0;
      velocity[0] *= -1;
    } else if (waypoint[0] > width) {
      waypoint[0] = width;
      velocity[0] *= -1;
    }
    if (waypoint[1] < 0) {
      waypoint[1] = 0;
      velocity[1] *= -1;
    } else if (waypoint[1] > height) {
      waypoint[1] = height;
      velocity[1] *= -1;
    }

    // Find the distance from the particle to the mouse
    let mdx = particle[0] - mouse[0];
    let mdy = particle[1] - mouse[1];
    let dist = Math.sqrt((mdx * mdx) + (mdy * mdy));
    dist = Math.max(150 - dist, 0);

    // Repel the particle if it's too close to the mouse
    let rot = Math.atan2(mdy, mdx);
    let repelx = Math.cos(rot) * dist / 5;
    let repely = Math.sin(rot) * dist / 5;
    particle[0] += repelx;
    particle[1] += repely;

    // Move particle towards it's waypoint
    particle[0] += (waypoint[0] - particle[0]) * 0.01;
    particle[1] += (waypoint[1] - particle[1]) * 0.01;
  }

  particles[particles.length - 1][0] = mouse[0];
  particles[particles.length - 1][1] = mouse[1];
}

// Useful for seeing how the underlying particles move
function renderParticles() {
  context.clearRect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    const waypoint = waypoints[i];
    const particle = particles[i];
    context.fillStyle = 'red';
    context.fillRect(waypoint[0], waypoint[1], 2, 2);
    context.fillStyle = 'white';
    context.fillRect(particle[0], particle[1], 2, 2);
  }
}

function renderVoronoi() {
  // D3 calculates the voronoi map and gives us an array of points we can then draw
  const polygons = voronoi.polygons(particles);

  context.clearRect(0, 0, width, height);
  context.beginPath();

  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    if (polygon) {
      context.moveTo(polygon[0][0], polygon[0][1])
      for (let i = 1; i < polygon.length; i++) {
        context.lineTo(polygon[i][0], polygon[i][1]);
      }
      context.closePath();
    }
  }

  context.strokeStyle = gradient;
  context.lineWidth = 2;
  context.stroke();
}

function update() {
  updateParticles();
  // renderParticles();
  renderVoronoi();
  requestAnimationFrame(update);
}

function onWindowResize() {
  // When the window is resized we recalculate the size of everything
  // The rendering routine will immediately pick up the new values
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  voronoi = d3.voronoi().extent([[-1, -1], [width + 1, height + 1]]);

  gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop('0', '#ee22aa');
  gradient.addColorStop('1', '#3388dd');

  const particleCount = width * height / 5500;
  createParticles(particleCount);
}

function onMouseMove(event) {
  mouse = [event.clientX, event.clientY];
}

document.addEventListener('mousemove', event => onMouseMove(event));
window.addEventListener('resize', () => onWindowResize())

onWindowResize();
update();
