# Visual asset credits

## Fonts

Newsreader and DM Sans are self-hosted with `next/font/local`; the browser does not request Google Fonts. Original variable font files came from the [official Newsreader directory](https://github.com/google/fonts/tree/main/ofl/newsreader) and [official DM Sans directory](https://github.com/google/fonts/tree/main/ofl/dmsans). Their license/copyright wording is retained in `src/app/fonts/Newsreader-OFL.txt` and `src/app/fonts/DMSans-OFL.txt` (SIL Open Font License 1.1); a trailing space was normalized. The designs' authors and copyright holders are identified in those files.

Newsreader regular/italic files provide editorial headings, paired with DM Sans for UI text. No font subscription, new package dependency or external runtime font service was added.

## Logo and diagrams

The Catalyst leaf/connection mark and favicon are original SVG code authored with Codex assistance. The six-part homepage model is implemented in React/SVG/CSS, with real explanatory controls and no invented project result. Product graph rendering uses the existing React Flow implementation. Icons remain Lucide, credited alongside the existing dependencies in the README.

## Original community artwork

Saved project asset: `public/images/community-garden.png`.

Generated using the **built-in image-generation tool**, not a CLI or a new production API integration. The image is an imagined garden scene; its on-page caption identifies it as an original illustration. It is not evidence of an actual event, real participant, customer, testimonial or measured impact. The user-provided reference mockups guided the design direction; they were not copied into the source or redistributed as product assets.

Exact generation prompt:

> Use case: illustration-story. Asset type: original panoramic editorial illustration for the supporting section of Catalyst, a community project planning website. Primary request: a quiet, sophisticated hand-painted gouache and colored-pencil scene of neighbors of different adult ages collaborating in a small community garden, two people discussing a paper plan at a wooden potting table, another person tending a raised bed, flowering herbs and simple urban garden structures, a few understated buildings and trees behind them. Warm morning light, cream paper, muted forest green and sage foliage, warm ochre and terracotta details. Human-centered and inviting, beautiful refined magazine illustration with visible paper grain and natural imperfect brush texture, not generic corporate vector art, not photorealistic, no floating UI. Wide landscape composition about 2:1, detailed but calm, edge-to-edge scene suitable for a wide cropped supporting banner. No lettering, no text, no logos, no fake quotes or statistics, no screens, no devices, no gradients/glow, no giant exaggerated faces. This depicts a fictional illustrative scene, not an actual event. Save the completed original artwork as a local file and make the local file path available so it can be copied into the Catalyst workspace.

`next/image` serves appropriately sized optimized versions. The source PNG remains in the repository for reproducibility. No generated image is used as a substitute for a working UI or an actual verification screenshot.
