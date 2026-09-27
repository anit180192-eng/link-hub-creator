export const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'x', 'linkedin', 'youtube', 'tiktok', 'github', 'website'] as const;
export type SocialLink = { platform: typeof SOCIAL_PLATFORMS[number]; url: string; label?: string };
export const socialName = (platform: string) => ({ instagram: 'Instagram', facebook: 'Facebook', x: 'X', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok', github: 'GitHub', website: 'Website' })[platform] || 'Website';
export function socialUrl(raw: string): string | null {
  try {
    const value = raw.trim();
    if (!value || value.length > 500) return null;
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password || url.href.length > 500) return null;
    return url.href;
  } catch { return null; }
}
export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap(item => {
    if (!item || !SOCIAL_PLATFORMS.includes(item.platform) || typeof item.url !== 'string') return [];
    const url = socialUrl(item.url);
    return url ? [{ platform: item.platform, url, label: typeof item.label === 'string' ? item.label.slice(0,60) : '' }] : [];
  });
}
