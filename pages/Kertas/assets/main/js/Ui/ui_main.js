

let isOverWindow = false;

const viewport = document.getElementById('viewport');
    const areas = document.querySelectorAll('.snap-area');
    let isCtrl = false;
    let topZ = 100;

    window.addEventListener('keydown', (e) => { if(e.key === 'Shift') { isCtrl = true; document.body.classList.add('ctrl-down'); } });
    window.addEventListener('keyup', (e) => { if(e.key === 'Shift') { isCtrl = false; document.body.classList.remove('ctrl-down'); } });

const areaTop = document.getElementById('a-top');
const areaBottom = document.getElementById('a-bottom');
const areaLeft = document.getElementById('a-left');
const areaRight = document.getElementById('a-right');

    // Add 'content' as a parameter with a default fallback
function createWindow(title, targetArea = null, content = null, showResizer = true, isDockable = true) {
    const win = document.createElement('div');
    win.className = 'window-panel';
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

    if (targetArea && isDockable) { dockWindow(win, targetArea); } 
    else { win.style.left = '100px'; win.style.top = '100px'; viewport.appendChild(win); }
    
    
			// Prevent drawing when mouse enters the window
			win.addEventListener('mouseenter', () => {
				isOverWindow = true;
				isDrawing = false; 
			});

			// Allow drawing again when mouse leaves
			win.addEventListener('mouseleave', () => {
				isOverWindow = false;
			});

			// Ensure clicking the window doesn't trigger a draw start
			win.addEventListener('mousedown', (e) => {
				isDrawing = false;
				// Optional: stop propagation so the viewport doesn't see the click
				e.stopPropagation(); 
			});
	
    return win;
}


    function dockWindow(win, area) {
        area.appendChild(win);
        win.classList.add('is-docked');
        refreshTabs(area);
    }

    function refreshTabs(area) {
        const strip = area.querySelector('.tab-strip');
        if (!strip) return;
        strip.innerHTML = '';
        const dockedWindows = area.querySelectorAll('.window-panel');
        
        dockedWindows.forEach((win, idx) => {
            const tab = document.createElement('div');
            tab.className = 'tab-item' + (win.classList.contains('active-content') || (idx === dockedWindows.length - 1 && !area.querySelector('.active-content')) ? ' active' : '');
            tab.innerHTML = `<span>${win.dataset.title}</span>`;
            
            tab.onclick = () => {
                area.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                area.querySelectorAll('.window-panel').forEach(w => w.classList.remove('active-content'));
                tab.classList.add('active');
                win.classList.add('active-content');
            };

            tab.onmousedown = (e) => {
				tab.click();
				if (isCtrl) {
						win._startDrag(e); 
					}
				};

            strip.appendChild(tab);
            if (tab.classList.contains('active')) win.classList.add('active-content');
            else win.classList.remove('active-content');
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
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        };
        win.querySelector('.title-bar').onmousedown = handleMove;
        win._startDrag = handleMove;
    }

function setupFloatingResize(win) {
    const resizer = win.querySelector('.win-resizer');
    resizer.onmousedown = (e) => {
		if (win.classList.contains('hide-resizer')) return;

        e.stopPropagation();
        const startW = win.offsetWidth, startH = win.offsetHeight, startX = e.clientX, startY = e.clientY;
        const onMove = (mE) => {
            // Limits removed: width and height now follow the mouse exactly
            win.style.width = (startW + (mE.clientX - startX)) + 'px';
            win.style.height = (startH + (mE.clientY - startY)) + 'px';
        };
        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
}

    document.querySelectorAll('.resizer').forEach(r => {
        r.onmousedown = (e) => {
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
            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
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

    createWindow("Xsheet Stuff", areaTop, 
    `
    <div class="flex-wrap-row">
    
		
		<button id="loadXDTSbtn">Load Xsheet</button>
		<button id="newTimesheetBtn">New Xsheet</button>
		<button id="exportBtn" style="display:none">Save Xsheet</button>

		<button id="addTrackBtn">Add Track</button>
		<button id="removeTrackBtn">Remove Track</button>
		<button id="autoRenameBtn">Auto-Rename Tracks</button>

		<button id="reorderLeftBtn">Reorder Track to Left</button>
		<button id="reorderRightBtn">Reorder Track to Right</button>
		
		<label for="adjustDuration">Adjust Duration</label>
		<input style="width:32px;text-align:center;" type="number" id="adjustDuration" value="1" min="1">
		<button id="increaseDurationBtn">Increase</button>
		<button id="decreaseDurationBtn">Decrease</button>
		<label>Time (<b id="durationLabel">0+0 | 00</b>)</label>
	</div>
    `);

createWindow("Xsheet Symbols", areaTop, 
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


createWindow("Assets Stuff", areaTop, 
`	<div class="flex-wrap-row">
		<button id="loadAssetsBtn">Load Assets</button>
		<button id="saveAssetsBtn">Save Assets</button>
		<input type="file" id="assetsInput" accept=".zip" style="display:none">
		<button id="loadBackdropBtn">Import Backdrop</button>
		<input type="file" id="backdropInput" accept="image/*" style="display:none">
						 
						 
		<button id="newLevelBtn">Add Level</button>
		<button id="deleteLevelBtn">Delete Level</button>
		<button id="arrangeLevelsBtn">Arrange Levels</button>

		<button id="newDrawingBtn"><span class="bl-icons-image"></span> Add Drawing</button>
		<button id="deleteDrawingBtn"><span class="bl-icons-trash"></span> Delete Drawing</button>

		<button id="prevDrawingBtn"><span class="bl-icons-frame_prev"></span> Prev Drawing</button>
		<button id="nextDrawingBtn"><span class="bl-icons-frame_next"></span> Next Drawing</button>
	</div>
`);


createWindow("Xsheet", areaLeft, 
    `
    <div id="tableContainer"></div>
    `);
    
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
`);
    
createWindow("Assets", areaRight, 
`
	<div id="levelsTree"></div>
`);

createWindow("Properties", areaRight, 
`	<div class="flex-wrap-column">
	<label for="newDuration">Default Xsheet Frame Duration</label>
	<input type="number" id="newDuration" min="1" value="24">
	<input type="file" id="fileInput" accept=".xdts,.json,.txt" style="display:none">

	<label for="canvasWidth">Canvas Width</label>
	<input type="number" id="canvasWidthInput" value="1280" min="1">

	<label for="canvasHeight">Canvas Height</label>
	<input type="number" id="canvasHeightInput" value="720" min="1">

	<button id="canvasResizeBtn">Resize Canvas</button>
	<button id="canvasRefreshBtn">Refresh Values</button>
	
	<label for="shiftAmount">Shift Amount</label>
	<input type="number" id="shiftAmount" value="10">
    <button onclick="shiftAllDrawings(0, -document.getElementById('shiftAmount').value)">Shift Drawings Up</button>
    <button onclick="shiftAllDrawings(0, document.getElementById('shiftAmount').value)">Shift Drawings Down</button>
    <button onclick="shiftAllDrawings(-document.getElementById('shiftAmount').value, 0)">Shift Drawings Left</button>
    <button onclick="shiftAllDrawings(document.getElementById('shiftAmount').value, 0)">Shift Drawings Right</button>
    
	</div>
	
    


`);



createWindow("Debug and Shortcuts (F1)", areaBottom, 
	`<div class="flex-wrap-column">
		<!--<li>Toggle to Show/Hide This Bottom Area (F1)</li>-->
		<li style="color:yellow;">Brush Size (Bracket) : <span id="brushSizeLabel"></span></li>
		<li style="color:yellow;">Eraser Size (Ctrl+Bracket) : <span id="eraserSizeLabel"></span></li>
		<li style="color:yellow;">Brush Aliasing (A) : <span id="aliasingLabel"></span></li>
		<li style="color:yellow;">Draw Behind (B) : <span id="drawBehindLabel"></span></li>
		<li style="color:yellow;">Pixelated Canvas (Shift+R) : <span id="imageRenderingLabel"></span></li>
		<li>Swap Colors (g)</li>
		<li>FlipH (/)</li>
		<li>FlipV (Shift+/)</li>
		<li>Reset View (0)</li>
		<li>Backdrop Opacity (Shift+Bracket)</li>
		<li>Reset Backdrop Opacity (\\)</li>
		<li>Backdrop Opacity to Zero (Shift+\\)</li>
		<li>Speedlines (shift+o)</li>
		<li>Ctrl+LMB on the cell to edit their values</li>
		<li>Ctrl+LMB on the level name to edit their name</li>
		<li>Jump to next/prev keyframe (Alt+1 / Alt+2)</li>
		<li>Next/prev frame (Arrow Right / Arrow Left)</li>
		<li>Play/Stop Animation (P) (Cached)(Only 24 Fps for now)</li>
		<li>Play/Pause Aniamtion (L) (Not Cached)</li>
		<li style="color:yellow;" id="activeTrackLabel">No active Track</li>
		<li style="color:yellow;" id="activeCelLabel">No active Cel</li>
		<li style="color:yellow;" id="activeLevelLabel">No active Level</li>
		<li style="color:yellow;" id="activeDrawingLabel">No active Drawing</li>

	</div
    `);

createWindow("Render & Export", areaTop, 
    `
    <div class="flex-wrap-row">
		<button id="flipbookBtn"><span class="bl-icons-play"></span> Flipbook</button>
		<label> <input type="checkbox" id="includeBackdrop" checked> Include backdrop </label>
   </div>
    `);
    
    
    updateLayoutStates();

