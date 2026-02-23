document.getElementById('saveAssetsBtn').onclick = () => {
  const zip = new JSZip(),
    folder = zip.folder("drawings"),
    dataFolder = zip.folder("data"); // Create the data folder

  // Save Canvas Properties
  const canvasProps = {
    width: parseInt(document.getElementById('canvasWidthInput').value),
    height: parseInt(document.getElementById('canvasHeightInput').value)
  };
  dataFolder.file("canvasProperties.json", JSON.stringify(canvasProps));

  for (const label in levels) {
    const f = folder.folder(label);
    levels[label].forEach(c => f.file(c.name, c.data.split(',')[1], {
      base64: true
    }));
  }
  
  if (backdropData) zip.folder("backdrop").file("backdrop.png", backdropData.split(',')[1], {
    base64: true
  });

  zip.generateAsync({ type: "blob" }).then(c => saveAs(c, "Kertas_assets.zip"));
};


function fileLoadAssets(file) {
  JSZip.loadAsync(file).then(zip => {
    levels = {};
    levelCount = 0;
    levelsTree.innerHTML = "";
    activeLevel = null;
    activeDrawing = null;
    activeLevelLabel.textContent = "No active level";
    activeDrawingLabel.textContent = "No active drawing";
    canvas.style.cursor = "not-allowed";
	
	// 1. Load Canvas Properties first
    const propFile = zip.file("data/canvasProperties.json");
    if (propFile) {
      propFile.async("string").then(content => {
        const props = JSON.parse(content);
        const w = props.width || 800;
        const h = props.height || 600;
        
        // Update inputs
        document.getElementById('canvasWidthInput').value = w;
        document.getElementById('canvasHeightInput').value = h;
        
        // Resize canvas if needed
        resizeCanvases(w, h);
      });
    }
    
    const backdropFile = zip.file("backdrop/backdrop.png");
    if (backdropFile) backdropFile.async("base64").then(data => {
      backdropData = `data:image/png;base64,${data}`;
      const img = new Image();
      img.onload = () => {
        resizeCanvases(img.width, img.height);
        canvasRefreshInputValues(); 
        backdropCanvasCtx.clearRect(0, 0, img.width, img.height);
        backdropCanvasCtx.drawImage(img, 0, 0);
      };
      img.src = backdropData;
    });

    const drawingPromises = [];
    zip.folder("drawings").forEach((rel, entry) => {
      if (entry.dir) {
        const label = rel.replace(/\/$/, "");
        levels[label] = [];

        const div = document.createElement('div');
        div.className = 'level';
        div.dataset.label = label;

        const toggle = document.createElement('span');
        toggle.className = 'toggle-icon';
        toggle.innerHTML = '<span class="bl-icons-outliner"></span>';

        const lblInput = document.createElement('input');
        lblInput.type = 'text';
        lblInput.value = label;
        lblInput.className = 'level-label';

        lblInput.onblur = () => {
          const newLabel = lblInput.value.trim();
          if (newLabel && newLabel !== label) {
            levels[newLabel] = levels[label];
            delete levels[label];
            div.dataset.label = newLabel;
            activeLevel = newLabel;
            activeLevelLabel.textContent = `Active Level: ${newLabel}`;
            autoArrange(newLabel);
          }
        };

        lblInput.onclick = () => {
          document.querySelectorAll('.level-label').forEach(el => el.classList.remove('active'));
          lblInput.classList.add('active');
          activeLevel = lblInput.value.trim();
          activeLevelLabel.textContent = `Active Level: ${activeLevel}`;
        };

        toggle.onclick = () => {
          const list = div.querySelector('.drawing-list');
          list.style.display = list.style.display === 'none' ? 'block' : 'none';
          toggle.innerHTML = '<span class="bl-icons-outliner"></span>';
        };

        const list = document.createElement('div');
        list.className = 'drawing-list';

        div.append(toggle, lblInput, list);
        levelsTree.appendChild(div);
        levelCount++;
      } else {
        const parts = rel.split("/"),
          label = parts[0],
          name = parts[1];
        const p = zip.file(entry.name).async("base64").then(data => {
          levels[label].push({
            name,
            data: `data:image/png;base64,${data}`
          });
        });
        drawingPromises.push(p);
      }
    });

    Promise.all(drawingPromises).then(() => {
      for (const label in levels) autoArrange(label);
    });
    autoArrangeLevels();
    
  });
}

const assetsInput = document.getElementById("assetsInput");
const dropZoneTree = document.getElementById("dropZoneTree");

dropZoneTree.addEventListener("dragover", e => { 
  e.preventDefault(); 
  dropZoneTree.classList.add("dragover"); 
});
dropZoneTree.addEventListener("dragleave", () => 
  dropZoneTree.classList.remove("dragover")
);
dropZoneTree.addEventListener("drop", e => {
  e.preventDefault();
  dropZoneTree.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file){fileLoadAssets(file);}
});

document.getElementById('loadBackdropBtn').onclick = () => document.getElementById('backdropInput').click();

document.getElementById('backdropInput').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    backdropData = evt.target.result;
    const img = new Image();
    img.onload = () => {
      resizeCanvases(img.width, img.height);
      backdropCanvasCtx.clearRect(0, 0, img.width, img.height);
      backdropCanvasCtx.drawImage(img, 0, 0);
      canvasRefreshInputValues();
    };
    img.src = backdropData;
  };
  reader.readAsDataURL(file);
  
};

document.getElementById('loadAssetsBtn').addEventListener("click", () => assetsInput.click());
assetsInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) fileLoadAssets(file);
});


