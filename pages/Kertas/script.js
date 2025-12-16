const bg = document.getElementById('bg'),
    bgx = bg.getContext('2d')
const cv_checkerboard = document.getElementById('checkerboard'),
    cvx_checkerboard = cv_checkerboard.getContext('2d')
const dr = document.getElementById('draw'),
    drx = dr.getContext('2d')
    drx.imageSmoothingEnabled = false;
const overlay = document.getElementById('overlay'),
    ox = overlay.getContext('2d')
const stack = document.getElementById('stack')
const sz = document.getElementById('sz'),
    op = document.getElementById('op'),
    col = document.getElementById('col')
   
let drawing = false,
    lx, ly, eras = false,
    pan = false,
    px = 0,
    py = 0,
    sc = 1,
    sd = 0
let targetPx = 0,
    targetPy = 0,
    targetSc = 1,
    panStartX = 0,
    panStartY = 0
const frames = [];
let cur = 0

let selecting = false,selStartX, selStartY, selEndX, selEndY;
let fillMode = false; 

function setSize(w, h) {
    stack.style.width = w + 'px';
    stack.style.height = h + 'px'
}

function apply() {
    stack.style.transform = `translate(-50%,-50%) translate(${px}px,${py}px) scale(${sc})`
}

function animate() {
    px += (targetPx - px) * 0.2;
    py += (targetPy - py) * 0.2;
    sc += (targetSc - sc) * 0.2;
    apply();
    requestAnimationFrame(animate)
}
animate()


//FILL TOOL
// Attach button toggle
	const fillBtn = document.getElementById("fillBtn");
    document.getElementById("fillBtn").addEventListener("click", () => {
    	
      fillMode = !fillMode;
		 if (fillMode) {
		     fillBtn.style.backgroundColor = "yellow";
		     
		 } else {
			fillBtn.style.backgroundColor = "";
		 }
    });
    
	function fill(x, y, fillColor, tolerance) {
  const w = dr.width, h = dr.height;
  const imageData = drx.getImageData(0, 0, w, h);
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

      if (px > 0) stack.push([px-1, py]);
      if (px < w-1) stack.push([px+1, py]);
      if (py > 0) stack.push([px, py-1]);
      if (py < h-1) stack.push([px, py+1]);
    }
  }

  drx.putImageData(imageData, 0, 0);
}

// Canvas click handler (with zoom-safe coordinates)
if (!selecting) {
  dr.addEventListener("pointerdown", e => {
    if (!fillMode) return; // only fill if enabled

    const rect = dr.getBoundingClientRect();

    // Map screen coords back to canvas pixel coords
    const scaleX = dr.width / rect.width;
    const scaleY = dr.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    fill(x, y, col.value, 0); // fill with chosen color
  });
}

 
// --- RESIZE STRETCH ---
function resize(w, h) {
    const snapshot = new Image();
    snapshot.src = dr.toDataURL();

	cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    
    overlay.width = w;
    overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        // Stretch to fit new size
        drx.drawImage(snapshot, 0, 0, w, h);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}

// --- RESIZE ANCHOR PRESERVE ---
function resizeAnchor(w, h, anchor = "top-left") {
    const snapshot = new Image();
    snapshot.src = dr.toDataURL();

    const oldW = dr.width;
    const oldH = dr.height;

	cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    
    overlay.width = w;
    overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        let offsetX = 0, offsetY = 0;
        if (anchor.includes("right")) offsetX = w - oldW;
        if (anchor.includes("bottom")) offsetY = h - oldH;
        // Draw at original size (no stretch)
        drx.drawImage(snapshot, offsetX, offsetY);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}


// --- RESIZE CENTER PRESERVE ---
function resizeCenter(w, h) {
    const snapshot = new Image();
    snapshot.src = dr.toDataURL();

    const oldW = dr.width;
    const oldH = dr.height;
		
		cv_checkerboard.width = w;
    cv_checkerboard.height = h;
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    overlay.width = w;
    overlay.height = h;
    stack.style.width = w + 'px';
    stack.style.height = h + 'px';

    snapshot.onload = () => {
        // Center the old drawing
        const offsetX = (w - oldW) / 2;
        const offsetY = (h - oldH) / 2;
        drx.drawImage(snapshot, offsetX, offsetY);
    };

    document.getElementById('canvasWidth').value = w;
    document.getElementById('canvasHeight').value = h;
}

