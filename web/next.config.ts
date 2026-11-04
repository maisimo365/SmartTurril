import path from "path";
import nextEnv from "@next/env";
import type { NextConfig } from "next";

// Cargar variables de entorno desde el .env de raiz
try {
  const { loadEnvConfig } = nextEnv;
  loadEnvConfig(path.resolve(process.cwd(), ".."));
} catch {
  // Ojito hijasss en Vercel las variables de entorno se configuran directo en el panel del proyecto
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
