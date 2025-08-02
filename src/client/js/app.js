import { ContentManagementSystem } from './content-management.js';
import { QRRegistration } from './qr-registration.js';
import { DeviceProfile } from './device-profile.js';

export class DigitalSignageApp {
  constructor() {
    this.contentManager = null;
    this.qrRegistration = null;
    this.deviceProfile = null;
    
    this.appState = 'initializing';
    this.isInitialized = false;
    
    this.eventListeners = {};
    
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing Digital Signage App...');
      
      // Initialize device profile
      this.deviceProfile = new DeviceProfile();
      
      // Check if device is already registered
      if (this.isDeviceRegistered()) {
        await this.startContentPlayback();
      } else {
        await this.startRegistration();
      }
      
      this.isInitialized = true;
      this.appState = 'ready';
      
      console.log('Digital Signage App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Digital Signage App:', error);
      this.appState = 'error';
      this.handleInitializationError(error);
    }
  }

  /**
   * Check if device is registered
   */
  isDeviceRegistered() {
    const deviceToken = localStorage.getItem('deviceToken');
    const networkId = localStorage.getItem('networkId');
    const subnetworkId = localStorage.getItem('subnetworkId');
    
    return deviceToken && networkId && subnetworkId;
  }

  /**
   * Start QR code registration
   */
  async startRegistration() {
    try {
      this.appState = 'registering';
      
      this.qrRegistration = new QRRegistration();
      
      // Listen for registration events
      this.qrRegistration.on('registrationSuccess', (data) => {
        this.handleRegistrationSuccess(data);
      });
      
      this.qrRegistration.on('registrationError', (error) => {
        this.handleRegistrationError(error);
      });
      
      this.qrRegistration.on('registrationTimeout', () => {
        this.handleRegistrationTimeout();
      });
      
      // Initialize QR registration
      await this.qrRegistration.initialize();
      
    } catch (error) {
      console.error('Failed to start registration:', error);
      this.handleRegistrationError(error);
    }
  }

  /**
   * Handle successful registration
   */
  async handleRegistrationSuccess(data) {
    try {
      console.log('Device registered successfully:', data);
      
      // Start content playback
      await this.startContentPlayback();
      
    } catch (error) {
      console.error('Failed to start content playback after registration:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Handle registration error
   */
  handleRegistrationError(error) {
    console.error('Registration failed:', error);
    this.appState = 'registration_error';
    
    // Show error message to user
    this.showErrorMessage('Registration failed. Please try again.');
  }

  /**
   * Handle registration timeout
   */
  handleRegistrationTimeout() {
    console.log('Registration timeout');
    this.appState = 'registration_timeout';
    
    // Show timeout message to user
    this.showErrorMessage('Registration timeout. Please try again.');
  }

  /**
   * Start content playback
   */
  async startContentPlayback() {
    try {
      this.appState = 'loading_content';
      
      // Get registration data
      const registrationData = this.getRegistrationData();
      
      if (!registrationData) {
        throw new Error('No registration data available');
      }
      
      // Initialize content management system
      this.contentManager = new ContentManagementSystem();
      
      // Listen for content manager events
      this.contentManager.networkManager.on('disconnected', () => {
        this.handleNetworkDisconnection();
      });
      
      this.contentManager.networkManager.on('reconnected', () => {
        this.handleNetworkReconnection();
      });
      
      this.contentManager.networkManager.on('offline', () => {
        this.handleOfflineMode();
      });
      
      // Initialize content manager
      await this.contentManager.initialize(
        registrationData.deviceId,
        registrationData.networkId,
        registrationData.subnetworkId
      );
      
      this.appState = 'playing';
      console.log('Content playback started successfully');
      
    } catch (error) {
      console.error('Failed to start content playback:', error);
      this.handleContentPlaybackError(error);
    }
  }

  /**
   * Get registration data
   */
  getRegistrationData() {
    if (this.qrRegistration) {
      return this.qrRegistration.getRegistrationData();
    }
    
    // Fallback to localStorage
    const deviceId = localStorage.getItem('deviceId');
    const networkId = localStorage.getItem('networkId');
    const subnetworkId = localStorage.getItem('subnetworkId');
    const deviceToken = localStorage.getItem('deviceToken');
    
    if (deviceId && networkId && subnetworkId && deviceToken) {
      return {
        deviceId,
        networkId,
        subnetworkId,
        deviceToken
      };
    }
    
    return null;
  }

  /**
   * Handle network disconnection
   */
  handleNetworkDisconnection() {
    console.log('Network disconnected');
    this.appState = 'disconnected';
    
    // Show disconnection message
    this.showStatusMessage('Network disconnected. Attempting to reconnect...');
  }

  /**
   * Handle network reconnection
   */
  handleNetworkReconnection() {
    console.log('Network reconnected');
    this.appState = 'playing';
    
    // Hide disconnection message
    this.hideStatusMessage();
  }

  /**
   * Handle offline mode
   */
  handleOfflineMode() {
    console.log('Device is offline');
    this.appState = 'offline';
    
    // Show offline message
    this.showStatusMessage('Device is offline. Playing cached content.');
  }

  /**
   * Handle content playback error
   */
  handleContentPlaybackError(error) {
    console.error('Content playback error:', error);
    this.appState = 'playback_error';
    
    // Show error message
    this.showErrorMessage('Failed to load content. Please check your connection.');
  }

  /**
   * Handle initialization error
   */
  handleInitializationError(error) {
    console.error('Initialization error:', error);
    this.appState = 'error';
    
    // Show error message
    this.showErrorMessage('Failed to initialize application. Please refresh the page.');
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showStatusMessage(message, 'error');
  }

  /**
   * Show status message
   */
  showStatusMessage(message, type = 'info') {
    // Remove existing status message
    this.hideStatusMessage();
    
    const statusElement = document.createElement('div');
    statusElement.id = 'statusMessage';
    statusElement.className = `status-message status-${type}`;
    statusElement.textContent = message;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .status-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1001;
        max-width: 80%;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .status-info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      
      .status-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .status-warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(statusElement);
    
    // Auto-hide after 10 seconds for info messages
    if (type === 'info') {
      setTimeout(() => {
        this.hideStatusMessage();
      }, 10000);
    }
  }

  /**
   * Hide status message
   */
  hideStatusMessage() {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
      statusElement.remove();
    }
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      appState: this.appState,
      isInitialized: this.isInitialized,
      deviceProfile: this.deviceProfile ? this.deviceProfile.getCapabilities() : null,
      contentManager: this.contentManager ? this.contentManager.getStatus() : null,
      qrRegistration: this.qrRegistration ? this.qrRegistration.getStatus() : null
    };
  }

  /**
   * Restart application
   */
  async restart() {
    try {
      console.log('Restarting application...');
      
      // Cleanup existing components
      this.cleanup();
      
      // Clear registration data
      if (this.qrRegistration) {
        this.qrRegistration.clearRegistrationData();
      }
      
      // Reinitialize
      await this.initialize();
      
    } catch (error) {
      console.error('Failed to restart application:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Cleanup application
   */
  cleanup() {
    if (this.contentManager) {
      this.contentManager.stop();
    }
    
    if (this.qrRegistration) {
      this.qrRegistration.destroy();
    }
    
    this.hideStatusMessage();
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
          console.error('Error in app event listener:', error);
        }
      });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.digitalSignageApp = new DigitalSignageApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (window.digitalSignageApp) {
    if (document.hidden) {
      // Page is hidden, pause content
      if (window.digitalSignageApp.contentManager) {
        window.digitalSignageApp.contentManager.pause();
      }
    } else {
      // Page is visible, resume content
      if (window.digitalSignageApp.contentManager) {
        window.digitalSignageApp.contentManager.play();
      }
    }
  }
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
  if (window.digitalSignageApp) {
    window.digitalSignageApp.cleanup();
  }
});