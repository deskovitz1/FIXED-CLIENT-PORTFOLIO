/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    "/api/project-stills": ["./public/projects/**/*"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
