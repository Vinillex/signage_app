import { ContentItem } from './content_item.js';

const ContentPlaylist = [
  new ContentItem('video', 'https://videos.pexels.com/video-files/32501862/13859118_1920_1080_30fps.mp4', 5),
  new ContentItem('image', 'https://images.pexels.com/photos/9688475/pexels-photo-9688475.jpeg', 10),
  new ContentItem('video', 'https://videos.pexels.com/video-files/33025238/14076811_2560_1440_30fps.mp4', 10),
];



let currentIndex = 0;
let frontBuffer, backBuffer;

function createContentElement(item) {
  if (item.type === 'video') {
    const video = document.createElement('video');
    video.src = item.url;
    video.autoplay = false;
    video.controls = false;
    video.loop = true;
    video.muted = true;
    video.style.objectFit = "cover";
    video.style.width = "100%";
    video.style.height = "100%";
    return video;
  } else if (item.type === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    img.style.objectFit = "cover";
    img.style.width = "100%";
    img.style.height = "100%";
    return img;
  }
}

function swapBuffers() {
  frontBuffer.style.zIndex = 0;
  backBuffer.style.zIndex = 1;

  frontBuffer.innerHTML = "";
  [frontBuffer, backBuffer] = [backBuffer, frontBuffer];
}

function scheduleNextContent() {
  const currentItem = ContentPlaylist[currentIndex];
  const nextIndex = (currentIndex + 1) % ContentPlaylist.length;
  const nextItem = ContentPlaylist[nextIndex];

  // Preload into back buffer
  const element = createContentElement(nextItem);
  backBuffer.innerHTML = "";
  backBuffer.appendChild(element);

  if(element.tagName === 'VIDEO'){
    setTimeout(() => {
      element.play();
    },currentItem.duration * 1000);
  }


  setTimeout(() => {
    swapBuffers();
    currentIndex = nextIndex;
    scheduleNextContent();
  }, currentItem.duration * 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("signageContainer");

  // Create and style both buffers
  frontBuffer = document.createElement('div');
  backBuffer = document.createElement('div');

  [frontBuffer, backBuffer].forEach(buffer => {
    buffer.style.position = "absolute";
    buffer.style.top = 0;
    buffer.style.left = 0;
    buffer.style.width = "100%";
    buffer.style.height = "100%";
    buffer.style.transition = "opacity 0.5s ease";
  });

  frontBuffer.style.zIndex = 1;
  backBuffer.style.zIndex = 0;

  container.style.position = "relative";
  container.style.overflow = "hidden";
  container.appendChild(frontBuffer);
  container.appendChild(backBuffer);

  // Load initial content
  const firstItem = ContentPlaylist[currentIndex];
  const element = createContentElement(firstItem);
  frontBuffer.appendChild(element);

  scheduleNextContent();
});
