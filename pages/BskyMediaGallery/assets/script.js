let profiles = [];

async function loadProfilesFromFile(file) {
  try {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        profiles = data.profiles || [];

        // Save to localStorage for auto-load next time
        localStorage.setItem("lastProfiles", JSON.stringify(profiles));

        // reset state before loading new profiles
        allMedia = [];
        currentPage = 0;

        for (const handle of profiles) {
          await fetchProfileMedia(handle);
        }
      } catch (err) {
        console.error("Invalid JSON file", err);
      }
    };
    reader.readAsText(file);
  } catch (err) {
    console.error("Error reading file", err);
  }
}

const gallery = document.getElementById("gallery");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const closeBtn = document.querySelector(".close-btn");
const fileInput = document.getElementById("fileInput");
const sortToggleBtn = document.getElementById("sortToggleBtn");

let allMedia = [];
let currentPage = 0;
const pageSize = 18;
let sortLatestFirst = true; // default sort order

async function fetchProfileMedia(handle) {
  try {
    const resp = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=50`
    );
    const data = await resp.json();

    data.feed.forEach(post => {
      if (post.reason && post.reason.$type === "app.bsky.feed.defs#reasonRepost") return;
      if (post.reply) return;

      const embed = post.post.embed;
      const postUri = post.post.uri;
      const postUrl = `https://bsky.app/profile/${handle}/post/${postUri.split("/").pop()}`;
      const postDate = new Date(post.post.indexedAt); // capture date

      if (!embed) return;

      if (embed.$type === "app.bsky.embed.images#view" && embed.images) {
        embed.images.forEach(img => {
          allMedia.push({ type: "image", src: img.fullsize, alt: handle, postUrl, date: postDate });
        });
      }

      if (embed.$type === "app.bsky.embed.video#view" && embed.video) {
        allMedia.push({ type: "video", src: embed.video.url, alt: handle, postUrl, date: postDate });
      }

      if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
        if (embed.media?.$type === "app.bsky.embed.images#view") {
          embed.media.images.forEach(img => {
            allMedia.push({ type: "image", src: img.fullsize, alt: handle, postUrl, date: postDate });
          });
        }
        if (embed.media?.$type === "app.bsky.embed.video#view") {
          allMedia.push({ type: "video", src: embed.media.video.url, alt: handle, postUrl, date: postDate });
        }
      }
    });

    renderPage();
  } catch (err) {
    console.error("Error fetching media for", handle, err);
  }
}

function renderPage() {
  // sort based on toggle
  allMedia.sort((a, b) => {
    return sortLatestFirst ? b.date - a.date : a.date - b.date;
  });

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
      el.preload = "metadata";
      el.style.maxHeight = "200px";
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
    el.muted = true;
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
  downloadBtn.download = "";
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

// File input handler
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    await loadProfilesFromFile(file);
  }
});

// The JSON data you want to save
const data = {
  "profiles": [
    "spikysaurus.bsky.social",
    "sadewoo.bsky.social"
  ]
};

// Function to trigger file download
function saveJSON() {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "profiles.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
// Attach event listener to existing button by ID
document.getElementById("saveBtn").addEventListener("click", saveJSON);

// Sort toggle button
sortToggleBtn.addEventListener("click", () => {
  sortLatestFirst = !sortLatestFirst;
  sortToggleBtn.textContent = sortLatestFirst ? "Sort: Latest First ↑" : "Sort: Oldest First ↓";
  currentPage = 0; // reset to first page
  renderPage();
});

window.addEventListener("DOMContentLoaded", async () => {
  const savedProfiles = localStorage.getItem("lastProfiles");
  if (savedProfiles) {
    profiles = JSON.parse(savedProfiles);

    // reset state before loading saved profiles
    allMedia = [];
    currentPage = 0;

    for (const handle of profiles) {
      await fetchProfileMedia(handle);
    }
  }
});

