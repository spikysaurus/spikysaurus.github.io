const board=document.getElementById("board");

let selectedBox=null,isPanning=false,isZooming=false,psx=0,psy=0,iox=0,ioy=0,zid=null,zsy=0,iz=1,pvx=0,pvy=0;
const viewState={offsetX:0,offsetY:0,zoom:1};
function updateView(){board.style.transform=`translate(${viewState.offsetX}px,${viewState.offsetY}px) scale(${viewState.zoom})`;board.style.transformOrigin="0 0";}

// --- Single board resize handle (bottom-right) ---
const handle=document.getElementById("board-resize");
let resizing=false,startX=0,startY=0,startW=0,startH=0;
handle.addEventListener("pointerdown",e=>{
  e.stopPropagation();
  resizing=true;
  startX=e.clientX;startY=e.clientY;
  startW=board.offsetWidth;startH=board.offsetHeight;
  document.body.classList.add("noselect");
});


const toggleBtn = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

// Toggle menu when button is clicked
toggleBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent the click from bubbling to document
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (menu.style.display === "block" && !menu.contains(e.target) && e.target !== toggleBtn) {
    menu.style.display = "none";
  }
});



document.addEventListener("pointermove",e=>{
  if(resizing){
    const dx=e.clientX-startX,dy=e.clientY-startY;
    const newW=Math.max(startW+dx,100);
    const newH=Math.max(startH+dy,100);
    board.style.width=newW+"px";
    board.style.height=newH+"px";
    // --- auto update inputs ---
    document.getElementById("boardWidth").value=newW;
    document.getElementById("boardHeight").value=newH;
  }
});

document.addEventListener("pointerup",()=>{
  resizing=false;
  document.body.classList.remove("noselect");
});

// --- Drag & drop images ---
board.addEventListener("dragover",e=>e.preventDefault());
board.addEventListener("drop",e=>{
  e.preventDefault();[...e.dataTransfer.files].forEach(f=>{
    if(f.type.startsWith("image/")){const r=new FileReader();r.onload=ev=>createImageBox(ev.target.result,e.clientX,e.clientY);r.readAsDataURL(f);}
  });
});

function createImageBox(src, x, y) {
  const box = document.createElement("div");
  box.className = "image-box";

  const img = document.createElement("img");
  img.src = src;
  img.style.width = "500px";
  box.appendChild(img);

  const resize = document.createElement("div");
  resize.className = "resize-handle";
  box.appendChild(resize);

  const rotate = document.createElement("div");
  rotate.className = "rotate-handle";
  box.appendChild(rotate);

  board.appendChild(box);

  // --- Unified state ---
  const state = { posX:0, posY:0, angle:0, scaleX:1, scaleY:1, width:350 };
  box._state = state;

  // --- Unified update function ---
  box._update = function () {
    box.style.transform =
      `translate(${state.posX}px,${state.posY}px) ` +
      `rotate(${state.angle}rad) ` +
      `scale(${state.scaleX},${state.scaleY})`;
    img.style.width = state.width + "px";
  };
  box._update();

  // --- Selection ---
  box.addEventListener("click", e => {
    e.stopPropagation();
    if (selectedBox) selectedBox.classList.remove("selected");
    selectedBox = box;
    box.classList.add("selected");
  });

  // --- Resize logic ---
  let isResizing = false, startX = 0, startW = 0;
  resize.addEventListener("pointerdown", e => {
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startW = state.width;
    document.body.classList.add("noselect");
  });

  // --- Rotate logic ---
  let isRot = false, startA = 0, initA = 0;
  rotate.addEventListener("pointerdown", e => {
    e.stopPropagation();
    isRot = true;
    document.body.classList.add("noselect");
    const r = box.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    startA = Math.atan2(e.clientY - cy, e.clientX - cx);
    initA = state.angle;
  });

  // --- Drag logic ---
  let down = false, sx = 0, sy = 0, ix = 0, iy = 0;
  box.addEventListener("pointerdown", e => {
    const t = e.target;
    if (t.classList.contains("resize-handle") || t.classList.contains("rotate-handle")) return;
    if (selectedBox) selectedBox.classList.remove("selected");
    selectedBox = box;
    box.classList.add("selected");
    down = true;
    sx = e.clientX;
    sy = e.clientY;
    ix = state.posX;
    iy = state.posY;
  });

  const gridSize = 20;
  const onMove = e => {
    if (isPanning || isZooming) return;
    if (isResizing) {
      let w = startW + (e.clientX - startX);
      if (w > 20) {
        w = Math.round(w / gridSize) * gridSize;
        state.width = w;
        box._update();
      }
    }
    if (isRot) {
      const r = box.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const a = Math.atan2(e.clientY - cy, e.clientX - cx);
      state.angle = initA + (a - startA);
      box._update();
    }
    if (down) {
      let nx = ix + (e.clientX - sx);
      let ny = iy + (e.clientY - sy);
      nx = Math.round(nx / gridSize) * gridSize;
      ny = Math.round(ny / gridSize) * gridSize;
      state.posX = nx;
      state.posY = ny;
      box._update();
    }
  };
  const onUp = () => {
    isResizing = false;
    isRot = false;
    down = false;
    document.body.classList.remove("noselect");
  };
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);

  return box;
}


