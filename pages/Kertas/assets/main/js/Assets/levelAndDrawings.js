
const activeLevelLabel=document.getElementById('activeLevelLabel'),
      activeDrawingLabel=document.getElementById('activeDrawingLabel'),
      levelsTree=document.getElementById('levelsTree');

function setactiveDrawing(c){
  const img=new Image();
  img.onload=()=>{
    activeCanvasCtx.clearRect(0,0,canvas.width,canvas.height);
    activeCanvasCtx.drawImage(img,0,0)
  };
  img.src=c.data;
  activeDrawing=c;
  activeDrawingIndex=levels[activeLevel].indexOf(c);
  activeDrawingLabel.textContent=`Active Drawing: ${c.name.replace(/\.png$/,"")}`;
  canvas.style.cursor="crosshair";
  document.querySelectorAll('.drawing input').forEach(el=>el.classList.remove('active'));
  const list=levelsTree.querySelector(`[data-label="${activeLevel}"] .drawing-list`);
  list.querySelectorAll('.drawing').forEach(div=>{
    const input=div.querySelector('input');
    if(input.value.trim()===c.name.replace(/\.png$/,""))input.classList.add('active');
  });
}

// Separate function for creating the edit button
function editButtonHandler(level, c) {
  document.querySelectorAll('.level-label').forEach(el => el.classList.remove('active'));
  const levelLabelEl = levelsTree.querySelector(`[data-label="${level}"] .level-label`);
  if (levelLabelEl) {
    levelLabelEl.classList.add('active');
    activeLevel = level;
    activeLevelLabel.textContent = `Active Level: ${level}`;
  }
  setactiveDrawing(c);
}

function createEditButton(level, c) {
  const edit = document.createElement('button');
  edit.innerHTML = "<span class='bl-icons-greasepencil'></span>";
  edit.onclick = () => editButtonHandler(level, c);
  return edit;
}


// Updated addDrawingElement function
function addDrawingElement(level, c) {
  const div = document.createElement('div');
  div.className = 'drawing';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = c.name.replace(/\.png$/, "");
  input.onblur = () => {
    c.name = input.value.trim() + ".png";
    autoArrange(level); // This re-sorts and re-adds elements
  };

  // Use your existing edit button logic
  const edit = createEditButton(level, c);

  div.append(input, edit);
  
  // Find the container
  const listContainer = levelsTree.querySelector(`[data-label="${level}"] .drawing-list`);
  if (listContainer) {
    listContainer.appendChild(div);
    // CRITICAL: Ensure the list is visible when a drawing is added
    listContainer.style.display = 'block'; 
  }
}



function autoArrange(level) {
  // Sort the actual data array
  levels[level].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  
  const list = levelsTree.querySelector(`[data-label="${level}"] .drawing-list`);
  if (list) {
    // Save the current visibility state (if it was block, keep it block)
    const wasVisible = list.style.display === 'block';
    
    list.innerHTML = ""; // Clear the UI list
    
    // Re-add all drawings
    levels[level].forEach(c => addDrawingElement(level, c));
    
    // Re-apply visibility
    if (wasVisible) {
      list.style.display = 'block';
    }
  }
}

