# Frontend Concepts Used in This Build

A reference for everything used to build the Atelier Mudassar demo — what each
technique is, why it's here, and where to find it in the code. Read it top to
bottom once, then use it as a lookup whenever you hit an unfamiliar pattern in
the codebase.

---

## 1. Next.js fundamentals

**App Router.** Everything lives under `src/app/`. A folder = a route; `page.tsx`
inside it is what renders. We only have one route (`/`), so all the content is
composed inside `src/app/page.tsx` out of section components.

**Server vs. Client Components.** By default, every component in the App
Router is a *Server Component* — it renders to HTML on the server, ships zero
JavaScript for itself, and can't use browser-only things like `useState` or
`onClick`. The moment a component needs interactivity (state, effects, event
handlers, animation libraries that touch the DOM), it needs the
`"use client"` directive at the very top of the file — that opts it into
being a *Client Component*, hydrated and interactive in the browser.

Look at the first line of `Navbar.tsx`, `Gallery.tsx`, `Hero.tsx` — all
`"use client"`, because they use `useState`, scroll listeners, or Framer
Motion. `layout.tsx` and `page.tsx` themselves have no directive — they're
server-rendered shells that just compose the client components together.

**Why this matters:** it's the single biggest architectural decision in
modern React. Shipping less JavaScript to the browser = faster load. The
skill is pushing `"use client"` as far down the tree as possible instead of
slapping it on everything.

**`next/font`** (`layout.tsx`). Fonts (Playfair Display, Cormorant Garamond,
Jost) are downloaded and self-hosted at build time instead of fetched from
Google's CDN at runtime. That avoids a render-blocking network request and a
layout shift when the font swaps in. Each font is exposed as a CSS variable
(`--font-display`, `--font-accent`, `--font-body`) and wired into Tailwind's
theme in `globals.css`.

**`next/image`** (used everywhere art appears). A drop-in replacement for
`<img>` that automatically: resizes images for the viewport, serves modern
formats, lazy-loads offscreen images, and prevents layout shift by reserving
space before the image loads.

Two patterns you'll see repeatedly:
- `fill` + a `relative`/`absolute` positioned parent — the image stretches to
  fill its container instead of setting explicit width/height. Used for every
  artwork card and the hero portrait.
- `sizes="(max-width: 768px) 50vw, 33vw"` — tells the browser how wide the
  image will actually render at different viewport widths, so it can request
  an appropriately-sized file instead of always downloading the largest
  version. Get this wrong and you silently ship oversized images to phones.
- `priority` on the hero image only — this disables lazy-loading for the one
  image that's visible immediately on page load (nothing else should have this
  prop, or you defeat the point of lazy loading).

---

## 2. Tailwind CSS v4 theming

This project uses Tailwind v4, which changed how custom design tokens work.
Instead of a `tailwind.config.js` with a `theme.extend` object, tokens are
declared directly in CSS using `@theme` (see `globals.css`):

```css
@theme inline {
  --color-gold: #cda35f;
  --color-ink: #0c0906;
  ...
}
```

Any `--color-*` token declared this way automatically becomes usable as a
Tailwind utility class — `--color-gold` gives you `bg-gold`, `text-gold`,
`border-gold`, etc., for free. This is how the whole espresso/gold/cream
palette in this build was wired up as first-class Tailwind utilities instead
of one-off inline styles.

**Naming note:** Tailwind v4 renamed `bg-gradient-to-r` → `bg-linear-to-r`
(more accurate now that Tailwind supports non-linear gradients too). Both
still work, but the new name is canonical — that's why you'll see
`bg-linear-to-*` throughout instead of the old `-gradient-` classes.

**Opacity modifiers** (`text-cream-dim/80`, `border-gold/25`) — the `/N`
suffix sets alpha transparency on any color utility without needing a
separate `rgba()` value or a second class.

---

## 3. CSS layout concepts

**Stacking context & z-index — the bug you actually hit.** When two elements
are both `position: absolute` with no explicit `z-index`, the browser paints
them in DOM order — later elements paint *on top of* earlier ones. The hero
portrait was invisible because the "atmospheric gradient wash" `<div>` was
written *after* the portrait's container in the JSX, so its opaque gradient
painted directly over the image, hiding it completely. The fix was pure
ordering: background/decorative layers first, subject (the image) after,
foreground content (text) last with an explicit `z-10`. This is one of the
most common real-world CSS bugs — always sanity-check paint order when
something "disappears" despite clearly being in the DOM.

**`object-fit` / `object-position`** (every artwork image). `object-cover`
makes an image fill its box without distorting aspect ratio, cropping
whatever overflows. `object-position` controls *which part* gets kept when
cropping happens — e.g. `object-[30%_center]` on the hero portrait biases the
crop toward the subject's face instead of the default center crop.

