const hamburgerBtn = document.getElementById("hamburgerBtn");
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

let bool = false;

function hamburgerBtnToggle() {
  bool = !bool;
  if (bool) {
	hamburger.style.transform = "scale(1,1)";
	hamburger.style.visibility = "visible";
	hamburger.style.opacity = "100%";
	hamburger.style.top = "64px";
    hamburgerBtn.style.borderBottomLeftRadius = "0px";
    hamburgerBtn.style.borderBottomRightRadius = "0px";
    hamburgerBtn.style.borderBottom = "none";
    hamburgerBtn.style.backgroundColor = "white";
	hamburgerBtn.style.color="#e23a6b";
    
	
  } else {
	hamburger.style.transform = "scale(0,0)";
	hamburger.style.visibility = "hidden";
	hamburger.style.opacity = "0%";
	hamburger.style.top = "50px";
    hamburgerBtn.style.borderBottomLeftRadius = "100%";
    hamburgerBtn.style.borderBottomRightRadius = "100%";
    hamburgerBtn.style.borderBottom = "2px solid #e23a6b";
    hamburgerBtn.style.backgroundColor = "#e23a6b";
	hamburgerBtn.style.color="white";
  }
}

hamburgerBtn.onclick = hamburgerBtnToggle;

const carousel = document.getElementById('carousel');

    function scrollCarousel(direction) {
      const itemWidth = carousel.querySelector('.carousel-item').offsetWidth + 15;
      carousel.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
    }

