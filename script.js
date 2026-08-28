const menuButton = document.querySelector(".menu");
const navigationLinks = document.querySelector(".links");
const navigation = document.querySelector(".nav");

function closeMenu() {
  if (!menuButton || !navigationLinks) return;
  navigationLinks.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation menu");
}

if (menuButton && navigationLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navigationLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  navigationLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (navigation && !navigation.contains(event.target)) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) closeMenu();
  });
}

document.querySelectorAll("[data-archive-toggle]").forEach((toggle) => {
  const archive = toggle.closest("[data-archive]");
  if (!archive) return;

  const extraItems = Array.from(archive.querySelectorAll("[data-archive-extra]"));
  toggle.addEventListener("click", () => {
    const shouldExpand = toggle.getAttribute("aria-expanded") !== "true";
    extraItems.forEach((item) => {
      item.hidden = !shouldExpand;
      if (shouldExpand) {
        item.querySelectorAll("img[data-src]").forEach((image) => {
          image.loading = "lazy";
          image.src = image.dataset.src;
          image.removeAttribute("data-src");
        });
      }
    });

    toggle.setAttribute("aria-expanded", String(shouldExpand));
    toggle.textContent = shouldExpand ? toggle.dataset.hideLabel : toggle.dataset.showLabel;
  });
});

const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.hidden = true;
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.setAttribute("aria-label", "Portfolio image viewer");
lightbox.innerHTML = `
  <div class="lightbox-dialog">
    <div class="lightbox-toolbar">
      <button class="lightbox-button lightbox-zoom" type="button" aria-label="View image at full size" aria-pressed="false">Full size</button>
      <button class="lightbox-button lightbox-close" type="button" aria-label="Close image viewer">Close</button>
    </div>
    <div class="lightbox-stage">
      <img class="lightbox-image" alt="Expanded portfolio image">
      <video class="lightbox-video" controls playsinline hidden></video>
    </div>
    <button class="lightbox-button lightbox-nav lightbox-prev" type="button" aria-label="Previous image">←</button>
    <button class="lightbox-button lightbox-nav lightbox-next" type="button" aria-label="Next image">→</button>
    <div class="lightbox-caption-wrap">
      <p class="lightbox-caption" aria-live="polite"></p>
      <a class="lightbox-source-link" target="_blank" rel="noopener noreferrer">View supporting data in Google Sheets ↗</a>
    </div>
  </div>
`;
document.body.append(lightbox);

const lightboxDialog = lightbox.querySelector(".lightbox-dialog");
const lightboxStage = lightbox.querySelector(".lightbox-stage");
const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxVideo = lightbox.querySelector(".lightbox-video");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");
const lightboxSourceLink = lightbox.querySelector(".lightbox-source-link");
const closeButton = lightbox.querySelector(".lightbox-close");
const zoomButton = lightbox.querySelector(".lightbox-zoom");
const previousButton = lightbox.querySelector(".lightbox-prev");
const nextButton = lightbox.querySelector(".lightbox-next");

let galleryItems = [];
let galleryIndex = 0;
let previouslyFocused = null;
let touchStartX = null;
let channelGalleryManifest = null;
let activeChannelItems = [];
let activeChannel = null;
let loadedChannelItemCount = 0;

const GALLERY_BATCH_SIZE = 8;
const PRELOAD_THRESHOLD = 3;

function visibleGalleryItems(groupName) {
  return Array.from(document.querySelectorAll(".js-lightbox")).filter((trigger) => {
    return trigger.dataset.gallery === groupName && !trigger.closest("[hidden]");
  });
}

function resetZoom() {
  lightbox.classList.remove("is-zoomed");
  zoomButton.setAttribute("aria-pressed", "false");
  zoomButton.setAttribute("aria-label", "View image at full size");
  zoomButton.textContent = "Full size";
  lightboxStage.scrollTop = 0;
  lightboxStage.scrollLeft = 0;
}

function stopLightboxVideo() {
  lightboxVideo.pause();
  lightboxVideo.removeAttribute("src");
  lightboxVideo.load();
}

function getLightboxItemData(item) {
  if (item instanceof Element) {
    const sourceImage = item.querySelector("img");
    return {
      type: "image",
      src: sourceImage.dataset.full || sourceImage.currentSrc || sourceImage.src || sourceImage.dataset.src,
      alt: sourceImage.alt,
      caption: item.dataset.caption || item.closest("figure")?.querySelector("figcaption")?.textContent || sourceImage.alt,
      supportingUrl: item.dataset.supportingUrl || ""
    };
  }

  return item;
}

function preloadChannelItem(item) {
  if (item.type === "video") return;
  const preloadImage = new Image();
  preloadImage.decoding = "async";
  preloadImage.src = item.src;
}