// --- BUTTON HANDLERS ---
document.getElementById('applySize').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    if (w > 0 && h > 0) {
        resize(w, h); // stretch
        frames[cur] = dr.toDataURL();
        render();
    }
};

document.getElementById('resizeLeft').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "top-right");
};

document.getElementById('resizeRight').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "top-left");
};

document.getElementById('resizeTop').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "bottom-left");
};

document.getElementById('resizeBottom').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeAnchor(w, h, "top-left");
};

document.getElementById('resizeCenter').onclick = () => {
    const w = parseInt(document.getElementById('canvasWidth').value, 10);
    const h = parseInt(document.getElementById('canvasHeight').value, 10);
    resizeCenter(w, h);
};

function init() {
    drx.clearRect(0, 0, dr.width, dr.height);
    frames.push(dr.toDataURL());
    cur = frames.length - 1;
    render()
}
resize(640, 360);
init()

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

let useAliased = false; // user can set this true/false
const AliasedBtn = document.getElementById('aliased');
AliasedBtn.onclick = () => {
    aliased = !aliased;
    if (!aliased) {
        AliasedBtn.style.backgroundColor = "yellow";
        useAliased = true;
        
    } else {
		AliasedBtn.style.backgroundColor = "";
      useAliased = false;
    }
};

//Painting
function circ(x, y, s, c, a) {
    if (!fillMode) {
        drx.globalAlpha = a;

        if (eras) {
            drx.globalCompositeOperation = 'destination-out';
            drx.fillStyle = 'rgba(0,0,0,1)'; // <-- can just use any solid color
        } else {
            drx.globalCompositeOperation = 'source-over';
            drx.fillStyle = c;
        }

        if (useAliased) {
            const r = Math.floor(s / 2);
            for (let py = -r; py <= r; py++) {
                for (let px = -r; px <= r; px++) {
                    if (px * px + py * py <= r * r) {
                        drx.fillRect(Math.round(x + px), Math.round(y + py), 1, 1);
                    }
                }
            }
        } else {
            drx.beginPath();
            drx.arc(x, y, s / 2, 0, Math.PI * 2);
            drx.fill();
        }

        drx.globalAlpha = 1;
        drx.globalCompositeOperation = 'source-over'; // reset after erasing
    }
}

function line(x0, y0, x1, y1, s, c, a) {
    const dx = x1 - x0,
          dy = y1 - y0,
          d = Math.hypot(dx, dy),
          // smaller step size ensures overlap
          st = Math.ceil(d / (s / 3));  
    for (let i = 0; i <= st; i++) {
        const t = i / st;
        circ(x0 + dx * t, y0 + dy * t, s, c, a);
    }
}



dr.onpointermove = e => {
    if (pan) return;
    if (drawing) {
        const { x, y } = getCanvasCoords(e, dr);
        
        line(lx, ly, x, y, parseInt(sz.value), col.value, parseFloat(op.value).toFixed(2));
        lx = x;
        ly = y;
    }
};

dr.onpointerup = e => {
    if (pan) return;
    drawing = false;
    frames[cur] = dr.toDataURL();
    render();
};


dr.onpointereave = () => {
    drawing = false
}
document.addEventListener('pointerdown', e => {
    if (!pan) return;
    psx = e.clientX - targetPx;
    psy = e.clientY - targetPy;
    document.body.style.cursor = 'grab'
})
document.addEventListener('pointermove', e => {
    if (!pan) return;
    if (e.buttons !== 1) return;
    targetPx = e.clientX - psx;
    targetPy = e.clientY - psy
})
document.addEventListener('pointerup', () => {
    if (!pan) return;
    document.body.style.cursor = 'default'
})

