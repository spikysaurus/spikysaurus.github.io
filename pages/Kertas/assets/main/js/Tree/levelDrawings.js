
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
    autoArrange(level);
  };

  // Use the new function here
  const edit = createEditButton(level, c);

  div.append(input, edit);
  levelsTree.querySelector(`[data-label="${level}"] .drawing-list`).appendChild(div);
}


function autoArrange(level){
  levels[level].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  const list=levelsTree.querySelector(`[data-label="${level}"] .drawing-list`);
  list.innerHTML="";
  levels[level].forEach(c=>addDrawingElement(level,c));
}

document.getElementById('newLevelBtn').onclick=()=>{
  const label=String.fromCharCode(65+levelCount++);
  levels[label]=[];
  const div=document.createElement('div');div.className='level';div.dataset.label=label;
  const toggle=document.createElement('span');toggle.className='toggle-icon';toggle.innerHTML='<span class="bl-icons-outliner"></span>';

  const lblInput=document.createElement('input');
  lblInput.type='text';lblInput.value=label;lblInput.className='level-label';
  lblInput.onblur=()=>{
    const newLabel=lblInput.value.trim();
    if(newLabel && newLabel!==label){
      levels[newLabel]=levels[label];
      delete levels[label];
      div.dataset.label=newLabel;
      activeLevel=newLabel;
      activeLevelLabel.textContent=`Active Level: ${newLabel}`;
      autoArrange(newLabel);
    }
  };
  lblInput.onclick=()=>{
    document.querySelectorAll('.level-label').forEach(el=>el.classList.remove('active'));
    lblInput.classList.add('active');
    activeLevel=lblInput.value.trim();
    activeLevelLabel.textContent=`Active Level: ${activeLevel}`;
  };

  toggle.onclick=()=>{
    const list=div.querySelector('.drawing-list');
    list.style.display=list.style.display==='none'?'block':'none';
    toggle.innerHTML='<span class="bl-icons-outliner"></span>';
  };

  const list=document.createElement('div');list.className='drawing-list';

  // Wrap toggle + label in flex row
  const header=document.createElement('div');
  header.className='level-header';
  header.append(toggle,lblInput);

  div.append(header,list);
  levelsTree.appendChild(div);
  lblInput.click();
  autoArrange(label);
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

document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key === 'q') {
    //~ event.preventDefault();
    document.getElementById('prevDrawingBtn').click();
  }
  if (event.altKey && event.key === 'w') {
    //~ event.preventDefault();
    document.getElementById('nextDrawingBtn').click();
  }
});


function autoArrangeLevels(){
  const levelLabels = Object.keys(levels).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  levelsTree.innerHTML = "";
  levelLabels.forEach(label=>{
    const div=document.createElement('div');div.className='level';div.dataset.label=label;
    const toggle=document.createElement('span');toggle.className='toggle-icon';toggle.innerHTML='<span class="bl-icons-outliner"></span>';

    const lblInput=document.createElement('input');
    lblInput.type='text';lblInput.value=label;lblInput.className='level-label';
    lblInput.onblur=()=>{
      const newLabel=lblInput.value.trim();
      if(newLabel && newLabel!==label){
        levels[newLabel]=levels[label];
        delete levels[label];
        div.dataset.label=newLabel;
        activeLevel=newLabel;
        activeLevelLabel.textContent=`Active Level: ${newLabel}`;
        autoArrange(newLabel);
      }
    };
    lblInput.onclick=()=>{
      document.querySelectorAll('.level-label').forEach(el=>el.classList.remove('active'));
      lblInput.classList.add('active');
      activeLevel=lblInput.value.trim();
      activeLevelLabel.textContent=`Active Level: ${activeLevel}`;
    };

    toggle.onclick=()=>{
      const list=div.querySelector('.drawing-list');
      list.style.display=list.style.display==='none'?'block':'none';
      toggle.innerHTML='<span class="bl-icons-outliner"></span>';
    };

    const list=document.createElement('div');list.className='drawing-list';

    // Wrap toggle + label in flex row
    const header=document.createElement('div');
    header.className='level-header';
    header.append(toggle,lblInput);

    div.append(header,list);
    levelsTree.appendChild(div);
    autoArrange(label);
  });
}

document.getElementById('arrangeLevelsBtn').onclick=()=>{
  autoArrangeLevels();
};
