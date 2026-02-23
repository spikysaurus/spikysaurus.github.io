
//window.colorPicker.activeColor); // Returns Hex/RGB of Foreground
//window.colorPicker.activeColorSecondary); // Returns Hex/RGB of Foreground
(function() {
  // 1. Global State Object
  window.colorPicker = {
    activeColor: '#000000',
    activeColorBackground: '#ffffff'
  };

  // 2. Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    .cp-panel {
      position: fixed; bottom: 20px; right: 20px;
      background-color: #303030; padding: 5px;
      border: none; display: flex; flex-direction: row; align-items: center; gap: 6px;
      z-index: 10000; user-select: none; border-radius: 4px;
      width: max-content;
    }
    .cp-handle {
      width: 8px; height: 48px; cursor: move;
      background: #4c4c4c;
      border-radius: 2px; margin-right: 2px;
    }
    .cp-preview-container {
      position: relative; width: 38px; height: 38px;
      background-color: transparent;
    }
    .cp-preview-bg {
      position: absolute; bottom: 2px; right: 2px; width: 22px; height: 22px; 
      background-color: #ffffff; border: 1.5px solid lightgray; z-index: 1;
      transition: background-color 0.1s;
    }
    .cp-preview-fg {
      position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; 
      background-color: #000000; border: 1.5px solid lightgray; z-index: 2;
      transition: background-color 0.1s;
    }
    .cp-grid {
      display: grid; 
      grid-template-columns: repeat(8, 24px); /* 8 columns of 24px */
      gap: 0px;
    }
    .cp-swatch {
      width: 24px; 
      height: 24px; 
      cursor: pointer;
      border: none;
      box-sizing: border-box;
    }
    .cp-swatch:hover {
      outline: 2px solid #fff;
      z-index: 5;
    }
    .cp-swatch:active { transform: scale(0.9); }
  `;
  document.head.appendChild(style);

  // 3. UI Setup
  const panel = document.createElement('div');
  panel.className = 'cp-panel';

  const handle = document.createElement('div');
  handle.className = 'cp-handle';
  panel.appendChild(handle);

  const previewCont = document.createElement('div');
  previewCont.className = 'cp-preview-container';
  const fgBox = document.createElement('div'); fgBox.className = 'cp-preview-fg';
  const bgBox = document.createElement('div'); bgBox.className = 'cp-preview-bg';
  previewCont.appendChild(fgBox); previewCont.appendChild(bgBox);
  panel.appendChild(previewCont);

  const grid = document.createElement('div');
  grid.className = 'cp-grid';

  const colors = [
    '#000000', '#808080', '#c0c0c0', '#ffffff', '#ff0000', '#ffc0cb', '#008000', '#90ee90',
    '#0000ff', '#00ffff', 'orange', 'yellow', '#800080', '#e6e6fa', '#c6aa85','#ffdbac'
  ];

  const updateFG = (hex) => { window.colorPicker.activeColor = hex; fgBox.style.backgroundColor = hex; };
  const updateBG = (hex) => { window.colorPicker.activeColorBackground = hex; bgBox.style.backgroundColor = hex; };

  // --- NEW: Swap Function ---
  const swapColors = () => {
    const temp = window.colorPicker.activeColor;
    updateFG(window.colorPicker.activeColorBackground);
    updateBG(temp);
  };

  // --- NEW: Key Listener ---
  window.addEventListener('keydown', (e) => {
    // Only swap if not typing in an input/textarea
    if (e.key.toLowerCase() === 'v' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      swapColors();
    }
  });

  colors.forEach(hex => {
    const swatch = document.createElement('div');
    swatch.className = 'cp-swatch';
    swatch.style.backgroundColor = hex;

    swatch.addEventListener('mousedown', (e) => {
      const color = swatch.style.backgroundColor;
      if (e.button === 0) updateFG(color);
      if (e.button === 2) updateBG(color);
    });

    swatch.addEventListener('dblclick', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.oninput = () => {
        swatch.style.backgroundColor = picker.value;
        updateFG(picker.value);
      };
      picker.click();
    });

    swatch.addEventListener('contextmenu', e => e.preventDefault());
    grid.appendChild(swatch);
  });

  panel.appendChild(grid);
  document.body.appendChild(panel);

  // 4. Drag Logic
  let isDragging = false, offX, offY;
  handle.onmousedown = (e) => {
    isDragging = true;
    const r = panel.getBoundingClientRect();
    offX = e.clientX - r.left; offY = e.clientY - r.top;
    handle.style.cursor = 'grabbing';
  };
  document.onmousemove = (e) => {
    if (!isDragging) return;
    panel.style.bottom = 'auto';
    panel.style.left = (e.clientX - offX) + 'px';
    panel.style.top = (e.clientY - offY) + 'px';
  };
  document.onmouseup = () => { isDragging = false; handle.style.cursor = 'move'; };
})();
