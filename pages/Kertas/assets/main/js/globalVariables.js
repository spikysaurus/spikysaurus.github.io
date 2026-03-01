//CANVAS
const container = document.getElementById("canvasContainer");
const canvasWidthInput = document.getElementById('canvasWidthInput');
const canvasHeightInput = document.getElementById('canvasHeightInput');
const CANVAS_WIDTH = 2340;
const CANVAS_HEIGHT = 1654;

const activeCanvas = document.getElementById('canvas');
const activeCanvasCtx = activeCanvas.getContext('2d');
const backdropCanvas = document.getElementById('backdropCanvas');
const backdropCanvasCtx = backdropCanvas.getContext('2d');
const backgroundColorCanvas = document.getElementById('backgroundColorCanvas');
const canvases = document.getElementsByClassName("canvases");

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


