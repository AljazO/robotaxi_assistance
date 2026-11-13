# Robotaxi Assistance

Orbit is a robotaxi monitoring and assistance dashboard for fleet operators.
The app includes a responsive operations overview and a live map workspace
with vehicle filters, map controls, fleet statistics, and vehicle assistance
actions.

## Run locally

Install dependencies once:

```bash
npm install
```

To enable Google Maps, create a browser API key in Google Cloud, enable the
Maps JavaScript API, copy `.env.example` to `.env`, and set
`VITE_GOOGLE_MAPS_API_KEY`. Keep the key restricted by HTTP referrer (for
local development, use `http://localhost:5173/*`).

Start the local development server:

```bash
npm run dev
```

Open the URL printed by Vite (normally
[http://localhost:5173](http://localhost:5173)) in your browser.

## Available scripts

- `npm run dev` - start the Vite development server
- `npm run build` - type-check and create a production build
- `npm run preview` - preview the production build locally
