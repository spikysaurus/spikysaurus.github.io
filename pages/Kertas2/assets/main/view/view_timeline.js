minUI = false;
minimalUIBtn = document.getElementById('minimalUI');
timelineWrapper = document.getElementById('timeline-wrapper');


minimalUIBtn.onclick = () => {
  minUI = !minUI;
  if (window.matchMedia("(orientation: portrait)").matches) {
	  if (minUI){
	  	timelineWrapper.style.display = 'none';
	  }
	  else{
		timelineWrapper.style.display = 'flex';
	  }
  }
  else{
  	if (minUI){
	  	timelineWrapper.style.display = 'none';
	  }
	  else{
		timelineWrapper.style.display = 'flex';
	  }
  }
};
