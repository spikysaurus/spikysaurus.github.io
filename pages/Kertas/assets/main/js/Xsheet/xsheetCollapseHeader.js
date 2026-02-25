const collapseHeaderArea = document.getElementsByClassName('collapseHeaderArea');
const collapseHeaderBtn = document.getElementById('collapseHeaderBtn');

let collapse = true;

window.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < collapseHeaderArea.length; i++) {
    collapseHeaderArea[i].style.display = "none";
  }
});

function collapseHeader() {
  collapse = !collapse;
  if (!collapse) {
    for (let i = 0; i < collapseHeaderArea.length; i++) {
      collapseHeaderArea[i].style.display = "flex";
    }
  } else {
    for (let i = 0; i < collapseHeaderArea.length; i++) {
      collapseHeaderArea[i].style.display = "none";
    }
  }
}

collapseHeaderBtn.onclick = () => collapseHeader();
