ShowPreferences = false;
preferencesBtn.onclick = () => {
	ShowPreferences = !ShowPreferences;
	if (ShowPreferences){
	preferences.style.display = "block";
	}
	else{
	preferences.style.display = "none";
	}
	
};


const cv_checkerboard = document.getElementById('checkerboard'),cvx_checkerboard = cv_checkerboard.getContext('2d')
ShowCheckerboard = false;
checkerboardBtn.onclick = () => {
ShowCheckerboard = !ShowCheckerboard;
 if (ShowCheckerboard) {
   cv_checkerboard.style.display = 'block';
 } else {
   cv_checkerboard.style.display = 'none';
 }
 
};
