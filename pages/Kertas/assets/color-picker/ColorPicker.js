

(function () {
  const el = {
    svWrap: document.getElementById('svWrap'),
    sv: document.getElementById('sv'),
    svThumb: document.getElementById('svThumb'),
    hueWrap: document.getElementById('hueWrap'),
    hue: document.getElementById('hue'),
    hueThumb: document.getElementById('hueThumb'),
    hex: document.getElementById('hex'),
    rgb: document.getElementById('rgb'),
    chips: document.getElementById('chips'),
//    prevSwatch: document.getElementById('prevSwatch'),
    curSwatch: document.getElementById('curSwatch'),
    readout: document.getElementById('readout'),
    setPrev: document.getElementById('setPrev')
  };

  // Color state in HSV
  const state = {
    h: 0,   // 0..360
    s: 1,   // 0..1
    v: 1,   // 0..1
    prevHex: '#ffffff'
  };

  // Utilities
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function hsvToRgb(h, s, v) {
    const c = v * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (0 <= hp && hp < 1) { r = c; g = x; b = 0; }
    else if (1 <= hp && hp < 2) { r = x; g = c; b = 0; }
    else if (2 <= hp && hp < 3) { r = 0; g = c; b = x; }
    else if (3 <= hp && hp < 4) { r = 0; g = x; b = c; }
    else if (4 <= hp && hp < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const m = v - c;
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r: h = 60 * (((g - b) / d) % 6); break;
        case g: h = 60 * (((b - r) / d) + 2); break;
        case b: h = 60 * (((r - g) / d) + 4); break;
      }
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  }
  function rgbToHex(r,g,b) {
    const toHex = x => x.toString(16).padStart(2,'0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  function hexToRgb(hex) {
    const m = String(hex).trim().replace(/^#/,'');
    if (m.length === 3) {
      const r = parseInt(m[0]+m[0],16),
            g = parseInt(m[1]+m[1],16),
            b = parseInt(m[2]+m[2],16);
      return {r,g,b};
    }
    if (m.length === 6) {
      const r = parseInt(m.slice(0,2),16),
            g = parseInt(m.slice(2,4),16),
            b = parseInt(m.slice(4,6),16);
      return {r,g,b};
    }
    return null;
  }

  // Render hue gradient
  function renderHue() {
    const ctx = el.hue.getContext('2d');
    const w = el.hue.width, h = el.hue.height;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 360; i += 10) {
      grad.addColorStop(i / 360, `hsl(${i} 100% 50%)`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Render SV square for current hue
  function renderSV() {
    const ctx = el.sv.getContext('2d');
    const w = el.sv.width, h = el.sv.height;
    // base: solid hue at full saturation and value
    const rgbHue = hsvToRgb(state.h, 1, 1);
    ctx.fillStyle = `rgb(${rgbHue.r},${rgbHue.g},${rgbHue.b})`;
    ctx.fillRect(0, 0, w, h);
    // overlay: white gradient (left to right) for saturation
    const gradWhite = ctx.createLinearGradient(0, 0, w, 0);
    gradWhite.addColorStop(0, 'rgba(255,255,255,1)');
    gradWhite.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradWhite;
    ctx.fillRect(0, 0, w, h);
    // overlay: black gradient (top to bottom) for value
    const gradBlack = ctx.createLinearGradient(0, 0, 0, h);
    gradBlack.addColorStop(0, 'rgba(0,0,0,0)');
    gradBlack.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gradBlack;
    ctx.fillRect(0, 0, w, h);
  }

  // Layout canvas for crisp rendering
  function resizeCanvas() {
    // SV canvas
    const rectSV = el.svWrap.getBoundingClientRect();
    el.sv.width = Math.max(1, Math.floor(rectSV.width));
    el.sv.height = el.sv.width; // square
    // Hue canvas
    const rectHue = el.hueWrap.getBoundingClientRect();
    el.hue.width = Math.max(1, Math.floor(rectHue.width));
    el.hue.height = Math.max(1, Math.floor(rectHue.height));
    renderHue();
    renderSV();
    placeThumbs();
    updateUI();
  }

  function placeThumbs() {
    const svRect = el.sv.getBoundingClientRect();
    const x = state.s * svRect.width;
    const y = (1 - state.v) * svRect.height;
    el.svThumb.style.left = `${x}px`;
    el.svThumb.style.top = `${y}px`;

    const hueRect = el.hue.getBoundingClientRect();
    const hx = (state.h / 360) * hueRect.width;
    el.hueThumb.style.left = `${hx}px`;
  }

  function updateUI() {
    const { r, g, b } = hsvToRgb(state.h, state.s, state.v);
    const hex = rgbToHex(r, g, b);
    el.curSwatch.style.background = hex;
//    el.prevSwatch.style.background = state.prevHex;
    el.hex.value = hex;
    el.rgb.value = `${r}, ${g}, ${b}`;
    el.readout.textContent = `HSV: ${Math.round(state.h)}°, ${Math.round(state.s*100)}%, ${Math.round(state.v*100)}%`;
  }

  // Interaction: SV square
  function onSVPointer(e) {
    const rect = el.sv.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    state.s = x;
    state.v = 1 - y;
    renderSV();
    placeThumbs();
    updateUI();
  }
  // Interaction: Hue slider
  function onHuePointer(e) {
    const rect = el.hue.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    state.h = x * 360;
    renderHue();
    renderSV();
    placeThumbs();
    updateUI();
  }

  // Pointer capture helpers
  function drag(elTarget, onMove) {
    function move(ev) { onMove(ev); }
    function up() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  el.svWrap.addEventListener('pointerdown', (e) => {
    onSVPointer(e);
    drag(el.svWrap, onSVPointer);
  });
  el.hueWrap.addEventListener('pointerdown', (e) => {
    onHuePointer(e);
    drag(el.hueWrap, onHuePointer);
  });

  // Inputs: HEX and RGB
  el.hex.addEventListener('change', () => {
    const rgb = hexToRgb(el.hex.value);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
    renderSV(); placeThumbs(); updateUI();
  });
  el.rgb.addEventListener('change', () => {
    const parts = el.rgb.value.split(',').map(s => parseInt(s.trim(), 10));
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return;
    const r = clamp(parts[0], 0, 255), g = clamp(parts[1], 0, 255), b = clamp(parts[2], 0, 255);
    const hsv = rgbToHsv(r, g, b);
    state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
    renderSV(); placeThumbs(); updateUI();
  });

  // Preset chips (classic MS Paint inspired palette)
  const presets = [
    '#000000','#808080','#c0c0c0','#ffffff',
    '#800000','#ff0000','#ffa500','#ffff00',
    '#008000','#00ff00','#00ffff','#008080',
    '#000080','#0000ff','#800080','#ff00ff'
  ];
  function renderChips() {
    el.chips.innerHTML = '';
    presets.forEach(hex => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.background = hex;
      chip.title = hex;
      chip.addEventListener('click', () => {
        const rgb = hexToRgb(hex);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
        renderSV(); placeThumbs(); updateUI();
      });
      el.chips.appendChild(chip);
    });
  }
	
	let col = document.getElementById('col')
  // Previous snapshot
  el.setPrev.addEventListener('click', () => {
    const { r,g,b } = hsvToRgb(state.h, state.s, state.v);
    state.prevHex = rgbToHex(r,g,b);
    col.value = state.prevHex
    updateUI();
  });

  // Init
  window.addEventListener('resize', resizeCanvas, { passive: true });
  renderChips();
  resizeCanvas();
  
  function ensureCanvasSize() {
  const rectSV = el.svWrap.getBoundingClientRect();
  if (rectSV.width > 0) {
    el.sv.width = rectSV.width;
    el.sv.height = rectSV.width;
    renderSV();
  }

  const rectHue = el.hueWrap.getBoundingClientRect();
  if (rectHue.width > 0) {
    el.hue.width = rectHue.width;
    el.hue.height = rectHue.height;
    renderHue();
  }

  placeThumbs();
  updateUI();
}


  const ColorPickerBtn = document.getElementById('ColorPickerBtn');
const picker = document.getElementById('paintPicker');
picker.style.display = 'none';
ColorPickerBtn.onclick = () => {
 if (picker.style.display === 'none') {
   picker.style.display = 'block';
   ensureCanvasSize();

 } else {
   picker.style.display = 'none';
   ensureCanvasSize();

 }
};
})();
