export class DeviceProfile {
  constructor() {
    this.deviceId = null;
    this.model = null;
    this.manufacturer = null;
    this.os = null;
    this.osVersion = null;
    this.browser = null;
    this.browserVersion = null;
    
    // Display capabilities
    this.resolution = null;
    this.refreshRate = null;
    this.colorDepth = null;
    this.pixelRatio = null;
    
    // Media capabilities
    this.supportedFormats = [];
    this.maxBitrate = null;
    this.preferredFormat = null;
    this.codecSupport = {};
    
    // Hardware capabilities
    this.cpu = null;
    this.memory = null;
    this.storage = null;
    this.network = null;
    
    // Custom settings
    this.customSettings = {};
    
    this.autoDetect();
  }

  /**
   * Auto-detect device capabilities
   */
  autoDetect() {
    this.detectOS();
    this.detectBrowser();
    this.detectDisplay();
    this.detectMediaCapabilities();
    this.detectHardware();
  }

  /**
   * Detect operating system
   */
  detectOS() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) {
      this.os = 'Windows';
      this.osVersion = this.extractVersion(userAgent, 'Windows NT ');
    } else if (userAgent.includes('Mac OS X')) {
      this.os = 'macOS';
      this.osVersion = this.extractVersion(userAgent, 'Mac OS X ');
    } else if (userAgent.includes('Linux')) {
      this.os = 'Linux';
      this.osVersion = this.extractVersion(userAgent, 'Linux ');
    } else if (userAgent.includes('Android')) {
      this.os = 'Android';
      this.osVersion = this.extractVersion(userAgent, 'Android ');
    } else if (userAgent.includes('iOS')) {
      this.os = 'iOS';
      this.osVersion = this.extractVersion(userAgent, 'OS ');
    } else if (userAgent.includes('Tizen')) {
      this.os = 'Tizen';
      this.osVersion = this.extractVersion(userAgent, 'Tizen ');
    } else if (userAgent.includes('WebOS')) {
      this.os = 'WebOS';
      this.osVersion = this.extractVersion(userAgent, 'WebOS ');
    } else {
      this.os = 'Unknown';
    }
  }

  /**
   * Detect browser
   */
  detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      this.browser = 'Chrome';
      this.browserVersion = this.extractVersion(userAgent, 'Chrome/');
    } else if (userAgent.includes('Firefox')) {
      this.browser = 'Firefox';
      this.browserVersion = this.extractVersion(userAgent, 'Firefox/');
    } else if (userAgent.includes('Safari')) {
      this.browser = 'Safari';
      this.browserVersion = this.extractVersion(userAgent, 'Version/');
    } else if (userAgent.includes('Edge')) {
      this.browser = 'Edge';
      this.browserVersion = this.extractVersion(userAgent, 'Edge/');
    } else {
      this.browser = 'Unknown';
    }
  }

  /**
   * Detect display capabilities
   */
  detectDisplay() {
    this.resolution = `${screen.width}x${screen.height}`;
    this.colorDepth = screen.colorDepth;
    this.pixelRatio = window.devicePixelRatio || 1;
    
    // Try to detect refresh rate
    this.detectRefreshRate();
  }

  /**
   * Detect refresh rate using requestAnimationFrame
   */
  async detectRefreshRate() {
    const start = performance.now();
    let frames = 0;
    
    return new Promise((resolve) => {
      const measure = () => {
        frames++;
        if (frames >= 60) {
          const end = performance.now();
          const duration = end - start;
          this.refreshRate = Math.round((frames / duration) * 1000);
          resolve(this.refreshRate);
        } else {
          requestAnimationFrame(measure);
        }
      };
      requestAnimationFrame(measure);
    });
  }

  /**
   * Detect media capabilities
   */
  async detectMediaCapabilities() {
    // Video formats
    const videoFormats = [
      'video/mp4; codecs="avc1.42E01E"',
      'video/webm; codecs="vp8"',
      'video/webm; codecs="vp9"',
      'video/ogg; codecs="theora"',
      'video/mp4; codecs="hevc.1.6.L93.B0"',
      'video/mp4; codecs="av01.0.08M.08"'
    ];
    
    // Image formats
    const imageFormats = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ];
    
    this.supportedFormats = [];
    
    // Check video formats
    for (const format of videoFormats) {
      if (document.createElement('video').canPlayType(format) !== '') {
        this.supportedFormats.push(format);
      }
    }
    
    // Check image formats
    for (const format of imageFormats) {
      this.supportedFormats.push(format);
    }
    
    // Set preferred format
    this.setPreferredFormat();
    
    // Detect codec support
    this.detectCodecSupport();
  }

  /**
   * Detect codec support
   */
  detectCodecSupport() {
    const video = document.createElement('video');
    
    this.codecSupport = {
      h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
      h265: video.canPlayType('video/mp4; codecs="hevc.1.6.L93.B0"') !== '',
      vp8: video.canPlayType('video/webm; codecs="vp8"') !== '',
      vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
      av1: video.canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '',
      theora: video.canPlayType('video/ogg; codecs="theora"') !== ''
    };
  }

  /**
   * Set preferred format based on capabilities
   */
  setPreferredFormat() {
    // Priority order for video formats
    const videoPriority = [
      'video/mp4; codecs="avc1.42E01E"', // H.264
      'video/webm; codecs="vp9"',        // VP9
      'video/mp4; codecs="hevc.1.6.L93.B0"', // H.265
      'video/webm; codecs="vp8"',        // VP8
      'video/ogg; codecs="theora"'       // Theora
    ];
    
    for (const format of videoPriority) {
      if (this.supportedFormats.includes(format)) {
        this.preferredFormat = format;
        break;
      }
    }
    
    if (!this.preferredFormat) {
      this.preferredFormat = 'video/mp4; codecs="avc1.42E01E"';
    }
  }

  /**
   * Detect hardware capabilities
   */
  detectHardware() {
    // Memory
    if (navigator.deviceMemory) {
      this.memory = navigator.deviceMemory;
    }
    
    // CPU cores
    if (navigator.hardwareConcurrency) {
      this.cpu = navigator.hardwareConcurrency;
    }
    
    // Storage
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        this.storage = estimate;
      });
    }
    
    // Network
    if (navigator.connection) {
      this.network = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
  }

  /**
   * Load device profile from server
   */
  async load(deviceId) {
    try {
      const response = await fetch(`/api/devices/${deviceId}/profile`);
      const profile = await response.json();
      
      this.deviceId = deviceId;
      this.update(profile);
      
      return true;
    } catch (error) {
      console.error('Failed to load device profile:', error);
      return false;
    }
  }

  /**
   * Update device profile
   */
  update(profile) {
    Object.assign(this, profile);
  }

  /**
   * Save device profile to server
   */
  async save() {
    try {
      const response = await fetch(`/api/devices/${this.deviceId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.toJSON())
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to save device profile:', error);
      return false;
    }
  }

  /**
   * Check if device supports a specific format
   */
  supportsFormat(format) {
    return this.supportedFormats.includes(format);
  }

  /**
   * Check if device supports a specific resolution
   */
  supportsResolution(resolution) {
    if (!resolution) return true;
    
    const [width, height] = resolution.split('x').map(Number);
    const [screenWidth, screenHeight] = this.resolution.split('x').map(Number);
    
    return width <= screenWidth && height <= screenHeight;
  }

  /**
   * Check if device supports a specific bitrate
   */
  supportsBitrate(bitrate) {
    if (!this.maxBitrate || !bitrate) return true;
    
    return bitrate <= this.maxBitrate;
  }

  /**
   * Get optimal resolution for content
   */
  getOptimalResolution(contentResolution) {
    if (!contentResolution) return this.resolution;
    
    const [contentWidth, contentHeight] = contentResolution.split('x').map(Number);
    const [screenWidth, screenHeight] = this.resolution.split('x').map(Number);
    
    // If content is smaller than screen, use content resolution
    if (contentWidth <= screenWidth && contentHeight <= screenHeight) {
      return contentResolution;
    }
    
    // Otherwise, scale down to fit screen
    const scale = Math.min(screenWidth / contentWidth, screenHeight / contentHeight);
    const optimalWidth = Math.round(contentWidth * scale);
    const optimalHeight = Math.round(contentHeight * scale);
    
    return `${optimalWidth}x${optimalHeight}`;
  }

  /**
   * Get optimal bitrate for content
   */
  getOptimalBitrate(contentBitrate) {
    if (!this.maxBitrate || !contentBitrate) return contentBitrate;
    
    return Math.min(contentBitrate, this.maxBitrate);
  }

  /**
   * Get optimal format for content type
   */
  getOptimalFormat(contentType) {
    if (contentType === 'video') {
      return this.preferredFormat;
    }
    
    return contentType;
  }

  /**
   * Get device capabilities summary
   */
  getCapabilities() {
    return {
      os: this.os,
      browser: this.browser,
      resolution: this.resolution,
      refreshRate: this.refreshRate,
      supportedFormats: this.supportedFormats,
      codecSupport: this.codecSupport,
      memory: this.memory,
      cpu: this.cpu,
      network: this.network
    };
  }

  /**
   * Extract version from user agent string
   */
  extractVersion(userAgent, prefix) {
    const index = userAgent.indexOf(prefix);
    if (index === -1) return null;
    
    const versionStart = index + prefix.length;
    const versionEnd = userAgent.indexOf(' ', versionStart);
    const version = userAgent.substring(versionStart, versionEnd !== -1 ? versionEnd : undefined);
    
    return version.replace(/[;_]/g, '.');
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      deviceId: this.deviceId,
      model: this.model,
      manufacturer: this.manufacturer,
      os: this.os,
      osVersion: this.osVersion,
      browser: this.browser,
      browserVersion: this.browserVersion,
      resolution: this.resolution,
      refreshRate: this.refreshRate,
      colorDepth: this.colorDepth,
      pixelRatio: this.pixelRatio,
      supportedFormats: this.supportedFormats,
      maxBitrate: this.maxBitrate,
      preferredFormat: this.preferredFormat,
      codecSupport: this.codecSupport,
      cpu: this.cpu,
      memory: this.memory,
      storage: this.storage,
      network: this.network,
      customSettings: this.customSettings
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    const profile = new DeviceProfile();
    Object.assign(profile, json);
    return profile;
  }
}