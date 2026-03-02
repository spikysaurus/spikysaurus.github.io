

let isOverWindow = false;

const viewport = document.getElementById('viewport');
    const areas = document.querySelectorAll('.snap-area');
    let isCtrl = false;
    let topZ = 100;

    window.addEventListener('keydown', (e) => { if(e.key === 'Shift') { isCtrl = true; document.body.classList.add('ctrl-down'); } });
    window.addEventListener('keyup', (e) => { if(e.key === 'Shift') { isCtrl = false; document.body.classList.remove('ctrl-down'); } });

const areaTop = document.getElementById('a-top');
const areaLeft = document.getElementById('a-left');
const areaRight = document.getElementById('a-right');

const areaBottom = document.getElementById('a-bottom');

    // Add 'content' as a parameter with a default fallback
function createWindow(title, targetArea = null, content = null, showResizer = true, isDockable = true, customClass = '',makeActive = true) {
    const win = document.createElement('div');
    win.className = 'window-panel';
    
    if (customClass) {
        win.classList.add(customClass);
    }
    
    win.dataset.title = title;
    win.dataset.dockable = isDockable; 
    
     // Apply the class if showResizer is false
    if (!showResizer) {
        win.classList.add('hide-resizer');
    }
    
    // Use custom content if provided, otherwise use the default template
    const bodyContent = content || `Content for ${title}.<br><br><b>Docked:</b> Drag tab to move.<br><b>Floating:</b> Drag title bar or resize bottom-right corner.`;

    win.innerHTML = `
        <div class="title-bar"><span>${title}</span></div>
        <div class="content">${bodyContent}</div>
        <div class="win-resizer"></div>
    `;
    
    setupDragging(win);
    setupFloatingResize(win);
	
	if (makeActive) {
        win.classList.add('active-content');
    }
    
    if (targetArea && isDockable) { dockWindow(win, targetArea); } 
    else { win.style.left = '100px'; win.style.top = '100px'; viewport.appendChild(win); }
    
    
			// Prevent drawing when mouse enters the window
			win.addEventListener('pointerenter', () => {
				isOverWindow = true;
				isDrawing = false; 
			});

			// Allow drawing again when mouse leaves
			win.addEventListener('pointerleave', () => {
				isOverWindow = false;
			});

			// Ensure clicking the window doesn't trigger a draw start
			win.addEventListener('pointerdown', (e) => {
				isDrawing = false;
				// Optional: stop propagation so the viewport doesn't see the click
				e.stopPropagation(); 
			});
	
    return win;
}


    function dockWindow(win, area) {
		 if (win.classList.contains('active-content')) {
			area.querySelectorAll('.window-panel').forEach(w => 
				w.classList.remove('active-content')
			);
		}
		
        area.appendChild(win);
        win.classList.add('is-docked');
        refreshTabs(area);
    }

   function refreshTabs(area) {
    const strip = area.querySelector('.tab-strip');
    if (!strip) return;
    strip.innerHTML = '';
    
    const dockedWindows = area.querySelectorAll('.window-panel');
    
    // 1. Identify which window SHOULD be active
    // Priority: Existing 'active-content' class > OR the very last window in the list
    let activeWin = area.querySelector('.active-content');
    if (!activeWin && dockedWindows.length > 0) {
        activeWin = dockedWindows[dockedWindows.length - 1];
    }

    dockedWindows.forEach((win) => {
        const tab = document.createElement('div');
        const isThisActive = (win === activeWin);
        
        tab.className = 'tab-item' + (isThisActive ? ' active' : '');
        tab.innerHTML = `<span>${win.dataset.title}</span>`;
        
        tab.onclick = () => {
            // Remove active status from all tabs/windows in this area
            area.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            area.querySelectorAll('.window-panel').forEach(w => w.classList.remove('active-content'));
            
            // Apply to clicked
            tab.classList.add('active');
            win.classList.add('active-content');
        };

        tab.onpointerdown = (e) => {
            tab.click();
            if (isCtrl) win._startDrag(e);
        };

        strip.appendChild(tab);

        // 2. FORCE the content visibility to match the tab state immediately
        if (isThisActive) {
            win.classList.add('active-content');
        } else {
            win.classList.remove('active-content');
        }
    });
}


    function setupDragging(win) {
        const handleMove = (e) => {
            let offsetX = 175, offsetY = 15;
            if (!win.classList.contains('is-docked')) {
                let rect = win.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            }

            win.style.zIndex = ++topZ;
            document.body.classList.add('is-interacting');

            const onMove = (mE) => {
                if (win.classList.contains('is-docked')) {
                    const oldArea = win.parentElement;
                    win.classList.remove('is-docked', 'active-content');
                    viewport.appendChild(win);
                    win.style.width = '350px'; win.style.height = '250px';
                    refreshTabs(oldArea);
                    updateLayoutStates();
                }
                win.style.left = (mE.clientX - offsetX) + 'px';
                win.style.top = (mE.clientY - offsetY) + 'px';
                
                areas.forEach(a => a.classList.remove('hover-active'));
                if (isCtrl && win.dataset.dockable === "true") {
                    win.style.pointerEvents = 'none';
                    const target = document.elementFromPoint(mE.clientX, mE.clientY)?.closest('.snap-area');
                    win.style.pointerEvents = 'auto';
                    if (target && target.id !== 'a-center') target.classList.add('hover-active');
                }
            };

            const onUp = (uE) => {
                document.body.classList.remove('is-interacting');
                 if (isCtrl && win.dataset.dockable === "true") {
                    win.style.pointerEvents = 'none';
                    const target = document.elementFromPoint(uE.clientX, uE.clientY)?.closest('.snap-area');
                    win.style.pointerEvents = 'auto';
                    if (target && target.id !== 'a-center') dockWindow(win, target);
                }
                areas.forEach(a => a.classList.remove('hover-active'));
                updateLayoutStates();
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        };
        win.querySelector('.title-bar').onpointerdown = handleMove;
        win._startDrag = handleMove;
    }

function setupFloatingResize(win) {
    const resizer = win.querySelector('.win-resizer');
    resizer.onpointerdown = (e) => {
		if (win.classList.contains('hide-resizer')) return;

        e.stopPropagation();
        const startW = win.offsetWidth, startH = win.offsetHeight, startX = e.clientX, startY = e.clientY;
        const onMove = (mE) => {
            // Limits removed: width and height now follow the mouse exactly
            win.style.width = (startW + (mE.clientX - startX)) + 'px';
            win.style.height = (startH + (mE.clientY - startY)) + 'px';
        };
        const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointereup', onUp); };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };
}

    document.querySelectorAll('.resizer').forEach(r => {
        r.onpointerdown = (e) => {
            const target = document.getElementById(r.dataset.target), dir = r.dataset.dir;
            const startSize = (dir === 'left' || dir === 'right') ? target.offsetWidth : target.offsetHeight;
            const startPos = (dir === 'left' || dir === 'right') ? e.clientX : e.clientY;
            const onMove = (mE) => {
                const currentPos = (dir === 'left' || dir === 'right') ? mE.clientX : mE.clientY;
                let delta = (dir === 'left' || dir === 'top') ? (startPos - currentPos) : (currentPos - startPos);
                let newSize = Math.max(50, startSize + delta);
                target.style.flex = `0 0 ${newSize}px`;
                target.dataset.last = newSize + 'px';
            };
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        };
    });

    const updateLayoutStates = () => {
        areas.forEach(a => { 
            if(a.id !== 'a-center') {
                const hasChildren = a.querySelectorAll('.window-panel').length > 0;
                a.classList.toggle('collapsed', !hasChildren);
                if (hasChildren) a.style.flex = `0 0 ${a.dataset.last}`;
            }
        });
    };
    
    //~ <button id="toggleOrientationBtn"><span class="bl-icons-gesture_rotate"></span></button>





    createWindow("Xsheet", areaTop, 
    `
    <div class="flex-wrap-row">
    
		
		<button id="loadXDTSbtn">Load</button>
		<button id="newTimesheetBtn">New</button>
		<button id="exportBtn" style="display:none">Save</button>

		<button id="addTrackBtn">Add Track</button>
		<button id="removeTrackBtn">Remove Track</button>
		<button id="autoRenameBtn">Auto-Rename</button>

		<button id="reorderLeftBtn">Reorder Left</button>
		<button id="reorderRightBtn">Reorder Right</button>
		
		<label for="adjustDuration">Adjust Duration</label>
		<input style="width:32px;text-align:center;" type="number" id="adjustDuration" value="1" min="1">
		<button id="increaseDurationBtn">Inc</button>
		<button id="decreaseDurationBtn">Dec</button>
		<label>Time (<b id="durationLabel">0+0 | 00</b>)</label>
	</div>
    `,true,true,'',false);

createWindow("Symbols", areaTop, 
`
	<div class="flex-wrap-row">
	<label>Click to copy : </label>
		<input type="text" id="symNull" value="x" hidden>
		<button onclick="navigator.clipboard.writeText(symNull.value)">Empty (x)</button>

		<input type="text" id="symTick1" value="○" hidden>
		<button onclick="navigator.clipboard.writeText(symTick1.value)">inbetween (○)</button>

		<input type="text" id="symTick2" value="●" hidden>
		<button onclick="navigator.clipboard.writeText(symTick2.value)">Reverse Sheet (●)</button>

		<input type="text" id="symHyphen" value="｜" hidden>
		<button onclick="navigator.clipboard.writeText(symHyphen.value)">Hyphen (｜)</button>
	</div>
`);


createWindow("Assets", areaTop, 
`	<div class="flex-wrap-row">
		<button id="loadAssetsBtn">Load</button>
		<button id="saveAssetsBtn">Save</button>
		<input type="file" id="assetsInput" accept=".zip" style="display:none">
		<button id="loadBackdropBtn">Add Backdrop</button>
		<input type="file" id="backdropInput" accept="image/*" style="display:none">
						 
						 
		<button id="newLevelBtn">Add Level</button>
		<button id="deleteLevelBtn">Delete Level</button>
		<button id="arrangeLevelsBtn">Arrange Levels</button>

		<button id="newDrawingBtn"><span class="bl-icons-image"></span> Add Drawing</button>
		<button id="deleteDrawingBtn"><span class="bl-icons-trash"></span> Delete Drawing</button>

	</div>
`,true,true,'',false);


createWindow("Xsheet", areaLeft, 
    `
    <div id="tableContainer"></div>
    `,true,true,"dropZone",true);
    
createWindow("Info", areaLeft,
`<div class="flex-wrap-column">
	<label for="titleInput">Title</label>
	<input id="titleInput" type="text">

	<label for="sceneInput">Scene</label>
	<input id="sceneInput" type="number">

	<label for="cutInput">Cut</label>
	<input id="cutInput" type="number">

	<label for="nameInput">Name</label>
	<input id="nameInput" type="text">

	<label for="memoInput">Memo</label>
	<textarea id="memoInput">Memo</textarea>
	</div>
`,true,true,'',false);
    
createWindow("Assets", areaRight, 
`
	<div id="levelsTree"></div>
`,true,true,"dropZoneTree",true);

createWindow("Properties", areaRight, 
`	<div class="flex-wrap-column">
	<label for="newDuration">Default Xsheet Frame Duration</label>
	<input type="number" id="newDuration" min="1" value="24">
	<input type="file" id="fileInput" accept=".xdts,.json,.txt" style="display:none">

	<label for="canvasWidth">Canvas Width</label>
	<input type="number" id="canvasWidthInput" value="2340" min="1">

	<label for="canvasHeight">Canvas Height</label>
	<input type="number" id="canvasHeightInput" value="1654" min="1">

	<button id="canvasResizeBtn">Resize Canvas</button>
	<button id="canvasRefreshBtn">Refresh Values</button>
	
	<label for="shiftAmount">Shift Amount</label>
	<input type="number" id="shiftAmount" value="10">
    <button onclick="shiftAllDrawings(0, -document.getElementById('shiftAmount').value)">Shift Drawings Up</button>
    <button onclick="shiftAllDrawings(0, document.getElementById('shiftAmount').value)">Shift Drawings Down</button>
    <button onclick="shiftAllDrawings(-document.getElementById('shiftAmount').value, 0)">Shift Drawings Left</button>
    <button onclick="shiftAllDrawings(document.getElementById('shiftAmount').value, 0)">Shift Drawings Right</button>
    
	</div>
	
    


`,true,true,'',false);

    //~ <button onclick="cameraManager.addKeyframe()" class="ui-btn add-key">
			//~ + Add Keyframe
		//~ </button>
createWindow("Camera", areaTop, 
    `
    <div class="flex-wrap-row">
		<button onclick="cameraManager.loadCameraData()" class="ui-btn load-cam">
			Load
		</button>
		
		<button onclick="cameraManager.saveCameraData()" class="ui-btn save-cam">
			Save
		</button>
		
		<button id="deleteCameraKeyBtn" onclick="cameraFeature.deleteKeyframe()">
		  Delete Key
		</button>
		
   </div>
    `,true,true,"dropZoneCamera",false);    
    
 createWindow("Playback", areaBottom, 
    `
    <div class="flex-wrap-row">
		<button id="playAniCachedBtn"><span class="bl-icons-play"></span>Play/Stop (cached)</button>
		<button id="playAniBtn"><span class="bl-icons-play"></span>Play/Stop</button>
		<button id="prevCelBtn"><span class="bl-icons-prev_keyframe"></span>Prev Cel</button>
		<button id="nextCelBtn"><span class="bl-icons-next_keyframe"></span>Next Cel</button>
		<button id="prevFrameBtn"><span class="bl-icons-tria_left_bar"></span>Prev Frame</button>
		<button id="nextFrameBtn"><span class="bl-icons-tria_right_bar"></span>Next Frame</button>
		<button id="prevDrawingBtn"><span class="bl-icons-frame_prev"></span> Prev Drawing</button>
		<button id="nextDrawingBtn"><span class="bl-icons-frame_next"></span> Next Drawing</button>
   </div>
    `,true,true,'',false);  

createWindow("Render", areaBottom, 
    `
    <div class="flex-wrap-row">
		<button id="flipbookBtn"><span class="bl-icons-play"></span> Flipbook</button>
		<label> <input type="checkbox" id="includeBackdrop" checked> Include backdrop </label>
   </div>
    `,true,true,'',false);
    
 
             
createWindow("Debug", areaLeft, 
	`<div class="flex-wrap-column">
		<!--<li>Toggle to Show/Hide This Bottom Area (F1)</li>-->
		<li style="color:yellow;">Brush Size (Bracket) : <span id="brushSizeLabel"></span></li>
		<li style="color:yellow;">Eraser Size (Ctrl+Bracket) : <span id="eraserSizeLabel"></span></li>
		<li style="color:yellow;">Brush Aliasing (A) : <span id="aliasingLabel"></span></li>
		<li style="color:yellow;">Draw Behind (B) : <span id="drawBehindLabel"></span></li>
		<li style="color:yellow;">Pixelated Canvas (Shift+R) : <span id="imageRenderingLabel"></span></li>
		<li>FlipH (/)</li>
		<li>FlipV (Shift+/)</li>
		<li>Reset View (0)</li>
		<li>Backdrop Opacity (Shift+Bracket)</li>
		<li>Reset Backdrop Opacity (\\)</li>
		<li>Backdrop Opacity to Zero (Shift+\\)</li>
		<li>Speedlines (shift+o)</li>
		<li>Ctrl+LMB/Double Click on the cell to edit their values</li>
		<li>Ctrl+LMB on the level name to edit their name</li>
		<li style="color:yellow;" id="activeTrackLabel">No active Track</li>
		<li style="color:yellow;" id="activeCelLabel">No active Cel</li>
		<li style="color:yellow;" id="activeLevelLabel">No active Level</li>
		<li style="color:yellow;" id="activeDrawingLabel">No active Drawing</li>
		
		<li><b>Ctrl+LMB/Double Click</b> on the Xsheet cell to edit it's values</li>
		<li><b>Alt+LMB</b> to clear it's value</li>
		<li>(Desktop) You can load .xdts/.zip Assets/.json Camera data by dropping the file into their <b>Areas</b></li>
		<li>You can hover over a button to display a tooltip to see its keyboard shortcut</li>
		<li>(Desktop) <b>Hold Shift and Drag</b> tabs to detatch it into a floating window, <b>Hold Shift and Drag</b> the window's title bar into any areas and <b>Release LMB</b> to dock it</li>

	</div
    `,true,true,'',false);
     
updateLayoutStates();
window.isAutoKeyOn = true; 

//~ left: 50%;
//~ transform: translateX(-50%);

  // 2. Setup styles - Absolute positioning over the canvas
  const style = document.createElement('style');
  style.textContent = `
    .nav-container {
  position: absolute;
  bottom: 60px;
  right: 0px;
  display: flex;
  flex-direction: column; /* Stacked vertically */
  gap: 3px;
  background: rgba(26, 26, 26, 0.85);
  padding: 3px;
  border-top-left-radius: 10px; 
  border-bottom-left-radius: 10px; 
  z-index: 10000;
  touch-action: none;
  pointer-events: auto;
}

.nav-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #000;
  color: #999;
  cursor: pointer;
  font-family: 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.15s ease;
  min-width: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn.active {
  background: #4c4c4c;
  color: #fff;
}


    
  `;
  document.head.appendChild(style);

// Check if device is desktop (has a mouse/fine pointer)
const isDesktop = window.matchMedia('(pointer: fine)').matches;

const navItems = [
  { label: 'T', target: areaTop, defaultVisible: true },
  { label: 'L', target: areaLeft, defaultVisible: isDesktop || false },
  { label: 'R', target: areaRight, defaultVisible: isDesktop || false },
  { label: 'B', target: areaBottom, defaultVisible: isDesktop || true }
];

  // 4. Create the container
  const navContainer = document.createElement('div');
  navContainer.className = 'nav-container';

  // 5. Build buttons & initialize visibility
  navItems.forEach(item => {
    const btn = document.createElement('button');
    
    // Set initial display state in DOM
    if (item.target) {
      item.target.style.display = item.defaultVisible ? '' : 'none';
    }

    // Set initial button style
    btn.className = item.defaultVisible ? 'nav-btn active' : 'nav-btn';
    btn.textContent = item.label;

    // Pointer event for toggle
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!item.target) return;

      const isHidden = item.target.style.display === 'none';

      if (isHidden) {
        item.target.style.display = ''; // Show
        btn.classList.add('active');
      } else {
        item.target.style.display = 'none'; // Hide
        btn.classList.remove('active');
      }
    });

    navContainer.appendChild(btn);
  });

  // 6. Append to canvasContainer
  if (canvasContainer) {
    // Ensure canvasContainer is the relative parent for our absolute nav
    if (getComputedStyle(canvasContainer).position === 'static') {
      canvasContainer.style.position = 'relative';
    }
    canvasContainer.appendChild(navContainer);
  } else {
    console.error("canvasContainer not found. Appending to body instead.");
    document.body.appendChild(navContainer);
  }



