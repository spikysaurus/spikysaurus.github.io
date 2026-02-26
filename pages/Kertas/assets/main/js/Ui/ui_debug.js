let showInfos = true;

document.addEventListener("keydown", e => {
	showInfos = !showInfos;
	if (e.key === "F1") {
		if (showInfos){
			areaBottom.style.display = "none";
			}
			else{
				areaBottom.style.display = "block";
				}
  }
	
});

const drawBehindLabel = document.getElementById("drawBehindLabel");
const imageRenderingLabel = document.getElementById("imageRenderingLabel");

function updateBrushSizeLabel() { const l = document.getElementById("brushSizeLabel"); if (l) l.textContent = brush_size; }
function updateEraserSizeLabel() { const l = document.getElementById("eraserSizeLabel"); if (l) l.textContent = eraser_size; }
function updateAliasingLabel() { const l = document.getElementById("aliasingLabel"); if (l) l.textContent = brush_aliasing; }

document.addEventListener("DOMContentLoaded", () => {
  updateBrushSizeLabel();
  drawBehindLabel.textContent = "false";
  updateEraserSizeLabel();
  updateAliasingLabel();
  imageRenderingLabel.textContent = "false";
});
