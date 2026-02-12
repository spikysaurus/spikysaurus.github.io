function CelAddNull() {
//if (cel_entry) {

//CelDelete()

//} else {
const frameIndex = frame_current + 1
const idx = animation.findIndex(a => a.layer_name === active_layer.id && a.frame === frameIndex);
  if (idx !== -1) {
    animation.splice(idx, 1);
  }
  
    animation.push({
      layer_name: active_layer.id,
      frame: frame_current+1,
      drawing: null
    });
//  }
  // Clear pixels on canvas too
  clearPixels();

  render();
  show(frame_current);
}


//function CelDelete() {
//  if (animation.length === 0) return; // nothing to delete

//  const confirmDelete = confirm("Delete this cel? (permanent)");
//  if (!confirmDelete) return;

//  const frameIndex = frame_current + 1; // timeline is 1-based
//  const layerCanvases = Array.from(document.querySelectorAll('#stack canvas'))
//    .filter(c => c.id.startsWith('layer'));

//  // Find the active layer (the one whose frame cell is "active")
//  const activeLayer = layerCanvases.find(c => {
//    return animation.some(a => a.layer_name === c.id && a.frame === frameIndex);
//  }) || layerCanvases[0]; // fallback to first layer if none active

//  if (!activeLayer) return;

//  // Remove the cel entry for this layer/frame
//  const idx = animation.findIndex(a => a.layer_name === activeLayer.id && a.frame === frameIndex);
//  if (idx !== -1) {
//    animation.splice(idx, 1);
//  }

//  // Clear pixels on canvas too
//  clearPixels();
//  // Adjust current index if needed
//  if (frame_current >= animation.length) {
//    frame_current = Math.max(0, animation.length - 1);
//  }

//  render();
//  show(frame_current);
//}
