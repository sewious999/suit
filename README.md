# Atelier — Publishable Custom Suit Configurator

## What this is
A production-oriented Vite + React + Three.js web app starter.

## Run locally
```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

## Build for production
```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Publish
### Vercel
1. Put this project in a GitHub repository.
2. Import the repository into Vercel.
3. Framework: Vite.
4. Build command: `npm run build`
5. Output directory: `dist`

### Netlify
Build command: `npm run build`
Publish directory: `dist`

### GitHub Pages
Use a Vite-compatible GitHub Pages workflow or deploy the generated `dist/` directory.

## V1 capabilities
- Interactive 3D viewer with 360° OrbitControls
- Single/double-breasted
- Notch/peak/shawl lapels
- Lapel width 5–15 cm in 0.5 cm increments
- Shoulder, pocket and vent options
- Button material/color/count
- Surgical/working cuffs and sleeve button count
- Multiple suit colors and fabric patterns
- Trouser pleats, hems and break
- Local save
- Shareable design URL using encoded configuration
- Responsive desktop/mobile layout

## Production upgrade path
The current 3D suit is procedural. For a truly photorealistic commercial product, replace it with a professionally modeled GLB/GLTF garment system with modular components or morph targets. The React configuration state is already separated from the viewer so that a production asset can be wired into the same controls.