**`aspect-ratio` via Tailwind's `aspect-*`** (`Gallery.tsx`, `Process.tsx`).
Reserves a fixed width:height ratio for a box before its content (often an
image that's still loading) has loaded — prevents layout jank.

**CSS Grid with variable spans** (`Gallery.tsx`). The gallery grid uses
`grid-cols-2 md:grid-cols-3` with one card per five getting
`col-span-2 row-span-2` — that's what creates the "featured, larger tile
breaking the rhythm" look instead of a flat, monotonous grid.

**The CSS-crop trick** (`Process.tsx`). Rather than pre-cropping images
pixel-by-pixel, a full image is placed in a shorter `aspect-[16/8.3]` box
with `object-cover object-top` — this crops off the bottom of the image
(where unwanted caption text lived) purely in CSS, no image editing needed.
Useful trick any time you need "most of this image, minus one edge."

---

## 4. Framer Motion (animation)

This is the library doing essentially all the motion in the site. Core ideas:

**`initial` / `animate` / `exit`.** Every animated element declares its
starting style (`initial`), its resting style (`animate`), and — if it can
be removed from the DOM — its style while leaving (`exit`, only works inside
`<AnimatePresence>`). Framer interpolates between them automatically; you
never write a manual CSS `@keyframes` for this.

**`whileInView` + `viewport={{ once: true }}`.** This is what makes sections
fade/slide into place *as you scroll to them* rather than all firing at page
load. `once: true` means the animation plays the first time the element
enters the viewport and never replays on scroll-back — prevents an annoying
re-trigger every time you scroll past a section twice.

**`AnimatePresence`** (`Navbar.tsx` mobile menu, `Gallery.tsx` filter grid and
lightbox). Normally when React removes an element from the tree, it's just
gone — no exit animation possible, because the DOM node is already deleted
before Framer gets a chance to animate it out. `AnimatePresence` wraps the
conditional render and delays the actual removal until the `exit` animation
finishes playing.

**`layout` prop + `mode="popLayout"`** (`Gallery.tsx` filter buttons). When
you filter the gallery, cards are added/removed and the remaining cards need
to *slide* into their new grid positions rather than snapping instantly.
`layout` tells Framer to animate any position change automatically;
`popLayout` mode makes exiting items animate out without shoving the
remaining grid items around while they leave.

**`useScroll` / `useMotionValueEvent`** (`Navbar.tsx`). Reads live scroll
position as a reactive value and lets you respond to it (here: toggling the
navbar's background once you've scrolled past 40px) without manually
attaching and cleaning up a `scroll` event listener yourself.

**`useSpring`** (`ScrollProgress.tsx`). Wraps a raw value (scroll progress,
0→1) in spring physics so the progress bar *eases* toward the real value
instead of jumping to match the scroll position every single frame — a small
detail that makes it feel considerably less mechanical.

---

## 5. Smooth scrolling (Lenis)

`SmoothScroll.tsx` replaces the browser's native (slightly abrupt) scroll
with an eased, momentum-based scroll feel. It works by hijacking the scroll
loop: on every animation frame (`requestAnimationFrame`), it asks Lenis to
compute the current interpolated scroll position and apply it. This is a
common "premium site" tell — most polished portfolio/agency sites use some
version of this instead of native scroll.

---

## 6. Interaction patterns

**Controlled filter state** (`Gallery.tsx`). `useState` holds which category
is active; the visible artwork list is derived from it with `useMemo` rather
than stored separately — this guarantees the filtered list can never drift
out of sync with the selected filter, because it's *computed*, not
duplicated state.

**Lightbox modal.** A few things happening together when you open an
artwork:
- `document.body.style.overflow = "hidden"` while open, to stop the page
  scrolling behind the modal.
- A `keydown` listener for `Escape` (close), `ArrowLeft`/`ArrowRight`
  (prev/next) — keyboard support isn't optional polish, it's expected
  behavior for any modal/lightbox.
- Both effects are cleaned up in the `useEffect` return function when the
  modal closes or the component unmounts — forgetting this cleanup is a
  classic React bug (the listener keeps firing after the modal is gone).

**Magnetic/reveal buttons** (`Hero.tsx` "View Portfolio"). A filled color
`<span>` sits translated fully below the button (`translate-y-full`) and
slides up to cover it on hover via a CSS `transition-transform` — cheaper
and smoother than animating `background-color` directly.

---

## 7. Accessibility touches

- Every meaningful image has a descriptive `alt` (not just the filename).
- Icon-only buttons (menu toggle, lightbox close/prev/next) have
  `aria-label` since there's no visible text for a screen reader to announce.
- The lightbox is fully keyboard-operable (Escape/arrows), not mouse-only.
- Color contrast: body copy uses `cream-dim`/`porcelain` against dark
  backgrounds rather than low-contrast gold-on-dark for anything
  paragraph-length — gold is reserved for accents and short labels.

---

## 8. The asset pipeline (how the art got from PDF to the site)

Worth understanding even though it's not "frontend" per se: the client's PDF
was rasterized page-by-page at 3x resolution using `pdfjs-dist` +
`@napi-rs/canvas` (Node), then each artwork was cropped out of its page
programmatically before being dropped into `public/art/`. This is why image
paths in `src/app/data/artworks.ts` point to files like `page04_art.png` —
the naming just tracks which PDF page they came from. For the real build,
these should be replaced with the client's actual full-resolution source
files once he provides them; the PDF crops are demo-quality only.

---

## Quick glossary

| Term | One-line meaning |
|---|---|
| Hydration | React attaching interactivity to server-rendered HTML in the browser |
| Client Component | A component that ships JS and can use state/effects/events |
| Stacking context | The rule set that decides which overlapping element paints on top |
| `useMemo` | Cache a computed value so it's only recalculated when its inputs change |
| `useEffect` cleanup | Code that undoes a side effect (listener, timer) when it's no longer needed |
| Viewport-triggered animation | Animation that plays when an element scrolls into view, not on page load |
| Layout animation | Animating an element's position/size change automatically instead of it snapping |
| CLS (Cumulative Layout Shift) | A page-quality metric penalized when content jumps around as it loads — what `aspect-ratio` and `next/image` sizing prevent |
