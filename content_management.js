// content_management.js

import { ContentItem } from './content_item.js';

// Your playlist of content
const ContentPlaylist = [
  new ContentItem('video', 'https://videos.pexels.com/video-files/32501862/13859118_1920_1080_30fps.mp4', 5),
  new ContentItem('image', 'https://images.pexels.com/photos/9688475/pexels-photo-9688475.jpeg?_gl=1*zw5wvu*_ga*MTgwNzM0MjQ3MC4xNzI5NjI3MDgx*_ga_8JE65Q40S6*czE3NTI2ODM2MTgkbzckZzEkdDE3NTI2ODM2MjMkajU1JGwwJGgw', 10),
  new ContentItem('video', 'https://videos.pexels.com/video-files/12659228/12659228-uhd_2560_1440_60fps.mp4', 10),
];

let currentIndex = 0;

async function playNextContent() {
  const container = document.getElementById("signageContainer");
  container.innerHTML = ""; // Clear previous content

  const item = ContentPlaylist[currentIndex];

  if (item.type === 'video') {
    const video = document.createElement('video');
    video.src = item.url;
    video.autoplay = true;
    video.controls = false;
    video.loop = false;
    video.muted = true;
    video.style.width = "100%";
    video.style.height = "100%";

    container.appendChild(video);

    video.play().catch(console.error);
  }

  else if (item.type === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    container.appendChild(img);
    
  }

  setTimeout(playNext, item.duration * 1000);
}

function playNext() {
  currentIndex = (currentIndex + 1) % ContentPlaylist.length;
  playNextContent();
}

document.addEventListener("DOMContentLoaded", () => {
  playNextContent();
});