/*
  Channel galleries use progressive loading:
  - the first 8 full-size assets load when a channel opens;
  - the next batch loads near the end of the already loaded items;
  - video files load only after the user opens that video.
  This keeps the first page load light while preserving source image quality.
*/
function loadNextChannelBatch() {
  const nextBatch = activeChannelItems.slice(
    loadedChannelItemCount,
    loadedChannelItemCount + GALLERY_BATCH_SIZE
  );

  nextBatch.forEach(preloadChannelItem);
  galleryItems.push(...nextBatch);
  loadedChannelItemCount += nextBatch.length;
}

function maybeLoadNextChannelBatch() {
  const nearEndOfLoadedItems = galleryIndex >= galleryItems.length - PRELOAD_THRESHOLD;
  if (activeChannel && nearEndOfLoadedItems && loadedChannelItemCount < activeChannelItems.length) {
    loadNextChannelBatch();
  }
}

function renderLightboxItem() {
  const item = getLightboxItemData(galleryItems[galleryIndex]);
  if (!item) return;

  resetZoom();
  if (item.type === "video") {
    lightboxImage.hidden = true;
    lightboxVideo.hidden = false;
    lightboxVideo.src = item.src;
    lightboxVideo.setAttribute("aria-label", item.alt);
    lightboxVideo.load();
  } else {
    stopLightboxVideo();
    lightboxVideo.hidden = true;
    lightboxImage.hidden = false;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
  }

  lightboxCaption.textContent = item.caption;
  lightboxSourceLink.href = item.supportingUrl || "";
  lightboxSourceLink.hidden = !item.supportingUrl;

  const hasMultipleItems = galleryItems.length > 1;
  previousButton.hidden = !hasMultipleItems;
  nextButton.hidden = !hasMultipleItems;
  maybeLoadNextChannelBatch();
}

function openLightbox(trigger) {
  activeChannel = null;
  activeChannelItems = [];
  loadedChannelItemCount = 0;
  galleryItems = visibleGalleryItems(trigger.dataset.gallery);
  galleryIndex = Math.max(0, galleryItems.indexOf(trigger));
  previouslyFocused = document.activeElement;
  renderLightboxItem();
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  closeButton.focus();
}

async function openChannelGallery(trigger) {
  trigger.disabled = true;
  try {
    if (!channelGalleryManifest) {
      const response = await fetch("assets/preorders/channels/gallery-manifest.json");
      if (!response.ok) throw new Error("Channel gallery manifest could not be loaded.");
      channelGalleryManifest = await response.json();
    }

    activeChannel = trigger.dataset.channelGallery;
    const channelItems = channelGalleryManifest[activeChannel] || [];
    activeChannelItems = [...channelItems]
      .sort((a, b) => a.bytes - b.bytes)
      .map((item, index) => ({
        ...item,
        alt: `${activeChannel.replace(/-/g, " ")} archive item`,
        caption: `${item.caption} · ${index + 1} of ${channelItems.length}`
      }));
    loadedChannelItemCount = 0;
    galleryItems = [];
    galleryIndex = 0;
    loadNextChannelBatch();
    previouslyFocused = document.activeElement;
    renderLightboxItem();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton.focus();
  } catch (error) {
    console.error(error);
  } finally {
    trigger.disabled = false;
  }
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.classList.remove("lightbox-open");
  stopLightboxVideo();
  resetZoom();
  if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
}

function moveLightbox(direction) {
  if (galleryItems.length < 2) return;
  galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
  renderLightboxItem();
}

document.querySelectorAll(".js-lightbox").forEach((trigger) => {
  trigger.addEventListener("click", () => openLightbox(trigger));
});

document.querySelectorAll("[data-channel-gallery]").forEach((trigger) => {
  trigger.addEventListener("click", () => openChannelGallery(trigger));
});

closeButton.addEventListener("click", closeLightbox);
previousButton.addEventListener("click", () => moveLightbox(-1));
nextButton.addEventListener("click", () => moveLightbox(1));

zoomButton.addEventListener("click", () => {
  const isZoomed = lightbox.classList.toggle("is-zoomed");
  zoomButton.setAttribute("aria-pressed", String(isZoomed));
  zoomButton.setAttribute("aria-label", isZoomed ? "Fit image to screen" : "View image at full size");
  zoomButton.textContent = isZoomed ? "Fit to screen" : "Full size";
  lightboxStage.scrollTop = 0;
  lightboxStage.scrollLeft = 0;
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

lightboxStage.addEventListener("click", (event) => {
  if (event.target === lightboxStage) closeLightbox();
});

lightboxStage.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null;
}, { passive: true });

lightboxStage.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
  const distance = touchEndX - touchStartX;
  if (Math.abs(distance) > 60) moveLightbox(distance > 0 ? -1 : 1);
  touchStartX = null;
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (!lightbox.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveLightbox(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveLightbox(1);
      return;
    }
    if (event.key === "Tab") {
      const focusable = Array.from(lightboxDialog.querySelectorAll("button:not([hidden])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    return;
  }

  if (event.key === "Escape") {
    closeMenu();
    menuButton?.focus();
  }
});