//PAN
document.addEventListener('pointerstart', e => {
    if (e.length === 2) {
        const dx = e[0].clientX - e[1].clientX
        const dy = e[0].clientY - e[1].clientY
        sd = Math.hypot(dx, dy)
    }
    if (e.length === 3) {
        panStartX = e[0].clientX - targetPx
        panStartY = e[0].clientY - targetPy
    }
}, {
    passive: true
})
document.addEventListener('pointermove', e => {
    if (e.length === 2) {
        const dx = e[0].clientX - e[1].clientX
        const dy = e[0].clientY - e[1].clientY
        const nd = Math.hypot(dx, dy)
        const f = nd / sd
        targetSc = Math.min(Math.max(targetSc * f, 0.5), 3)
        sd = nd
    }
    if (e.length === 3) {
        targetPx = e[0].clientX - panStartX
        targetPy = e[0].clientY - panStartY
    }
}, {
    passive: true
})
//zoomIn.onclick = () => {
// targetSc *= 1.1
//}
//zoomOut.onclick = () => {
// targetSc *= 0.9
//}

let zoomInterval;

// Zoom In (hold to repeat)
zoomIn.onpointerdown = () => {
    zoomInterval = setInterval(() => {
        targetSc *= 1.1;
        // redraw or update canvas here if needed
    }, 100); // every 100ms
};

zoomIn.onpointerup = zoomIn.onpointerleave = () => {
    clearInterval(zoomInterval);
};

// Zoom Out (hold to repeat)
zoomOut.onpointerdown = () => {
    zoomInterval = setInterval(() => {
        targetSc *= 0.9;
        // redraw or update canvas here if needed
    }, 100);
};

zoomOut.onpointerup = zoomOut.onpointerleave = () => {
    clearInterval(zoomInterval);
};


document.addEventListener('wheel', e => {
    e.preventDefault()
    if (e.ctrlKey) {
        const d = e.deltaY < 0 ? 1.1 : 0.9
        targetSc = Math.min(Math.max(targetSc * d, 0.5), 3)
    } else {
        targetPx -= e.deltaX
        targetPy -= e.deltaY
    }
}, {
    passive: false
})

//let selecting = false,selStartX, selStartY, selEndX, selEndY;
let clipboard = null;
const selectBtn = document.getElementById('select');
selectBtn.onclick = () => {
    selecting = !selecting;
    if (selecting) {
        selectBtn.style.backgroundColor = "yellow";
        selectBtn.style.color = "black";
        
    } else {
        selectBtn.style.backgroundColor = "";
        ox.clearRect(0, 0, overlay.width, overlay.height);
    }
//    selectBtn.classList.toggle(!selecting, selecting);
};

// disable painting when selecting
dr.onpointerdown = e => {
    if (pan || selecting) return;
    drawing = true;
    lx = e.offsetX;
    ly = e.offsetY;
    circ(lx, ly, parseInt(sz.value), col.value, parseFloat(op.value));
};
dr.onpointermove = e => {
    if (pan || selecting) return;
    if (drawing) {
        line(lx, ly, e.offsetX, e.offsetY, parseInt(sz.value), col.value, parseFloat(op.value));
        lx = e.offsetX;
        ly = e.offsetY;
    }
};
dr.onpointerup = () => {
    if (pan || selecting) return;
    drawing = false;
    frames[cur] = dr.toDataURL();
    render();
};
dr.onpointerleave = () => {
    drawing = false
};


// selection handlers
dr.addEventListener('pointerdown', e => {
    if (selecting) {
        selStartX = e.offsetX;
        selStartY = e.offsetY;
        selEndX = selStartX;
        selEndY = selStartY;
    }
});
dr.addEventListener('pointermove', e => {
    if (selecting && e.buttons === 1) {
        selEndX = e.offsetX;
        selEndY = e.offsetY;
        ox.clearRect(0, 0, overlay.width, overlay.height);
        ox.strokeStyle = 'rgba(0,255,0,0.8)';
        ox.lineWidth = 1;
        ox.strokeRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);
    }
});
dr.addEventListener('pointerup', e => {
    if (selecting) {
        selEndX = e.offsetX;
        selEndY = e.offsetY;
//        ox.clearRect(0, 0, overlay.width, overlay.height);
    }
});
//prev is canvas.addEve-
// changed ctx to dr
dr.addEventListener("pointerdown", e => {
    if (e.pointerType === "pen" || e.pointerType === "touch" || e.pointerType === "mouse") {
        drawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
//        ctx.beginPath();
//        ctx.moveTo(lastX, lastY);
    }
    else{pass}
});
dr.addEventListener("pointermove", e => { 
    if (!drawing) return;
    if (e.pointerType === "pen" || e.pointerType === "touch" || e.pointerType === "mouse") {
//        ctx.lineTo(e.offsetX, e.offsetY);
//        ctx.stroke();
        lastX = e.offsetX;
        lastY = e.offsetY;
    }
    else{pass}
});
// Selection handlers with pointer events
dr.addEventListener('pointerdown', e => {
    if (selecting) {
        const { x, y } = getCanvasCoords(e, dr);
        selStartX = x;
        selStartY = y;
        selEndX = x;
        selEndY = y;
    }
});

