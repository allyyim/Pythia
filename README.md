# Pythia

React + TypeScript app built with Vite and configured for automatic GitHub Pages deployment via GitHub Actions.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub repository + deployment

The project is configured to deploy on every push to `main` using `.github/workflows/deploy-pages.yml`.

1. Create a repo named `Pythia` under https://github.com/allyyim
2. Link this local project and push:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/allyyim/Pythia.git
git push -u origin main
```

3. In the GitHub repo settings, set Pages source to `GitHub Actions`.

After that, every push to `main` triggers a fresh Pages deployment.
