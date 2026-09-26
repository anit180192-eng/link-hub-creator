import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Folder,
  Globe2,
  Layers,
  Link2,
  Plus,
} from "lucide-react";
import homeImage from "@/assets/homepage/04-published-home-demo.webp.asset.json";
import creativeImage from "@/assets/homepage/05-creative-tab-demo.webp.asset.json";
import "./homepage.css";

const collections = {
  Personal: [
    {
      name: "Everyday essentials",
      links: [
        ["G", "Gmail", "Email"],
        ["C", "Calendar", "Your schedule"],
        ["D", "Drive", "Your files"],
      ],
    },
    {
      name: "A little inspiration",
      links: [
        ["P", "Pinterest", "Ideas to keep"],
        ["Y", "YouTube", "Watch & learn"],
      ],
    },
  ],
  Work: [
    {
      name: "Start the workday",
      links: [
        ["N", "Notion", "Notes & projects"],
        ["S", "Slack", "Team conversations"],
        ["M", "Meet", "Video meetings"],
      ],
    },
    {
      name: "Make progress",
      links: [
        ["T", "Trello", "Project boards"],
        ["D", "Docs", "Write & collaborate"],
      ],
    },
  ],
  Creative: [
    {
      name: "Make something",
      links: [
        ["C", "Canva", "Design ideas"],
        ["F", "Figma", "Your designs"],
        ["P", "Pinterest", "Visual inspiration"],
      ],
    },
    {
      name: "Share your work",
      links: [
        ["Y", "YouTube", "Your channel"],
        ["I", "Instagram", "Your posts"],
      ],
    },
  ],
};
type Topic = keyof typeof collections;
const topics = Object.keys(collections) as Topic[];

function Example() {
  const [topic, setTopic] = useState<Topic>("Personal");
  return (
    <div id="example" className="lp-example">
      <div className="lp-browser">
        <span className="lp-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          <Globe2 size={12} /> Your personal start page
        </span>
        <span className="lp-example-badge">Interactive example</span>
      </div>
      <div className="lp-example-content">
        <div className="lp-greeting">
          <div>
            <p>A PLACE FOR YOUR EVERYDAY</p>
            <h2>Hello, Alex.</h2>
            <span>Your next click starts here.</span>
          </div>
          <div className="lp-clock" aria-label="Example clock, nine forty one">
            09:41<span>Local time · example</span>
          </div>
        </div>
        <div
          className="lp-demo-tabs"
          role="tablist"
          aria-label="Example collections"
          onKeyDown={(event) => {
            const index = topics.indexOf(topic);
            const next =
              event.key === "ArrowRight"
                ? (index + 1) % topics.length
                : event.key === "ArrowLeft"
                  ? (index + topics.length - 1) % topics.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? topics.length - 1
                      : -1;
            const value = topics[next];
            if (!value) return;
            event.preventDefault();
            setTopic(value);
            event.currentTarget
              .querySelectorAll<HTMLButtonElement>('[role="tab"]')
              [next]?.focus();
          }}
        >
          {topics.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              id={`demo-${name}`}
              aria-controls="demo-content"
              aria-selected={topic === name}
              tabIndex={topic === name ? 0 : -1}
              onClick={() => setTopic(name)}
            >
              <Layers size={14} />
              {name}
            </button>
          ))}
        </div>
        <div
          className="lp-demo-folders"
          id="demo-content"
          role="tabpanel"
          aria-labelledby={`demo-${topic}`}
        >
          {collections[topic].map((group) => (
            <section key={group.name} className="lp-demo-folder">
              <h3>
                <Folder size={15} />
                {group.name}
                <span>{group.links.length}</span>
              </h3>
              {group.links.map(([letter, title, description], index) => (
                <div className="lp-demo-link" key={title}>
                  <span className={`lp-letter lp-letter-${index}`}>
                    {letter}
                  </span>
                  <span>
                    <b>{title}</b>
                    <small>{description}</small>
                  </span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </div>
              ))}
            </section>
          ))}
        </div>
        <p className="lp-demo-note">
          Try the tabs above. Sample links are for illustration.
        </p>
      </div>
    </div>
  );
}

