# Universal Digital Signage System

A cross-platform digital signage solution that works on Android, Windows, Tizen OS, WebOS, Web browsers, and other operating systems with a unified codebase.

## 🏗️ System Architecture

### Overview
The system follows a hierarchical content management structure designed for multi-branch organizations like banks:

```
Organization
├── Networks (Global Content)
│   ├── Subnetworks (Branch-specific Content)
│   │   ├── Devices (Individual Screens)
│   │   └── Device Profiles (Hardware Specifications)
│   └── User Access Control
└── Content Management System
```

### Key Components

1. **Cross-Platform Player**
   - Web-based core (HTML5/CSS3/JavaScript)
   - Electron wrapper for desktop platforms
   - Progressive Web App (PWA) for mobile
   - Native wrappers for TV platforms (Tizen, WebOS)

2. **Content Management System**
   - Hierarchical content organization
   - Real-time synchronization
   - Preloading mechanism to prevent black screens
   - Device profile management

3. **Authentication & Access Control**
   - QR code-based device registration
   - Role-based user permissions
   - Network and subnetwork access control

4. **Device Management**
   - Hardware profile management
   - Resolution and format optimization
   - Bitrate and codec specifications

## 🚀 Features

### Content Management
- **Global Content**: Organization-wide content shared across all branches
- **Branch-specific Content**: Localized content for individual branches
- **Real-time Sync**: Instant content updates across all devices
- **Preloading**: Seamless transitions without black screens
- **Multiple Formats**: Video, images, web content, and interactive elements

### Device Management
- **Hardware Profiles**: Model numbers, resolutions, supported formats
- **Auto-detection**: Automatic hardware specification detection
- **Optimization**: Content optimization based on device capabilities
- **Remote Control**: Centralized device management and monitoring

### User Management
- **QR Code Registration**: Easy device onboarding via mobile app
- **Role-based Access**: Different permission levels for users
- **Network Access Control**: Granular control over content access
- **Audit Trail**: Complete activity logging

### Technical Features
- **Cross-platform**: Single codebase for all platforms
- **Offline Support**: Local content caching
- **Real-time Updates**: WebSocket-based synchronization
- **Scalable**: Supports thousands of devices
- **Secure**: End-to-end encryption and authentication

## 📱 Supported Platforms

- **Web Browsers**: Chrome, Firefox, Safari, Edge
- **Desktop**: Windows, macOS, Linux (via Electron)
- **Mobile**: Android, iOS (via PWA)
- **Smart TVs**: Tizen OS, WebOS, Android TV
- **Digital Signage Players**: Commercial signage hardware

## 🛠️ Technology Stack

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Vanilla JS with modular architecture
- **UI**: Custom CSS with responsive design
- **Media**: HTML5 Video/Audio APIs

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Redis cache
- **Real-time**: WebSocket (Socket.io)
- **File Storage**: AWS S3 / Azure Blob Storage
- **CDN**: CloudFront / Azure CDN

### Cross-Platform
- **Desktop**: Electron
- **Mobile**: Progressive Web App (PWA)
- **TV**: Platform-specific wrappers

## 📋 Roadmap

### Phase 1: Core Platform (Weeks 1-4)
- [x] Basic content player with preloading
- [ ] Cross-platform build system
- [ ] Device profile management
- [ ] Basic content management

### Phase 2: Content Management (Weeks 5-8)
- [ ] Hierarchical content organization
- [ ] Real-time synchronization
- [ ] Admin panel for content management
- [ ] User access control system

### Phase 3: Device Management (Weeks 9-12)
- [ ] QR code registration system
- [ ] Device profile auto-detection
- [ ] Remote device monitoring
- [ ] Hardware optimization

### Phase 4: Advanced Features (Weeks 13-16)
- [ ] Analytics and reporting
- [ ] Advanced scheduling
- [ ] Interactive content support
- [ ] Multi-language support

### Phase 5: Enterprise Features (Weeks 17-20)
- [ ] Advanced security features
- [ ] API for third-party integrations
- [ ] White-label solutions
- [ ] Enterprise deployment tools

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd digital-signage-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
```

### Building for Different Platforms
```bash
# Web version
npm run build:web

# Desktop (Electron)
npm run build:desktop

# Mobile (PWA)
npm run build:mobile

# TV platforms
npm run build:tizen
npm run build:webos
```

## 📊 System Diagrams

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │  Content Store  │    │  Device Player  │
│                 │    │                 │    │                 │
│ • User Mgmt     │◄──►│ • Global Content│◄──►│ • Content Play  │
│ • Content Mgmt  │    │ • Branch Content│    │ • Preloading    │
│ • Device Mgmt   │    │ • Real-time Sync│    │ • Hardware Opt  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   CDN/Storage   │    │   Analytics     │
│                 │    │                 │    │                 │
│ • QR Scanner    │    │ • Media Files   │    │ • Usage Stats   │
│ • Device Reg    │    │ • Content Cache │    │ • Performance   │
│ • Remote Ctrl   │    │ • Global Dist   │    │ • Reports       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Content Flow
```
Global Content ──┐
                 ├──► Network Content ──┐
Branch Content ──┘                      ├──► Subnetwork Content ──┐
                                        │                          ├──► Device Player
User Content ───────────────────────────┘                          │
                                                                   │
Preloaded Content ◄────────────────────────────────────────────────┘
```

### Device Registration Flow
```
Device Boot ──► QR Code Display ──► Mobile App Scan ──► Server Registration ──► Content Assignment ──► Ready to Play
```

## 🔧 Configuration

### Device Profiles
```json
{
  "model": "Samsung QM55R",
  "resolution": "1920x1080",
  "supportedFormats": ["mp4", "webm", "jpg", "png"],
  "maxBitrate": "10Mbps",
  "refreshRate": 60,
  "capabilities": {
    "video": true,
    "audio": true,
    "interactive": false
  }
}
```

### Content Scheduling
```json
{
  "networkId": "bank-global",
  "subnetworkId": "branch-001",
  "schedule": {
    "monday": [
      {"time": "09:00", "contentId": "welcome-video"},
      {"time": "12:00", "contentId": "lunch-promo"}
    ]
  }
}
```

## 📈 Performance Optimization

### Preloading Strategy
- **Next Content**: Always preload the next item in playlist
- **Background Loading**: Load content during idle time
- **Progressive Loading**: Start playback before full download
- **Cache Management**: Intelligent cache based on device storage

### Hardware Optimization
- **Resolution Matching**: Content scaled to device resolution
- **Format Selection**: Optimal format based on device capabilities
- **Bitrate Adaptation**: Dynamic bitrate based on network conditions
- **Memory Management**: Efficient memory usage for smooth playback

## 🔒 Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Encryption**: End-to-end content encryption
- **Audit**: Complete activity logging
- **Network Security**: VPN support for secure deployments

## 📞 Support

For technical support and questions:
- Email: support@digitalsignage.com
- Documentation: https://docs.digitalsignage.com
- Community: https://community.digitalsignage.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.