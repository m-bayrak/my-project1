# Growth & E-commerce Case Studies

English portfolio case-study site covering e-commerce growth, website design, campaign design, banner advertising, services, and product pre-order launches.

## Pages

- `index.html` — portfolio overview and headline results
- `site-design.html` — website evolution and redesign work
- `themed-designs.html` — seasonal / campaign design examples
- `banner-insights.html` — GDN / Discovery banner production and measurement
- `services.html` — commerce service initiatives
- `preorders.html` — flagship pre-order growth case study

## Development

This is a static HTML/CSS/JavaScript site. Edit the source files directly. `assets.zip` contains the optimized image library used by the pages. The GitHub Pages workflow unpacks it during deployment.

For local development, unpack the assets first:

```bash
unzip assets.zip
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the site from `main`. In GitHub repository **Settings → Pages**, set **Source** to **GitHub Actions** if it is not already enabled.

## Working with Codex

Codex can edit the HTML, CSS, JavaScript, content structure, accessibility, responsive behavior, and interactions directly in this repository. If image files need to be changed, unzip `assets.zip`, edit or add assets, then rebuild the archive before committing.
