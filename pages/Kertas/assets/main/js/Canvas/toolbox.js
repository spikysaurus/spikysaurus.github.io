// Toolbox dragging logic
const toolbox = document.getElementById('toolbox');
let offsetX, offsetY, isToolboxDragging = false;

toolbox.addEventListener('mousedown', (e) => {
  isToolboxDragging = true;
  offsetX = e.clientX - toolbox.offsetLeft;
  offsetY = e.clientY - toolbox.offsetTop;
});

document.addEventListener('mousemove', (e) => {
  if (isToolboxDragging) {
    toolbox.style.left = (e.clientX - offsetX) + 'px';
    toolbox.style.top = (e.clientY - offsetY) + 'px';
  }
});

document.addEventListener('mouseup', () => {
  isToolboxDragging = false;
});
