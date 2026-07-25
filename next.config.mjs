/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  },
  webpack: (config) => {
    config.externals.push({
      "onnxruntime-node": "commonjs onnxruntime-node",
      "@huggingface/transformers": "commonjs @huggingface/transformers",
    });
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
