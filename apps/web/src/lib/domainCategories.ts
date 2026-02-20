export type DomainCategory = 'Analytics' | 'Ads' | 'Fonts' | 'Video' | 'CDN' | 'Social' | 'Other'

interface CategoryConfig {
  label: DomainCategory
  pattern: RegExp
  riskLevel: 1 | 2 | 3
  badgeCn: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: 'Analytics',
    pattern: /googletagmanager|google-analytics|analytics\.google|gtag\.|segment\.io|hotjar|mixpanel|heap\.io|amplitude|datadog/,
    riskLevel: 1,
    badgeCn: 'bg-red-100 text-red-700 border border-red-200',
  },
  {
    label: 'Ads',
    pattern: /doubleclick|googlesyndication|adservice|amazon-adsystem|connect\.facebook|fbcdn|fbevents|adtrafficquality|media\.net|doubleverify|adform/,
    riskLevel: 1,
    badgeCn: 'bg-red-100 text-red-700 border border-red-200',
  },
  {
    label: 'Social',
    pattern: /twitter|x\.com|t\.co|facebook\.com|instagram|linkedin|snapchat|pinterest|tiktok|whatsapp/,
    riskLevel: 2,
    badgeCn: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  {
    label: 'Fonts',
    pattern: /fonts\.googleapis|fonts\.gstatic|typekit\.net|fontawesome|use\.typekit|p\.typekit/,
    riskLevel: 2,
    badgeCn: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  {
    label: 'Video',
    pattern: /youtube|vimeo|wistia|jwplatform|mux\.com|brightcove/,
    riskLevel: 2,
    badgeCn: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  {
    label: 'CDN',
    pattern: /cloudfront|jsdelivr|unpkg|cdnjs|fastly|akamaized|cloudflare|gstatic\.com|storage\.googleapis|nyt\.com|theathletic/,
    riskLevel: 3,
    badgeCn: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  },
]

const OTHER: CategoryConfig = {
  label: 'Other',
  pattern: /.*/,
  riskLevel: 3,
  badgeCn: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
}

export function categorizeDomain(domain: string): CategoryConfig {
  for (const cat of CATEGORIES) {
    if (cat.pattern.test(domain)) return cat
  }
  return OTHER
}

export function sortDomainsByRisk(domains: string[]): string[] {
  return [...domains].sort((a, b) => {
    return categorizeDomain(a).riskLevel - categorizeDomain(b).riskLevel
  })
}
