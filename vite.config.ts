import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html')
      }
    }
  },
  plugins: [
    react(),
    {
      name: 'configure-mime-types',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.split('?')[0] === '/zenbudget.apk') {
            const apkPath = path.resolve(__dirname, 'zenbudget.apk');
            if (fs.existsSync(apkPath)) {
              res.setHeader('Content-Type', 'application/vnd.android.package-archive');
              res.setHeader('Content-Disposition', 'attachment; filename="ZenBudget.apk"');
              const stream = fs.createReadStream(apkPath);
              stream.pipe(res);
              return;
            }
          }
          next();
        });
      }
    }
  ],
})
