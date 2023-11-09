import { type MetadataRoute } from "next";
import { env } from "~/env.mjs";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${env.NEXTAUTH_URL}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${env.NEXTAUTH_URL}/signin`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}