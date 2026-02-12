
//FILL TOOL
function fill(x, y, fillColor, tolerance) {
const w = active_layer.width, h = active_layer.height;
const imageData = active_layer_ctx.getImageData(0, 0, w, h);
const data = imageData.data;

  function getPixel(px, py) {
    const i = (py * w + px) * 4;
    return [data[i], data[i+1], data[i+2], data[i+3]];
  }

  function setPixel(px, py, color) {
    const i = (py * w + px) * 4;
    data[i]   = color[0];
    data[i+1] = color[1];
    data[i+2] = color[2];
    data[i+3] = color[3];
  }

  function parseColor(colorStr) {
    const tmp = document.createElement("canvas").getContext("2d");
    tmp.fillStyle = colorStr;
    tmp.fillRect(0, 0, 1, 1);
    const c = tmp.getImageData(0, 0, 1, 1).data;
    return [c[0], c[1], c[2], c[3]];
  }

  function colorMatch(c1, c2, tol) {
    // Euclidean distance in RGBA space
    const diff = Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2) +
      Math.pow(c1[3] - c2[3], 2)
    );
    return diff <= tol;
  }

  const targetColor = getPixel(x, y);
  const newColor = parseColor(fillColor);

  // Only skip if the new color is *exactly* the same
  if (targetColor.toString() === newColor.toString()) return;

  const stack = [[x, y]];
  const visited = new Set();

  while (stack.length) {
    const [px, py] = stack.pop();
    const key = px + "," + py;
    if (visited.has(key)) continue;
    visited.add(key);

    const currentColor = getPixel(px, py);
    if (colorMatch(currentColor, targetColor, tolerance)) {
      setPixel(px, py, newColor); // always overwrite

      if (px > 0) stack.push([px-	1, py]);
      if (px < w-1) stack.push([px+1, py]);
      if (py > 0) stack.push([px, py-1]);
      if (py < h-1) stack.push([px, py+1]);
    }
  }

  active_layer_ctx.putImageData(imageData, 0, 0);
}

// Fill Tool handlers
active_layer.addEventListener("pointerdown", e => {
    if (activeTool != "ToolFill") return; // only fill if enabled

    // --- Capture undo state BEFORE filling ---
    undoStack.push(dataURL);

    const rect = active_layer.getBoundingClientRect();

    // Map screen coords back to canvas pixel coords
    const scaleX = active_layer.width / rect.width;
    const scaleY = active_layer.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    fill(x, y, col.value, 0); // fill with chosen color

    // Optionally update frames[] if you want fills to be stored like strokes
    frames[frame_current] = dataURL;
    render();
});
