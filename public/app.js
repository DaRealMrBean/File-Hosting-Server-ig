// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const typeFilter = document.getElementById('typeFilter');
const sortBy = document.getElementById('sortBy');
const sortOrder = document.getElementById('sortOrder');
const mediaGrid = document.getElementById('mediaGrid');
const mediaModal = document.getElementById('mediaModal');
const closeModal = document.getElementById('closeModal');
const viewerContainer = document.getElementById('viewerContainer');
const fileName = document.getElementById('fileName');
const fileMeta = document.getElementById('fileMeta');
const toastContainer = document.getElementById('toastContainer');

// Playback Controls
const playbackControls = document.getElementById('playbackControls');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnRewind10 = document.getElementById('btnRewind10');
const btnForward10 = document.getElementById('btnForward10');
const btnSkipBack = document.getElementById('btnSkipBack');
const btnSkipForward = document.getElementById('btnSkipForward');

// Zoom Controls
const zoomControls = document.getElementById('zoomControls');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomReset = document.getElementById('btnZoomReset');
const zoomLevel = document.getElementById('zoomLevel');

// Volume Controls
const volumeControls = document.getElementById('volumeControls');
const volumeSlider = document.getElementById('volumeSlider');

// Fullscreen Control
const btnFullscreen = document.getElementById('btnFullscreen');

// State
let currentMedia = null;
let currentZoom = 1;
let mediaItems = [];
let currentMediaType = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadMedia();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Upload events
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  
  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    uploadFiles(files);
  });
  
  // Filter and sort events
  typeFilter.addEventListener('change', loadMedia);
  sortBy.addEventListener('change', loadMedia);
  sortOrder.addEventListener('change', loadMedia);
  
  // Modal events
  closeModal.addEventListener('click', closeViewer);
  mediaModal.addEventListener('click', (e) => {
    if (e.target === mediaModal) closeViewer();
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Playback controls
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnRewind10.addEventListener('click', () => seekMedia(-10));
  btnForward10.addEventListener('click', () => seekMedia(10));
  btnSkipBack.addEventListener('click', skipBack);
  btnSkipForward.addEventListener('click', skipForward);
  
  // Zoom controls
  btnZoomIn.addEventListener('click', () => adjustZoom(0.25));
  btnZoomOut.addEventListener('click', () => adjustZoom(-0.25));
  btnZoomReset.addEventListener('click', resetZoom);
  
  // Volume control
  volumeSlider.addEventListener('input', adjustVolume);
  
  // Fullscreen
  btnFullscreen.addEventListener('click', toggleFullscreen);
}

// File Upload Handlers
function handleFileSelect(e) {
  const files = e.target.files;
  uploadFiles(files);
  fileInput.value = '';
}

async function uploadFiles(files) {
  if (files.length === 0) return;
  
  uploadProgress.style.display = 'block';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Validate file type
    if (!isValidMediaType(file)) {
      showToast(`Skipping ${file.name}: Unsupported file type`, 'warning');
      continue;
    }
    
    try {
      await uploadFile(file);
      showToast(`Uploaded: ${file.name}`, 'success');
    } catch (error) {
      showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
    }
  }
  
  uploadProgress.style.display = 'none';
  progressFill.style.width = '0%';
  loadMedia();
}

function isValidMediaType(file) {
  const validTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'
  ];
  return validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|webm|avi|mov|mkv|wmv|mp3|wav|ogg|flac|aac)$/i);
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `Uploading ${file.name}: ${Math.round(percent)}%`;
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

// Load Media
async function loadMedia() {
  try {
    const type = typeFilter.value;
    const sort = sortBy.value;
    const order = sortOrder.value;
    
    const response = await fetch(`/api/media?type=${type}&sort=${sort}&order=${order}`);
    mediaItems = await response.json();
    
    renderMediaGrid();
  } catch (error) {
    showToast('Failed to load media', 'error');
  }
}

