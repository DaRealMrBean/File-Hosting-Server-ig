# RetroVault - Media Hosting Platform

A retro-styled file hosting website for uploading, viewing, and managing media files.

## Features

### Upload & Download
- **Drag & Drop** upload interface
- **Click to browse** file selection
- Support for multiple file uploads
- Files stored locally on the server
- Progress indicator during upload

### Supported Media Types
- **Images**: JPG, JPEG, PNG, GIF, BMP, WEBP, SVG
- **Videos**: MP4, WEBM, AVI, MOV, MKV, WMV
- **Audio**: MP3, WAV, OGG, FLAC, AAC

### Media Preview & Viewer
- **Image viewer** with zoom controls
- **Video player** with full playback controls
- **Audio player** with volume control
- Fullscreen mode support

### Playback Controls (Videos/Audio)
- Play/Pause
- Skip Forward/Backward
- +/- 10 seconds seek
- Volume control slider

### Image Controls
- Zoom In/Out (50% - 300%)
- Reset Zoom
- Keyboard shortcuts

### Sorting & Filtering
- **Filter by Type**: All, Images, Videos, Audio, Other
- **Sort by**: 
  - Name (Alphabetical A-Z or Z-A)
  - Date Uploaded (Newest/Oldest first)
  - File Size (Smallest/Largest first)
  - File Type
- **Order**: Ascending or Descending

### Additional Features
- Delete files with confirmation
- Toast notifications for actions
- Responsive design for mobile/desktop
- Keyboard shortcuts for quick access
- CRT scanline animation effect

## Keyboard Shortcuts

When viewing media:
- `Escape` - Close viewer
- `Space` - Play/Pause (videos/audio)
- `Arrow Left` - Rewind 10s / Zoom Out
- `Arrow Right` - Forward 10s / Zoom In
- `Arrow Up` - Increase Volume / Zoom In
- `Arrow Down` - Decrease Volume / Zoom Out
- `+` / `=` - Zoom In (images)
- `-` - Zoom Out (images)
- `0` - Reset Zoom (images)
- `F` - Toggle Fullscreen

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Then open your browser to:
```
http://localhost:3000
```

## Project Structure

```
/workspace
├── server.js           # Express backend server
├── package.json        # Node.js dependencies
├── public/
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Retro-themed CSS
│   └── app.js          # Frontend JavaScript
├── uploads/            # Stored media files
└── media-metadata.json # File metadata database
```

## API Endpoints

- `GET /api/media` - List all media files (with sorting/filtering)
- `POST /api/upload` - Upload a new file
- `DELETE /api/media/:id` - Delete a file
- `GET /uploads/:filename` - Access uploaded file

## UI Theme

The interface features a **retro-futuristic** design with:
- Dark navy/blue color scheme
- Neon pink accent colors
- Monospace typography
- CRT scanline effects
- Glowing text shadows
- Smooth animations

---

Built with Express.js, Multer, and vanilla JavaScript/CSS