export function HomeLanding({ signedIn = false }: { signedIn?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lpb-home-theme");
      if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
    } catch { /* Use the system theme when storage is unavailable. */ }
    const sync = (event: StorageEvent) => {
      if (event.key !== "lpb-home-theme") return;
      setTheme(event.newValue === "light" || event.newValue === "dark" ? event.newValue : "system");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const [screen, setScreen] = useState<"home" | "links">("home");
  const ctaUrl = signedIn ? "/dashboard" : "/auth?mode=signup";
  const ctaText = signedIn ? "Open my dashboard" : "Create my free page";
  const cta = (className = "") => (
    <a className={`lp-button lp-primary ${className}`} href={ctaUrl}>
      {ctaText}
      <ArrowRight size={17} />
    </a>
  );
  return (
    <div className="lp-home" data-theme={theme}>
      <a className="lp-skip" href="#main">
        Skip to content
      </a>
      <header className="lp-header lp-container">
        <a href="/" className="lp-brand" aria-label="Landing Page Builder home">
          <span>
            <Bookmark size={21} />
          </span>
          <div>
            Landing Page Builder<small>YOUR PERSONAL START PAGE</small>
          </div>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#plans">Plans</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="lp-header-actions">
          <label className="lp-theme-control">
            <span>Theme</span>
            <select aria-label="Homepage colour theme" value={theme} onChange={(event) => {
              const next = event.target.value as "light" | "dark" | "system";
              setTheme(next);
              try { localStorage.setItem("lpb-home-theme", next); } catch { /* Keep the selection for this visit. */ }
            }}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
        <a
          className="lp-signin"
          href={signedIn ? "/dashboard" : "/auth?mode=signin"}
        >
          {signedIn ? "My dashboard" : "Log in"}
          <ArrowUpRight size={15} />
        </a>
        </div>
      </header>
      <main id="main">
        <section className="lp-hero lp-container">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">
              <span /> A HOME FOR YOUR BOOKMARKS
            </p>
            <h1>
              Your everyday websites.
              <br />
              <em>One personal start page.</em>
            </h1>
            <p className="lp-intro">
              Turn your favourite links into a page you can open every day. Keep
              work, life and side projects organised in tabs and folders.
            </p>
            <div className="lp-actions">
              {cta()}
              <a className="lp-text-link" href="#example">
                See an example
                <ChevronRight size={17} />
              </a>
            </div>
            <p className="lp-reassurance">
              <Check size={14} /> Free account <span>·</span> No coding{" "}
              <span>·</span> No extension required
            </p>
          </div>
          <div className="lp-hero-demo">
            <Example />
            <p className="lp-caption">
              <span>01 /</span> This is the kind of page you’ll create—not the
              editor.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="lp-how lp-container">
          <div className="lp-section-heading">
            <p className="lp-eyebrow">
              FROM “WHERE’S THAT LINK?” TO “RIGHT HERE.”
            </p>
            <h2>Start small. Make it yours.</h2>
            <p>You only need an account and one website to get started.</p>
          </div>
          <div className="lp-steps">
            {[
              [
                "01",
                "Create your free account",
                "Click “Create my free page” and sign up. You’ll arrive in your dashboard.",
              ],
              [
                "02",
                "Add the websites you use",
                "Paste your first link, or import a bookmarks file. Give related links a tab or folder.",
              ],
              [
                "03",
                "Open your own start page",
                "Preview and publish it. Bookmark its address, or follow our guide to make it your browser homepage.",
              ],
            ].map(([number, title, body]) => (
              <article key={number}>
                <span className="lp-step-number">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-proof">
          <div className="lp-container lp-proof-grid">
            <div>
              <p className="lp-eyebrow">YOUR LINKS, WITH ROOM TO BREATHE</p>
              <h2>
                A familiar place.
                <br />
                Every time you open it.
              </h2>
              <p>
                Keep favourite links close, group the rest by topic, and add
                world clocks for the places that matter to you.
              </p>
              <ul className="lp-checks">
                <li>
                  <Check />
                  Separate profiles for work and personal life
                </li>
                <li>
                  <Check />
                  Tabs and folders that make sense to you
                </li>
                <li>
                  <Check />A page address you can use in any browser
                </li>
              </ul>
              <p className="lp-proof-note">
                Build in your dashboard. Use your published page day to day.
              </p>
            </div>
            <div className="lp-shot">
              <div
                className="lp-shot-tabs"
                role="group"
                aria-label="Choose a published-page screenshot"
              >
                <button
                  type="button"
                  aria-pressed={screen === "home"}
                  onClick={() => setScreen("home")}
                >
                  Published home
                </button>
                <button
                  type="button"
                  aria-pressed={screen === "links"}
                  onClick={() => setScreen("links")}
                >
                  Published links tab
                </button>
              </div>
              <img
                src={screen === "home" ? homeImage.url : creativeImage.url}
                alt={
                  screen === "home"
                    ? "Sample published start page showing a greeting, clocks and favourite links"
                    : "Sample published links tab with links grouped in a folder"
                }
                width="1600"
                height="900"
                loading="lazy"
              />
              <p>Actual product screenshots · sample content</p>
            </div>
          </div>
        </section>

        <section id="plans" className="lp-container lp-plans">
          <div>
            <p className="lp-eyebrow">A SIMPLE PLACE TO START</p>
            <h2>Make your first page for free.</h2>
            <p>
              Get comfortable with your page before thinking about anything
              else.
            </p>
          </div>
          <div className="lp-free-card">
            <div className="lp-plan-top">
              <span>FREE ACCOUNT</span>
              <b>£0</b>
            </div>
            <ul>
              <li>
                <Check />2 profiles
              </li>
              <li>
                <Check />5 tabs per profile
              </li>
              <li>
                <Check />
                Unlimited links and folders
              </li>
              <li>
                <Check />
                Bookmark file import and publishing
              </li>
            </ul>
            {cta()}
            <p>No payment details needed for the free plan.</p>
          </div>
          <p className="lp-premium-note">
            Need more room later? Premium offers 10 profiles and 50 tabs per
            profile.{" "}
            <strong>New Premium subscriptions are currently paused.</strong>{" "}
            <a href="/pricing.html">
              View plan and billing details <ArrowUpRight size={13} />
            </a>
          </p>
        </section>

        <section className="lp-container lp-extension">
          <span className="lp-extension-icon">
            <Plus />
          </span>
          <div>
            <h2>Save a website while you browse.</h2>
            <p>
              Our optional Chrome extension connects to your builder. You can
              also use the website without installing anything.
            </p>
          </div>
          <a
            href="https://chromewebstore.google.com/detail/cgbpomcaomohgkboedipghgiojcjkmdk"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-button lp-secondary"
          >
            View Chrome extension
            <ArrowUpRight size={16} />
          </a>
        </section>

        <section id="questions" className="lp-container lp-faq">
          <div>
            <p className="lp-eyebrow">A FEW THINGS TO KNOW</p>
            <h2>
              New here?
              <br />
              You’re in the right place.
            </h2>
            <p>
              Still unsure?{" "}
              <a href="mailto:antcodeslabs@gmail.com">Ask us a question.</a>
            </p>
          </div>
          <div>
            {[
              [
                "What does this tool actually do?",
                "It helps you build a personal page of website shortcuts. Instead of finding the same websites in bookmarks, messages or open browser tabs, you can open them from your own organised start page.",
              ],
              [
                "Do I need to know how to build a website?",
                "No. Create an account, paste a website address and use the dashboard to organise it. You don’t need to write code or arrange a website from scratch.",
              ],
              [
                "What are profiles, tabs and folders?",
                "A profile is a separate start page—for example, Personal or Work. Tabs divide that page into topics. Folders group related links inside a tab. Start with the defaults and organise more later.",
              ],
              [
                "Does it replace my browser or change every new tab?",
                "No. It is a website you open in your existing browser. After publishing, you can bookmark your page or follow the setup guide to set it as your homepage. Browser setup is a separate, optional step.",
              ],
              [
                "Can I protect my published page?",
                "Use PIN & access in the dashboard to configure protection for each profile. Review those settings before sharing its address. Your account sign-in and a profile’s access PIN serve different purposes.",
              ],
              [
                "Do I have to install the extension?",
                "No. You can add links yourself or import an HTML bookmarks file from the dashboard. The Chrome extension is an optional shortcut for saving websites while you browse.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus size={17} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-last lp-container">
          <p className="lp-eyebrow">ONE ACCOUNT. YOUR OWN STARTING POINT.</p>
          <h2>Start with the links you already love.</h2>
          <p>
            Your email. Your favourite tools. That project you keep coming back
            to.
          </p>
          {cta()}
        </section>
      </main>
      <footer className="lp-footer lp-container">
        <div>
          <b>Landing Page Builder</b>
          <p>A personal start page for your everyday web.</p>
          <small>
            Built by{" "}
            <a
              href="https://aurunex.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              AuruNex
            </a>
          </small>
        </div>
        <nav aria-label="Footer">
          <a href="/setup">Browser setup guide</a>
          <a href="/pricing.html">Pricing</a>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="/refunds.html">Refunds & cancellation</a>
          <a href="mailto:antcodeslabs@gmail.com">Contact</a>
        </nav>
      </footer>
    </div>
  );
}
