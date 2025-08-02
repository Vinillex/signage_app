import { io } from 'socket.io-client';

export class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.networkId = null;
    this.subnetworkId = null;
    this.deviceId = null;
    
    this.eventListeners = {};
    this.contentCache = new Map();
    
    this.setupReconnection();
  }

  /**
   * Connect to the network
   */
  async connect(networkId, subnetworkId, deviceId) {
    this.networkId = networkId;
    this.subnetworkId = subnetworkId;
    this.deviceId = deviceId;
    
    try {
      // Initialize socket connection
      this.socket = io(process.env.SERVER_URL || 'http://localhost:3000', {
        query: {
          networkId,
          subnetworkId,
          deviceId
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });
      
      this.setupSocketListeners();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('Connected to network:', networkId);
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
      
    } catch (error) {
      console.error('Failed to connect to network:', error);
      throw error;
    }
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from network');
      this.emit('disconnected');
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      this.connected = true;
      console.log('Reconnected to network after', attemptNumber, 'attempts');
      this.emit('reconnected');
    });
    
    // Content events
    this.socket.on('contentUpdate', (data) => {
      console.log('Received content update:', data);
      this.handleContentUpdate(data);
    });
    
    this.socket.on('contentDelete', (contentId) => {
      console.log('Content deleted:', contentId);
      this.contentCache.delete(contentId);
      this.emit('contentDeleted', contentId);
    });
    
    // Device events
    this.socket.on('deviceUpdate', (data) => {
      console.log('Device updated:', data);
      this.emit('deviceUpdate', data);
    });
    
    this.socket.on('profileUpdate', (profile) => {
      console.log('Profile updated:', profile);
      this.emit('profileUpdate', profile);
    });
    
    // Network events
    this.socket.on('networkUpdate', (data) => {
      console.log('Network updated:', data);
      this.emit('networkUpdate', data);
    });
    
    // Sync events
    this.socket.on('syncRequest', (data) => {
      console.log('Sync requested:', data);
      this.handleSyncRequest(data);
    });
    
    this.socket.on('syncComplete', (data) => {
      console.log('Sync completed:', data);
      this.emit('syncComplete', data);
    });
  }

  /**
   * Setup reconnection logic
   */
  setupReconnection() {
    window.addEventListener('online', () => {
      if (!this.connected && this.socket) {
        this.socket.connect();
      }
    });
    
    window.addEventListener('offline', () => {
      this.connected = false;
      this.emit('offline');
    });
  }

  /**
   * Get content from server
   */
  async getContent() {
    try {
      const response = await fetch(`/api/networks/${this.networkId}/subnetworks/${this.subnetworkId}/content`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.json();
      
      // Cache content
      content.forEach(item => {
        this.contentCache.set(item.id, item);
      });
      
      return content;
    } catch (error) {
      console.error('Failed to get content:', error);
      
      // Return cached content if available
      if (this.contentCache.size > 0) {
        return Array.from(this.contentCache.values());
      }
      
      throw error;
    }
  }

  /**
   * Get optimized URL for content
   */
  async getOptimizedUrl(contentId, deviceProfile) {
    try {
      const params = new URLSearchParams({
        deviceId: this.deviceId,
        resolution: deviceProfile.resolution,
        format: deviceProfile.preferredFormat
      });
      
      if (deviceProfile.maxBitrate) {
        params.append('bitrate', deviceProfile.maxBitrate);
      }
      
      const response = await fetch(`/api/content/${contentId}/optimized?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Failed to get optimized URL:', error);
      
      // Return original URL as fallback
      const content = this.contentCache.get(contentId);
      return content ? content.url : null;
    }
  }

  /**
   * Report playback to server
   */
  async reportPlayback(contentId) {
    try {
      await fetch('/api/analytics/playback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          networkId: this.networkId,
          subnetworkId: this.subnetworkId,
          contentId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to report playback:', error);
    }
  }

  /**
   * Handle content update
   */
  handleContentUpdate(data) {
    // Update cache
    if (data.content) {
      this.contentCache.set(data.content.id, data.content);
    }
    
    // Emit event
    this.emit('contentUpdate', data.content);
  }

  /**
   * Handle sync request
   */
  async handleSyncRequest(data) {
    try {
      // Get current status
      const status = {
        deviceId: this.deviceId,
        networkId: this.networkId,
        subnetworkId: this.subnetworkId,
        timestamp: new Date().toISOString(),
        contentCache: Array.from(this.contentCache.keys())
      };
      
      // Send status to server
      this.socket.emit('syncStatus', status);
      
    } catch (error) {
      console.error('Failed to handle sync request:', error);
    }
  }

  /**
   * Request content sync
   */
  async requestSync() {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected to network');
    }
    
    this.socket.emit('syncRequest', {
      deviceId: this.deviceId,
      networkId: this.networkId,
      subnetworkId: this.subnetworkId
    });
  }

  /**
   * Send heartbeat
   */
  sendHeartbeat() {
    if (this.socket && this.connected) {
      this.socket.emit('heartbeat', {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(status) {
    try {
      await fetch(`/api/devices/${this.deviceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...status,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to update device status:', error);
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const response = await fetch(`/api/networks/${this.networkId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Get subnetwork information
   */
  async getSubnetworkInfo() {
    try {
      const response = await fetch(`/api/networks/${this.networkId}/subnetworks/${this.subnetworkId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get subnetwork info:', error);
      throw error;
    }
  }

  /**
   * Disconnect from network
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this.contentCache.clear();
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
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      networkId: this.networkId,
      subnetworkId: this.subnetworkId,
      deviceId: this.deviceId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Get cached content
   */
  getCachedContent() {
    return Array.from(this.contentCache.values());
  }

  /**
   * Clear content cache
   */
  clearCache() {
    this.contentCache.clear();
  }
}