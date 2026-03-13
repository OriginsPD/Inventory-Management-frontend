import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true is disabled — babel-plugin-react-compiler@1.0.0 cannot be resolved
  // by Next.js 16's compiled Babel bundle on the Bun runtime (module path resolution mismatch).
  // Re-enable once Next.js ships built-in React Compiler support that does not require
  // an external Babel plugin, or when a compatible version of the plugin is released.
};

export default nextConfig;
