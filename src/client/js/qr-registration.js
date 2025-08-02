import QRCode from 'qrcode';

export class QRRegistration {
  constructor() {
    this.deviceId = null;
    this.registrationUrl = null;
    this.qrCodeElement = null;
    this.registrationStatus = 'waiting';
    this.pollInterval = null;
    this.maxPollAttempts = 60; // 5 minutes at 5-second intervals
    this.pollAttempts = 0;
    
    this.eventListeners = {};
  }

  /**
   * Initialize QR registration
   */
  async initialize() {
    try {
      // Generate device ID if not exists
      this.deviceId = this.getDeviceId();
      
      // Get registration URL from server
      await this.getRegistrationUrl();
      
      // Generate QR code
      await this.generateQRCode();
      
      // Start polling for registration
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize QR registration:', error);
      return false;
    }
  }

  /**
   * Get or generate device ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Generate unique device ID
   */
  generateDeviceId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const userAgent = navigator.userAgent.substring(0, 10);
    
    return `device_${timestamp}_${random}_${userAgent}`;
  }

  /**
   * Get registration URL from server
   */
  async getRegistrationUrl() {
    try {
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          deviceInfo: this.getDeviceInfo()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.registrationUrl = data.registrationUrl;
      
      return data;
    } catch (error) {
      console.error('Failed to get registration URL:', error);
      throw error;
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate QR code
   */
  async generateQRCode() {
    if (!this.registrationUrl) {
      throw new Error('Registration URL not available');
    }
    
    try {
      // Create QR code element
      this.qrCodeElement = document.createElement('div');
      this.qrCodeElement.id = 'qrCode';
      this.qrCodeElement.className = 'qr-code-container';
      
      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(this.registrationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create QR code image
      const qrImage = document.createElement('img');
      qrImage.src = qrCodeDataURL;
      qrImage.alt = 'Device Registration QR Code';
      qrImage.className = 'qr-code-image';
      
      // Create instruction text
      const instructionText = document.createElement('p');
      instructionText.className = 'qr-instruction';
      instructionText.textContent = 'Scan this QR code with your mobile app to register this device';
      
      // Create device ID display
      const deviceIdText = document.createElement('p');
      deviceIdText.className = 'device-id';
      deviceIdText.textContent = `Device ID: ${this.deviceId}`;
      
      // Create status indicator
      const statusIndicator = document.createElement('div');
      statusIndicator.className = 'status-indicator';
      statusIndicator.id = 'statusIndicator';
      
      // Assemble QR code container
      this.qrCodeElement.appendChild(qrImage);
      this.qrCodeElement.appendChild(instructionText);
      this.qrCodeElement.appendChild(deviceIdText);
      this.qrCodeElement.appendChild(statusIndicator);
      
      // Add to page
      const container = document.getElementById('signageContainer');
      container.appendChild(this.qrCodeElement);
      
      // Add styles
      this.addStyles();
      
      // Update status
      this.updateStatus('waiting');
      
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  /**
   * Add CSS styles for QR code
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .qr-code-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        text-align: center;
        z-index: 1000;
        max-width: 400px;
        width: 90%;
      }
      
      .qr-code-image {
        max-width: 300px;
        width: 100%;
        height: auto;
        border: 2px solid #ddd;
        border-radius: 10px;
      }
      
      .qr-instruction {
        margin: 20px 0 10px 0;
        font-size: 16px;
        color: #333;
        font-weight: 500;
      }
      
      .device-id {
        margin: 10px 0;
        font-size: 12px;
        color: #666;
        font-family: monospace;
        word-break: break-all;
      }
      
      .status-indicator {
        margin-top: 15px;
        padding: 10px;
        border-radius: 5px;
        font-weight: 500;
      }
      
      .status-waiting {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      .status-registering {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      
      .status-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .status-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .fade-out {
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      
      .fade-in {
        opacity: 1;
        transition: opacity 0.5s ease;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Start polling for registration status
   */
  startPolling() {
    this.pollInterval = setInterval(() => {
      this.checkRegistrationStatus();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Check registration status
   */
  async checkRegistrationStatus() {
    try {
      const response = await fetch(`/api/devices/${this.deviceId}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.registered) {
        this.handleRegistrationSuccess(data);
      } else {
        this.pollAttempts++;
        
        if (this.pollAttempts >= this.maxPollAttempts) {
          this.handleRegistrationTimeout();
        }
      }
      
    } catch (error) {
      console.error('Failed to check registration status:', error);
      this.pollAttempts++;
      
      if (this.pollAttempts >= this.maxPollAttempts) {
        this.handleRegistrationTimeout();
      }
    }
  }

  /**
   * Handle successful registration
   */
  handleRegistrationSuccess(data) {
    this.registrationStatus = 'success';
    this.updateStatus('success', 'Device registered successfully!');
    
    // Stop polling
    this.stopPolling();
    
    // Store registration data
    localStorage.setItem('networkId', data.networkId);
    localStorage.setItem('subnetworkId', data.subnetworkId);
    localStorage.setItem('deviceToken', data.deviceToken);
    
    // Emit success event
    this.emit('registrationSuccess', data);
    
    // Fade out QR code after 3 seconds
    setTimeout(() => {
      this.fadeOut();
    }, 3000);
  }

  /**
   * Handle registration timeout
   */
  handleRegistrationTimeout() {
    this.registrationStatus = 'timeout';
    this.updateStatus('error', 'Registration timeout. Please try again.');
    
    // Stop polling
    this.stopPolling();
    
    // Emit timeout event
    this.emit('registrationTimeout');
    
    // Show retry button
    this.showRetryButton();
  }

  /**
   * Handle registration error
   */
  handleRegistrationError(error) {
    this.registrationStatus = 'error';
    this.updateStatus('error', 'Registration failed. Please try again.');
    
    // Stop polling
    this.stopPolling();
    
    // Emit error event
    this.emit('registrationError', error);
    
    // Show retry button
    this.showRetryButton();
  }

  /**
   * Update status display
   */
  updateStatus(status, message = '') {
    this.registrationStatus = status;
    
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator status-${status}`;
      
      switch (status) {
        case 'waiting':
          statusIndicator.textContent = 'Waiting for registration...';
          break;
        case 'registering':
          statusIndicator.textContent = 'Registration in progress...';
          break;
        case 'success':
          statusIndicator.textContent = message || 'Registration successful!';
          break;
        case 'error':
          statusIndicator.textContent = message || 'Registration failed';
          break;
        case 'timeout':
          statusIndicator.textContent = message || 'Registration timeout';
          break;
      }
    }
  }

  /**
   * Show retry button
   */
  showRetryButton() {
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry Registration';
    retryButton.className = 'retry-button';
    retryButton.onclick = () => this.retryRegistration();
    
    const container = document.getElementById('qrCode');
    if (container) {
      container.appendChild(retryButton);
    }
    
    // Add retry button styles
    const style = document.createElement('style');
    style.textContent = `
      .retry-button {
        margin-top: 15px;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .retry-button:hover {
        background: #0056b3;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Retry registration
   */
  async retryRegistration() {
    try {
      // Reset state
      this.pollAttempts = 0;
      this.registrationStatus = 'waiting';
      
      // Get new registration URL
      await this.getRegistrationUrl();
      
      // Regenerate QR code
      await this.regenerateQRCode();
      
      // Start polling again
      this.startPolling();
      
    } catch (error) {
      console.error('Failed to retry registration:', error);
      this.handleRegistrationError(error);
    }
  }

  /**
   * Regenerate QR code
   */
  async regenerateQRCode() {
    if (this.qrCodeElement) {
      this.qrCodeElement.remove();
    }
    
    await this.generateQRCode();
  }

  /**
   * Fade out QR code
   */
  fadeOut() {
    if (this.qrCodeElement) {
      this.qrCodeElement.classList.add('fade-out');
      
      setTimeout(() => {
        if (this.qrCodeElement) {
          this.qrCodeElement.remove();
        }
      }, 500);
    }
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Get registration status
   */
  getStatus() {
    return {
      deviceId: this.deviceId,
      registrationStatus: this.registrationStatus,
      pollAttempts: this.pollAttempts,
      maxPollAttempts: this.maxPollAttempts
    };
  }

  /**
   * Check if device is registered
   */
  isRegistered() {
    return localStorage.getItem('deviceToken') !== null;
  }

  /**
   * Get registration data
   */
  getRegistrationData() {
    if (!this.isRegistered()) {
      return null;
    }
    
    return {
      deviceId: this.deviceId,
      networkId: localStorage.getItem('networkId'),
      subnetworkId: localStorage.getItem('subnetworkId'),
      deviceToken: localStorage.getItem('deviceToken')
    };
  }

  /**
   * Clear registration data
   */
  clearRegistrationData() {
    localStorage.removeItem('networkId');
    localStorage.removeItem('subnetworkId');
    localStorage.removeItem('deviceToken');
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
          console.error('Error in QR registration event listener:', error);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopPolling();
    
    if (this.qrCodeElement) {
      this.qrCodeElement.remove();
    }
    
    this.eventListeners = {};
  }
}