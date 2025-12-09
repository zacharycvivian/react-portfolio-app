import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/contact", "/edit-profile", "/admin"],
      },
    ],
    sitemap: "https://www.zacharycvivian.com/sitemap.xml",
  };
}
