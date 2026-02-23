function openTab(evt, tabName) {
  // 1. Get the parent container to only affect this specific tab group
  var container = evt.currentTarget.parentElement.parentElement;
  
  // 2. Hide only the tabcontent within this specific container
  var tabcontent = container.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // 3. Remove "active" from buttons in this container only
  var tablinks = container.getElementsByClassName("tablinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  // 4. Show current tab and set active
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

// 5. IMPROVED: Click ALL defaultOpen elements on load
document.addEventListener("DOMContentLoaded", function() {
  var defaults = document.querySelectorAll(".defaultOpen");
  defaults.forEach(function(el) {
    el.click();
  });
});
