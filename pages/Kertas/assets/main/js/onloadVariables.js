function updateBrushSizeLabel() { const l = document.getElementById("brushSizeLabel"); if (l) l.textContent = brush_size; }
function updateEraserSizeLabel() { const l = document.getElementById("eraserSizeLabel"); if (l) l.textContent = eraser_size; }
function updateAliasingLabel() { const l = document.getElementById("aliasingLabel"); if (l) l.textContent = brush_aliasing; }
function updateDrawBehindLabel() { const l = document.getElementById("drawBehindLabel"); if (l) l.textContent = "false"; }
function updateImageRenderingLabel() { const l = document.getElementById("imageRenderingLabel"); if (l) l.textContent = "false";}

window.addEventListener("DOMContentLoaded", () => {
  // Reset symbol inputs
  document.getElementById("symNull").value = "x";
  document.getElementById("symTick1").value = "○";
  document.getElementById("symTick2").value = "●";
  document.getElementById("symHyphen").value = "｜";
  // Reset symbol map in JS
  symbolDisplayMap = {
    SYMBOL_NULL_CELL: "x",
    SYMBOL_TICK_1: "○",
    SYMBOL_TICK_2: "●",
    SYMBOL_HYPHEN: "｜"
  };

	updateBrushSizeLabel();
	updateDrawBehindLabel();
	updateEraserSizeLabel();
	updateAliasingLabel();
	updateImageRenderingLabel();
});
