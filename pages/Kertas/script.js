

const bg = document.getElementById('bg'),
    bgx = bg.getContext('2d')
const dr = document.getElementById('draw'),
    drx = dr.getContext('2d')
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
function resize(w, h) {
    bg.width = w;
    bg.height = h;
    dr.width = w;
    dr.height = h;
    overlay.width = w;
    overlay.height = h
    stack.style.width = w + 'px';
    stack.style.height = h + 'px'
}

function init() {
    drx.clearRect(0, 0, dr.width, dr.height);
    frames.push(dr.toDataURL());
    cur = frames.length - 1;
    render()
}

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

function circ(x, y, s, c, a) {
    drx.globalAlpha = a;
    drx.globalCompositeOperation = eras ? 'destination-out' : 'source-over';
    drx.fillStyle = eras ? 'rgba(0,0,0,1)' : c;
    drx.beginPath();
    drx.arc(x, y, s / 2, 0, Math.PI * 2);
    drx.fill();
    drx.globalAlpha = 1
}

function line(x0, y0, x1, y1, s, c, a) {
    const dx = x1 - x0,
        dy = y1 - y0,
        d = Math.hypot(dx, dy),
        st = Math.ceil(d / (s / 2));
    for (let i = 0; i <= st; i++) {
        const t = i / st;
        circ(x0 + dx * t, y0 + dy * t, s, c, a)
    }
}
//dr.addEventListener("pointermove", e => {
//    if (pan) return;
//    if (drawing) {
//        const { x, y } = getCanvasCoords(e, dr);
//        line(lx, ly, x, y, parseInt(sz.value), col.value, parseFloat(op.value));
//        lx = x;
//        ly = y;
//    }
//});


dr.onpointermove = e => {
    if (pan) return;
    if (drawing) {
        const { x, y } = getCanvasCoords(e, dr);
        line(lx, ly, x, y, parseInt(sz.value), col.value, parseFloat(op.value));
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
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        sd = Math.hypot(dx, dy)
    }
    if (e.touches.length === 3) {
        panStartX = e.touches[0].clientX - targetPx
        panStartY = e.touches[0].clientY - targetPy
    }
}, {
    passive: true
})
document.addEventListener('pointermove', e => {
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const nd = Math.hypot(dx, dy)
        const f = nd / sd
        targetSc = Math.min(Math.max(targetSc * f, 0.5), 3)
        sd = nd
    }
    if (e.touches.length === 3) {
        targetPx = e.touches[0].clientX - panStartX
        targetPy = e.touches[0].clientY - panStartY
    }
}, {
    passive: true
})
zoomIn.onclick = () => {
 targetSc *= 1.1
//    targetSc = Math.min(targetSc * 1.1, 3)
//    targetSc = Math.max(targetSc * 1.1, 0.0001);// prevent collapse to 0
}
zoomOut.onclick = () => {
 targetSc *= 0.9
//    targetSc = Math.max(targetSc * 0.9, 0.5)
//    targetSc = Math.max(targetSc * 0.9, 0.0001);// prevent collapse to 0
}
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

let selecting = false,
    selStartX, selStartY, selEndX, selEndY;
let clipboard = null;
const selectBtn = document.getElementById('select');
selectBtn.onclick = () => {
    selecting = !selecting;
    if (selecting) {
        selectBtn.style.backgroundColor = "lightblue";
    } else {
        selectBtn.style.backgroundColor = "";
        ox.clearRect(0, 0, overlay.width, overlay.height);
    }
    selectBtn.classList.toggle('activePan', selecting);
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
dr.addEventListener("pointerdown", e => {
    if (e.pointerType === "pen" || e.pointerType === "touch" || e.pointerType === "mouse") {
        drawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }
});
dr.addEventListener("pointermove", e => {
    if (!drawing) return;
    if (e.pointerType === "pen" || e.pointerType === "touch" || e.pointerType === "mouse") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        lastX = e.offsetX;
        lastY = e.offsetY;
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

//dr.addEventListener('pointermove', e => {
//    if (selecting && e.pressure > 0) { // pressure>0 means pointer is down
//        const { x, y } = getCanvasCoords(e, dr);
//        selEndX = x;
//        selEndY = y;
//        ox.clearRect(0, 0, overlay.width, overlay.height);
//        ox.strokeStyle = 'rgba(0,255,0,0.8)';
//        ox.lineWidth = 1;
//        ox.strokeRect(selStartX, selStartY, selEndX - selStartX, selEndY - selStartY);
//    }
//});

//dr.addEventListener('pointerup', e => {
//    if (selecting) {
//        const { x, y } = getCanvasCoords(e, dr);
//        selEndX = x;
//        selEndY = y;
//        ox.clearRect(0, 0, overlay.width, overlay.height);
//    }
//});

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
// Paste clipboard at mouse position
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
brushBtn.onclick = () => {
    eras = !eras;
    brushBtn.textContent = eras ? 'Eraser' : 'Pen'
}
const panBtn = document.getElementById('pan')
panBtn.onclick = () => {
    pan = !pan;
    if (pan) {
        panBtn.style.backgroundColor = "lightblue";
    } else {
        panBtn.style.backgroundColor = "";
    }
    panBtn.classList.toggle('activePan', pan)
}

//Color Buttons
//document.getElementById("black").onclick=()=>{col.value="#000000"},
//document.getElementById("white").onclick=()=>{col.value="#ffffff"},
//document.getElementById("red").onclick=()=>{col.value="#ff0000"},
//document.getElementById("green").onclick=()=>{col.value="#00ff00"},
//document.getElementById("blue").onclick=()=>{col.value="#0000ff"};
//document.getElementById('clr').onclick = () => {
//    const confirmClear = confirm("Clear the canvas?");
//    if (confirmClear) {
//        drx.clearRect(0, 0, dr.width, dr.height);
//        frames[cur] = dr.toDataURL();
//        render();
//    }
//};

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

//Add Frame
function add() {
    drx.clearRect(0, 0, dr.width, dr.height);
    frames.push(dr.toDataURL());
    cur = frames.length - 1;
    render()
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
    link.download = "keyframes.json"
    link.href = URL.createObjectURL(blob)
    link.click()
}
//ImportJSON
document.getElementById('import').onclick = () => {
    const input = document.createElement('input')
    input.type = "file"
    input.accept = "application/json"
    input.onchange = e => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            try {
                const obj = JSON.parse(reader.result)
                if (obj.background) {
                    document.getElementById('url').value = obj.background
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.src = obj.background
                    img.onload = () => {
                        resize(img.width, img.height)
                        bgx.clearRect(0, 0, bg.width, bg.height)
                        bgx.drawImage(img, 0, 0)
                        drx.clearRect(0, 0, dr.width, dr.height)
                    }
                    
                    
                }
                if (obj.frames) {
                    frames.length = 0
                    obj.frames.forEach(f => frames.push(f.url))
                    cur = 0
                    show(cur)
                    render()
                }
                
            } catch (err) {
                console.error("Invalid JSON", err)
            }
        }
        reader.readAsText(file)
        
    }
    input.click()
}
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
resize(640, 360);
init()

