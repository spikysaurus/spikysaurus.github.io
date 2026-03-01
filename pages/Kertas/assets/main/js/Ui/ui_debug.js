let showInfos = true;

document.addEventListener("keydown", e => {
	showInfos = !showInfos;
	if (e.key === "F1") {
		if (showInfos){
			areaBottom.style.display = "none";
			}
			else{
				areaBottom.style.display = "block";
				}
  }
	
});
