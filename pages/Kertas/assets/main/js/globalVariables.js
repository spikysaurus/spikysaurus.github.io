
//OVERLAYS
const cameraOverlay = document.getElementById('cameraOverlay')
const cameraOverlayCtx = cameraOverlay.getContext('2d');

const lassoFillOverlay = document.getElementById("lassoFillOverlay");
const lassoFillOverlayCtx = lassoFillOverlay.getContext("2d");

const lassoSelectOverlay = document.getElementById("lassoSelectOverlay");
const lassoSelectOverlayCtx = lassoSelectOverlay.getContext('2d');

const rectOverlay = document.getElementById("rectOverlay");
const rectOverlayCtx = rectOverlay.getContext('2d');

//TOOLS
let activeTool = "ToolBrush"; 
let previousTool = "ToolBrush";
let isDrawing = false;
let isDragging = false; 
let brush_size = 1;
let eraser_size = 15;
let brush_opacity = 1;
let brush_aliasing = true;
let drawBehind; 


