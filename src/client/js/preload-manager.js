export class PreloadManager {
  constructor() {
    this.preloadedContent = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxPreloadItems = 3;
    this.preloadTimeout = 30000; // 30 seconds
    this.eventListeners = {};
    
    this.setupStorage();
  }

  /**
   * Setup local storage for preloaded content
   */
  setupStorage() {
    // Check if IndexedDB is available
    if ('indexedDB' in window) {
      this.initIndexedDB();
    } else {
      console.warn('IndexedDB not available, using memory storage');
    }
  }

  /**
   * Initialize IndexedDB for content storage
   */
  async initIndexedDB() {
    try {
      const request = indexedDB.open('SignagePreload', 1);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('IndexedDB initialized for preload storage');
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for preloaded content
        if (!db.objectStoreNames.contains('preloadedContent')) {
          const store = db.createObjectStore('preloadedContent', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Start preloading content
   */
  start(playlist, deviceProfile) {
    this.playlist = playlist;
    this.deviceProfile = deviceProfile;
    
    // Clear existing preload queue
    this.preloadQueue = [];
    
    // Add all content to preload queue
    playlist.forEach((item, index) => {
      this.preloadQueue.push({
        item,
        index,
        priority: this.calculatePriority(index, item)
      });
    });
    
    // Sort by priority
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // Start preloading
    this.processPreloadQueue();
  }

  /**
   * Calculate preload priority
   */
  calculatePriority(index, item) {
    let priority = 0;
    
    // Higher priority for next items
    if (index <= 2) {
      priority += 100 - (index * 10);
    }
    
    // Higher priority for videos (take longer to load)
    if (item.type === 'video') {
      priority += 50;
    }
    
    // Higher priority for larger files
    if (item.fileSize) {
      priority += Math.min(item.fileSize / 1024 / 1024, 50); // Max 50 points for size
    }
    
    // Higher priority for high bitrate content
    if (item.bitrate) {
      priority += Math.min(item.bitrate / 1000, 30); // Max 30 points for bitrate
    }
    
    return priority;
  }

  /**
   * Process preload queue
   */
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }
    
    this.isPreloading = true;
    
    try {
      // Preload next few items
      const itemsToPreload = this.preloadQueue.slice(0, this.maxPreloadItems);
      
      const preloadPromises = itemsToPreload.map(async (queueItem) => {
        try {
          await this.preloadContent(queueItem.item);
          
          // Remove from queue
          const index = this.preloadQueue.findIndex(item => item.item.id === queueItem.item.id);
          if (index > -1) {
            this.preloadQueue.splice(index, 1);
          }
          
        } catch (error) {
          console.error('Failed to preload content:', queueItem.item.id, error);
        }
      });
      
      await Promise.allSettled(preloadPromises);
      
    } catch (error) {
      console.error('Error processing preload queue:', error);
    } finally {
      this.isPreloading = false;
      
      // Continue processing if there are more items
      if (this.preloadQueue.length > 0) {
        setTimeout(() => {
          this.processPreloadQueue();
        }, 1000);
      }
    }
  }

  /**
   * Preload individual content item
   */
  async preloadContent(item) {
    if (this.preloadedContent.has(item.id)) {
      return this.preloadedContent.get(item.id);
    }
    
    try {
      const preloadedItem = await this.loadContent(item);
      
      // Store in memory
      this.preloadedContent.set(item.id, preloadedItem);
      
      // Store in IndexedDB if available
      if (this.db) {
        await this.storeInIndexedDB(item.id, preloadedItem);
      }
      
      // Emit event
      this.emit('contentReady', preloadedItem);
      
      return preloadedItem;
      
    } catch (error) {
      console.error('Failed to preload content:', item.id, error);
      throw error;
    }
  }

  /**
   * Load content based on type
   */
  async loadContent(item) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Preload timeout')), this.preloadTimeout);
    });
    
    const loadPromise = this.loadContentByType(item);
    
    try {
      const result = await Promise.race([loadPromise, timeoutPromise]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load content by type
   */
  async loadContentByType(item) {
    switch (item.type) {
      case 'video':
        return await this.loadVideo(item);
      case 'image':
        return await this.loadImage(item);
      case 'web':
        return await this.loadWebContent(item);
      default:
        throw new Error(`Unsupported content type: ${item.type}`);
    }
  }

  /**
   * Load video content
   */
  async loadVideo(item) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      
      video.onloadedmetadata = () => {
        const preloadedItem = {
          id: item.id,
          type: 'video',
          url: video.src,
          element: video,
          metadata: {
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight
          },
          loadedAt: new Date()
        };
        
        resolve(preloadedItem);
      };
      
      video.onerror = () => {
        reject(new Error(`Failed to load video: ${item.url}`));
      };
      
      video.src = item.url;
    });
  }

  /**
   * Load image content
   */
  async loadImage(item) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const preloadedItem = {
          id: item.id,
          type: 'image',
          url: img.src,
          element: img,
          metadata: {
            width: img.naturalWidth,
            height: img.naturalHeight
          },
          loadedAt: new Date()
        };
        
        resolve(preloadedItem);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${item.url}`));
      };
      
      img.src = item.url;
    });
  }

  /**
   * Load web content
   */
  async loadWebContent(item) {
    // For web content, we might just store the URL
    const preloadedItem = {
      id: item.id,
      type: 'web',
      url: item.url,
      metadata: {
        url: item.url
      },
      loadedAt: new Date()
    };
    
    return preloadedItem;
  }

  /**
   * Get preloaded content
   */
  getPreloadedContent(contentId) {
    return this.preloadedContent.get(contentId);
  }

  /**
   * Check if content is preloaded
   */
  isPreloaded(contentId) {
    return this.preloadedContent.has(contentId);
  }

  /**
   * Update playlist and adjust preload queue
   */
  updatePlaylist(newPlaylist) {
    this.playlist = newPlaylist;
    
    // Update preload queue
    const newQueue = [];
    
    newPlaylist.forEach((item, index) => {
      newQueue.push({
        item,
        index,
        priority: this.calculatePriority(index, item)
      });
    });
    
    // Sort by priority
    newQueue.sort((a, b) => b.priority - a.priority);
    
    this.preloadQueue = newQueue;
    
    // Continue processing
    this.processPreloadQueue();
  }

  /**
   * Store content in IndexedDB
   */
  async storeInIndexedDB(id, content) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['preloadedContent'], 'readwrite');
      const store = transaction.objectStore('preloadedContent');
      
      await store.put({
        id,
        content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to store in IndexedDB:', error);
    }
  }

  /**
   * Load content from IndexedDB
   */
  async loadFromIndexedDB(id) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['preloadedContent'], 'readonly');
      const store = transaction.objectStore('preloadedContent');
      const result = await store.get(id);
      
      return result ? result.content : null;
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Clear old preloaded content
   */
  clearOldContent() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, content] of this.preloadedContent.entries()) {
      if (now - content.loadedAt > maxAge) {
        this.preloadedContent.delete(id);
      }
    }
    
    // Clear from IndexedDB
    if (this.db) {
      this.clearOldFromIndexedDB(maxAge);
    }
  }

  /**
   * Clear old content from IndexedDB
   */
  async clearOldFromIndexedDB(maxAge) {
    try {
      const transaction = this.db.transaction(['preloadedContent'], 'readwrite');
      const store = transaction.objectStore('preloadedContent');
      const index = store.index('timestamp');
      
      const cutoff = new Date(Date.now() - maxAge).toISOString();
      const range = IDBKeyRange.upperBound(cutoff);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Failed to clear old content from IndexedDB:', error);
    }
  }

  /**
   * Get preload statistics
   */
  getStats() {
    return {
      preloadedCount: this.preloadedContent.size,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      maxPreloadItems: this.maxPreloadItems
    };
  }

  /**
   * Clear all preloaded content
   */
  clear() {
    this.preloadedContent.clear();
    this.preloadQueue = [];
    this.isPreloading = false;
    
    // Clear from IndexedDB
    if (this.db) {
      this.clearIndexedDB();
    }
  }

  /**
   * Clear IndexedDB
   */
  async clearIndexedDB() {
    try {
      const transaction = this.db.transaction(['preloadedContent'], 'readwrite');
      const store = transaction.objectStore('preloadedContent');
      await store.clear();
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in preload event listener:', error);
        }
      });
    }
  }
}