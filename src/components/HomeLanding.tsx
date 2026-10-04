import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Folder,
  Globe2,
  Layers,
  Link2,
  Plus,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { HomeWidgetDemo } from "./HomeWidgetDemo";
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

const useCases = [
  {
    audience: "TEAM ONBOARDING",
    title: "Give new colleagues a place to start.",
    problem: "A new colleague needs project tools, templates and shared folders. The links are scattered across Teams, emails and bookmarks.",
    solution: "Bring those destinations into one project page. Group links into Start here, Everyday tools and Reference, then share the page with each new joiner.",
    example: "Project overview · Templates · Working tools",
  },
  {
    audience: "CREATIVE & AI PROJECTS",
    title: "Keep your next idea within reach.",
    problem: "You’re trying AI tools, building small websites or making music. Each experiment adds more project links, tutorials and profiles to manage.",
    solution: "Organise your creative work into tabs and folders, so the tools you use, the projects you’re building and the places you share them stay easy to revisit.",
    example: "Web experiments · Music tools · My profiles",
  },
  {
    audience: "TRAINING & WORKSHOPS",
    title: "Share the resources with the session.",
    problem: "Tool links and exercises get buried in the session chat. Afterwards, learners ask for the same resources again.",
    solution: "Share a resource page at the start. Group preparation, live exercises and further reading, then add recording links when they’re available.",
    example: "Tools to try · Exercises · Keep learning",
  },
  {
    audience: "PROJECT & PROGRAMME MANAGEMENT",
    title: "Make every workstream easier to navigate.",
    problem: "Your project uses different boards, dashboards and document folders. Remembering where each one lives becomes another task.",
    solution: "Use tabs for workstreams and folders for planning, delivery and reporting. Give people a familiar route to the systems where their work happens.",
    example: "Planning · Delivery · Reporting",
  },
  {
    audience: "COMPANY RESOURCES",
    title: "Keep useful information close at hand.",
    problem: "People repeatedly ask where to find request forms, company information and learning resources.",
    solution: "Maintain a page of clearly labelled resource links. Create a separate public-facing collection for company introductions, services and contact information.",
    example: "Company information · Forms · Learning",
  },
  {
    audience: "MARKETING & MULTIPLE BRANDS",
    title: "Give each brand its own collection.",
    problem: "Websites, social profiles, campaign assets and company stories get mixed together when you manage more than one brand.",
    solution: "Create a separate profile for each brand, within your plan’s limits. Organise links to its story, published work and campaign resources in one place.",
    example: "About us · Our journey · Campaign resources",
  },
];

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
            09:41<span>Optional clock · example</span>
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
          <img src="/homepage-logo.svg" alt="" width={40} height={40} />
          <div>
            Landing Page Builder<small>YOUR PERSONAL START PAGE</small>
          </div>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#use-cases">Use cases</a>
          <a href="#features">Features</a>
          <a href="#plans">Plans</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="lp-header-actions">
          <div className="lp-theme-control" role="group" aria-label="Homepage colour theme">
            {([
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "System", Monitor],
            ] as const).map(([value, label, Icon]) => (
              <button key={value} type="button" aria-label={label + " theme"} title={value === "system" ? "Match system theme" : label + " theme"} aria-pressed={theme === value} onClick={() => {
                setTheme(value);
                try { localStorage.setItem("lpb-home-theme", value); } catch { /* Keep the selection for this visit. */ }
              }}>
                <Icon size={15} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}
          </div>
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
              work, life and side projects organised in tabs and folders. Add the
              widgets you need, then drag everything into place.
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
            <a className="lp-text-link lp-use-cases-link" href="#use-cases">
              See how this fits your work and everyday life
              <ChevronRight size={17} aria-hidden="true" />
            </a>
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
                "Paste your first link, or import a bookmarks file. Group links in folders, then add optional widgets to Home.",
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

        <section id="use-cases" className="lp-container lp-use-cases" aria-labelledby="use-cases-heading">
          <div className="lp-section-heading">
            <p className="lp-eyebrow">REAL SITUATIONS. ONE ORGANISED STARTING POINT.</p>
            <h2 id="use-cases-heading">Where would one page help you?</h2>
            <p>Onboarding a colleague, running a workshop or exploring a creative idea? Give the links you need a place you can return to.</p>
          </div>
          <div className="lp-feature-cards lp-use-case-cards">
            {useCases.map(({ audience, title, problem, solution, example }) => (
              <article key={audience}>
                <span>{audience}</span>
                <h3>{title}</h3>
                <p>{problem}</p>
                <p className="lp-use-case-solution"><strong>How your page helps</strong>{solution}</p>
                <p className="lp-use-case-example"><Folder size={14} aria-hidden="true" /><span>{example}</span></p>
              </article>
            ))}
          </div>
          <div className="lp-use-cases-next">
            <p>Start with the links you share repeatedly or open every day. Keep the collection current as your work changes.</p>
            {cta()}
          </div>
          <p className="lp-use-cases-note">You manage the page and share it with your audience. Linked documents and tools keep their existing access requirements.</p>
        </section>

        <section id="features" className="lp-proof">
          <div className="lp-container lp-proof-grid">
            <div>
              <p className="lp-eyebrow">NEW WAYS TO MAKE HOME YOURS</p>
              <h2>
                Your links. Your widgets.
                <br />
                Your way to start.
              </h2>
              <p>
                Choose from nine optional Home widgets. Keep a few useful things
                in view, without filling your page with things you don’t need.
              </p>
              <ul className="lp-checks">
                <li>
                  <Check />
                  Small sticky notes that expand when clicked
                </li>
                <li>
                  <Check />
                  Checklists, a focus timer and a monthly calendar
                </li>
                <li>
                  <Check />Drag folders and widgets into your preferred order
                </li>
              </ul>
              <p className="lp-proof-note">
                In the builder, open Home → Add widget. Choose compact or wide cards,
                arrange them, and use them on your published page.
              </p>
            </div>
            <div className="lp-shot">
              <div
                className="lp-shot-tabs"
                role="group"
                aria-label="Choose a product preview"
              >
                <button
                  type="button"
                  aria-pressed={screen === "home"}
                  onClick={() => setScreen("home")}
                >
                  Try Home widgets
                </button>
                <button
                  type="button"
                  aria-pressed={screen === "links"}
                  onClick={() => setScreen("links")}
                >
                  Published links tab
                </button>
              </div>
              {screen === "home" ? <HomeWidgetDemo /> : <>
                <img src={creativeImage.url} alt="Sample published links tab with links grouped in a folder" width="1600" height="900" loading="lazy" />
                <p>Product screenshot · sample content</p>
              </>}
            </div>
          </div>
        </section>

        <section className="lp-container lp-feature-overview" aria-label="What you can add to your start page">
          <div className="lp-feature-cards">
            <article><span>01 / PICK YOUR WIDGETS</span><h3>Only what helps your day.</h3><p>Clock & date, world clocks, favourites, most visited, recently opened, sticky notes, checklist, focus timer and monthly calendar. Nothing is added automatically to a new profile.</p></article>
            <article><span>02 / ARRANGE YOUR SPACE</span><h3>Grab. Move. Make it yours.</h3><p>Drag folders within a tab and widgets on Home using the dotted handles. Positions save automatically. Move arrows are there when you prefer them.</p></article>
            <article><span>03 / CHOOSE YOUR LOOK</span><h3>A page that feels like you.</h3><p>Choose from 20 colour combinations, use light, dark or system mode, and give each profile its own style.</p></article>
          </div>
          <p className="lp-feature-privacy">Notes and checklist items stay in the current browser for each profile; they aren’t synced or published. Anyone using that browser can see them. Most visited and recently opened count only links opened through your page in that browser.</p>
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
              <li>
                <Check />Optional widgets and drag-and-drop organisation
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
              <a href="mailto:aurunex.ventures@gmail.com">Ask us a question.</a>
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
                "How do I add widgets or move things around?",
                "In the builder, open Home and click Add widget. Choose only the widgets you want, set their width, and drag the dotted handles to rearrange them. You can also drag folders within a tab. The move arrows offer an alternative to dragging.",
              ],
              [
                "Are my sticky notes and tasks shared with visitors?",
                "No. Note text and checklist items are stored only in the current browser, separately for each profile. Visitors in another browser get their own notes and tasks. These items do not sync between devices, and clearing browser data removes them. Anyone sharing your browser can see them.",
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
          <p>
            Curious about what else we build and explore?{" "}
            <a href="https://aurunex.com/" target="_blank" rel="noopener noreferrer">
              Explore AuruNex <ArrowUpRight size={11} aria-hidden="true" />
            </a>
          </p>
        </div>
        <nav aria-label="Footer">
          <a href="#use-cases">Use cases</a>
          <a href="/setup">Browser setup guide</a>
          <a href="/pricing.html">Pricing</a>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="/refunds.html">Refunds & cancellation</a>
          <a href="mailto:aurunex.ventures@gmail.com">Contact us</a>
        </nav>
      </footer>
    </div>
  );
}
