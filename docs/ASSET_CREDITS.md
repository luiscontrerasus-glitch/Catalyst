# Visual asset credits

## Fonts

The current refinement self-hosts **Instrument Serif Regular** for the homepage headline and **Geist** for the interface with `next/font/local`. Files came from the [official Instrument Serif directory](https://github.com/google/fonts/tree/main/ofl/instrumentserif) and [official Geist directory](https://github.com/google/fonts/tree/main/ofl/geist). Original copyright and SIL Open Font License 1.1 notices are preserved in `src/app/fonts/InstrumentSerif-OFL.txt` and `src/app/fonts/Geist-OFL.txt`. No external font request, subscription, or package dependency is required at runtime or build time.

Only trailing whitespace in the two license files was normalized; license and copyright wording is unchanged. Newsreader/DM Sans files and licenses belong to the earlier `e01944b` redesign. They remain as historical source assets but are no longer imported or loaded by the current application. Current headings outside the homepage hero, project titles, forms, graph nodes, counts, and navigation all use Geist.

## Logo and diagrams

The Catalyst leaf/connection mark and favicon are original SVG code authored with Codex assistance. The four-part homepage model is implemented in React/SVG/CSS, with real explanatory controls and no invented project result. Product graph rendering uses the existing React Flow implementation. Icons remain Lucide, credited alongside the existing dependencies in the README.

## Original community artwork

Saved project asset: `public/images/community-garden.png`.

Generated using the **built-in image-generation tool**, not a CLI or a new production API integration. The image is an imagined garden scene. It appeared with an illustration caption in the earlier redesign; the entire artwork section is removed in the current minimal refinement, so this image is not requested by the current homepage. It is not evidence of an actual event, real participant, customer, testimonial or measured impact. The user-provided reference mockups guided the design direction; they were not copied into the source or redistributed as product assets.

Exact generation prompt:

> Use case: illustration-story. Asset type: original panoramic editorial illustration for the supporting section of Catalyst, a community project planning website. Primary request: a quiet, sophisticated hand-painted gouache and colored-pencil scene of neighbors of different adult ages collaborating in a small community garden, two people discussing a paper plan at a wooden potting table, another person tending a raised bed, flowering herbs and simple urban garden structures, a few understated buildings and trees behind them. Warm morning light, cream paper, muted forest green and sage foliage, warm ochre and terracotta details. Human-centered and inviting, beautiful refined magazine illustration with visible paper grain and natural imperfect brush texture, not generic corporate vector art, not photorealistic, no floating UI. Wide landscape composition about 2:1, detailed but calm, edge-to-edge scene suitable for a wide cropped supporting banner. No lettering, no text, no logos, no fake quotes or statistics, no screens, no devices, no gradients/glow, no giant exaggerated faces. This depicts a fictional illustrative scene, not an actual event. Save the completed original artwork as a local file and make the local file path available so it can be copied into the Catalyst workspace.

The earlier version used `next/image` for responsive optimized copies. The unused source PNG remains in the repository for provenance. No generated image is used as a substitute for a working UI or an actual verification screenshot.
