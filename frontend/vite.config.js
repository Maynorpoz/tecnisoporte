import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El puerto 5173 es el de Vite por defecto, pero lo dejo explicito porque
// en esta máquina hay varios proyectos levantados y conviene saber cual
// usa cual. host true es para que también responda desde el contenedor.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
