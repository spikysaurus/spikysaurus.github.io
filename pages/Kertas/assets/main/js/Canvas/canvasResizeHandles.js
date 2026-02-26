// 1. CONFIG
const HANDLE_SIZE = 7;
const handles = [];
const corners = [
  { name: 'tl', cursor: 'nwse-resize', x: 0, y: 0 },
  { name: 'tr', cursor: 'nesw-resize', x: 1, y: 0 },
  { name: 'bl', cursor: 'nesw-resize', x: 0, y: 1 },
  { name: 'br', cursor: 'nwse-resize', x: 1, y: 1 }
];

// 2. POSITIONING LOGIC
function updateHandlePositions() {
  const rect = activeCanvas.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  handles.forEach(h => {
    const corner = h.dataset;
    // Calculate exact corner coordinates
    const posX = corner.x == 0 ? rect.left : rect.right;
    const posY = corner.y == 0 ? rect.top : rect.bottom;

    Object.assign(h.style, {
      left: `${posX + scrollX}px`,
      top: `${posY + scrollY}px`,
      display: 'block'
    });
  });
}

// 3. CREATE HANDLES
corners.forEach(c => {
  const handle = document.createElement('div');
  handle.dataset.x = c.x;
  handle.dataset.y = c.y;
  
  Object.assign(handle.style, {
    position: 'absolute',
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    backgroundColor: '#007bff',
    border: '2px solid white',
    borderRadius: '50%',
    zIndex: '0',
    cursor: c.cursor,
    transform: 'translate(-50%, -50%)'
  });

  document.body.appendChild(handle);
  handles.push(handle);

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = activeCanvas.width;
    const startH = activeCanvas.height;

	const onMouseMove = (mE) => {
	  const dx = mE.clientX - startX;
	  const dy = mE.clientY - startY;

	  let newW = startW;
	  let newH = startH;

	  // Anchor opposite corner
	  if (c.name === 'tr') {
		// anchor bottom-left
		newW = startW + dx;
		newH = startH - dy;
	  } else if (c.name === 'tl') {
		// anchor bottom-right
		newW = startW - dx;
		newH = startH - dy;
	  } else if (c.name === 'br') {
		// anchor top-left
		newW = startW + dx;
		newH = startH + dy;
	  } else if (c.name === 'bl') {
		// anchor top-right
		newW = startW - dx;
		newH = startH + dy;
	  }

  // Minimum size
  newW = Math.max(10, newW);
  newH = Math.max(10, newH);

  // Pass anchor name into resizeCanvases
  resizeCanvases(Math.round(newW), Math.round(newH), c.name);

  // Update handles to new corners
  updateHandlePositions();
  canvasRefreshInputValues();
  isDrawing = false;
};


    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);;
    };
    

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    
  });
});


// 4. SYNC EVENTS
updateHandlePositions();
window.addEventListener('resize', updateHandlePositions);
window.addEventListener('scroll', updateHandlePositions);

// Keeps handles attached during any canvas changes
const observer = new MutationObserver(updateHandlePositions);
observer.observe(activeCanvas, { attributes: true, attributeFilter: ['style', 'width', 'height'] });

