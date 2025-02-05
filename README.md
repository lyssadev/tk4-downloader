# 🎥 TK4 Downloader

<div align="center">

![TK4 Downloader Banner](https://media.discordapp.net/attachments/1242993159332565058/1336784608179650710/Screenshot_2025-02-05_19-07-24.png?ex=67a5112e&is=67a3bfae&hm=df66846dd09329ea98a6eef2015b6799f6cdbfb5a37005c6a8f508feeb43472e&=&format=webp&quality=lossless&width=693&height=380)

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg?style=for-the-badge)](https://github.com/lyssadev/tk4-downloader)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg?style=for-the-badge)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/lyssadev/tk4-downloader/pulls)

**Modern TikTok video downloader with advanced features and stunning CLI interface**  
*Perfect for Termux & Linux users*

[Features](#features) •
[Quick Start](#quick-start) •
[Documentation](DOCS.md) •
[Examples](#examples) •
[Support](#support)

</div>

## ✨ Features

### 🎬 Advanced Video Downloads
- **High Quality**: Full HD video downloads
- **No Watermark**: Clean videos without TikTok watermark
- **Multiple Sources**: Smart fallback system
- **Format Options**: Various output formats
- **Audio Control**: Optional audio extraction

### 🚀 Performance
- **Smart Caching**: Faster repeated downloads
- **Parallel Processing**: Multiple concurrent downloads
- **Auto-Retry**: Built-in retry mechanism
- **Proxy Support**: Network optimization
- **Memory Efficient**: Optimized resource usage

### 📊 Monitoring & Control
- **Real-time Progress**: Live download tracking
- **Detailed Statistics**: Performance metrics
- **Event System**: Custom event handling
- **Debug Mode**: Comprehensive logging
- **Error Recovery**: Smart error handling

### 🎨 Modern CLI
- **Beautiful Interface**: Gradient colors
- **Interactive**: User-friendly prompts
- **Progress Bars**: Visual feedback
- **Status Updates**: Real-time information
- **Error Display**: Clear error messages

## 🚀 Quick Start

### Installation
```bash
# Using npm
npm install tk4-downloader

# Using yarn
yarn add tk4-downloader
```

### Basic Usage
```javascript
import TikTokDownloader from 'tk4-downloader';

// Initialize
const downloader = new TikTokDownloader();

// Download video
try {
    const result = await downloader.downloadVideo('https://www.tiktok.com/@user/video/1234567890');
    console.log('Video downloaded successfully:', result.url);
} catch (error) {
    console.error('Download failed:', error.message);
}
```

## 📚 Documentation

For detailed documentation, including:
- Advanced configuration options
- API reference
- Event handling
- Statistics & monitoring
- Best practices
- Troubleshooting

👉 See our comprehensive [Documentation](DOCS.md)

## 💡 Examples

### Download with Progress
```javascript
const downloader = new TikTokDownloader({ debug: true });

downloader.on('progress', ({message}) => {
    console.log(message);
});

const result = await downloader.downloadVideo(url);
```

### Batch Download
```javascript
const downloader = new TikTokDownloader({
    parallelDownloads: 3,
    cacheResults: true
});

const urls = ['url1', 'url2', 'url3'];
const results = await Promise.all(
    urls.map(url => downloader.downloadVideo(url))
);
```

## 🔧 Requirements

- Node.js >= 16
- Internet connection
- Supported platforms:
  - Linux
  - macOS
  - Windows
  - Termux (Android)

## 🤝 Contributing

We welcome contributions! See our [Contributing Guidelines](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

Need help? We've got you covered:

1. 📚 Check our [Documentation](DOCS.md)
2. 🔍 Search [existing issues](https://github.com/lyssadev/tk4-downloader/issues)
3. 💡 Create a [new issue](https://github.com/lyssadev/tk4-downloader/issues/new)

## 🌟 Show Your Support

If you find this project helpful, please give it a star ⭐️

## 📊 Stats & Updates

- Latest version: 1.5.0
- Downloads: Growing daily
- Active development
- Regular updates
- Community supported

---

<div align="center">

**Made with ❤️ by [lyssadev](https://github.com/lyssadev) & [chifft](https://github.com/chifft)**

*A powerful tool for the TikTok community*

</div>
