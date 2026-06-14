const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database file to store metadata
const METADATA_FILE = path.join(__dirname, 'media-metadata.json');

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading metadata:', err);
  }
  return [];
}

function saveMetadata(metadata) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

// Get all media files with metadata
app.get('/api/media', (req, res) => {
  let metadata = loadMetadata();
  
  // Add file info from disk
  const uploadDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    
    metadata = metadata.map(item => {
      const filePath = path.join(uploadDir, item.filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return { ...item, size: stats.size };
      }
      return item;
    });
  }
  
  // Apply sorting
  const { sort = 'name', order = 'asc', type = 'all' } = req.query;
  
  // Filter by type
  if (type !== 'all') {
    metadata = metadata.filter(item => item.type === type);
  }
  
  // Sort
  metadata.sort((a, b) => {
    let comparison = 0;
    switch (sort) {
      case 'name':
        comparison = a.originalName.localeCompare(b.originalName);
        break;
      case 'date':
        comparison = new Date(a.uploadedAt) - new Date(b.uploadedAt);
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = a.originalName.localeCompare(b.originalName);
    }
    return order === 'desc' ? -comparison : comparison;
  });
  
  res.json(metadata);
});

// Upload media
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const metadata = loadMetadata();
  
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let fileType = 'other';
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const videoExts = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.wmv'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac'];
  
  if (imageExts.includes(fileExt)) fileType = 'image';
  else if (videoExts.includes(fileExt)) fileType = 'video';
  else if (audioExts.includes(fileExt)) fileType = 'audio';
  
  const newEntry = {
    id: uuidv4(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    type: fileType,
    uploadedAt: new Date().toISOString(),
    size: req.file.size
  };
  
  metadata.push(newEntry);
  saveMetadata(metadata);
  
  res.json(newEntry);
});

// Delete media
app.delete('/api/media/:id', (req, res) => {
  let metadata = loadMetadata();
  const item = metadata.find(m => m.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const filePath = path.join(__dirname, 'uploads', item.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  metadata = metadata.filter(m => m.id !== req.params.id);
  saveMetadata(metadata);
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
