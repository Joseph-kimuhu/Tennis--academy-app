import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function videoRangePlugin() {
  return {
    name: 'video-range-requests',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.match(/\.(mp4|webm|ogg)$/i)) return next();

        const filePath = path.join(__dirname, 'public', decodeURIComponent(req.url));
        if (!fs.existsSync(filePath)) return next();

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'video/mp4');

        if (range) {
          const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
          const start = parseInt(startStr, 10);
          const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': chunkSize,
          });
          fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
          res.writeHead(200, { 'Content-Length': fileSize });
          fs.createReadStream(filePath).pipe(res);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), videoRangePlugin()],
})
