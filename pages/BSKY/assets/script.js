let profiles = [];

async function loadProfiles() {
  try {
    const resp = await fetch("assets/profiles.json"); // external JSON file
    const data = await resp.json();
    profiles = data.profiles;

    for (const handle of profiles) {
      await fetchProfileMedia(handle);
    }
  } catch (err) {
    console.error("Error loading profiles.json", err);
  }
}

const gallery = document.getElementById("gallery");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const closeBtn = document.querySelector(".close-btn");

let allMedia = [];
let currentPage = 0;
const pageSize = 18;

async function fetchProfileMedia(handle) {
  try {
    const resp = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=50`
    );
    const data = await resp.json();

    data.feed.forEach(post => {
      // Skip reposts
      if (post.reason && post.reason.$type === "app.bsky.feed.defs#reasonRepost") {
        return;
      }

      // Skip replies
      if (post.reply) {
        return;
      }

      const embed = post.post.embed;
      const postUri = post.post.uri;
      const postUrl = `https://bsky.app/profile/${handle}/post/${postUri.split("/").pop()}`;

      if (!embed) return;

      // Images
      if (embed.$type === "app.bsky.embed.images#view" && embed.images) {
        embed.images.forEach(img => {
          allMedia.push({ type: "image", src: img.fullsize, alt: handle, postUrl });
        });
      }

      // Video
      if (embed.$type === "app.bsky.embed.video#view" && embed.video) {
        allMedia.push({ type: "video", src: embed.video.url, alt: handle, postUrl });
      }

      // Mixed record with media
      if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
        if (embed.media?.$type === "app.bsky.embed.images#view") {
          embed.media.images.forEach(img => {
            allMedia.push({ type: "image", src: img.fullsize, alt: handle, postUrl });
          });
        }
        if (embed.media?.$type === "app.bsky.embed.video#view") {
          allMedia.push({ type: "video", src: embed.media.video.url, alt: handle, postUrl });
        }
      }
    });

    renderPage();
  } catch (err) {
    console.error("Error fetching media for", handle, err);
  }
}

function renderPage() {
  gallery.innerHTML = "";
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageItems = allMedia.slice(start, end);

  pageItems.forEach(item => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";

    let el;
    if (item.type === "image") {
      el = document.createElement("img");
      el.src = item.src;
      el.alt = item.alt;
    } else {
      el = document.createElement("video");
      el.src = item.src;
      el.controls = true;
      el.preload = "metadata"; // avoid heavy loading
      el.style.maxHeight = "200px"; // keep grid tidy
    }
    wrapper.appendChild(el);

    wrapper.addEventListener("click", () => openModal(item));

    gallery.appendChild(wrapper);
  });

  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = end >= allMedia.length;
}

function openModal(item) {
  modalContent.innerHTML = "";
  let el;
  if (item.type === "image") {
    el = document.createElement("img");
    el.src = item.src;
    el.alt = item.alt;
  } else {
    el = document.createElement("video");
    el.src = item.src;
    el.controls = true;
    el.autoplay = true;
    el.muted = true; // autoplay silently
  }
  modalContent.appendChild(el);

  const btnContainer = document.createElement("div");
  btnContainer.className = "modal-buttons";

  const linkBtn = document.createElement("a");
  linkBtn.href = item.postUrl;
  linkBtn.target = "_blank";
  linkBtn.textContent = "View Original Post";
  btnContainer.appendChild(linkBtn);

  const downloadBtn = document.createElement("a");
  downloadBtn.href = item.src;
  downloadBtn.download = ""; // native download attribute
  downloadBtn.textContent = "Download Media";
  downloadBtn.className = "download";
  btnContainer.appendChild(downloadBtn);

  modalContent.appendChild(btnContainer);
  modal.style.display = "flex";
}

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  modalContent.innerHTML = "";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    modalContent.innerHTML = "";
  }
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
  }
});

nextBtn.addEventListener("click", () => {
  if ((currentPage + 1) * pageSize < allMedia.length) {
    currentPage++;
    renderPage();
  }
});

(async function init() {
  await loadProfiles();
})();

