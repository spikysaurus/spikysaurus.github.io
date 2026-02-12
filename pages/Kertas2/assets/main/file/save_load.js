SaveProjectBtn.onclick = async () => {
  const bgUrl = document.getElementById('url').value.trim();
  const zip = new JSZip();

  // Create frames folder inside zip
  const framesFolder = zip.folder("frames");

  // For each animation entry, composite background + that frame’s image into a PNG
  for (const entry of animation) {
    const tmp = document.createElement('canvas');
    tmp.width = cv_background.width;
    tmp.height = cv_background.height;
    const tx = tmp.getContext('2d');

    // Optional: draw background
    // tx.drawImage(cv_background, 0, 0);

    // Draw this frame’s image
    const img = new Image();
    img.src = entry.drawing;
    await new Promise(res => { img.onload = res; });
    tx.drawImage(img, 0, 0);

    // Convert to Blob (PNG)
    const blob = await new Promise(resolve =>
      tmp.toBlob(resolve, "image/png")
    );

    // Filename based on layer + frame number
    const filename = `${entry.layer_name}_${String(entry.frame).padStart(4, '0')}.png`;
    framesFolder.file(filename, blob);

    // Update entry’s drawing path to point to the file inside zip
    entry.drawing = `frames/${filename}`;
  }

  // Build JSON metadata
  const data = {
    background: bgUrl,
    canvas: {
      width: active_layer.width,
      height: active_layer.height
    },
    animation: animation
  };

  // Add JSON file at root of zip
  zip.file("data.json", JSON.stringify(data, null, 2));

  // Generate zip and trigger download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "Kertas.zip");
};


LoadProjectBtn.onclick = () => {
  const input = document.createElement('input');
  input.type = "file";
  input.accept = ".zip";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const zip = await JSZip.loadAsync(reader.result);

        // Read JSON metadata
        const jsonFile = zip.file("data.json");
        if (!jsonFile) throw new Error("Missing data.json in zip");
        const jsonText = await jsonFile.async("string");
        const obj = JSON.parse(jsonText);

        // Restore background
        if (obj.background) {
          document.getElementById('url').value = obj.background;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = obj.background;
          img.onload = () => {
            const w = (obj.canvas && obj.canvas.width) || img.width;
            const h = (obj.canvas && obj.canvas.height) || img.height;
            resize(w, h);

            document.getElementById('canvasWidth').value = w;
            document.getElementById('canvasHeight').value = h;

            cvx_background.clearRect(0, 0, cv_background.width, cv_background.height);
            cvx_background.drawImage(img, 0, 0, w, h);
            clearPixels();
          };
        } else if (obj.canvas && obj.canvas.width && obj.canvas.height) {
          resize(obj.canvas.width, obj.canvas.height);
          document.getElementById('canvasWidth').value = obj.canvas.width;
          document.getElementById('canvasHeight').value = obj.canvas.height;
        }

        // Clear existing animation and layer canvases
        animation.length = 0;
        const stack = document.getElementById("stack");
        Array.from(stack.querySelectorAll("canvas"))
          .filter(c => c.id.startsWith("layer"))
          .forEach(c => c.remove());

        // Collect all unique layer names from animation metadata
        const layerNames = [...new Set(obj.animation.map(f => f.layer_name))];

        // Recreate canvases for each layer
        layerNames.forEach(name => {
          const newCanvas = document.createElement("canvas");
          newCanvas.id = name;
          newCanvas.width = obj.canvas.width;
          newCanvas.height = obj.canvas.height;
          stack.appendChild(newCanvas);

          bindDrawingEvents(newCanvas);
        });

        // Restore animation frames from zip
        if (obj.animation) {
          for (const frame of obj.animation) {
            const pngPath = frame.drawing; // e.g. "frames/layer0_0001.png"
            const pngFile = zip.file(pngPath);
            if (pngFile) {
              const blob = await pngFile.async("blob");
              const url = URL.createObjectURL(blob);
              animation.push({
                layer_name: frame.layer_name,
                frame: frame.frame,
                drawing: url
              });
            }
          }

          // Set current frame index
          frame_current = 0;

          // Auto‑draw all layers’ frame 1
          const layerCanvases = Array.from(stack.querySelectorAll("canvas"))
            .filter(c => c.id.startsWith("layer"));
          layerCanvases.forEach(c => {
            const ctx = c.getContext("2d");
            const frame = animation.find(
              a => a.layer_name === c.id && a.frame === frame_current + 1
            );
            if (frame && frame.drawing) {
              const img = new Image();
              img.src = frame.drawing;
              img.onload = () => ctx.drawImage(img, 0, 0);
            }
          });

          // Set the first layer as active
          const firstLayerCanvas = layerCanvases[0];
          if (firstLayerCanvas) {
            active_layer = firstLayerCanvas;
            active_layer_ctx = active_layer.getContext("2d");
          }

          render();
        }

      } catch (err) {
        console.error("Invalid ZIP or JSON", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
  timelineBarPosition();
};






