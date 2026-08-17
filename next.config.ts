import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // מאפשר להעלות קבצי Excel/PDF (עד 10MB) דרך ה-Server Action של הייבוא
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
