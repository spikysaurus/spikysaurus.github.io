aliasing = true;
aliasingToggle.style.backgroundColor = "black";
aliasingToggle.style.color = "white";

aliasingToggle.onclick = () => {
    aliasing = !aliasing;
    if (!aliasing) {
		aliasingToggle.style.backgroundColor = "";
		aliasingToggle.style.color = "black";
    } else {
		aliasingToggle.style.backgroundColor = "black";
		aliasingToggle.style.color = "white";
    }
};


