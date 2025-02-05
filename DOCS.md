# TK4 Downloader Library Documentation

<div align="center">

![TK4 Library Banner](https://your-banner-image-url.png)

**Advanced TikTok Video Downloader Library**  
*Version 1.5.0*

</div>

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Advanced Usage](#advanced-usage)
- [Configuration Options](#configuration-options)
- [API Reference](#api-reference)
- [Events](#events)
- [Statistics & Monitoring](#statistics--monitoring)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install tk4-downloader
# or
yarn add tk4-downloader
```

## Quick Start

```javascript
import TikTokDownloader from 'tk4-downloader';

// Initialize the downloader
const downloader = new TikTokDownloader();

// Basic usage
async function downloadVideo() {
    try {
        const result = await downloader.downloadVideo('https://www.tiktok.com/@user/video/1234567890');
        console.log(`Video downloaded: ${result.url}`);
    } catch (error) {
        console.error('Download failed:', error.message);
    }
}
```

## Advanced Usage

### With Custom Configuration

```javascript
const downloader = new TikTokDownloader({
    preferredQuality: 'high',
    maxRetries: 5,
    cacheResults: true,
    debug: true,
    parallelDownloads: 3
});

// Add event listeners
downloader.on('progress', ({status, message}) => {
    console.log(`Progress: ${message}`);
});

downloader.on('success', (info) => {
    console.log(`Downloaded from ${info.source} in ${info.duration}ms`);
});

// Download with monitoring
async function downloadWithMonitoring(url) {
    const result = await downloader.downloadVideo(url);
    const stats = downloader.getDetailedStats();
    console.log(`Success rate: ${stats.successRate}%`);
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preferredQuality` | string | 'high' | Video quality ('high', 'medium', 'low') |
| `maxRetries` | number | 3 | Maximum retry attempts |
| `timeout` | number | 10000 | Request timeout in milliseconds |
| `cacheResults` | boolean | true | Enable result caching |
| `maxCacheAge` | number | 3600000 | Cache duration in milliseconds |
| `parallelDownloads` | number | 3 | Number of concurrent downloads |
| `outputFormat` | string | 'mp4' | Output video format |
| `includeAudio` | boolean | true | Include audio in download |
| `debug` | boolean | false | Enable debug logging |
| `proxyUrl` | string | null | Proxy server URL |
| `customFileName` | string | null | Custom filename pattern |
| `downloadPath` | string | process.cwd() | Download directory path |

## API Reference

### Core Methods

#### `downloadVideo(url: string, options?: object): Promise<object>`
Downloads a TikTok video.
```javascript
const result = await downloader.downloadVideo(url);
// Returns: { url, author, description, quality, source }
```

#### `getDetailedStats(): object`
Get detailed download statistics.
```javascript
const stats = downloader.getDetailedStats();
// Returns comprehensive statistics object
```

#### `resetStats(): void`
Reset all statistics counters.
```javascript
downloader.resetStats();
```

### Advanced Methods

#### `getVideoMetadata(url: string): Promise<object>`
Fetch video metadata from multiple sources.
```javascript
const metadata = await downloader.getVideoMetadata(url);
```

#### `selectBestQuality(results: Array): object`
Select best quality version from available sources.
```javascript
const bestQuality = downloader.selectBestQuality(results);
```

## Events

### Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| `start` | Download started | `{ url, timestamp }` |
| `progress` | Download progress | `{ status, message }` |
| `success` | Download completed | `{ url, author, duration, source }` |
| `error` | Error occurred | `{ error, url }` |
| `debug` | Debug information | `{ timestamp, level, message }` |

### Event Usage

```javascript
// Progress monitoring
downloader.on('progress', ({status, message}) => {
    console.log(`Status: ${status}, Message: ${message}`);
});

// Error handling
downloader.on('error', ({error, url}) => {
    console.error(`Failed to download ${url}: ${error}`);
});

// Success handling
downloader.on('success', (info) => {
    console.log(`Downloaded from ${info.source} in ${info.duration}ms`);
});
```

## Statistics & Monitoring

### Basic Statistics

```javascript
const stats = downloader.getStats();
console.log(`Success rate: ${stats.successRate}%`);
console.log(`Average speed: ${stats.averageSpeedMs}ms`);
```

### Detailed Statistics

```javascript
const detailedStats = downloader.getDetailedStats();
console.log(`Cache efficiency: ${detailedStats.cacheEfficiency}%`);
console.log(`API Performance:`, detailedStats.apiPerformance);
console.log(`Total downloads: ${detailedStats.totalDownloads}`);
```

## Error Handling

```javascript
try {
    const result = await downloader.downloadVideo(url);
} catch (error) {
    if (error.message.includes('Could not fetch video information')) {
        console.error('Video might be private or deleted');
    } else if (error.message.includes('Timeout')) {
        console.error('Network timeout - try again');
    } else {
        console.error('Unknown error:', error.message);
    }
}
```

## Best Practices

1. **Enable Caching for Multiple Downloads**
```javascript
const downloader = new TikTokDownloader({
    cacheResults: true,
    maxCacheAge: 3600000 // 1 hour
});
```

2. **Handle Rate Limiting**
```javascript
const downloader = new TikTokDownloader({
    maxRetries: 5,
    timeout: 15000
});
```

3. **Optimize for Bulk Downloads**
```javascript
const downloader = new TikTokDownloader({
    parallelDownloads: 3,
    cacheResults: true
});
```

## Examples

### Basic Download
```javascript
const downloader = new TikTokDownloader();
const result = await downloader.downloadVideo('https://www.tiktok.com/...');
console.log(`Downloaded: ${result.url}`);
```

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

### Custom Error Handling
```javascript
const downloader = new TikTokDownloader();

downloader.on('error', ({error, url}) => {
    console.error(`Failed to download ${url}`);
    console.error('Error:', error);
});

try {
    await downloader.downloadVideo(url);
} catch (error) {
    // Handle specific error cases
}
```

## Troubleshooting

### Common Issues

1. **Video Not Found**
   - Verify the URL is correct and accessible
   - Check if the video is private or deleted
   - Try using a different source API

2. **Download Fails**
   - Check your internet connection
   - Increase timeout and retry values
   - Try using a proxy server

3. **Poor Performance**
   - Enable caching for multiple downloads
   - Adjust parallel download settings
   - Check network conditions

### Debug Mode

Enable debug mode for detailed logging:
```javascript
const downloader = new TikTokDownloader({
    debug: true
});

downloader.on('debug', ({level, message}) => {
    console.log(`[${level}] ${message}`);
});
```

## Performance Optimization

### Caching Strategy
```javascript
const downloader = new TikTokDownloader({
    cacheResults: true,
    maxCacheAge: 3600000,
    parallelDownloads: 3
});
```

### Memory Management
```javascript
// Clear cache periodically
setInterval(() => {
    downloader.resetStats();
}, 3600000); // Every hour
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue if needed

---

<div align="center">

Made with ❤️ by [lyssadev](https://github.com/lyssadev) & [chifft](https://github.com/chifft)

</div> 