// Selection handlers with pointer events
dr.addEventListener('pointerdown', e => {
    if (selecting) {
        const { x, y } = getCanvasCoords(e, dr);
        selStartX = x;
        selStartY = y;
        selEndX = x;
        selEndY = y;
    }
});

dr.addEventListener('pointermove', e => {
    if (selecting && e.pressure > 0) { // pressure>0 means pointer is down
        const { x, y } = getCanvasCoords(e, dr);
        selEndX = x;
        selEndY = y;
        ox.clearRect(0, 0, overlay.width, overlay.height);
        ox.strokeStyle = 'purple';
        ox.fillStyle = 'rgba(128, 0, 128, 0.2)'; // purple with 20% opacity
        ox.fillRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);
        
        ox.lineWidth = 1;
        ox.setLineDash([6, 4]); // 6px dash, 4px gap
        ox.strokeRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);
    }
});

dr.addEventListener('pointerup', e => {
    if (selecting) {
        const { x, y } = getCanvasCoords(e, dr);
        selEndX = x;
        selEndY = y;
//        ox.clearRect(0, 0, overlay.width, overlay.height);
    }
});

// Copy selected region
document.getElementById('copy').onclick = () => {
    if (selStartX != null) {
    		ox.clearRect(0, 0, overlay.width, overlay.height);
        const w = selEndX - selStartX;
        const h = selEndY - selStartY;
        if (w && h) {
            const tmp = document.createElement('canvas');
            tmp.width = Math.abs(w);
            tmp.height = Math.abs(h);
            const ctx = tmp.getContext('2d');
            ctx.drawImage(dr, Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(w), Math.abs(h), 0, 0, Math.abs(w), Math.abs(h));
            clipboard = tmp;
        }
    }
};
// Cut = copy + clear
document.getElementById('cut').onclick = () => {
    document.getElementById('copy').onclick();
    drx.clearRect(Math.min(selStartX, selEndX), Math.min(selStartY, selEndY), Math.abs(selEndX - selStartX), Math.abs(selEndY - selStartY));
    frames[cur] = dr.toDataURL();
    render();
};
//// Paste clipboard at mouse position
document.getElementById('paste').onclick = () => {
    if (clipboard) {
        dr.addEventListener('click', function pasteOnce(e) {
            drx.drawImage(clipboard, e.offsetX, e.offsetY);
            frames[cur] = dr.toDataURL();
            render();
            dr.removeEventListener('click', pasteOnce);
        });
    }
};





const brushBtn = document.getElementById('brush')
const brushBtn_icon = document.getElementById('brush-icon')
brushBtn.onclick = () => {
    eras = !eras
    if (eras){
    	brushBtn_icon.classList.replace('bl-icons-greasepencil', 'bl-icons-meta_ellipsoid');
    }
    else{
    	brushBtn_icon.classList.replace('bl-icons-meta_ellipsoid', 'bl-icons-greasepencil');
    }
    
    	
}
const panBtn = document.getElementById('pan')
panBtn.onclick = () => {
    pan = !pan;
    if (pan) {
        panBtn.style.backgroundColor = "yellow";
        panBtn.style.color = "black";
    } else {
        panBtn.style.backgroundColor = "";
    }
    panBtn.classList.toggle('activePan', pan)
}

document.getElementById('clr').onclick = () => {
    const confirmClear = confirm("Clear the canvas?");
    if (confirmClear) {
        drx.clearRect(0, 0, dr.width, dr.height);
        frames[cur] = dr.toDataURL();
        render();
    }
};

//Save Button
document.getElementById('save').onclick = () => {
    const tmp = document.createElement('canvas');
    tmp.width = bg.width;
    tmp.height = bg.height;
    const tx = tmp.getContext('2d');
    tx.drawImage(bg, 0, 0);
    tx.drawImage(dr, 0, 0);
    const link = document.createElement('a');
    link.download = 'img.png';
    link.href = tmp.toDataURL();
    link.click()
}



