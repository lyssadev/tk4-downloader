import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import boxen from 'boxen';
import gradient from 'gradient-string';
import terminalLink from 'terminal-link';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import figlet from 'figlet';
import fetch from 'node-fetch';
import axios from 'axios';
import TikTokDownloader from './lib/tiktok.js';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Enhanced console styling configuration
const mainBoxOptions = {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'cyan',
    backgroundColor: '#1B1B1B'
};

const alertBoxOptions = {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
    backgroundColor: '#2D2D2D'
};

const successBoxOptions = {
    padding: 1,
    margin: 1,
    borderStyle: 'bold',
    borderColor: 'green',
    backgroundColor: '#1B1B1B'
};

const errorBoxOptions = {
    padding: 1,
    margin: 1,
    borderStyle: 'bold',
    borderColor: 'red',
    backgroundColor: '#1B1B1B'
};

// Enhanced gradient colors
const titleGradient = gradient([
    '#FF0000',
    '#FF7F00',
    '#FFFF00',
    '#00FF00',
    '#0000FF',
    '#4B0082',
    '#9400D3'
]);

const rainbowText = text => gradient(['#ff0000', '#00ff00', '#0000ff'])(text);
const neonText = text => gradient(['#00ff00', '#00ffff', '#ff00ff'])(text);
const goldText = text => gradient(['#FFD700', '#FFA500'])(text);

async function checkForUpdates() {
    const spinner = ora({
        text: rainbowText('Checking for updates...'),
        color: 'cyan',
        spinner: 'dots12'
    }).start();
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/lyssadev/tk4-downloader/main/package.json');
        const data = await response.json();
        
        if (data.version !== packageJson.version) {
            spinner.info(boxen(
                `${chalk.yellow('⚡ UPDATE AVAILABLE ⚡')}\n\n` +
                `Current: ${chalk.dim(packageJson.version)} → Latest: ${chalk.green(data.version)}\n\n` +
                `Run: ${chalk.cyan('npm install -g tk4-downloader')} to update\n` +
                `${chalk.dim('Stay updated for the best experience!')}`,
                alertBoxOptions
            ));
        } else {
            spinner.succeed(chalk.green('✨ You are using the latest version!'));
        }
    } catch (error) {
        spinner.warn(chalk.yellow('⚠️ Could not check for updates'));
    }
}

function displayBanner() {
    console.clear();
    
    // Create a stunning ASCII art title
    const title = figlet.textSync('TK4', {
        font: 'ANSI Shadow',
        horizontalLayout: 'full',
        verticalLayout: 'default'
    });
    
    const subtitle = figlet.textSync('DOWNLOADER', {
        font: 'Small',
        horizontalLayout: 'fitted',
        verticalLayout: 'default'
    });

    const version = figlet.textSync('v1.5.0', {
        font: 'Mini',
        horizontalLayout: 'fitted'
    });

    // Display the enhanced title with rainbow gradient
    console.log('\n');
    title.split('\n').forEach(line => console.log(titleGradient(line)));
    subtitle.split('\n').forEach(line => console.log(neonText(line)));
    version.split('\n').forEach(line => console.log(goldText(line)));
    
    // Display main info box
    console.log(boxen(
        `${chalk.bold(rainbowText('TK4 Downloader'))} ${chalk.dim(`v${packageJson.version}`)}\n\n` +
        `${chalk.blue('◆')} ${neonText('Download TikTok videos in FHD quality')}\n` +
        `${chalk.blue('◆')} ${chalk.red('Remove watermarks automatically')}\n` +
        `${chalk.blue('◆')} ${chalk.magenta('Modern CLI with real-time progress')}\n` +
        `${chalk.blue('◆')} ${chalk.yellow('Optimized for speed and quality')}\n` +
        `${chalk.blue('◆')} ${chalk.green('Multiple download sources')}\n` +
        `${chalk.blue('◆')} ${chalk.cyan('Smart caching system')}\n\n` +
        `${chalk.dim('━'.repeat(50))}\n` +
        `${chalk.dim('Created with')} ${chalk.red('♥')} ${chalk.dim('by')} ${chalk.cyan('lyssadev')} ${chalk.dim('&')} ${chalk.cyan('chifft')}\n` +
        `${chalk.dim('Optimized for Termux & Linux Users')}`,
        mainBoxOptions
    ));
}

async function validateTikTokUrl(url) {
    const regex = /^https?:\/\/((?:vm|vt|www)\.)?tiktok\.com\/.+/i;
    return regex.test(url) || chalk.red('⚠️ Please enter a valid TikTok URL');
}

