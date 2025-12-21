# 🧵 SpoolTracker

A modern filament spool management system for 3D printing enthusiasts. Track your filament inventory, manage spools across multiple locations (AMS, printer, racks), and never run out of your favorite colors.

![SpoolTracker](https://img.shields.io/badge/version-1.0.0-green) ![Quarkus](https://img.shields.io/badge/Quarkus-3.17.0-blue) ![React](https://img.shields.io/badge/React-18-blue)

## 🚀 Quick Start

### Option 1: One Command (Recommended)

```bash
# Start both backend and frontend together
npm run dev
```

Or use the shell script:

```bash
./start-dev.sh
```

This will start:
- **Backend** at http://localhost:8080
- **Frontend** at http://localhost:5173
- **API Docs** at http://localhost:8080/q/swagger-ui

### Option 2: Start Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw quarkus:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📋 Prerequisites

- **Java 21+** - For Quarkus backend
- **Maven 3.9+** - For building backend (or use included wrapper)
- **Node.js 18+** - For React frontend
- **npm 9+** - For package management

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📦 **Spool Management** | Track individual spools with unique IDs, weights, and locations |
| 🎨 **Color Catalog** | 77 pre-loaded Bambu Lab colors with accurate hex codes |
| 📍 **Location Tracking** | Track spools in AMS, on printer, in storage racks, or in use |
| ⚖️ **Weight Tracking** | Monitor remaining filament with automatic percentage calculation |
| ⚠️ **Low Stock Alerts** | Get notified when spools are running low |
| 📊 **Statistics Dashboard** | Overview of your inventory by location and material type |

## 🗂️ Pre-loaded Data

The application comes with seed data for **Bambu Lab** filaments:

### Materials
- PLA, PETG, ASA/ABS, TPU, PC, PA/PET, PPS, Support, Fiber Reinforced

### Filament Types
| Type | Colors |
|------|--------|
| PLA Basic | 30 colors |
| PLA Matte | 25 colors |
| PETG High Flow | 14 colors |
| PETG Translucent | 8 colors |

### Spool Locations
| Location | Description |
|----------|-------------|
| **AMS** | Automatic Material System |
| **PRINTER** | Currently loaded on printer |
| **RACK** | Storage rack |
| **STORAGE** | General storage |
| **IN_USE** | Currently being used |
| **EMPTY** | Empty/finished spool |

## 🛠️ Tech Stack

### Backend
- **Quarkus 3.17.0** - Supersonic Subatomic Java framework
- **Hibernate ORM with Panache** - Simplified JPA
- **H2 Database** (dev) / **PostgreSQL** (production)
- **RESTEasy Reactive** - Reactive REST endpoints
- **SmallRye OpenAPI** - API documentation

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Lucide Icons** - Beautiful icons
- **CSS Modules** - Scoped styling

## 📡 API Endpoints

### Materials
```
GET    /api/materials          - List all materials
GET    /api/materials/{id}     - Get material by ID
POST   /api/materials          - Create new material
PUT    /api/materials/{id}     - Update material
DELETE /api/materials/{id}     - Delete material
```

### Filament Types
```
GET    /api/filament-types                - List all (filter: materialId, manufacturerId)
GET    /api/filament-types/{id}           - Get by ID
POST   /api/filament-types                - Create new
PUT    /api/filament-types/{id}           - Update
DELETE /api/filament-types/{id}           - Delete
GET    /api/filament-types/{id}/colors    - Get colors
POST   /api/filament-types/{id}/colors    - Add color
```

### Manufacturers
```
GET    /api/manufacturers          - List all manufacturers
GET    /api/manufacturers/{id}     - Get by ID
POST   /api/manufacturers          - Create new
PUT    /api/manufacturers/{id}     - Update
DELETE /api/manufacturers/{id}     - Delete
```

### Spools
```
GET    /api/spools                    - List all (filter: location, manufacturerId, etc.)
GET    /api/spools/{id}               - Get by ID
GET    /api/spools/uid/{uid}          - Get by unique ID
POST   /api/spools                    - Create new spool
PUT    /api/spools/{id}               - Update spool
PATCH  /api/spools/{id}/location      - Update location
PATCH  /api/spools/{id}/weight        - Update weight
PATCH  /api/spools/{id}/empty         - Mark as empty
DELETE /api/spools/{id}               - Delete spool
GET    /api/spools/stats/by-location  - Stats by location
GET    /api/spools/stats/by-material  - Stats by material
```

## 🏗️ Production Build

### Build Backend
```bash
cd backend
./mvnw package -DskipTests
# JAR file: target/backend-1.0.0-SNAPSHOT-runner.jar
```

### Build Frontend
```bash
cd frontend
npm run build
# Output: dist/
```

### Database Setup (PostgreSQL)
```bash
createdb spooltracker
```

Update `backend/src/main/resources/application.properties`:
```properties
%prod.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/spooltracker
%prod.quarkus.datasource.username=your_username
%prod.quarkus.datasource.password=your_password
```

## 📁 Project Structure

```
SpoolTracker/
├── backend/                    # Quarkus backend
│   ├── src/main/java/         # Java source files
│   │   └── com/spooltracker/
│   │       ├── dto/           # Data Transfer Objects
│   │       ├── entity/        # JPA Entities
│   │       └── resource/      # REST Resources
│   └── src/main/resources/
│       ├── application.properties
│       └── import.sql         # Seed data
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── types/            # TypeScript types
│   └── package.json
├── package.json               # Root package.json (dev scripts)
├── start-dev.sh              # Shell script to start dev servers
└── README.md
```

## 📄 License

MIT License - feel free to use and modify for your own projects.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