// Swap with next frame
document.getElementById('swapNext').onclick = () => {
    if (frames.length > 1) {
        const nextIndex = (cur + 1) % frames.length;
        const temp = frames[cur];
        frames[cur] = frames[nextIndex];
        frames[nextIndex] = temp;

        cur = nextIndex; // update pointer
        show(cur);
        render();
    }
};

// Swap with previous frame
document.getElementById('swapPrev').onclick = () => {
    if (frames.length > 1) {
        const prevIndex = (cur - 1 + frames.length) % frames.length;
        const temp = frames[cur];
        frames[cur] = frames[prevIndex];
        frames[prevIndex] = temp;

        cur = prevIndex; // update pointer
        show(cur);
        render();
    }
};

//Drag and drop frmae
function render() {
    const tl = document.getElementById('line')
    tl.innerHTML = ''
    frames.forEach((f, i) => {
        const d = document.createElement('div')
        d.className = 'f' + (i === cur ? ' active' : '')
        d.textContent = i + 1
        d.draggable = true
        d.dataset.index = i
        d.onclick = () => {
            cur = i;
            show(i);
            render()
        }
        d.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', i)
        })
        d.addEventListener('dragover', e => {
            e.preventDefault()
        })
        d.addEventListener('drop', e => {
            e.preventDefault()
            const from = parseInt(e.dataTransfer.getData('text/plain'))
            const to = parseInt(d.dataset.index)
            if (from !== to) {
                const moved = frames.splice(from, 1)[0]
                frames.splice(to, 0, moved)
                if (cur === from) cur = to
                else if (from < cur && to >= cur) cur--
                else if (from > cur && to <= cur) cur++
                render()
            }
        })
        tl.appendChild(d)
    })
}

