import type { MetadataRoute } from 'next'
import { getServerSupabase } from '@/lib/supabase'

const BASE = process.env.APP_URL ?? 'http://localhost:3000'

/**
 * Fetch unique hostnames from public+done scans (max 500).
 * Returns an empty array on any error so the sitemap degrades gracefully.
 */
async function getPublicReportEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = getServerSupabase()
    const { data } = await supabase
      .from('scans')
      .select('url, created_at')
      .eq('public', true)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(500)

    if (!data) return []

    // Deduplicate by normalised hostname
    const seen = new Set<string>()
    const entries: MetadataRoute.Sitemap = []

    for (const row of data) {
      try {
        const host = new URL(row.url).hostname.replace(/^www\./, '').toLowerCase()
        if (!host || seen.has(host)) continue
        seen.add(host)
        entries.push({
          url: `${BASE}/report/${host}`,
          lastModified: new Date(row.created_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      } catch {
        // skip malformed URLs
      }
    }

    return entries
  } catch {
    // Supabase unavailable at build time → skip report entries
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/scan`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE}/dsgvo-website-check`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/google-fonts-dsgvo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/google-analytics-dsgvo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/facebook-pixel-dsgvo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/tracking-cookies-dsgvo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const reportEntries = await getPublicReportEntries()

  return [...staticEntries, ...reportEntries]
}
