import { ContentItem } from './content-item.js';
import { DeviceProfile } from './device-profile.js';
import { NetworkManager } from './network-manager.js';
import { PreloadManager } from './preload-manager.js';

export class ContentManagementSystem {
  constructor() {
    this.networkManager = new NetworkManager();
    this.preloadManager = new PreloadManager();
    this.deviceProfile = new DeviceProfile();
    
    this.currentPlaylist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.frontBuffer = null;
    this.backBuffer = null;
    
    this.networkId = null;
    this.subnetworkId = null;
    this.deviceId = null;
    
    this.initializeBuffers();
    this.setupEventListeners();
  }

  async initialize(deviceId, networkId, subnetworkId) {
    this.deviceId = deviceId;
    this.networkId = networkId;
    this.subnetworkId = subnetworkId;
    
    // Get device profile
    await this.deviceProfile.load(deviceId);
    
    // Connect to network
    await this.networkManager.connect(networkId, subnetworkId, deviceId);
    
    // Load initial content
    await this.loadContent();
    
    // Start preloading
    this.preloadManager.start(this.currentPlaylist, this.deviceProfile);
    
    // Start playback
    this.startPlayback();
  }

  initializeBuffers() {
    const container = document.getElementById("signageContainer");
    
    this.frontBuffer = document.createElement('div');
    this.backBuffer = document.createElement('div');
    
    [this.frontBuffer, this.backBuffer].forEach(buffer => {
      buffer.style.position = "absolute";
      buffer.style.top = 0;
      buffer.style.left = 0;
      buffer.style.width = "100%";
      buffer.style.height = "100%";
      buffer.style.transition = "opacity 0.3s ease";
      buffer.style.overflow = "hidden";
    });
    
    this.frontBuffer.style.zIndex = 1;
    this.backBuffer.style.zIndex = 0;
    
    container.style.position = "relative";
    container.style.overflow = "hidden";
    container.appendChild(this.frontBuffer);
    container.appendChild(this.backBuffer);
  }

  setupEventListeners() {
    // Listen for content updates from server
    this.networkManager.on('contentUpdate', (playlist) => {
      this.updatePlaylist(playlist);
    });
    
    // Listen for device profile updates
    this.networkManager.on('profileUpdate', (profile) => {
      this.deviceProfile.update(profile);
      this.optimizeContent();
    });
    
    // Listen for preload events
    this.preloadManager.on('contentReady', (content) => {
      this.onContentPreloaded(content);
    });
  }

  async loadContent() {
    try {
      // Get content from network manager
      const content = await this.networkManager.getContent();
      
      // Filter content based on device capabilities
      this.currentPlaylist = this.filterContentForDevice(content);
      
      // Optimize content for device
      this.optimizeContent();
      
      console.log(`Loaded ${this.currentPlaylist.length} content items`);
    } catch (error) {
      console.error('Failed to load content:', error);
      // Fallback to default content
      this.loadFallbackContent();
    }
  }

  filterContentForDevice(content) {
    return content.filter(item => {
      // Check if device supports the content type
      if (!this.deviceProfile.supportsFormat(item.type)) {
        return false;
      }
      
      // Check if device supports the resolution
      if (item.resolution && !this.deviceProfile.supportsResolution(item.resolution)) {
        return false;
      }
      
      // Check if device supports the bitrate
      if (item.bitrate && !this.deviceProfile.supportsBitrate(item.bitrate)) {
        return false;
      }
      
      return true;
    });
  }

  optimizeContent() {
    this.currentPlaylist = this.currentPlaylist.map(item => {
      const optimized = { ...item };
      
      // Optimize resolution
      if (item.resolution) {
        optimized.resolution = this.deviceProfile.getOptimalResolution(item.resolution);
      }
      
      // Optimize bitrate
      if (item.bitrate) {
        optimized.bitrate = this.deviceProfile.getOptimalBitrate(item.bitrate);
      }
      
      // Optimize format
      optimized.format = this.deviceProfile.getOptimalFormat(item.type);
      
      return optimized;
    });
  }

