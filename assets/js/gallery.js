

fetch('../assets/json/data.json')
.then(response => response.json())
.then(data => {
  displayImages(data.A);
})

.catch(error => console.error('Error fetching data:', error));

function displayImages(imageUrls) {
  const container = document.getElementById('display-images'); // Get the container element
  imageUrls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Fan Art';
    container.appendChild(img);
    img.onclick = () => img.classList.toggle("full");
  });
}

fetch('../assets/json/data.json')
.then(response => response.json())
.then(data => {
  // The 'data' variable now holds the array of image URLs
  displayImagesB(data.B); //data.slice(2,5)
})

function displayImagesB(imageUrls) {
  const container = document.getElementById('display-imagesB'); // Get the container element
  imageUrls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Original Characters';
    container.appendChild(img);
    img.onclick = () => img.classList.toggle("full");
  });
}

fetch('../assets/json/data.json')
.then(response => response.json())
.then(data => {
  // The 'data' variable now holds the array of image URLs
  displayImagesC(data.C); //data.slice(2,5)
})

function displayImagesC(imageUrls) {
  const container = document.getElementById('display-imagesC'); // Get the container element
  imageUrls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'GIFs';
    container.appendChild(img);
    img.onclick = () => img.classList.toggle("full");
  });
}

//OLD
// window.addEventListener("load", () => {
//   for (let i of document.querySelectorAll(".gallery img")) {
//     i.onclick = () => i.classList.toggle("full");
//   }
// });