async function downloadVideo(url, filename) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function downloadTikTok(url) {
    const spinner = ora({
        text: neonText('Initializing download process...'),
        color: 'cyan',
        spinner: 'dots12'
    }).start();

    try {
        // Initialize downloader with enhanced options
        const tiktok = new TikTokDownloader({
            preferredQuality: 'high',
            maxRetries: 3,
            debug: true,
            timeout: 15000,
            cacheResults: true,
            maxCacheAge: 3600000,
            parallelDownloads: 3,
            outputFormat: 'mp4',
            includeAudio: true
        });

        // Add event listeners for better feedback
        tiktok.on('debug', ({ timestamp, level, message }) => {
            if (level === 'error') {
                spinner.warn(chalk.yellow(`${message}`));
            }
        });

        tiktok.on('progress', ({ status, message }) => {
            spinner.text = neonText(message);
        });

        // Start download with progress tracking
        spinner.text = rainbowText('Fetching video information...');
        const videoInfo = await tiktok.downloadVideo(url);
        
        if (!videoInfo || !videoInfo.url) {
            throw new Error('Could not fetch video information');
        }

        const videoId = url.split('/').pop().split('?')[0] || Date.now();
        const filename = `tiktok_${videoId}.mp4`;
        
        spinner.text = neonText('⬇️ Downloading video...');
        await downloadVideo(videoInfo.url, filename);
        
        // Get detailed statistics
        const stats = tiktok.getDetailedStats();
        
        spinner.succeed(chalk.green('✨ Download completed successfully!'));
        
        // Display enhanced success message
        console.log(boxen(
            `${chalk.green('✓')} ${chalk.bold('Download Summary')}\n\n` +
            `${chalk.blue('📁')} Filename: ${chalk.cyan(filename)}\n` +
            `${chalk.blue('👤')} Author: ${chalk.cyan(videoInfo.author || 'Unknown')}\n` +
            `${chalk.blue('🎥')} Quality: ${chalk.green(videoInfo.quality)}\n` +
            `${chalk.blue('🔍')} Source: ${chalk.yellow(videoInfo.source)}\n` +
            `${chalk.blue('📍')} Location: ${chalk.cyan(process.cwd())}\n` +
            `${chalk.blue('⚡')} Status: ${chalk.green('Ready to play!')}\n` +
            `${chalk.blue('📊')} Success Rate: ${chalk.green(Math.round(stats.successRate) + '%')}\n` +
            `${chalk.blue('⏱️')} Response Time: ${chalk.yellow(stats.averageSpeedMs + 'ms')}\n` +
            `${chalk.blue('💾')} Cache Status: ${stats.cacheSaves > 0 ? chalk.green('Hit') : chalk.yellow('Miss')}\n\n` +
            `${chalk.dim('Tip: Your video is ready to be shared!')}`,
            successBoxOptions
        ));

        // Display API performance if debug is enabled
        if (videoInfo.source && stats.apiUsage[videoInfo.source]) {
            const apiStats = stats.apiUsage[videoInfo.source];
            console.log(boxen(
                `${chalk.yellow('API Performance Metrics')}\n\n` +
                `${chalk.blue('🎯')} Success Rate: ${chalk.green(Math.round((apiStats.successes / apiStats.calls) * 100) + '%')}\n` +
                `${chalk.blue('⚡')} Avg Response: ${chalk.cyan(Math.round(apiStats.averageResponseTime) + 'ms')}\n` +
                `${chalk.blue('📊')} Total Calls: ${chalk.yellow(apiStats.calls)}`,
                alertBoxOptions
            ));
        }

        return filename;
    } catch (error) {
        spinner.fail(chalk.red(`❌ Download failed: ${error.message}`));
        
        // Enhanced error display
        console.error(boxen(
            `${chalk.red('❌ Error Details')}\n\n` +
            `${chalk.red(error.message)}\n\n` +
            `${chalk.dim('Troubleshooting Tips:')}\n` +
            `${chalk.dim('1. Check your internet connection')}\n` +
            `${chalk.dim('2. Verify the TikTok URL is valid')}\n` +
            `${chalk.dim('3. Try again in a few moments')}\n` +
            `${chalk.dim('4. The video might be private or deleted')}`,
            errorBoxOptions
        ));
        
        throw error;
    }
}

// Enhanced graceful exit
process.on('SIGINT', () => {
    console.log(boxen(
        `${chalk.yellow('👋 Thanks for using TK4 Downloader!')}\n\n` +
        `${chalk.dim('Follow us on GitHub for updates:')}\n` +
        `${chalk.cyan('https://github.com/lyssadev/tk4-downloader')}\n\n` +
        `${chalk.dim('Star ⭐ the repository if you found it helpful!')}`,
        { padding: 1, margin: 1, borderColor: 'yellow', dimBorder: true }
    ));
    process.exit(0);
});

async function main() {
    displayBanner();
    await checkForUpdates();

    try {
        const { url } = await inquirer.prompt([
            {
                type: 'input',
                name: 'url',
                message: neonText('Enter TikTok video URL:'),
                validate: validateTikTokUrl,
                prefix: '🎥'
            }
        ]);

        await downloadTikTok(url);

        console.log(boxen(
            `${chalk.green('✓')} ${chalk.bold('Success!')}\n\n` +
            `${chalk.dim('Press')} ${chalk.cyan('Ctrl+C')} ${chalk.dim('to exit')}\n` +
            `${chalk.dim('or paste another URL to download more videos')}`,
            { padding: 1, margin: 1, borderColor: 'green', dimBorder: true }
        ));
        
    } catch (error) {
        process.exit(1);
    }
}

main(); 