const infos = document.getElementById("debug");
let showInfos = true;

document.addEventListener("keydown", e => {
	showInfos = !showInfos;
	if (e.key === "F1") {
		if (!showInfos){
			infos.style.display = "none";
			}
			else{
				infos.style.display = "block";
				}
  }
	
});