mirrorH.addEventListener("click", () => {
  if (!selectedBox) return;
  const state = selectedBox._state;
  state.scaleX *= -1;
  selectedBox._update();
});

mirrorV.addEventListener("click", () => {
  if (!selectedBox) return;
  const state = selectedBox._state;
  state.scaleY *= -1;
  selectedBox._update();
});


// --- Pan + zoom ---
function toLocal(x,y){const r=board.getBoundingClientRect();return{x:(x-r.left-viewState.offsetX)/viewState.zoom,y:(y-r.top-viewState.offsetY)/viewState.zoom};}
document.addEventListener("pointerdown",e=>{
  if(e.button!==0||!e.altKey)return;
  if(e.shiftKey){isPanning=true;psx=e.clientX;psy=e.clientY;iox=viewState.offsetX;ioy=viewState.offsetY;e.target.setPointerCapture?.(e.pointerId);}
  else if(e.ctrlKey){isZooming=true;zid=e.pointerId;zsy=e.clientY;iz=viewState.zoom;const p=toLocal(e.clientX,e.clientY);pvx=p.x;pvy=p.y;iox=viewState.offsetX;ioy=viewState.offsetY;e.target.setPointerCapture?.(e.pointerId);}
});
document.addEventListener("pointermove",e=>{
  if(isPanning){viewState.offsetX=iox+(e.clientX-psx);viewState.offsetY=ioy+(e.clientY-psy);updateView();}
  if(isZooming&&e.pointerId===zid){const dy=e.clientY-zsy;let nz=iz*Math.exp(-0.003*dy);nz=Math.min(Math.max(nz,0.1),12);viewState.offsetX=iox-(pvx*(nz-iz));viewState.offsetY=ioy-(pvy*(nz-iz));viewState.zoom=nz;updateView();}
});
document.addEventListener("pointerup",e=>{isPanning=false;if(isZooming&&e.pointerId===zid){isZooming=false;zid=null;}});

// --- Deselect ---
board.addEventListener("click",e=>{if(e.target===board&&selectedBox){selectedBox.classList.remove("selected");selectedBox=null;}});

// SAVE PNG
document.getElementById("saveBoard").addEventListener("click",()=>{
  // Hide all handles
  const css = document.querySelectorAll(".resize-handle,.rotate-handle,#board-resize")
  css.forEach(el=>{
    el.style.display="none";
  });

  html2canvas(board).then(canvas=>{
    // Restore handles
    css.forEach(el=>{
      el.style.display="";
    });

    // Trigger download
    const link=document.createElement("a");
    link.download="board.png";
    link.href=canvas.toDataURL("image/png");
    link.click();
  });
});

["boardWidth","boardHeight"].forEach(id=>{
  document.getElementById(id).addEventListener("input",()=>{
    const w=parseInt(document.getElementById("boardWidth").value,10);
    const h=parseInt(document.getElementById("boardHeight").value,10);
    if(w>=100) board.style.width=w+"px";
    if(h>=100) board.style.height=h+"px";
  });
});

// --- Helper: normalize image src to base64 ---
async function getImageBase64(img) {
  if (img.src.startsWith("data:")) {
    // Already base64
    return img.src.split(",")[1];
  } else {
    // Blob/Object URL → fetch and convert
    const response = await fetch(img.src);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(",")[1]); // strip "data:image/...;base64,"
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// --- SAVE ZIP ---
document.getElementById("saveZip").addEventListener("pointerdown", async () => {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");

  const data = {
    board: {
      width: board.offsetWidth,
      height: board.offsetHeight
    },
    images: []
  };

  const boxes = board.querySelectorAll(".image-box");
  let idx = 0;
  for (const box of boxes) {
    const img = box.querySelector("img");
    const tr = box.style.transform;
    const filename = `img${idx}.png`;

    // Extract state directly from your tracked properties
    const state = {
      filename,
      posX: parseFloat(tr.match(/translate\((.*?)px/)[1]) || 0,
      posY: parseFloat(tr.match(/translate.*?,(.*?)px/)[1]) || 0,
      angle: parseFloat(tr.match(/rotate\((.*?)rad/)[1]) || 0,
      scaleX: img._scaleX ?? 1,
      scaleY: img._scaleY ?? 1,
      width: parseInt(img.style.width, 10)
    };

    data.images.push(state);

    // FIX: normalize src to base64
    const base64 = await getImageBase64(img);
    imagesFolder.file(filename, base64, { base64: true });

    idx++;
  }

  // Add JSON
  zip.file("project.json", JSON.stringify(data, null, 2));

  // Generate zip
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "WebRef.zip");
});

// --- LOAD ZIP ---
document.getElementById("loadZip").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const zip = await JSZip.loadAsync(file);
  const jsonText = await zip.file("project.json").async("string");
  const data = JSON.parse(jsonText);

  // Reset board
board.querySelectorAll(".image-box").forEach(el => el.remove());
  board.style.width = data.board.width + "px";
  board.style.height = data.board.height + "px";

  for (const saved of data.images) {
    // Load image blob from zip
    const imgBlob = await zip.file("images/" + saved.filename).async("blob");
    const src = URL.createObjectURL(imgBlob);

    // Create new box
    const box = createImageBox(src, saved.posX, saved.posY);

    // Restore state directly
    const st = box._state;
    st.posX   = saved.posX;
    st.posY   = saved.posY;
    st.angle  = saved.angle;
    st.scaleX = saved.scaleX;
    st.scaleY = saved.scaleY;
    st.width  = saved.width;

    // Apply restored state
    box._update();
  }
});

