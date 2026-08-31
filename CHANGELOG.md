# Changelog

All notable changes to the SmartStart Speed Checker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-18

### Added
- Real-time GPS speed monitoring with 10-second intervals
- Customizable speed limit settings (default: 50 km/h)
- Audio overspeed warnings using expo-av
- Speed logging system with PDF export capability
- GPS noise filtering to distinguish actual movement from GPS drift
- Driver information input (name, car number, gender)
- Session-based monitoring with start/stop functionality
- Distance calculation using Haversine formula
- Overspeed detection and logging

### Technical Details
- **Expo SDK**: Upgraded to version 54.0.13
- **React Native**: Updated to 0.81.4
- **React**: Updated to 19.1.0
- **Node.js**: Requires v20.19.4 or higher
- **Key Dependencies**:
  - expo-location for GPS tracking
  - expo-av for audio warnings
  - expo-print for PDF generation
  - haversine for distance calculations
  - expo-file-system/legacy for file operations

### Known Limitations
- No automatic road speed limit detection (manual input required)
- GPS accuracy depends on device location and signal strength
- Audio warnings may not work reliably with expo-audio (using expo-av instead)
- Background processing limited by device power management
- Indoor GPS accuracy reduced

### Bug Fixes
- Fixed VirtualizedList nesting warnings in CheckerScreen
- Resolved expo-file-system deprecation warnings
- Fixed GPS noise filtering threshold (was too strict at 0.02km)
- Corrected audio warning system by reverting to expo-av from expo-audio beta
- Fixed speed logging system that was filtering out all movements as "noise"

### Development Notes
- Migrated from Expo SDK 52 to SDK 54
- Updated all dependencies for SDK 54 compatibility
- Implemented comprehensive debugging and logging system
- Added GPS precision handling with 6-decimal place accuracy
- Set movement threshold to 5 meters for meaningful speed warnings