let allImages = [];
let currentIndex = 0;
let zoomLevel = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

async function loadGallery() {
  try {
    const response = await fetch('../../assets/json/data_gallery.json');
    allImages = await response.json();
    renderGallery(allImages);
  } catch (error) {
    console.error("Error loading gallery:", error);
  }
}

function renderGallery(images) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = "";

  images.forEach((imgData, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    
	const thumb = document.createElement('img');
	const originalSrc = imgData.src; // e.g. "gallery/icons/photo.jpg"
	const parts = originalSrc.split('/'); // Separate base path and filename
	const filename = parts.pop();          // "photo.jpg"
	const basePath = parts.join('/');      // "gallery/icons"
	console.log("Base path:", basePath);
	console.log("Filename:", filename);
	const dotIndex = filename.lastIndexOf('.');
	const nameOnly = filename.slice(0, dotIndex); // "photo"
	const ext = filename.slice(dotIndex);         // ".jpg"
	thumb.src = basePath + "/thumbnails/" + nameOnly + "_thumb" + ext;    // "resized/photo_thumb.jpg"


    thumb.addEventListener('click', () => openLightbox(index));

    card.appendChild(thumb);
    gallery.appendChild(card);
  });
}
document.getElementById('lightbox-img').ondragstart = function() { return false; };

function openLightbox(index) {
  currentIndex = index;
  zoomLevel = 1;
  translateX = 0;
  translateY = 0;

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const loadingText = document.getElementById('loadingText');

  lightbox.style.display = "flex";
	
  // Show thumbnail first
//  lightboxImg.src = allImages[index].src.replace(/(\d+)\/(\d+)$/, "_thumb");
  updateTransform();

  // Show loading text
  loadingText.style.display = "block";

  // Preload full image
  const fullImg = new Image();
  fullImg.src = allImages[index].src;
  fullImg.onload = () => {
    lightboxImg.src = fullImg.src;
    loadingText.style.display = "none";
  };
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = "none";
}

function showPrev() {
  currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
  openLightbox(currentIndex);
}

function showNext() {
  currentIndex = (currentIndex + 1) % allImages.length;
  openLightbox(currentIndex);
}

function zoomIn() {
  zoomLevel += 0.2;
  updateTransform();
}

function zoomOut() {
  zoomLevel = Math.max(0.5, zoomLevel - 0.2);
  updateTransform();
}

function updateTransform() {
  const lightboxImg = document.getElementById('lightbox-img');
  lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
}

// Dragging logic
const lightboxImg = document.getElementById('lightbox-img');

lightboxImg.addEventListener('mousedown', e => {
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

document.addEventListener('mousemove', e => {
  if (!isDragging) return;
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  updateTransform();
});

// Touch support
lightboxImg.addEventListener('touchstart', e => {
  isDragging = true;
  const touch = e.touches[0];
  startX = touch.clientX - translateX;
  startY = touch.clientY - translateY;
});

document.addEventListener('touchend', () => {
  isDragging = false;
});

document.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const touch = e.touches[0];
  translateX = touch.clientX - startX;
  translateY = touch.clientY - startY;
  updateTransform();
});

document.addEventListener("DOMContentLoaded", () => {
  loadGallery();

  document.getElementById('close').addEventListener('click', closeLightbox);
  document.getElementById('prev').addEventListener('click', showPrev);
  document.getElementById('next').addEventListener('click', showNext);
  document.getElementById('zoomIn').addEventListener('click', zoomIn);
  document.getElementById('zoomOut').addEventListener('click', zoomOut);
});

// Search by tag
document.getElementById('search').addEventListener('input', e => {
  const query = e.target.value.toLowerCase();
  const filtered = allImages.filter(img =>
    img.tags && img.tags.some(tag => tag.toLowerCase().includes(query))
  );
  renderGallery(filtered);
});

function selectTag(evt, tag) {
  const searchInput = document.getElementById("search");
  searchInput.value = tag;

  // Fire the input event programmatically
  searchInput.dispatchEvent(new Event("input"));
}


