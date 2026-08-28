# Mykola Strelbitskyi · Growth & E-commerce Case Studies

English professional portfolio covering growth marketing, e-commerce, paid acquisition, website optimization, creative operations, services and product launches. The historical portfolio period is primarily 2019–2021.

Live site: [m-bayrak.github.io/growth-marketing-portfolio](https://m-bayrak.github.io/growth-marketing-portfolio/)

## Pages

- `index.html` — recruiter-focused overview and headline results
- `site-design.html` — website evolution and redesign work
- `themed-designs.html` — seasonal and campaign design examples
- `banner-insights.html` — display creative production and measurement
- `services.html` — commerce service initiatives
- `preorders.html` — flagship pre-order growth case study

## Development

The site is plain static HTML, CSS and vanilla JavaScript. There is no framework, package manager or build step.

The normal `assets/` directory contains the original-quality PNG and JPEG portfolio images used by the pages. Analytics screenshots and spreadsheets are intentionally kept at their supplied resolution for readability.

Run the site locally from the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the six pages, shared CSS/JavaScript and the normal `assets/` directory from `main`. In GitHub repository **Settings → Pages**, set **Source** to **GitHub Actions** if it is not already enabled.
