
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const certDir = path.join(os.homedir(), "dev-certs");

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: ['online.imm.gov.au', 'online'],
    // https: {
    //   key: fs.readFileSync(
    //     path.join(certDir, "localhost-key.pem")
    //   ),
    //   cert: fs.readFileSync(
    //     path.join(certDir, "localhost.pem")
    //   ),
    // },
  },
});
