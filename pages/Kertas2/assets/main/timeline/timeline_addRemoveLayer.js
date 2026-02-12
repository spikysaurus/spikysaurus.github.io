
function addLayer(){
  const stack = document.getElementById("stack");

  // Find existing layer canvases
  const existingLayers = Array.from(stack.querySelectorAll("canvas"))
    .filter(c => c.id.startsWith("layer"));

  // Determine next layer index
  const nextIndex = existingLayers.length; // layer0 already exists
  const newLayerId = "layer" + nextIndex;

  // Create new canvas
  const newCanvas = document.createElement("canvas");
  newCanvas.id = newLayerId;
  newCanvas.width = stack.querySelector("#layer0").width;
  newCanvas.height = stack.querySelector("#layer0").height;
  stack.appendChild(newCanvas);

  // Set it as active layer
  active_layer = newCanvas;
  active_layer_ctx = newCanvas.getContext("2d");

  // Attach drawing events so you can paint on this new layer
  bindDrawingEvents(newCanvas);

  // Clear it so it's blank
  active_layer_ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

  // Add a blank frame at frame 1
//  const blankDataURL = newCanvas.toDataURL(); // snapshot of empty canvas
	
if (cel_entry) {
// Instead of removing, mark as null
cel_entry.drawing = null;
} else {
  animation.push({
    layer_name: newCanvas.id,
    frame: 1,
    drawing: null // valid string, not [object ImageData]
  });
  }

  // Refresh timeline
  render();
};
