import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache the client-side Router Cache for dynamic routes so moving between
    // already-visited pages (Dashboard, Daily Entry, Inventory, …) is instant
    // instead of re-fetching from the server on every click. Mutations call
    // revalidatePath(), which busts these entries to keep data fresh.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
