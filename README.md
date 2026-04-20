# VenueIQ — Your Stadium, Decoded

VenueIQ is a premium, energetic sports event companion designed to modernize the stadium experience. Built for the modern fan, it provides real-time insights, AI-driven assistance, and seamless concession ordering, all within a high-contrast, neon-themed interface.

![VenueIQ Logo](./public/favicon.svg)

## 🏟️ The Experience

- **Live Crowd Heatmaps**: See the flow of the stadium in real-time. Avoid the crush and find the clearest paths.
- **Queue Oracle**: AI-predicted wait times for every concession stall. Know exactly when to get your next drink.
- **Order to Seat**: Skip the food queue entirely. Order from your stall and get a notification when it's ready or have it delivered to your seat.
- **AI Stadium Assistant**: A natural language companion that knows the stadium better than anyone. Ask for directions, restroom locations, or match stats.
- **Premium Design**: A high-contrast, energetic stadium palette (Electric Cyan & Neon Lime) featuring glassmorphism and modern typography.

## 🚀 Tech Stack

- **Core**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [TanStack Start](https://tanstack.com/start) — Deeply integrated routing and server functions.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with a custom Oklch color system.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: Radix UI primitives with custom glassmorphism styling.
- **Deployment**: Configured for Cloudflare/Vite environments.

## 🛠️ Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) installed.

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the dev server
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## 📁 Project Structure

- `src/routes/`: TanStack Router-based file routing.
- `src/components/`: Reusable UI components & the unique VenueIQ Logo.
- `src/hooks/`: Custom hooks for venue live data and simulation.
- `src/lib/`: Core logic for fan sessions and stadium metrics.
- `src/styles.css`: The central design system tokens (Cyan & Lime).

## 🎨 Design System

VenueIQ uses a dedicated "Energetic Stadium" palette:
- **Primary**: Electric Cyan (`oklch(0.65 0.18 200)`)
- **Accent**: Neon Lime (`oklch(0.8 0.22 140)`)
- **Background**: Deep Space (`oklch(0.12 0.015 250)`)

---

Built with ❤️ for fans who want a smarter match day.
