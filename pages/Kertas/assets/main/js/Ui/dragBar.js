function makeResizable(barId, targetId) {
  const bar = document.getElementById(barId);
  const target = document.getElementById(targetId);

  let startX = 0;
  let startWidth = 0;

  const drag = (e) => {
    document.selection ? document.selection.empty() : window.getSelection().removeAllRanges();
    const newWidth = startWidth + (e.pageX - startX);
    target.style.width = newWidth + 'px';
  };

  bar.addEventListener('mousedown', (e) => {
    startX = e.pageX;
    startWidth = target.offsetWidth;
    document.addEventListener('mousemove', drag);
  });

  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', drag);
  });
}

// Left xsheet panel
makeResizable('dragbar-1', 'drag-left-1');
// Middle tree panel
makeResizable('dragbar-2', 'drag-middle');