document.getElementById('newLevelBtn').onclick = () => {
  // 1. Generate the base label (A, B, C...)
  let label = String.fromCharCode(65 + levelCount++);
  
  // 2. Collision Check: If name exists, append "x"
  while (levels.hasOwnProperty(label)) {
    label += "x";
  }

  // 3. Initialize level data structure
  levels[label] = [];
  
  const div = document.createElement('div');
  div.className = 'level';
  div.dataset.label = label;
  
  const toggle = document.createElement('span');
  toggle.className = 'toggle-icon';
  toggle.innerHTML = '<span class="bl-icons-outliner"></span>';

  // 4. Create Span for the label
  const lblSpan = document.createElement('span');
  lblSpan.className = 'level-label';
  lblSpan.textContent = label;
  lblSpan.spellcheck = false;

  // Handle manual renaming (triggered by blur after editing)
  lblSpan.onblur = () => {
    lblSpan.contentEditable = false;
    lblSpan.classList.remove('editing');

    let newLabel = lblSpan.textContent.trim();
    const oldLabel = div.dataset.label;

    if (newLabel && newLabel !== oldLabel) {
      // Prevent duplicate names
      while (levels.hasOwnProperty(newLabel)) {
        newLabel += "x";
      }
      
      // CRITICAL: Transfer data array to prevent drawing loss
      levels[newLabel] = levels[oldLabel];
      delete levels[oldLabel];
      
      lblSpan.textContent = newLabel;
      div.dataset.label = newLabel;
      activeLevel = newLabel;
      
      if(window.activeLevelLabel) {
        activeLevelLabel.textContent = `Active Level: ${newLabel}`;
      }

      // Rebuild UI to sort correctly and maintain state
      autoArrangeLevels();
    } else if (!newLabel) {
      lblSpan.textContent = oldLabel;
    }
  };

  // Trigger blur on Enter
  lblSpan.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lblSpan.blur();
    }
  };

  lblSpan.onclick = (e) => {
    // 5. Ctrl + Click Logic to Edit
    if (e.ctrlKey || e.metaKey) {
      lblSpan.contentEditable = true;
      lblSpan.classList.add('editing');
      lblSpan.focus();
      document.execCommand('selectAll', false, null);
    } else {
      // Standard Click: Select active level
      document.querySelectorAll('.level-label').forEach(el => el.classList.remove('active'));
      lblSpan.classList.add('active');
      activeLevel = div.dataset.label;
      if(window.activeLevelLabel) {
        activeLevelLabel.textContent = `Active Level: ${activeLevel}`;
      }
    }
  };

  // --- Drawing List Setup ---
  const list = document.createElement('div');
  list.className = 'drawing-list';
  
  // NEW: Default new levels to be EXPANDED (display: block)
  list.style.display = 'block';

  toggle.onclick = () => {
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
  };

  // Layout Setup
  const header = document.createElement('div');
  header.className = 'level-header';
  header.append(toggle, lblSpan);

  div.append(header, list);
  levelsTree.appendChild(div);
  
  // Set as active level immediately
  lblSpan.click();

  // Call the sorting/arrangement function
  // Note: Using autoArrangeLevels() ensures the whole list refreshes
  autoArrangeLevels();
};




document.getElementById('deleteLevelBtn').onclick=()=>{
  if(!activeLevel){alert("No active level selected!");return}
  if(!confirm(`Are you sure you want to delete Level ${activeLevel} and all its drawings?`))return;
  delete levels[activeLevel];
  const levelEl=levelsTree.querySelector(`[data-label="${activeLevel}"]`);
  if(levelEl)levelEl.remove();
  activeLevel=null;activeDrawing=null;activeDrawingIndex=-1;
  activeLevelLabel.textContent="No active level";activeDrawingLabel.textContent="No active drawing";
  activeCanvasCtx.clearRect(0,0,canvas.width,canvas.height);canvas.style.cursor="not-allowed";
};

document.getElementById('newDrawingBtn').onclick = () => {
  if (!activeLevel) { alert("Select a level first!");return;}
  activeCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL("image/png"),
        name = `${levels[activeLevel].length + 1}.png`,
        drawing = { name, data };
  levels[activeLevel].push(drawing);
  autoArrange(activeLevel);
  setactiveDrawing(drawing);
};
document.addEventListener('keydown', (event) => {
  if (event.key === '`') {
    document.getElementById('newDrawingBtn').click();
  }
});


document.getElementById('deleteDrawingBtn').onclick=()=>{
  if(!activeLevel||!activeDrawing){alert("No active drawing selected!");return}
  const idx=levels[activeLevel].indexOf(activeDrawing);
  if(idx!==-1){
    levels[activeLevel].splice(idx,1);
    levelsTree.querySelector(`[data-label="${activeLevel}"] .drawing-list`).querySelectorAll('.drawing')[idx].remove()
  }
  activeDrawing=null;activeDrawingIndex=-1;activeDrawingLabel.textContent="No active drawing";
  activeCanvasCtx.clearRect(0,0,canvas.width,canvas.height);canvas.style.cursor="not-allowed";
  document.querySelectorAll('.drawing input').forEach(el=>el.classList.remove('active'));
};

document.getElementById('prevDrawingBtn').onclick = () => {
  if (!activeLevel || !levels[activeLevel].length) return;
  activeDrawingIndex = (activeDrawingIndex - 1 + levels[activeLevel].length) % levels[activeLevel].length;
  setactiveDrawing(levels[activeLevel][activeDrawingIndex]);
};