function show(i) {
    if (frames[i]) {
        const img = new Image();
        img.onload = () => {
            drx.clearRect(0, 0, dr.width, dr.height);
            drx.drawImage(img, 0, 0)
        };
        img.src = frames[i]
    }
}
//Export JSON
document.getElementById('export').onclick = () => {
    const bgUrl = document.getElementById('url').value.trim()
    const data = {
        background: bgUrl, // store the image URL input
        frames: frames.map((f, i) => ({
            index: i,
            url: f
        }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    })
    const link = document.createElement('a')
    link.download = "document.json"
    link.href = URL.createObjectURL(blob)
    link.click()
}

// Import JSON
document.getElementById('import').onclick = () => {
    const input = document.createElement('input');
    input.type = "file";
    input.accept = "application/json";
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const obj = JSON.parse(reader.result);

                // Restore background
                if (obj.background) {
                    document.getElementById('url').value = obj.background;
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = obj.background;
                    img.onload = () => {
                        const w = obj.width || img.width;
                        const h = obj.height || img.height;
                        resize(w, h);

                        // Update input fields
                        document.getElementById('canvasWidth').value = w;
                        document.getElementById('canvasHeight').value = h;

                        bgx.clearRect(0, 0, bg.width, bg.height);
                        bgx.drawImage(img, 0, 0, w, h);
                        drx.clearRect(0, 0, dr.width, dr.height);
                    };
                } else if (obj.width && obj.height) {
                    // Resize even if no background image
                    resize(obj.width, obj.height);

                    // Update input fields
                    document.getElementById('canvasWidth').value = obj.width;
                    document.getElementById('canvasHeight').value = obj.height;
                }

                // Restore frames
                if (obj.frames) {
                    frames.length = 0;
                    obj.frames.forEach(f => frames.push(f.url));
                    cur = 0;
                    show(cur);
                    render();
                }

            } catch (err) {
                console.error("Invalid JSON", err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Load Image
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

// Helper: composite background + frame into a dataURL
async function composeFrame(bgUrl, frameUrl, outW, outH) {
    const can = document.createElement('canvas')
    can.width = outW
    can.height = outH
    const ctx = can.getContext('2d')
    // Fill transparent background to avoid PDF black page
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, outW, outH)
    // Draw background if present
    if (bgUrl) {
        try {
            const bgImg = await loadImage(bgUrl)
            const r = Math.min(outW / bgImg.width, outH / bgImg.height)
            const w = bgImg.width * r,
                h = bgImg.height * r
            const x = (outW - w) / 2,
                y = (outH - h) / 2
            ctx.drawImage(bgImg, x, y, w, h)
        } catch (e) {
            // ignore bg errors, continue with frame
        }
    }
    // Draw frame (dataURL or external)
    if (frameUrl) {
        const frImg = await loadImage(frameUrl)
        const r = Math.min(outW / frImg.width, outH / frImg.height)
        const w = frImg.width * r,
            h = frImg.height * r
        const x = (outW - w) / 2,
            y = (outH - h) / 2
        ctx.drawImage(frImg, x, y, w, h)
    }
    return can.toDataURL("image/jpeg", 0.92) // smaller PDF size; use PNG if needed
}
// Export PDF
document.getElementById('pdf').onclick = async () => {
    const {
        jsPDF
    } = window.jspdf
    const pdf = new jsPDF()
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const bgUrl = document.getElementById('url').value.trim() || null
    try {
        for (let i = 0; i < frames.length; i++) {
            const compositeDataURL = await composeFrame(bgUrl, frames[i], Math.floor(pageW * 4), Math.floor(pageH * 4))
            // Add scaled image to page (PDF units are in pt by default)
            pdf.addImage(compositeDataURL, 'JPEG', 0, 0, pageW, pageH)
            if (i < frames.length - 1) pdf.addPage()
        }
        pdf.save("document.pdf")
    } catch (err) {
        console.error("PDF export failed:", err)
        alert("PDF export failed. Check console for details.")
    }
}

document.getElementById('add').onclick = add
//Add Frame
function add() {
    drx.clearRect(0, 0, dr.width, dr.height);
    frames.push(dr.toDataURL());
    cur = frames.length - 1;
    render()
}

document.getElementById('load').onclick = () => {
    const u = document.getElementById('url').value.trim();
    if (!u) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        resize(img.width, img.height);
        bgx.clearRect(0, 0, bg.width, bg.height);
        bgx.drawImage(img, 0, 0);
        drx.clearRect(0, 0, dr.width, dr.height);
        frames[cur] = dr.toDataURL();
        render()
    };
    img.src = u
}


//DRAG BUTTONS

function makeDragButton(btn) {
  const displayEl = btn.querySelector('.value-display');
  const inputEl = btn.querySelector('.value-input');

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const getAttr = (name, fallback) => {
    const v = parseFloat(btn.getAttribute(name));
    return Number.isFinite(v) ? v : fallback;
  };

  let min = getAttr('data-min', 0);
  let max = getAttr('data-max', 100);
  let step = getAttr('data-step', 1);
  let pxPerStep = getAttr('data-px-per-step', 16);

  let startX = 0;
  let startVal = 0;
  let isDragging = false;
  let accumulated = 0;

  const readVal = () => parseFloat(displayEl.textContent) || 0;
  const writeVal = (v) => {
    const clamped = clamp(v, min, max);
    displayEl.textContent = clamped;
    inputEl.value = clamped;
  };

  // Double-click to edit
  btn.addEventListener('dblclick', () => {
    btn.classList.add('editing');
    inputEl.focus();
    inputEl.select();
  });

  // Commit input on blur or Enter
  inputEl.addEventListener('blur', () => {
    btn.classList.remove('editing');
    writeVal(parseFloat(inputEl.value));
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      inputEl.blur();
    }
  });

  // Keyboard support
  btn.addEventListener('keydown', (e) => {
    let v = readVal();
    switch (e.key) {
      case 'ArrowRight': writeVal(v + step); e.preventDefault(); break;
      case 'ArrowLeft': writeVal(v - step); e.preventDefault(); break;
    }
  });

  // Pointer drag
  btn.addEventListener('pointerdown', (e) => {
    if (btn.classList.contains('editing')) return;
    btn.setPointerCapture(e.pointerId);
    isDragging = true;
    btn.classList.add('dragging');
    startY = e.clientY;
    startVal = readVal();
    accumulated = 0;
  });

  btn.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = startY - e.clientY ; // right is positive
    const totalStepsFloat = (dx + accumulated) / pxPerStep;
    const wholeSteps = Math.trunc(totalStepsFloat);
    if (wholeSteps !== 0) {
      const next = startVal + wholeSteps * step;
      writeVal(next);
      const usedPx = wholeSteps * pxPerStep;
      accumulated = (dx + accumulated) - usedPx;
    }
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    btn.classList.remove('dragging');
    btn.releasePointerCapture?.(e.pointerId);
  };

  btn.addEventListener('pointerup', endDrag);
  btn.addEventListener('pointercancel', endDrag);
  btn.addEventListener('pointerleave', endDrag);

  writeVal(readVal());
}

