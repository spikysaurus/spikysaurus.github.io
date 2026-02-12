function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Use clientX/clientY for consistency across mouse/touch/pen
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}


//// Painting primitives
function circ(x, y, s, c, a) {
  active_layer_ctx.globalAlpha = a;

  if (activeTool === "ToolEraser") {
    active_layer_ctx.globalCompositeOperation = "destination-out";
    active_layer_ctx.fillStyle = "#000"; // solid fill for erasing
  } else {
    active_layer_ctx.globalCompositeOperation = "source-over";
    active_layer_ctx.fillStyle = c;
  }

  if (aliasing) {
    const r = Math.floor(s / 2);
    for (let py = -r; py <= r; py++) {
      for (let px = -r; px <= r; px++) {
        if (px * px + py * py <= r * r) {
          active_layer_ctx.fillRect(Math.round(x + px), Math.round(y + py), 1, 1);
        }
      }
    }
  } else {
    active_layer_ctx.beginPath();
    active_layer_ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    active_layer_ctx.fill();
  }

  // reset state
  active_layer_ctx.globalAlpha = 1;
  active_layer_ctx.globalCompositeOperation = "source-over";
}

function line(x0, y0, x1, y1, s, c, a) {
  const dx = x1 - x0,
        dy = y1 - y0,
        d = Math.hypot(dx, dy),
        st = Math.ceil(d / (s / 3)); // step count ensures overlap

  for (let i = 0; i <= st; i++) {
    const t = i / st;
    circ(x0 + dx * t, y0 + dy * t, s, c, a);
  }
}

function getBrushSettings(e) {
  const baseSize = parseInt(brush_size.value, 10);
  const baseOpacity = parseFloat(brush_opacity.value);

  const pressure = e.pressure > 0 ? e.pressure : 1.0;

  const brushSize = pressureSizeToggle.checked ? baseSize * pressure : baseSize;
  const brushOpacity = pressureOpacityToggle.checked ? baseOpacity * pressure : baseOpacity;

  return { brushSize, brushOpacity };
}


function bindDrawingEvents() {
  active_layer.onpointerdown = e => {
    if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
      // Save undo state
      undoStack.push(dataURL);
      redoStack = [];

      drawing = true;
      lx = e.offsetX;
      ly = e.offsetY;

      // Draw initial dot if pressure not controlling size/opacity
      if (!pressureSizeToggle.checked && !pressureOpacityToggle.checked) {
        const { brushSize, brushOpacity } = getBrushSettings(e);
        circ(lx, ly, brushSize, col.value, brushOpacity);
      }
    }
  };

  active_layer.onpointermove = e => {
    if ((activeTool === "ToolBrush" || activeTool === "ToolEraser") && drawing) {
      // Skip zero-length moves if pressure is enabled
      if ((pressureSizeToggle.checked || pressureOpacityToggle.checked) &&
          lx === e.offsetX && ly === e.offsetY) {
        return;
      }

      const { brushSize, brushOpacity } = getBrushSettings(e);
      line(lx, ly, e.offsetX, e.offsetY, brushSize, col.value, brushOpacity);
      lx = e.offsetX;
      ly = e.offsetY;
    }
  };

//active_layer.onpointerup = () => {
//    if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
//      drawing = false;

//      // Update or insert into animation[]
//        animation.push({
//          layer_name: active_layer.id,
//          frame: frame_current + 1,
//          drawing: dataURL
//        });

//      // Refresh timeline but DO NOT immediately clear canvas
//      render();
//    }
//  };
//}

  active_layer.onpointerup = () => {
    if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
      drawing = false;
      
        if (cel_entry) {
    cel_entry.drawing = active_layer.toDataURL();
  } else {
        animation.push({
          layer_name: active_layer.id,
          frame: frame_current + 1,
          drawing: active_layer.toDataURL()
        });
}
      // Refresh timeline but DO NOT immediately clear canvas
      render();
    }
  };
}

//// Initial binding for the first active layer
bindDrawingEvents(active_layer);



// --- Globals ---
//let selStartX = null, selStartY = null, selEndX = null, selEndY = null;
let isDraggingHandle = false;
let dragStartX = 0, dragStartY = 0;
let frozenStartX = 0, frozenStartY = 0, frozenEndX = 0, frozenEndY = 0;
//let clipboard = null;


// --- Freehand drawing handlers ---
active_layer.addEventListener('pointerdown', e => {
  if (["pen","touch","mouse"].includes(e.pointerType)) {
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

active_layer.addEventListener('pointermove', e => {
  if (!drawing) return;
  if (["pen","touch","mouse"].includes(e.pointerType)) {
    // ctx.lineTo(e.offsetX, e.offsetY);
    // ctx.stroke();
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

active_layer.addEventListener('pointerup', e => {
  drawing = false;
});



const BEToggle = document.getElementById("BrushEraserToggle");
const BEStuff = document.getElementById("BrushStuff");
let BEToggleBool = true;
const iconSpan = BEToggle.querySelector("span"); // get the existing span

function updateBEToggle() {
  if (activeTool === "ToolBrush" || activeTool === "ToolEraser") {
    BEStuff.style.display = "flex";
  } else {
    BEStuff.style.display = "none";
    
  }
  
  if (activeTool === "ToolBrush"){
		iconSpan.className = "bl-icons-greasepencil";
		}
	if (activeTool === "ToolEraser"){
		iconSpan.className = "bl-icons-meta_ellipsoid";
		}
		
}



BEToggle.onclick = () => {
  //~ BEToggleBool = !BEToggleBool;

  if (activeTool === "ToolEraser") {
    setActiveTool("ToolBrush");
    iconSpan.className = "bl-icons-greasepencil";
  } 
  else if (activeTool === "ToolBrush"){
    setActiveTool("ToolEraser");
    iconSpan.className = "bl-icons-meta_ellipsoid";
  }
};

// Update activeTool UI
function updateUI() {
  tools.forEach(tool => {
	updateBEToggle();
    tool.btn.style.backgroundColor = tool.active ? "black" : "";
    tool.btn.style.color = tool.active ? "white" : "";
    
    const debug_activeTool = document.getElementById("debug_activeTool");
    
  });
}