document.getElementById('nextDrawingBtn').onclick = () => {
  if (!activeLevel || !levels[activeLevel].length) return;
  activeDrawingIndex = (activeDrawingIndex + 1) % levels[activeLevel].length;
  setactiveDrawing(levels[activeLevel][activeDrawingIndex]);
};

//Shortcuts
document.addEventListener('keydown', (event) => {
  // Existing Alt + Q or Shift + <
  if ((event.altKey && event.key === 'q') || (event.shiftKey && event.key === '<')) {
    document.getElementById('prevDrawingBtn').click();
  }
  
  // Existing Alt + W or Shift + >
  if ((event.altKey && event.key === 'w') || (event.shiftKey && event.key === '>')) {
    document.getElementById('nextDrawingBtn').click();
  }
  
  if ((event.key === '~')) {
    document.getElementById('deleteDrawingBtn').click();
  }
});


function autoArrangeLevels() {
  // 1. Remember which levels are currently EXPANDED (display: block)
  const expandedLevels = new Set();
  document.querySelectorAll('.level').forEach(div => {
    const list = div.querySelector('.drawing-list');
    if (list && list.style.display === 'block') {
      expandedLevels.add(div.dataset.label);
    }
  });

  // 2. Sort the level keys
  const levelLabels = Object.keys(levels).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true })
  );
  
  levelsTree.innerHTML = ""; // Clear UI

  levelLabels.forEach(label => {
    const div = document.createElement('div');
    div.className = 'level';
    div.dataset.label = label;
    
    const toggle = document.createElement('span');
    toggle.className = 'toggle-icon';
    toggle.innerHTML = '<span class="bl-icons-outliner"></span>';

    const lblSpan = document.createElement('span');
    lblSpan.className = 'level-label';
    lblSpan.textContent = label;
    lblSpan.spellcheck = false;

    // --- Renaming Logic ---
    lblSpan.onblur = () => {
      lblSpan.contentEditable = false;
      lblSpan.classList.remove('editing');

      let newLabel = lblSpan.textContent.trim();
      const oldLabel = div.dataset.label;

      if (newLabel && newLabel !== oldLabel) {
        while (levels.hasOwnProperty(newLabel)) {
          newLabel += "x";
        }
        
        // Transfer data
        levels[newLabel] = levels[oldLabel]; 
        delete levels[oldLabel];
        
        activeLevel = newLabel;
        if(window.activeLevelLabel) activeLevelLabel.textContent = `Active Level: ${newLabel}`;
        
        // If the old level was expanded, make sure the new name is expanded too
        if (expandedLevels.has(oldLabel)) {
          expandedLevels.delete(oldLabel);
          expandedLevels.add(newLabel);
        }

        autoArrangeLevels(); 
      } else {
        lblSpan.textContent = oldLabel;
      }
    };

    lblSpan.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); lblSpan.blur(); }
    };

    lblSpan.onclick = (e) => {
      if (e.ctrlKey || e.metaKey) {
        lblSpan.contentEditable = true;
        lblSpan.classList.add('editing');
        lblSpan.focus();
        document.execCommand('selectAll', false, null);
      } else {
        document.querySelectorAll('.level-label').forEach(el => el.classList.remove('active'));
        lblSpan.classList.add('active');
        activeLevel = div.dataset.label;
        if(window.activeLevelLabel) activeLevelLabel.textContent = `Active Level: ${activeLevel}`;
      }
    };

    // --- The Drawing List ---
    const list = document.createElement('div');
    list.className = 'drawing-list';
    
    // 3. RESTORE THE STATE: If it was open before, keep it open now
    list.style.display = expandedLevels.has(label) ? 'block' : 'none';

    const header = document.createElement('div');
    header.className = 'level-header';
    header.append(toggle, lblSpan);

    div.append(header, list);
    levelsTree.appendChild(div);

    // Re-populate drawings
    if (levels[label]) {
      levels[label].forEach(drawing => {
        addDrawingElement(label, drawing);
      });
    }

    toggle.onclick = () => {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    };

    if (label === activeLevel) lblSpan.classList.add('active');
  });
}




document.getElementById('arrangeLevelsBtn').onclick=()=>{
  autoArrangeLevels();
};
