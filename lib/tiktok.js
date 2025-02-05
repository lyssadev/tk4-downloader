import axios from 'axios';
import * as cheerio from 'cheerio';
import CryptoJS from 'crypto-js';
import got from 'got';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

/**
 * @class TikTokDownloader
 * @extends EventEmitter
 * @description Advanced TikTok video downloader with multiple fallback methods and real-time events
 * @author lyssadev & chifft
 * @version 1.5.0
 */
class TikTokDownloader extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            timeout: options.timeout || 10000,
            maxRetries: options.maxRetries || 3,
            preferredQuality: options.preferredQuality || 'high',
            includeWatermark: options.includeWatermark || false,
            proxyUrl: options.proxyUrl || null,
            debug: options.debug || false,
            downloadPath: options.downloadPath || process.cwd(),
            autoRetry: options.autoRetry ?? true,
            cacheResults: options.cacheResults ?? true,
            maxCacheAge: options.maxCacheAge || 3600000, // 1 hour
            parallelDownloads: options.parallelDownloads || 3,
            outputFormat: options.outputFormat || 'mp4',
            includeAudio: options.includeAudio ?? true,
            customFileName: options.customFileName || null,
            headers: options.headers || {}
        };

        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];

        // Enhanced API endpoints
        this.apis = {
            snaptik: 'https://api.snaptik.com/video-details',
            tikwm: 'https://www.tikwm.com/api',
            tikmate: 'https://api.tikmate.app/api',
            savett: 'https://savett.cc/api',
            tikdown: 'https://tikdown.org/api',
            tiktokapi: 'https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed',
            dlpanda: 'https://dlpanda.com/api/v2/video',
            ssstik: 'https://ssstik.io/api/v1/download'
        };

        // Initialize cache
        this.cache = new Map();
        this.cacheTimer = setInterval(() => this.cleanCache(), this.options.maxCacheAge);

        // Enhanced statistics
        this.stats = {
            totalDownloads: 0,
            successfulDownloads: 0,
            failedDownloads: 0,
            averageSpeed: 0,
            totalSize: 0,
            cacheSaves: 0,
            apiUsage: {},
            errors: [],
            startTime: Date.now()
        };

        // Initialize API usage tracking
        Object.keys(this.apis).forEach(api => {
            this.stats.apiUsage[api] = {
                calls: 0,
                successes: 0,
                failures: 0,
                averageResponseTime: 0
            };
        });

        this.initializeEventHandlers();
    }

    /**
     * Initialize event handlers
     * @private
     */
    initializeEventHandlers() {
        this.on('error', (error) => {
            this.stats.errors.push({
                timestamp: Date.now(),
                error: error.message,
                url: error.url
            });
            this.debug(`Error occurred: ${error.message}`, 'error');
        });

        this.on('success', (info) => {
            const api = info.source;
            if (this.stats.apiUsage[api]) {
                this.stats.apiUsage[api].successes++;
                this.stats.apiUsage[api].averageResponseTime = 
                    (this.stats.apiUsage[api].averageResponseTime * (this.stats.apiUsage[api].successes - 1) + info.duration) 
                    / this.stats.apiUsage[api].successes;
            }
        });
    }

    /**
     * Clean expired cache entries
     * @private
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.options.maxCacheAge) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Generate cache key for URL
     * @private
     * @param {string} url - Video URL
     * @returns {string} Cache key
     */
    generateCacheKey(url) {
        return createHash('md5').update(url).digest('hex');
    }

    /**
     * Get a random user agent
     * @private
     * @returns {string} Random user agent
     */
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * Log debug messages if debug mode is enabled
     * @private
     * @param {string} message - Debug message
     * @param {string} level - Log level (info, warn, error)
     */
    debug(message, level = 'info') {
        if (this.options.debug) {
            const timestamp = new Date().toISOString();
            this.emit('debug', { timestamp, level, message });
        }
    }

    /**
     * Extract video ID from TikTok URL
     * @private
     * @param {string} url - TikTok video URL
     * @returns {string|null} Video ID
     */
    async getVideoId(url) {
        try {
            // Support multiple URL formats
            const patterns = [
                /video\/(\d+)/,
                /\/v\/(\d+)/,
                /vm\.tiktok\.com\/(\w+)/,
                /vt\.tiktok\.com\/(\w+)/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }

            // If no pattern matches, try to fetch the redirect URL
            if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
                const response = await axios.head(url);
                const finalUrl = response.request.res.responseUrl;
                return this.getVideoId(finalUrl);
            }

            return null;
        } catch (error) {
            this.debug(`Error extracting video ID: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Fetch with retry and proxy support
     * @private
     * @param {string} url - URL to fetch
     * @param {object} options - Fetch options
     * @returns {Promise<object>} Response data
     */
    async fetchWithRetry(url, options = {}) {
        const retries = this.options.maxRetries;
        let lastError = null;

        for (let i = 0; i < retries; i++) {
            try {
                const config = {
                    ...options,
                    url,
                    headers: {
                        'User-Agent': this.getRandomUserAgent(),
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        ...options.headers
                    },
                    timeout: this.options.timeout,
                    proxy: this.options.proxyUrl ? {
                        host: this.options.proxyUrl,
                        protocol: 'http'
                    } : null
                };

                this.debug(`Attempt ${i + 1}/${retries} for ${url}`);
                const response = await axios(config);
                return response;
            } catch (error) {
                lastError = error;
                this.debug(`Fetch attempt ${i + 1} failed: ${error.message}`, 'warn');
                if (i < retries - 1) {
                    const delay = Math.pow(2, i) * 1000; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Enhanced video metadata fetching with parallel API calls
     * @private
     * @param {string} url - TikTok video URL
     * @returns {Promise<object>} Video metadata
     */
    async getVideoMetadata(url) {
        const cacheKey = this.generateCacheKey(url);
        
        // Check cache first
        if (this.options.cacheResults && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.options.maxCacheAge) {
                this.stats.cacheSaves++;
                this.debug('Using cached result', 'info');
                return cached.data;
            }
        }

        const errors = [];
        const videoId = await this.getVideoId(url);
        this.emit('progress', { status: 'fetching', message: 'Fetching video metadata...' });

        // Enhanced parallel API calls with timeout
        const apiMethods = [
            { name: 'snaptik', fn: () => this.trySnaptikAPI(url) },
            { name: 'tikwm', fn: () => this.tryTikwmAPI(url) },
            { name: 'tikdown', fn: () => this.tryTikdownAPI(url) },
            { name: 'savett', fn: () => this.trySaveTTAPI(url) },
            { name: 'ssstik', fn: () => this.trySsstikAPI(url) },
            { name: 'dlpanda', fn: () => this.tryDlpandaAPI(url) },
            { name: 'webscraping', fn: () => this.tryWebScraping(url) }
        ];

        const results = await Promise.allSettled(
            apiMethods.map(async ({ name, fn }) => {
                const startTime = Date.now();
                try {
                    this.stats.apiUsage[name].calls++;
                    const result = await Promise.race([
                        fn(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), this.options.timeout)
                        )
                    ]);
                    
                    if (result) {
                        this.stats.apiUsage[name].successes++;
                        const duration = Date.now() - startTime;
                        this.stats.apiUsage[name].averageResponseTime = 
                            (this.stats.apiUsage[name].averageResponseTime * 
                            (this.stats.apiUsage[name].successes - 1) + duration) / 
                            this.stats.apiUsage[name].successes;
                        return result;
                    }
                    return null;
                } catch (error) {
                    this.stats.apiUsage[name].failures++;
                    errors.push(`${name}: ${error.message}`);
                    return null;
                }
            })
        );

        const successfulResults = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        if (successfulResults.length === 0) {
            throw new Error(`All methods failed:\n${errors.join('\n')}`);
        }

        // Get best quality result
        const bestResult = this.selectBestQuality(successfulResults);

        // Cache the result
        if (this.options.cacheResults) {
            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                data: bestResult
            });
        }

        return bestResult;
    }

    /**
     * Try SnaptikAPI method
     * @private
     */
    async trySnaptikAPI(url) {
        try {
            const response = await this.fetchWithRetry(this.apis.snaptik, {
                params: { url: encodeURIComponent(url) }
            });
            if (response.data?.video) {
                return {
                    videoUrl: response.data.video.url,
                    author: response.data.author.name,
                    desc: response.data.video.description,
                    quality: 'high',
                    source: 'snaptik'
                };
            }
        } catch (error) {
            this.debug(`SnaptikAPI failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Try TikWM API method
     * @private
     */
    async tryTikwmAPI(url) {
        try {
            const response = await this.fetchWithRetry(`${this.apis.tikwm}/?url=${encodeURIComponent(url)}`);
            if (response.data?.data) {
                return {
                    videoUrl: response.data.data.play,
                    author: response.data.data.author.nickname,
                    desc: response.data.data.title,
                    quality: 'high',
                    source: 'tikwm'
                };
            }
        } catch (error) {
            this.debug(`TikWM API failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Try web scraping method
     * @private
     */
    async tryWebScraping(url) {
        try {
            const response = await this.fetchWithRetry(url);
            const $ = cheerio.load(response.data);
            const videoUrl = $('video source').first().attr('src');
            if (videoUrl) {
                return {
                    videoUrl,
                    author: $('meta[property="og:author"]').attr('content'),
                    desc: $('meta[property="og:description"]').attr('content'),
                    quality: 'medium',
                    source: 'webscraping'
                };
            }
        } catch (error) {
            this.debug(`Web scraping failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Try SaveTT API method
     * @private
     */
    async trySaveTTAPI(url) {
        try {
            const response = await this.fetchWithRetry(`${this.apis.savett}/ajaxSearch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `url=${encodeURIComponent(url)}`
            });
            if (response.data?.links?.[0]) {
                return {
                    videoUrl: response.data.links[0].url,
                    author: response.data.author || 'Unknown',
                    desc: response.data.desc || '',
                    quality: 'high',
                    source: 'savett'
                };
            }
        } catch (error) {
            this.debug(`SaveTT API failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Try Tikdown API method
     * @private
     */
    async tryTikdownAPI(url) {
        try {
            const response = await this.fetchWithRetry(`${this.apis.tikdown}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { url }
            });
            if (response.data?.video) {
                return {
                    videoUrl: response.data.video.url,
                    author: response.data.author,
                    desc: response.data.description,
                    quality: 'high',
                    source: 'tikdown'
                };
            }
        } catch (error) {
            this.debug(`Tikdown API failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Try SSSTik API method
     * @private
     */
    async trySsstikAPI(url) {
        try {
            const response = await this.fetchWithRetry(`${this.apis.ssstik}/info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': this.getRandomUserAgent()
                },
                data: { url }
            });

            if (response.data?.video) {
                return {
                    videoUrl: response.data.video.url,
                    author: response.data.author,
                    desc: response.data.description,
                    quality: 'high',
                    source: 'ssstik'
                };
            }
        } catch (error) {
            this.debug(`SSSTik API failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Try DLPanda API method
     * @private
     */
    async tryDlpandaAPI(url) {
        try {
            const response = await this.fetchWithRetry(`${this.apis.dlpanda}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': this.getRandomUserAgent()
                },
                data: { url }
            });

            if (response.data?.url) {
                return {
                    videoUrl: response.data.url,
                    author: response.data.author,
                    desc: response.data.description,
                    quality: 'high',
                    source: 'dlpanda'
                };
            }
        } catch (error) {
            this.debug(`DLPanda API failed: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Select the best quality video from available sources
     * @private
     * @param {Array<object>} results - Array of successful results
     * @returns {object} Best quality video metadata
     */
    selectBestQuality(results) {
        const qualityMap = { high: 3, medium: 2, low: 1 };
        const preferredQuality = this.options.preferredQuality;

        // Sort by quality and source reliability
        results.sort((a, b) => {
            if (qualityMap[b.quality] !== qualityMap[a.quality]) {
                return qualityMap[b.quality] - qualityMap[a.quality];
            }
            // If qualities are equal, prefer certain sources
            const sourceOrder = ['snaptik', 'tikwm', 'tikdown', 'savett', 'webscraping'];
            return sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source);
        });

        // Select the best match based on preferred quality
        let selected = results[0];
        if (preferredQuality !== 'high') {
            selected = results.find(r => r.quality === preferredQuality) || selected;
        }

        this.debug(`Selected source: ${selected.source} with quality: ${selected.quality}`);
        return selected;
    }

    /**
     * Download TikTok video
     * @public
     * @param {string} url - TikTok video URL
     * @param {object} options - Download options
     * @returns {Promise<object>} Video information
     */
    async downloadVideo(url, options = {}) {
        this.stats.totalDownloads++;
        const startTime = Date.now();

        try {
            this.emit('start', { url, timestamp: startTime });
            const metadata = await this.getVideoMetadata(url);
            
            if (!metadata || !metadata.videoUrl) {
                throw new Error('Could not get video URL');
            }

            this.stats.successfulDownloads++;
            const endTime = Date.now();
            const duration = endTime - startTime;
            this.stats.averageSpeed = (this.stats.averageSpeed * (this.stats.successfulDownloads - 1) + duration) / this.stats.successfulDownloads;

            this.emit('success', {
                url: metadata.videoUrl,
                author: metadata.author,
                description: metadata.desc,
                quality: metadata.quality,
                source: metadata.source,
                duration: duration
            });

            return {
                url: metadata.videoUrl,
                author: metadata.author,
                description: metadata.desc,
                quality: metadata.quality,
                source: metadata.source
            };
        } catch (error) {
            this.stats.failedDownloads++;
            this.emit('error', { error: error.message, url });
            throw error;
        }
    }

    /**
     * Get download statistics
     * @public
     * @returns {object} Download statistics
     */
    getStats() {
        return {
            ...this.stats,
            successRate: (this.stats.successfulDownloads / this.stats.totalDownloads) * 100,
            averageSpeedMs: Math.round(this.stats.averageSpeed)
        };
    }

    /**
     * Reset download statistics
     * @public
     */
    resetStats() {
        this.stats = {
            totalDownloads: 0,
            successfulDownloads: 0,
            failedDownloads: 0,
            averageSpeed: 0
        };
    }

    /**
     * Get detailed statistics
     * @public
     * @returns {object} Detailed statistics
     */
    getDetailedStats() {
        const uptime = Date.now() - this.stats.startTime;
        return {
            ...this.stats,
            uptime,
            successRate: (this.stats.successfulDownloads / this.stats.totalDownloads) * 100,
            averageSpeedMs: Math.round(this.stats.averageSpeed),
            cacheEfficiency: (this.stats.cacheSaves / this.stats.totalDownloads) * 100,
            apiPerformance: this.stats.apiUsage,
            lastErrors: this.stats.errors.slice(-5), // Last 5 errors
            totalSizeFormatted: this.formatBytes(this.stats.totalSize)
        };
    }

    /**
     * Format bytes to human readable format
     * @private
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default TikTokDownloader; 