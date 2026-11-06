import path from "path";
import nextEnv from "@next/env";
import type { NextConfig } from "next";

// Cargar variables de entorno desde el .env unificado en la raíz del proyecto
const { loadEnvConfig } = nextEnv;
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;