// --- Delete button ---
const deleteBtn = document.getElementById("deleteImage");
deleteBtn.addEventListener("click", () => {
  if (selectedBox) {
    board.removeChild(selectedBox);
    selectedBox = null;
  }
});

// --- Delete keyboard shortcut (Del key) ---
document.addEventListener("keydown", e => {
  if (e.key === "Delete" && selectedBox) {
    board.removeChild(selectedBox);
    selectedBox = null;
  }
});

// Pan overlay drag
let panDragging = false, panStartX = 0, panStartY = 0, panInitX = 0, panInitY = 0;
const panOverlay = document.getElementById("panOverlay");

panOverlay.addEventListener("pointerdown", e => {
  panDragging = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panInitX = viewState.offsetX;
  panInitY = viewState.offsetY;
  panOverlay.setPointerCapture(e.pointerId);
});

panOverlay.addEventListener("pointermove", e => {
  if (!panDragging) return;
  viewState.offsetX = panInitX + (e.clientX - panStartX);
  viewState.offsetY = panInitY + (e.clientY - panStartY);
  updateView();
});

panOverlay.addEventListener("pointerup", e => {
  panDragging = false;
  panOverlay.releasePointerCapture(e.pointerId);
});

// Zoom overlay drag
let zoomDragging = false, zoomStartY = 0, zoomInit = 1;
const zoomOverlay = document.getElementById("zoomOverlay");

zoomOverlay.addEventListener("pointerdown", e => {
  zoomDragging = true;
  zoomStartY = e.clientY;
  zoomInit = viewState.zoom;
  zoomOverlay.setPointerCapture(e.pointerId);
});

zoomOverlay.addEventListener("pointermove", e => {
  if (!zoomDragging) return;
  const dy = e.clientY - zoomStartY;
  let nz = zoomInit * Math.exp(-0.003 * dy);
  nz = Math.min(Math.max(nz, 0.1), 12);
  viewState.zoom = nz;
  updateView();
});

zoomOverlay.addEventListener("pointerup", e => {
  zoomDragging = false;
  zoomOverlay.releasePointerCapture(e.pointerId);
});

const navButton = document.getElementById("navButton");
const navOverlays = document.getElementById("navOverlays");

// Show overlays while holding button
navButton.addEventListener("pointerdown", () => {
  navOverlays.style.display = "flex";
});

// Hide overlays when released
navButton.addEventListener("pointerup", () => {
  navOverlays.style.display = "none";
});

// Also hide if pointer leaves button while pressed
navButton.addEventListener("pointerleave", () => {
  navOverlays.style.display = "none";
});

//fit zoom onload
window.addEventListener("load", () => {
  fitBoardToView();
});

function fitBoardToView() {
  const boardRect = board.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // ratio of viewport to board
  const scaleX = viewportW / boardRect.width;
  const scaleY = viewportH / boardRect.height;

  // choose the smaller so board fits entirely
  let fitZoom = Math.min(scaleX, scaleY);

  // add offset: zoom out a bit (e.g. 90%)
  fitZoom *= 1;  // adjust factor (0.85–0.95) to taste

  viewState.zoom = fitZoom;

  // center the board
  viewState.offsetX = (viewportW - boardRect.width * fitZoom) / 2;
  viewState.offsetY = (viewportH - boardRect.height * fitZoom) / 2;

  updateView();
}

document.getElementById("importImages").addEventListener("change", (e) => {
  const files = e.target.files;
  if (!files.length) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Create image box at default position
      createImageBox(ev.target.result, 50, 50);
    };
    reader.readAsDataURL(file);
  });
});




