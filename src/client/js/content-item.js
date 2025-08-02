export class ContentItem {
  /**
   * @param {string} id - Unique identifier for the content
   * @param {'video' | 'image' | 'web' | 'interactive'} type - The content type
   * @param {string} url - The URL or blob path of the content
   * @param {number} duration - Duration in seconds to display/play the content
   * @param {Object} options - Additional options for the content
   */
  constructor(id, type, url, duration, options = {}) {
    this.id = id;
    this.type = type;
    this.url = url;
    this.duration = duration;
    
    // Content metadata
    this.title = options.title || '';
    this.description = options.description || '';
    this.tags = options.tags || [];
    this.category = options.category || 'general';
    
    // Technical specifications
    this.resolution = options.resolution || null;
    this.bitrate = options.bitrate || null;
    this.format = options.format || null;
    this.fileSize = options.fileSize || null;
    
    // Display options
    this.objectFit = options.objectFit || 'cover';
    this.backgroundColor = options.backgroundColor || '#000000';
    this.transition = options.transition || 'fade';
    this.transitionDuration = options.transitionDuration || 0.3;
    
    // Scheduling options
    this.startDate = options.startDate || null;
    this.endDate = options.endDate || null;
    this.schedule = options.schedule || null; // Cron-like schedule
    this.priority = options.priority || 1;
    
    // Network hierarchy
    this.networkId = options.networkId || null;
    this.subnetworkId = options.subnetworkId || null;
    this.isGlobal = options.isGlobal || false;
    
    // Interactive options
    this.interactive = options.interactive || false;
    this.touchEnabled = options.touchEnabled || false;
    this.clickActions = options.clickActions || [];
    
    // Analytics
    this.viewCount = options.viewCount || 0;
    this.lastPlayed = options.lastPlayed || null;
    this.createdAt = options.createdAt || new Date();
    this.updatedAt = options.updatedAt || new Date();
  }

  /**
   * Check if content is currently active based on schedule
   */
  isActive() {
    const now = new Date();
    
    // Check date range
    if (this.startDate && now < new Date(this.startDate)) {
      return false;
    }
    
    if (this.endDate && now > new Date(this.endDate)) {
      return false;
    }
    
    // Check schedule
    if (this.schedule) {
      return this.isScheduledForNow();
    }
    
    return true;
  }

  /**
   * Check if content is scheduled for current time
   */
  isScheduledForNow() {
    if (!this.schedule) return true;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Simple schedule check - can be enhanced with cron parsing
    if (this.schedule.days && !this.schedule.days.includes(dayOfWeek)) {
      return false;
    }
    
    if (this.schedule.startTime && this.schedule.endTime) {
      const currentTime = hour * 60 + minute;
      const startTime = this.schedule.startTime.hour * 60 + this.schedule.startTime.minute;
      const endTime = this.schedule.endTime.hour * 60 + this.schedule.endTime.minute;
      
      return currentTime >= startTime && currentTime <= endTime;
    }
    
    return true;
  }

  /**
   * Get optimized URL for specific device profile
   */
  getOptimizedUrl(deviceProfile) {
    if (!deviceProfile) return this.url;
    
    // Add device-specific parameters to URL
    const url = new URL(this.url);
    
    if (deviceProfile.resolution) {
      url.searchParams.set('resolution', deviceProfile.resolution);
    }
    
    if (deviceProfile.maxBitrate) {
      url.searchParams.set('bitrate', deviceProfile.maxBitrate);
    }
    
    if (deviceProfile.preferredFormat) {
      url.searchParams.set('format', deviceProfile.preferredFormat);
    }
    
    return url.toString();
  }

  /**
   * Check if content is compatible with device profile
   */
  isCompatibleWith(deviceProfile) {
    if (!deviceProfile) return true;
    
    // Check format compatibility
    if (this.format && !deviceProfile.supportsFormat(this.format)) {
      return false;
    }
    
    // Check resolution compatibility
    if (this.resolution && !deviceProfile.supportsResolution(this.resolution)) {
      return false;
    }
    
    // Check bitrate compatibility
    if (this.bitrate && !deviceProfile.supportsBitrate(this.bitrate)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get content size in bytes
   */
  getSize() {
    return this.fileSize || 0;
  }

  /**
   * Get content duration in milliseconds
   */
  getDurationMs() {
    return this.duration * 1000;
  }

  /**
   * Check if content is a video
   */
  isVideo() {
    return this.type === 'video';
  }

  /**
   * Check if content is an image
   */
  isImage() {
    return this.type === 'image';
  }

  /**
   * Check if content is web content
   */
  isWeb() {
    return this.type === 'web';
  }

  /**
   * Check if content is interactive
   */
  isInteractive() {
    return this.type === 'interactive' || this.interactive;
  }

  /**
   * Increment view count
   */
  incrementViewCount() {
    this.viewCount++;
    this.lastPlayed = new Date();
  }

  /**
   * Get content statistics
   */
  getStats() {
    return {
      viewCount: this.viewCount,
      lastPlayed: this.lastPlayed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      fileSize: this.fileSize,
      duration: this.duration
    };
  }

  /**
   * Clone content item
   */
  clone() {
    return new ContentItem(
      this.id,
      this.type,
      this.url,
      this.duration,
      {
        title: this.title,
        description: this.description,
        tags: [...this.tags],
        category: this.category,
        resolution: this.resolution,
        bitrate: this.bitrate,
        format: this.format,
        fileSize: this.fileSize,
        objectFit: this.objectFit,
        backgroundColor: this.backgroundColor,
        transition: this.transition,
        transitionDuration: this.transitionDuration,
        startDate: this.startDate,
        endDate: this.endDate,
        schedule: this.schedule ? { ...this.schedule } : null,
        priority: this.priority,
        networkId: this.networkId,
        subnetworkId: this.subnetworkId,
        isGlobal: this.isGlobal,
        interactive: this.interactive,
        touchEnabled: this.touchEnabled,
        clickActions: [...this.clickActions],
        viewCount: this.viewCount,
        lastPlayed: this.lastPlayed,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      }
    );
  }

  /**
   * Returns a plain JSON object version of this instance
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      url: this.url,
      duration: this.duration,
      title: this.title,
      description: this.description,
      tags: this.tags,
      category: this.category,
      resolution: this.resolution,
      bitrate: this.bitrate,
      format: this.format,
      fileSize: this.fileSize,
      objectFit: this.objectFit,
      backgroundColor: this.backgroundColor,
      transition: this.transition,
      transitionDuration: this.transitionDuration,
      startDate: this.startDate,
      endDate: this.endDate,
      schedule: this.schedule,
      priority: this.priority,
      networkId: this.networkId,
      subnetworkId: this.subnetworkId,
      isGlobal: this.isGlobal,
      interactive: this.interactive,
      touchEnabled: this.touchEnabled,
      clickActions: this.clickActions,
      viewCount: this.viewCount,
      lastPlayed: this.lastPlayed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a ContentItem from a plain object (e.g., from localStorage or JSON)
   * @param {Object} obj
   * @returns {ContentItem}
   */
  static fromJSON(obj) {
    return new ContentItem(
      obj.id,
      obj.type,
      obj.url,
      obj.duration,
      {
        title: obj.title,
        description: obj.description,
        tags: obj.tags,
        category: obj.category,
        resolution: obj.resolution,
        bitrate: obj.bitrate,
        format: obj.format,
        fileSize: obj.fileSize,
        objectFit: obj.objectFit,
        backgroundColor: obj.backgroundColor,
        transition: obj.transition,
        transitionDuration: obj.transitionDuration,
        startDate: obj.startDate,
        endDate: obj.endDate,
        schedule: obj.schedule,
        priority: obj.priority,
        networkId: obj.networkId,
        subnetworkId: obj.subnetworkId,
        isGlobal: obj.isGlobal,
        interactive: obj.interactive,
        touchEnabled: obj.touchEnabled,
        clickActions: obj.clickActions,
        viewCount: obj.viewCount,
        lastPlayed: obj.lastPlayed,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt
      }
    );
  }

  /**
   * Create a content item from file upload
   */
  static fromFile(file, options = {}) {
    const id = options.id || crypto.randomUUID();
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const url = URL.createObjectURL(file);
    
    return new ContentItem(id, type, url, options.duration || 10, {
      title: options.title || file.name,
      fileSize: file.size,
      format: file.type,
      ...options
    });
  }
}