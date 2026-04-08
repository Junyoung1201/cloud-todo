import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {

    const isProduction = command === 'build' || mode === 'production';

    return {
        plugins: [react()],
        base: isProduction ? '/cloud-todo/' : '/',
        build: {
            outDir: 'build'
        },

        // 개발환경
        server: {
            port: 5819,
            host: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:5820',
                    changeOrigin: true
                },
                '/socket.io': {
                    target: 'http://localhost:5820',
                    changeOrigin: true,
                    ws: true
                }
            }
        }
    }
})