  updatePlaylist(newPlaylist) {
    const wasPlaying = this.isPlaying;
    
    if (wasPlaying) {
      this.pausePlayback();
    }
    
    this.currentPlaylist = this.filterContentForDevice(newPlaylist);
    this.optimizeContent();
    
    // Reset to beginning if current content is no longer in playlist
    if (this.currentIndex >= this.currentPlaylist.length) {
      this.currentIndex = 0;
    }
    
    // Update preload manager
    this.preloadManager.updatePlaylist(this.currentPlaylist);
    
    if (wasPlaying) {
      this.resumePlayback();
    }
  }

  startPlayback() {
    if (this.currentPlaylist.length === 0) {
      console.warn('No content to play');
      return;
    }
    
    this.isPlaying = true;
    this.playCurrentContent();
  }

  pausePlayback() {
    this.isPlaying = false;
    const currentElement = this.frontBuffer.firstElementChild;
    if (currentElement && currentElement.tagName === 'VIDEO') {
      currentElement.pause();
    }
  }

  resumePlayback() {
    this.isPlaying = true;
    const currentElement = this.frontBuffer.firstElementChild;
    if (currentElement && currentElement.tagName === 'VIDEO') {
      currentElement.play();
    }
  }

  async playCurrentContent() {
    if (!this.isPlaying || this.currentPlaylist.length === 0) {
      return;
    }
    
    const currentItem = this.currentPlaylist[this.currentIndex];
    
    try {
      // Create content element
      const element = await this.createContentElement(currentItem);
      
      // Clear front buffer and add new content
      this.frontBuffer.innerHTML = '';
      this.frontBuffer.appendChild(element);
      
      // Start playback
      if (element.tagName === 'VIDEO') {
        element.play().catch(error => {
          console.error('Failed to play video:', error);
        });
      }
      
      // Schedule next content
      this.scheduleNextContent(currentItem.duration);
      
      // Report playback to server
      this.networkManager.reportPlayback(currentItem.id);
      
    } catch (error) {
      console.error('Failed to play content:', error);
      this.scheduleNextContent(5); // Skip to next after 5 seconds
    }
  }

  async createContentElement(item) {
    const element = document.createElement(item.type === 'video' ? 'video' : 'img');
    
    // Set common properties
    element.style.objectFit = "cover";
    element.style.width = "100%";
    element.style.height = "100%";
    
    if (item.type === 'video') {
      element.autoplay = false;
      element.controls = false;
      element.loop = true;
      element.muted = true;
      element.playsInline = true;
      
      // Set video properties
      if (item.bitrate) {
        element.dataset.bitrate = item.bitrate;
      }
      
      if (item.resolution) {
        element.dataset.resolution = item.resolution;
      }
    }
    
    // Set source with optimization
    const optimizedUrl = await this.getOptimizedUrl(item);
    element.src = optimizedUrl;
    
    return element;
  }

  async getOptimizedUrl(item) {
    // Check if we have a preloaded version
    const preloaded = this.preloadManager.getPreloadedContent(item.id);
    if (preloaded) {
      return preloaded.url;
    }
    
    // Get optimized URL from server
    return await this.networkManager.getOptimizedUrl(item.id, this.deviceProfile);
  }

  scheduleNextContent(duration) {
    setTimeout(() => {
      if (this.isPlaying) {
        this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.length;
        this.playCurrentContent();
      }
    }, duration * 1000);
  }

  onContentPreloaded(content) {
    console.log(`Content preloaded: ${content.id}`);
  }

  loadFallbackContent() {
    this.currentPlaylist = [
      new ContentItem('image', '/assets/fallback-image.jpg', 10),
      new ContentItem('video', '/assets/fallback-video.mp4', 15)
    ];
  }

  // Public methods for external control
  play() {
    this.startPlayback();
  }

  pause() {
    this.pausePlayback();
  }

  stop() {
    this.pausePlayback();
    this.currentIndex = 0;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.length;
    this.playCurrentContent();
  }

  previous() {
    this.currentIndex = this.currentIndex === 0 
      ? this.currentPlaylist.length - 1 
      : this.currentIndex - 1;
    this.playCurrentContent();
  }

  getCurrentContent() {
    return this.currentPlaylist[this.currentIndex] || null;
  }

  getPlaylist() {
    return [...this.currentPlaylist];
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      totalItems: this.currentPlaylist.length,
      deviceId: this.deviceId,
      networkId: this.networkId,
      subnetworkId: this.subnetworkId
    };
  }
}