// Initialize all drag buttons automatically
document.querySelectorAll('.drag-btn').forEach(makeDragButton);

// Export Gif
document.getElementById('exportGif').onclick = exportGif;

// Export GIF from collected frames
GifDelay = document.getElementById('GifDelay');
function exportGif() {
    if (!frames.length) {
        alert("No frames to export!");
        return;
    }

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: dr.width,
        height: dr.height,
        transparent: null // disable transparency → solid background
    });

    let loadedCount = 0;

    frames.forEach((frameDataUrl, idx) => {
        const img = new Image();
        img.src = frameDataUrl;

        img.onload = () => {
            // Draw onto a temp canvas to ensure background is filled
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = dr.width;
            tempCanvas.height = dr.height;
            const tempCtx = tempCanvas.getContext("2d");

            // Fill background (white here, change if needed)
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, dr.width, dr.height);

            // Draw the frame image on top
            tempCtx.drawImage(img, 0, 0);

            gif.addFrame(tempCtx, { delay: GifDelay.value }); // 200ms per frame

            loadedCount++;
            if (loadedCount === frames.length) {
                gif.on("finished", blob => {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "animation.gif";
                    link.click();
                });
                gif.render();
            }
        };
    });
}

//Animation Play
let playing = false;
let playIndex = 0;
let playTimer = null;

const playBtn = document.getElementById("playBtn");
const playBtn_icon = document.getElementById("playBtn_icon");
const delayInput = document.getElementById("GifDelay");

playBtn.onclick = () => {
    if (playing) {
        stopAnimation();
        playBtn_icon.classList.replace('bl-icons-pause', 'bl-icons-play');
        
    } else {
        playAnimation();
        playBtn_icon.classList.replace('bl-icons-play', 'bl-icons-pause');	
    }
    
};

function playAnimation() {
    if (!frames.length) {
        alert("No frames to play!");
        return;
    }
    playing = true;
    playIndex = 0;
    nextFrame();
}

function stopAnimation() {
    playing = false;
    clearTimeout(playTimer);
}

function nextFrame() {
    if (!playing) return;

    const frame = frames[playIndex];
    const img = new Image();
    img.src = frame.src || frame; // handle if frames[] is just dataURLs

    img.onload = () => {
        drx.clearRect(0, 0, dr.width, dr.height);
        drx.drawImage(img, 0, 0);

        // get delay from input field
        const delayMs = parseInt(delayInput.value, 10) || 200;

        playTimer = setTimeout(() => {
            playIndex = (playIndex + 1) % frames.length;
            nextFrame();
        }, delayMs);
    };
}

//Duplicate Frame
document.getElementById("duplicateBtn").onclick = duplicateFrame;

function duplicateFrame() {
    if (frames.length === 0) {
        alert("No frames to duplicate!");
        return;
    }

    // Get current frame
    const currentFrame = frames[cur];

    // Create a shallow copy (if frames are objects with src+delay, clone it)
    const newFrame = typeof currentFrame === "object"
        ? { ...currentFrame }
        : currentFrame;

    // Insert duplicate right after current frame
    frames.splice(cur + 1, 0, newFrame);

    // Auto-select the new duplicated frame
    cur = cur + 1;

    // Re-render UI / canvas preview
    render();
}


const toggleBtn = document.getElementById('toggleLabel');
const settings = document.getElementById('settings');
settings.style.display = 'none';
toggleBtn.onclick = () => {
 if (settings.style.display === 'none') {
   settings.style.display = 'block';
 } else {
   settings.style.display = 'none';
 }
 
};


const checkerboardBtn = document.getElementById('checkerboardBtn');
checkerboardBtn.onclick = () => {
 if (cv_checkerboard.style.display === 'none') {
   cv_checkerboard.style.display = 'block';
 } else {
   cv_checkerboard.style.display = 'none';
 }
 
};


