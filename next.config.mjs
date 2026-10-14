/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/public/index.html", destination: "/home", permanent: false },
      {
        source: "/public/campaign.html",
        destination: "/planner",
        permanent: false,
      },
      {
        source: "/public/cars.html",
        destination: "/catalog",
        permanent: false,
      },
      { source: "/index.html", destination: "/home", permanent: false },
      { source: "/campaign.html", destination: "/planner", permanent: false },
      { source: "/cars.html", destination: "/catalog", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.uploadthing.com" },
    ],
  },
};

export default nextConfig;
