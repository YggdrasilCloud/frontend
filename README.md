# YggdrasilCloud Frontend

Modern photo management web application built with SvelteKit.

## Features

- 🚀 **Fast**: Built with SvelteKit for optimal performance
- 📦 **Smart Caching**: TanStack Query for efficient API data management
- 📤 **Powerful Upload**: Uppy integration with drag & drop, progress tracking, and chunked uploads
- 🎨 **Modern UI**: Clean interface inspired by FileRun and Nextcloud
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔐 **Secure**: JWT authentication support

## Tech Stack

- **Framework**: SvelteKit
- **State Management**: TanStack Query (Svelte Query)
- **File Upload**: Uppy
- **Drag & Drop**: svelte-dnd-action
- **Virtualization**: svelte-virtual-list
- **Language**: TypeScript
- **Styling**: CSS (scoped)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ (if running locally without Docker)

### With Docker (Recommended)

1. Clone the repository:

```bash
git clone git@github.com:YggdrasilCloud/frontend.git
cd frontend
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
docker compose up
```

4. Open your browser at `http://localhost:5173`

### Without Docker

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PUBLIC_API_URL=http://localhost:8888
```

## Development

### Running Commands

**All npm commands should be run inside Docker** to maintain consistency with the PHP backend approach:

```bash
# Start development server
docker compose up

# Run any npm command
docker compose exec frontend npm run build
docker compose exec frontend npm run check
docker compose exec frontend npm run lint

# Install/update dependencies
docker compose exec frontend npm install <package>

# After adding dependencies, rebuild the container
docker compose up -d --build
```

### Commands (when running locally without Docker)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Linting
npm run lint
```

## Project Structure

```
src/
├── lib/
│   ├── api/              # API client and queries
│   └── components/       # Reusable components
├── routes/               # SvelteKit routes (pages)
└── app.html             # HTML template
```

## API Integration

This frontend consumes the YggdrasilCloud API. Make sure the API is running and accessible at the URL specified in `PUBLIC_API_URL`.

API Repository: [YggdrasilCloud/api](https://github.com/YggdrasilCloud/api)

## Documentation

For detailed architecture and technical decisions, see [CLAUDE.md](./CLAUDE.md).

## License

MIT
