# CoinPulse — Crypto Market Tracker

A responsive React + Vite frontend project created for the Barakah TechLabs React.js Frontend Engineer internship assignment.

## Run locally

1. Install Node.js 20 LTS or newer.
2. Extract this project ZIP and open a terminal in this folder (the folder containing `package.json`).
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Deploy to GitHub Pages

1. Create a **public** GitHub repository with a matching project name.
2. Upload the contents of this folder to the repository root (do not upload the ZIP itself).
3. Push the files to the `main` branch.
4. In GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
5. Open **Actions** and wait for the “Deploy to GitHub Pages” workflow to complete.
6. Open the published URL shown in the workflow deployment details.

The workflow builds the project and applies the repository base path automatically. Keep the workflow file at `.github/workflows/deploy.yml`.

## Notes

- This is a frontend-only project and does not require a backend or database.
- Some features use local sample data or browser storage.
- External fonts and (where applicable) public market API requests require internet access.
- Review the task-specific demo limitations before presenting the project as production software.
