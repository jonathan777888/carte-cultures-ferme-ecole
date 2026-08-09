import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/carte-cultures-ferme-ecole/",
  plugins: [react()],
});
