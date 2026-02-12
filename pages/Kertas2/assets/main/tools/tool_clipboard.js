
// Copy selected region
copyBtn.onclick = () => {
    if (selStartX != null) {
//    		cvx_overlay.clearRect(0, 0, cv_overlay.width, cv_overlay.height);
        const w = selEndX - selStartX;
        const h = selEndY - selStartY;
        if (w && h) {
            const tmp = document.createElement('canvas');
            tmp.width = Math.abs(w);
            tmp.height = Math.abs(h);
            const ctx = tmp.getContext('2d');
            ctx.drawImage(active_layer, Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(w), Math.abs(h), 0, 0, Math.abs(w), Math.abs(h));
            clipboard = tmp;
        }
    }
};

// Delete
deleteBtn.onclick = () => {
	active_layer_ctx.clearRect(Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(selEndX - selStartX), Math.abs(selEndY - selStartY));
	frames[frame_current] = dataURL;
	render();
};

// Cut = copy + delete
cutBtn.onclick = () => {
	document.getElementById('copy').onclick();
	document.getElementById('delete').onclick();
};


// --- Paste clipboard into current selection ---
pasteBtn.onclick = () => {
  if (clipboard && selStartX != null && selEndX != null) {
    // compute selection bounds
    const w = selEndX - selStartX;
    const h = selEndY - selStartY;

    // draw clipboard image scaled to fit selection
    active_layer_ctx.drawImage(
      clipboard,
      0, 0, clipboard.width, clipboard.height, // source
      Math.min(selStartX, selEndX),
      Math.min(selStartY, selEndY),
      Math.abs(w),
      Math.abs(h) // destination size
    );

    frames[frame_current] = dataURL;
    render();
  }
};
