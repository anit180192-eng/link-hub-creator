import { Instagram, Facebook, Linkedin, Youtube, Github, Globe } from 'lucide-react';
import { parseSocialLinks, socialName } from '@/lib/social-links';
export function SocialLinks({ value, disabled = false }: { value: unknown; disabled?: boolean }) {
  const links = parseSocialLinks(value);
  if (!links.length) return null;
  return <div className="flex flex-wrap items-center gap-1" aria-label="Social links">
    {links.map((link,i) => {
      const Icon = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin, youtube: Youtube, github: Github, website: Globe, x: null, tiktok: null }[link.platform];
      const label = `${socialName(link.platform)}${link.label ? ` — ${link.label}` : ` — ${new URL(link.url).hostname}`}`;
      return <a key={i} href={disabled ? undefined : link.url} target={disabled ? undefined : '_blank'} rel="noopener noreferrer" aria-label={label} aria-disabled={disabled || undefined} title={disabled ? 'Archived profile' : label} className="inline-flex size-9 items-center justify-center rounded-md text-hub-accent hover:bg-hub-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
        {Icon ? <Icon className="size-4" aria-hidden="true" /> : <span aria-hidden="true" className="font-bold">{link.platform === 'x' ? '𝕏' : '♪'}</span>}
      </a>;
    })}
  </div>;
}
