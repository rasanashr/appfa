const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const port = 3000;

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PROCESSED_DIR = path.join(__dirname, 'processed');

[UPLOADS_DIR, PROCESSED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/processed', express.static('processed'));
app.use('/downloads', express.static('uploads'));

// Progress tracking
const processingStatus = {};

// Basic SSRF protection - block common internal IP ranges
function isSafeUrl(urlString) {
    try {
        const url = new URL(urlString);
        const hostname = url.hostname;

        // Block private IP ranges and localhost
        const privateIpRegex = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1|localhost)/;
        if (privateIpRegex.test(hostname)) {
            return false;
        }
        return ['http:', 'https:'].includes(url.protocol);
    } catch (e) {
        return false;
    }
}

app.post('/api/process', async (req, res) => {
    const { videoUrl } = req.body;
    if (!videoUrl || !isSafeUrl(videoUrl)) {
        return res.status(400).json({ error: 'Valid public Video URL is required' });
    }

    const id = uuidv4();
    const videoPath = path.join(UPLOADS_DIR, `${id}.mp4`);
    const outputDir = path.join(PROCESSED_DIR, id);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    processingStatus[id] = { status: 'downloading', progress: 0 };
    res.json({ id });

    try {
        // 1. Download the video
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream',
            timeout: 30000, // 30 seconds timeout
            maxContentLength: 100 * 1024 * 1024 // 100MB limit
        });

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            processingStatus[id].status = 'transcoding';

            // 2. Transcode to multi-bitrate HLS
            // For simplicity in this demo, we'll do 360p and 720p
            const command = ffmpeg(videoPath)
                .outputOptions([
                    '-filter_complex [0:v]split=2[v1,v2];[v1]scale=w=1280:h=720[v1out];[v2]scale=w=640:h=360[v2out]',
                    '-map [v1out]', '-c:v:0 libx264 -b:v:0 2800k -maxrate:v:0 2996k -bufsize:v:0 4200k',
                    '-map [v2out]', '-c:v:1 libx264 -b:v:1 800k -maxrate:v:1 856k -bufsize:v:1 1200k',
                    '-map a:0 -c:a:0 aac -b:a:0 128k',
                    '-map a:0 -c:a:1 aac -b:a:1 96k',
                    '-f hls',
                    '-hls_time 10',
                    '-hls_playlist_type disc',
                    '-hls_flags independent_segments',
                    '-hls_segment_filename', path.join(outputDir, 'stream_%v_%03d.ts'),
                    '-master_pl_name master.m3u8',
                    '-var_stream_map', 'v:0,a:0 v:1,a:1'
                ])
                .output(path.join(outputDir, 'playlist_%v.m3u8'))
                .on('progress', (progress) => {
                    processingStatus[id].progress = progress.percent;
                })
                .on('end', () => {
                    processingStatus[id].status = 'completed';
                    processingStatus[id].playlistUrl = `/processed/${id}/master.m3u8`;
                    processingStatus[id].downloadUrl = `/downloads/${id}.mp4`;
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    processingStatus[id].status = 'error';
                });

            command.run();
        });

        writer.on('error', (err) => {
            console.error('Download error:', err);
            processingStatus[id].status = 'error';
        });

    } catch (error) {
        console.error('Error processing video:', error);
        processingStatus[id].status = 'error';
    }
});

app.get('/api/status/:id', (req, res) => {
    const status = processingStatus[req.params.id];
    if (!status) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json(status);
});

// Simple cleanup every hour
setInterval(() => {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    fs.readdirSync(UPLOADS_DIR).forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
        }
    });

    fs.readdirSync(PROCESSED_DIR).forEach(dir => {
        const dirPath = path.join(PROCESSED_DIR, dir);
        const stats = fs.statSync(dirPath);
        if (now - stats.mtimeMs > maxAge) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    });
}, 3600000);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
