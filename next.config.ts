import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  },
};

export default nextConfig;
