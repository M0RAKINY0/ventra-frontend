import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const srcPath = fileURLToPath(new URL("./src", import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VENTRA_API_PROXY_TARGET || "http://localhost:4000"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": srcPath },
    },
    server: {
      // Same-origin requests in development, so the Better Auth session cookie
      // is sent without extra CORS setup.
      proxy: {
        "/api": { target: apiTarget, changeOrigin: false },
      },
    },
  }
})
