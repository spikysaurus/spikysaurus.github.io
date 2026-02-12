//// Undo/Redo

let undoStack = [];
let redoStack = [];

undoBtn.onclick = () => {undo()};
redoBtn.onclick = () => {redo()};

function undo() {
  if (undoStack.length > 0) {
    // Save current state into redoStack
    redoStack.push(dataURL);

    const lastState = undoStack.pop();
    const img = new Image();
    img.onload = () => {
      clearPixels();
      active_layer_ctx.drawImage(img, 0, 0);
      frames[frame_current] = lastState;
      render();
    };
    img.src = lastState;
  }
}

function redo() {
  if (redoStack.length > 0) {
    // Save current state into undoStack
    undoStack.push(dataURL);

    const nextState = redoStack.pop();
    const img = new Image();
    img.onload = () => {
      clearPixels();
      active_layer_ctx.drawImage(img, 0, 0);
      frames[frame_current] = nextState;
      render();
    };
    img.src = nextState;
  }
}