// Render Media Grid
function renderMediaGrid() {
  if (mediaItems.length === 0) {
    mediaGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📼</div>
        <div class="empty-state-text">No media files yet</div>
        <div class="empty-state-subtext">Upload some images, videos, or audio files to get started</div>
      </div>
    `;
    return;
  }
  
  mediaGrid.innerHTML = mediaItems.map(item => {
    const icon = getMediaIcon(item.type);
    const preview = generatePreview(item);
    const size = formatFileSize(item.size);
    const date = new Date(item.uploadedAt).toLocaleDateString();
    
    return `
      <div class="media-card" data-id="${item.id}" onclick="openViewer('${item.id}')">
        <div class="media-actions">
          <button class="action-btn delete" onclick="event.stopPropagation(); deleteMedia('${item.id}')" title="Delete">🗑️</button>
        </div>
        <div class="media-preview">
          ${preview}
        </div>
        <div class="media-info">
          <div class="media-name" title="${item.originalName}">${item.originalName}</div>
          <div class="media-meta">
            <span>${size}</span>
            <span class="media-type">${item.type}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getMediaIcon(type) {
  const icons = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    other: '📄'
  };
  return icons[type] || icons.other;
}

function generatePreview(item) {
  const url = `/uploads/${item.filename}`;
  
  if (item.type === 'image') {
    return `<img src="${url}" alt="${item.originalName}" loading="lazy">`;
  } else if (item.type === 'video') {
    return `
      <video src="${url}" preload="metadata">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem;">🎬</div>
      </video>
    `;
  } else if (item.type === 'audio') {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">🎵</div>`;
  }
  
  return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">${getMediaIcon(item.type)}</div>`;
}

// Open Viewer
function openViewer(id) {
  const item = mediaItems.find(m => m.id === id);
  if (!item) return;
  
  currentMedia = item;
  currentZoom = 1;
  
  const url = `/uploads/${item.filename}`;
  
  fileName.textContent = item.originalName;
  fileMeta.textContent = `${formatFileSize(item.size)} • Uploaded: ${new Date(item.uploadedAt).toLocaleString()} • Type: ${item.type}`;
  
  // Generate viewer content
  let content = '';
  currentMediaType = item.type;
  
  if (item.type === 'image') {
    content = `<img src="${url}" id="viewerMedia" alt="${item.originalName}">`;
    zoomControls.style.display = 'flex';
    playbackControls.style.display = 'none';
    volumeControls.style.display = 'none';
  } else if (item.type === 'video') {
    content = `
      <video src="${url}" id="viewerMedia" controls playsinline>
        Your browser does not support the video tag.
      </video>
    `;
    zoomControls.style.display = 'flex';
    playbackControls.style.display = 'flex';
    volumeControls.style.display = 'flex';
  } else if (item.type === 'audio') {
    content = `
      <audio src="${url}" id="viewerMedia" controls>
        Your browser does not support the audio tag.
      </audio>
    `;
    zoomControls.style.display = 'none';
    playbackControls.style.display = 'flex';
    volumeControls.style.display = 'flex';
  } else {
    content = `
      <div style="padding:2rem;text-align:center;">
        <div style="font-size:4rem;margin-bottom:1rem;">${getMediaIcon(item.type)}</div>
        <p>Preview not available for this file type</p>
        <a href="${url}" download="${item.originalName}" style="color:var(--accent-primary);margin-top:1rem;display:inline-block;">Download File</a>
      </div>
    `;
    zoomControls.style.display = 'none';
    playbackControls.style.display = 'none';
    volumeControls.style.display = 'none';
  }
  
  viewerContainer.innerHTML = content;
  updateZoomDisplay();
  
  // Setup media element listeners
  const mediaElement = document.getElementById('viewerMedia');
  if (mediaElement && (item.type === 'video' || item.type === 'audio')) {
    mediaElement.addEventListener('loadedmetadata', () => {
      if (item.type === 'video') mediaElement.play();
    });
  }
  
  mediaModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close Viewer
function closeViewer() {
  const mediaElement = document.getElementById('viewerMedia');
  if (mediaElement) {
    mediaElement.pause();
  }
  
  mediaModal.classList.remove('active');
  document.body.style.overflow = '';
  currentMedia = null;
}

// Delete Media
async function deleteMedia(id) {
  if (!confirm('Are you sure you want to delete this file?')) return;
  
  try {
    const response = await fetch(`/api/media/${id}`, { method: 'DELETE' });
    
    if (response.ok) {
      showToast('File deleted successfully', 'success');
      loadMedia();
      
      if (currentMedia && currentMedia.id === id) {
        closeViewer();
      }
    } else {
      showToast('Failed to delete file', 'error');
    }
  } catch (error) {
    showToast('Failed to delete file', 'error');
  }
}

// Playback Controls
function togglePlayPause() {
  const mediaElement = document.getElementById('viewerMedia');
  if (!mediaElement) return;
  
  if (mediaElement.paused) {
    mediaElement.play();
    btnPlayPause.textContent = '⏸️';
  } else {
    mediaElement.pause();
    btnPlayPause.textContent = '▶️';
  }
}

function seekMedia(seconds) {
  const mediaElement = document.getElementById('viewerMedia');
  if (!mediaElement) return;
  
  mediaElement.currentTime = Math.max(0, Math.min(mediaElement.duration, mediaElement.currentTime + seconds));
}

function skipBack() {
  const mediaElement = document.getElementById('viewerMedia');
  if (!mediaElement) return;
  
  // Skip to previous track would require playlist functionality
  // For now, rewind 30 seconds
  seekMedia(-30);
}

function skipForward() {
  const mediaElement = document.getElementById('viewerMedia');
  if (!mediaElement) return;
  
  // Skip to next track would require playlist functionality
  // For now, forward 30 seconds
  seekMedia(30);
}

// Zoom Controls
function adjustZoom(delta) {
  currentZoom = Math.max(0.5, Math.min(3, currentZoom + delta));
  updateZoom();
}

function resetZoom() {
  currentZoom = 1;
  updateZoom();
}

function updateZoom() {
  const mediaElement = document.getElementById('viewerMedia');
  if (!mediaElement || currentMediaType !== 'image') return;
  
  mediaElement.style.transform = `scale(${currentZoom})`;
  updateZoomDisplay();
}

function updateZoomDisplay() {
  zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
}

// Volume Control
function adjustVolume() {
  const mediaElement = document.getElementById('viewerMedia');
  if (!mediaElement) return;
  
  mediaElement.volume = volumeSlider.value / 100;
}

// Fullscreen Toggle
function toggleFullscreen() {
  const modalContent = document.querySelector('.modal-content');
  
  if (!document.fullscreenElement) {
    modalContent.requestFullscreen().catch(err => {
      showToast('Fullscreen not supported', 'warning');
    });
  } else {
    document.exitFullscreen();
  }
}

// Keyboard Shortcuts
function handleKeyboard(e) {
  if (!mediaModal.classList.contains('active')) return;
  
  const mediaElement = document.getElementById('viewerMedia');
  
  switch(e.key) {
    case 'Escape':
      closeViewer();
      break;
    case ' ':
      e.preventDefault();
      if (currentMediaType === 'video' || currentMediaType === 'audio') {
        togglePlayPause();
      }
      break;
    case 'ArrowLeft':
      if (currentMediaType === 'video' || currentMediaType === 'audio') {
        seekMedia(-10);
      } else if (currentMediaType === 'image') {
        adjustZoom(-0.25);
      }
      break;
    case 'ArrowRight':
      if (currentMediaType === 'video' || currentMediaType === 'audio') {
        seekMedia(10);
      } else if (currentMediaType === 'image') {
        adjustZoom(0.25);
      }
      break;
    case 'ArrowUp':
      if (currentMediaType === 'image') {
        adjustZoom(0.25);
      } else if (mediaElement) {
        mediaElement.volume = Math.min(1, mediaElement.volume + 0.1);
        volumeSlider.value = mediaElement.volume * 100;
      }
      break;
    case 'ArrowDown':
      if (currentMediaType === 'image') {
        adjustZoom(-0.25);
      } else if (mediaElement) {
        mediaElement.volume = Math.max(0, mediaElement.volume - 0.1);
        volumeSlider.value = mediaElement.volume * 100;
      }
      break;
    case '+':
    case '=':
      if (currentMediaType === 'image') {
        adjustZoom(0.25);
      }
      break;
    case '-':
      if (currentMediaType === 'image') {
        adjustZoom(-0.25);
      }
      break;
    case '0':
      if (currentMediaType === 'image') {
        resetZoom();
      }
      break;
    case 'f':
      toggleFullscreen();
      break;
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Utility Functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Make functions globally accessible
window.openViewer = openViewer;
window.deleteMedia = deleteMedia;
