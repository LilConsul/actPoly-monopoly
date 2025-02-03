import path from "path"
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [react()],
    server: {
        port: process.env.PORT,
        strictPort: true,
        host: true,
        allowedHosts: ['frontend'],
        origin: `http://0.0.0.0:${process.env.PORT}`,
        watch: {
            usePolling: true,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

})