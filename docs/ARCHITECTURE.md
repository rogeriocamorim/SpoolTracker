# SpoolTracker Architecture

## Overview

SpoolTracker is a full-stack web application for managing 3D printing filament spools. It consists of a React frontend and a Quarkus (Java) backend, communicating via REST APIs.

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v7
- **Styling**: CSS Modules with CSS Variables for theming
- **Form Validation**: react-hook-form + zod (planned)
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend
- **Framework**: Quarkus (Java)
- **ORM**: Hibernate ORM with Panache
- **Database**: MariaDB
- **API**: REST (JAX-RS)
- **Validation**: Jakarta Validation
- **Build Tool**: Maven

## Architecture Patterns

### Frontend Architecture

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable React components
│   │   ├── ui/          # Base UI components
│   │   └── ...          # Feature components
│   ├── contexts/        # React contexts (Theme, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── schemas/         # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   └── App.tsx          # Root component
```

**Key Patterns:**
- **Component Composition**: Reusable UI components
- **Custom Hooks**: Extract reusable logic (useDebounce, etc.)
- **API Layer**: Centralized API client with interceptors
- **Type Safety**: Full TypeScript coverage

### Backend Architecture

```
backend/
├── src/main/java/com/spooltracker/
│   ├── dto/             # Data Transfer Objects
│   ├── entity/          # JPA entities
│   ├── resource/        # REST endpoints
│   ├── service/         # Business logic services
│   ├── exception/       # Exception handlers
│   └── ...
```

**Key Patterns:**
- **Active Record**: Panache entities with static methods
- **DTO Pattern**: Separate DTOs for API contracts
- **Service Layer**: Business logic in services (SpoolHistoryService)
- **Global Exception Handling**: Centralized error responses

## Data Flow

### Frontend Data Flow

1. **User Action** → Component
2. **Component** → React Query Hook
3. **React Query** → API Client
4. **API Client** → Backend API
5. **Response** → React Query Cache
6. **Cache Update** → Component Re-render

### Backend Data Flow

1. **HTTP Request** → REST Resource
2. **Resource** → Service (if needed)
3. **Service/Resource** → Entity (Panache)
4. **Entity** → Database (via Hibernate)
5. **Response** → DTO → JSON

## Database Schema

### Core Entities

- **Spool**: Main entity representing a filament spool
- **Location**: Hierarchical location system (AMS, Rack, etc.)
- **FilamentType**: Type of filament (PLA Basic, PETG HF, etc.)
- **FilamentColor**: Color options for filament types
- **Material**: Base material (PLA, PETG, ABS, etc.)
- **Manufacturer**: Filament manufacturer
- **SpoolHistory**: Audit trail for spool changes

### Relationships

```
Spool
├── belongs to FilamentType
├── belongs to FilamentColor
├── belongs to Manufacturer
├── belongs to Location (optional)
└── has many SpoolHistory

Location
├── has many Spools
└── has parent Location (hierarchical)

FilamentType
├── belongs to Material
├── belongs to Manufacturer
└── has many FilamentColors
```

## API Design

### RESTful Principles

- **Resources**: Nouns (spools, locations, materials)
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Status Codes**: Standard HTTP status codes
- **Pagination**: Page-based pagination
- **Error Handling**: Consistent error response format

### Endpoint Structure

```
/api/{resource}              # List/Create
/api/{resource}/{id}         # Get/Update/Delete
/api/{resource}/{id}/{action} # Specific actions
```

## State Management

### Frontend State

- **Server State**: React Query (caching, synchronization)
- **UI State**: React useState/useReducer
- **Global UI State**: React Context (Theme)

### Backend State

- **Database**: MariaDB (persistent storage)
- **Transactions**: @Transactional for data consistency

## Security

### Current Implementation

- **CORS**: Configured for specific origins
- **Input Validation**: Backend validation annotations
- **SQL Injection**: Prevented by ORM (Hibernate)

### Planned

- Authentication (JWT)
- Authorization (Role-based)
- Rate Limiting
- Security Headers

## Error Handling

### Frontend

- **Error Boundary**: Catches React errors
- **API Interceptors**: Global error handling
- **Toast Notifications**: User-friendly error messages
- **Retry Logic**: Automatic retry for network errors

### Backend

- **Global Exception Handler**: Consistent error responses
- **Validation**: Jakarta Validation annotations
- **Error DTOs**: Structured error responses

## Performance Optimizations

### Frontend

- **Code Splitting**: Route-based lazy loading
- **Debouncing**: Search input debouncing
- **Pagination**: Server-side pagination
- **Query Caching**: React Query cache

### Backend

- **Database Indexes**: Defined in entity annotations
- **Pagination**: Limit query results
- **Lazy Loading**: Hibernate lazy loading
- **Query Optimization**: Panache query building

## Deployment

### Docker

- **Frontend**: Nginx container serving static files
- **Backend**: JVM container running Quarkus
- **Database**: External MariaDB

### Configuration

- **Environment Variables**: For configuration
- **Docker Compose**: Local development
- **Deploy Script**: Automated deployment

## Testing Strategy

### Current

- Basic test structure exists
- Unit test example (SpoolResourceTest)

### Planned

- Unit tests for services
- Integration tests for APIs
- Frontend component tests
- E2E tests

## Future Considerations

- **Caching**: Redis for frequently accessed data
- **Real-time Updates**: WebSocket support
- **Mobile App**: PWA or native app
- **Analytics**: Usage tracking and reporting
- **Backup**: Automated database backups

