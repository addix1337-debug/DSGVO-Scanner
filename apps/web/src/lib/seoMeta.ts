import type { Metadata } from 'next'

const BASE = process.env.APP_URL ?? 'http://localhost:3000'
const SITE_NAME = 'DSGVO Scanner'

/**
 * Generates consistent SEO metadata for every landing page:
 * canonical URL, OpenGraph, Twitter Card.
 */
export function seoMeta(
  pathname: string,
  title: string,
  description: string,
): Metadata {
  const url = `${BASE}${pathname}`
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'de_DE',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
