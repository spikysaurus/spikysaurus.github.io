
// --- Load Three.js dynamically ---
const threeScript = document.createElement("script");
threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
threeScript.onload = initStarfield; // run after Three.js is loaded
document.head.appendChild(threeScript);

function initStarfield() {
// --- Inject CSS ---
const style = document.createElement("style");
style.textContent = `
  body {
    margin: 0;
  }
  #overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: -1;
  }
`;
document.head.appendChild(style);

// --- Inject HTML ---
const svgContainer = document.createElement("div");
svgContainer.style.position = "fixed";
svgContainer.style.top = "50%";
svgContainer.style.left = "50%";
svgContainer.style.transform = "translate(-50%, -50%)";
svgContainer.style.width = "100%";
svgContainer.style.textAlign = "center";
svgContainer.style.zIndex = "-1";

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("id", "cubeCanvas");
svg.setAttribute("viewBox", "0 0 800 600");
svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
svg.style.width = "100%";
svg.style.height = "auto";
svgContainer.appendChild(svg);

document.body.appendChild(svgContainer);

const overlay = document.createElement("div");
overlay.id = "overlay";
document.body.appendChild(overlay);

// --- THREE.js Starfield ---
const scene = new THREE.Scene();
scene.background = null; // transparent background

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// --- STYLING ---
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "-2";
renderer.domElement.style.outline = "none";

document.body.appendChild(renderer.domElement);

// Create star geometry
const starCount = 3000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
const starColors = [];

const colorOptions = [
  new THREE.Color(0xffffff), // white
  new THREE.Color(0x87cefa), // light blue
  new THREE.Color(0x9370db), // purple
  new THREE.Color(0xffd700)  // yellow/gold
];

for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = Math.random() * -2000; // stars start behind camera
  starPositions.push(x, y, z);

  // Assign random color from palette
  const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
  starColors.push(color.r, color.g, color.b);
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);
starGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(starColors, 3)
);

const starMaterial = new THREE.PointsMaterial({
  size: 1.2,
  vertexColors: true, // use per-star colors
  transparent: true
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);

  const positions = starGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] += 4; // move stars toward camera
    if (positions[i + 2] > 10) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = -2000; // reset far back
    }
  }
  starGeometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
}
