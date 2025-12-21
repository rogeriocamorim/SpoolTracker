# SpoolTracker API Documentation

## Base URL

- Development: `http://localhost:8080`
- Production: Configured via environment variables

## Authentication

Currently, the API does not require authentication. This is planned for future releases.

## Response Format

All responses are in JSON format unless otherwise specified.

### Success Response

```json
{
  "id": 1,
  "name": "Example",
  ...
}
```

### Error Response

```json
{
  "timestamp": "2024-01-01T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation error message",
  "path": "/api/spools",
  "details": ["Field 'name' is required"]
}
```

## Endpoints

### Spools

#### Get All Spools
```
GET /api/spools
```

**Query Parameters:**
- `location` (optional): Filter by legacy location (AMS, PRINTER, RACK, STORAGE, IN_USE, EMPTY)
- `storageLocationId` (optional): Filter by storage location ID
- `manufacturerId` (optional): Filter by manufacturer ID
- `filamentTypeId` (optional): Filter by filament type ID
- `colorId` (optional): Filter by color ID
- `isEmpty` (optional): Filter by empty status (true/false)
- `colorNumber` (optional): Filter by color number
- `search` (optional): Generic search across multiple fields
- `page` (optional, default: 0): Page number (0-indexed)
- `pageSize` (optional, default: 50): Number of items per page

**Response:**
```json
{
  "content": [...],
  "page": 0,
  "pageSize": 50,
  "totalElements": 100,
  "totalPages": 2,
  "isFirst": true,
  "isLast": false,
  "hasPrevious": false,
  "hasNext": true
}
```

#### Get Spool by ID
```
GET /api/spools/{id}
```

#### Get Spool by UID
```
GET /api/spools/uid/{uid}
```

#### Create Spool
```
POST /api/spools
Content-Type: application/json

{
  "filamentTypeId": 1,
  "colorId": 1,
  "manufacturerId": 1,
  "spoolType": "PLASTIC",
  "storageLocationId": 1,
  "initialWeightGrams": 1000.0,
  "currentWeightGrams": 950.0,
  "colorNumber": "5",
  "notes": "Customer favorite"
}
```

#### Update Spool
```
PUT /api/spools/{id}
Content-Type: application/json

{
  "currentWeightGrams": 900.0,
  "notes": "Updated notes"
}
```

#### Update Spool Location
```
PATCH /api/spools/{id}/location?storageLocationId=2&details=Slot 1
```

#### Update Spool Weight
```
PATCH /api/spools/{id}/weight?weight=850.0
```

#### Mark Spool as Empty
```
PATCH /api/spools/{id}/empty
```

#### Delete Spool
```
DELETE /api/spools/{id}
```

#### Get Spool Statistics by Location
```
GET /api/spools/stats/by-location
```

#### Get Spool Statistics by Material
```
GET /api/spools/stats/by-material
```

### Spool History

#### Get Spool History
```
GET /api/spools/{id}/history
```

**Response:**
```json
[
  {
    "id": 1,
    "action": "LOCATION_CHANGED",
    "description": "Location changed from AMS to Rack",
    "oldValue": "{\"location\": \"AMS\"}",
    "newValue": "{\"location\": \"Rack\"}",
    "createdAt": "2024-01-01T12:00:00"
  }
]
```

### Locations

#### Get All Locations
```
GET /api/locations?activeOnly=true
```

#### Get Location Tree
```
GET /api/locations/tree
```

#### Get Location by ID
```
GET /api/locations/{id}
```

#### Create Location
```
POST /api/locations
Content-Type: application/json

{
  "name": "AMS Slot 1",
  "description": "First slot in AMS",
  "locationType": "AMS",
  "parentId": 1,
  "capacity": 1
}
```

#### Update Location
```
PUT /api/locations/{id}
```

#### Delete Location
```
DELETE /api/locations/{id}
```

#### Move Spool to Location
```
PATCH /api/locations/{locationId}/spools/{spoolId}
```

### Materials

#### Get All Materials
```
GET /api/materials
```

#### Get Material by ID
```
GET /api/materials/{id}
```

#### Create Material
```
POST /api/materials
```

#### Update Material
```
PUT /api/materials/{id}
```

#### Delete Material
```
DELETE /api/materials/{id}
```

### Manufacturers

#### Get All Manufacturers
```
GET /api/manufacturers
```

#### Get Manufacturer by ID
```
GET /api/manufacturers/{id}
```

#### Create Manufacturer
```
POST /api/manufacturers
```

#### Update Manufacturer
```
PUT /api/manufacturers/{id}
```

#### Delete Manufacturer
```
DELETE /api/manufacturers/{id}
```

### Filament Types

#### Get All Filament Types
```
GET /api/filament-types
```

#### Get Filament Type by ID
```
GET /api/filament-types/{id}
```

#### Get Colors for Filament Type
```
GET /api/filament-types/{id}/colors
```

#### Create Filament Type
```
POST /api/filament-types
```

#### Update Filament Type
```
PUT /api/filament-types/{id}
```

#### Delete Filament Type
```
DELETE /api/filament-types/{id}
```

### Export/Import

#### Export Spools to CSV
```
GET /api/export/spools/csv
```

**Response:** CSV file download

#### Import Spools from CSV
```
POST /api/export/spools/csv
Content-Type: text/plain

UID,Color Name,Material,Manufacturer,...
...
```

**Response:**
```
Import completed: 10 imported, 2 skipped

Errors:
Line 5: Manufacturer 'Unknown' not found
```

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently, there is no rate limiting. This will be implemented in future releases.

## CORS

CORS is enabled for the following origins:
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:3000`
- Production URLs (configured via environment variables)

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (0-indexed, default: 0)
- `pageSize`: Items per page (default: 50, max: 100)

## Error Handling

All errors follow the standard error response format. Validation errors include a `details` array with specific field errors.

## Examples

### Create a Spool

```bash
curl -X POST http://localhost:8080/api/spools \
  -H "Content-Type: application/json" \
  -d '{
    "filamentTypeId": 1,
    "colorId": 1,
    "manufacturerId": 1,
    "initialWeightGrams": 1000.0,
    "currentWeightGrams": 1000.0
  }'
```

### Search Spools

```bash
curl "http://localhost:8080/api/spools?search=PLA&page=0&pageSize=20"
```

### Get Spool History

```bash
curl http://localhost:8080/api/spools/1/history
```

