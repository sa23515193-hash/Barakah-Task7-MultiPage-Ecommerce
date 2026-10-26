import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Actions sets the repository base path during deployment.
  base: process.env.GITHUB_ACTIONS === "true" ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/` : "/",
});
