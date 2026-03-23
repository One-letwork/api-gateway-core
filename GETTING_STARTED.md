# Getting Started with API Gateway Core

Welcome to the API Gateway Core library! This guide will help you set up and start using the library in your project.

## Installation

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Install the Package

```bash
npm install api-gateway-core
```

or with yarn:

```bash
yarn add api-gateway-core
```

## Quick Start

### 1. Create a Basic Express App

Create a new file `src/server.ts`:

```typescript
import express from 'express';
import { AppFactory, ErrorHandlerMiddleware } from 'api-gateway-core';

const app = AppFactory.createApp({
  port: 3000,
  nodeEnv: 'development',
  enableCors: true,
  enableCompression: true,
});

// Define your routes here
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// Setup global error handling (must be after all routes)
AppFactory.setupErrorHandling(app);

// Start server
AppFactory.startServer(app, 3000);
```

### 2. Add Validation to Your Routes

```typescript
import { z } from 'zod';
import { ValidationMiddleware, ApiResponseHelper } from 'api-gateway-core';

// Define your schema
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0).optional(),
});

// Use in route
app.post(
  '/api/users',
  ValidationMiddleware.validateBody(createUserSchema),
  (req, res) => {
    const userData = req.body; // Already validated
    return ApiResponseHelper.created(res, { id: 1, ...userData });
  }
);
```

### 3. Handle Errors

Errors are automatically caught and formatted by the global error handler:

```typescript
import { ApiGatewayError, ErrorCode } from 'api-gateway-core';

app.get('/api/users/:id', (req, res, next) => {
  const userId = req.params.id;
  
  if (!userId) {
    // Throw an error that will be caught by the global handler
    return next(
      new ApiGatewayError(
        ErrorCode.NOT_FOUND,
        404,
        `User ${userId} not found`,
        { userId }
      )
    );
  }
  
  res.json({ id: userId, name: 'John' });
});
```

### 4. Add Pagination Support

```typescript
import { PaginationHelper, ApiResponseHelper } from 'api-gateway-core';

app.get('/api/users', (req, res) => {
  // Parse pagination from query
  const pagination = PaginationHelper.parse({
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  });

  const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ];

  const meta = PaginationHelper.getMeta(users.length, pagination.page, pagination.limit);
  
  return ApiResponseHelper.paginated(res, users, meta);
});
```

### 5. Add Filtering Support

```typescript
import { FilterHelper, ApiResponseHelper } from 'api-gateway-core';

app.get('/api/users', (req, res) => {
  // Parse filters from query
  const filters = FilterHelper.parseFilterObject(req.query);
  
  // Convert to SQL (for PostgreSQL)
  const { sql, params } = FilterHelper.toSqlWhere(filters);
  
  // Use in your database query
  // const query = `SELECT * FROM users WHERE ${sql}`;
  // const users = await db.query(query, params);
  
  return ApiResponseHelper.success(res, []);
});
```

## Configuration

### AppFactory Options

```typescript
interface AppConfig {
  port?: number;                    // Server port
  nodeEnv?: 'development' | 'production' | 'test';
  enableCors?: boolean;             // Enable CORS middleware
  enableCompression?: boolean;      // Enable gzip compression
  enableRequestLogging?: boolean;   // Enable request logging
  trustedProxies?: string[];        // Trust proxy headers
  bodyLimit?: string;               // JSON body size limit
  jsonLimit?: string;               // JSON payload limit
  urlLimit?: string;                // URL encoded payload limit
}
```

## Key Features

### API Response Formatting

All responses follow a consistent format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-20T10:00:00.000Z",
  "path": "/api/users",
  "traceId": "1704629400000-a1b2c3d4"
}
```

### Error Responses

Errors are formatted consistently:

```json
{
  "code": "NOT_FOUND",
  "message": "User not found",
  "statusCode": 404,
  "timestamp": "2024-01-20T10:00:00.000Z",
  "path": "/api/users/999",
  "traceId": "1704629400000-a1b2c3d4"
}
```

### Validation Errors

Validation errors include detailed field-level information:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "statusCode": 400,
  "validationErrors": [
    {
      "field": "email",
      "message": "Invalid email",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Trace IDs

Every request gets a unique trace ID (UUID) for debugging:

```
X-Trace-ID: 1704629400000-a1b2c3d4
```

Pass `X-Trace-ID` in request headers to track errors across services.

## Middleware

### Validation Middleware

Validates request body, query, or params:

```typescript
// Validate body
app.post('/api/users', ValidationMiddleware.validateBody(schema), handler);

// Validate query
app.get('/api/users', ValidationMiddleware.validateQuery(schema), handler);

// Validate params
app.get('/api/users/:id', ValidationMiddleware.validateParams(schema), handler);
```

### Error Handler Middleware

Automatically catches errors and formats responses. Setup last:

```typescript
AppFactory.setupErrorHandling(app);
```

### Request Metadata Middleware

Automatically added by `AppFactory.createApp()`. Adds:
- Trace ID generation
- Request timing
- Response logging

## Utilities

### PaginationHelper

```typescript
// Parse pagination params
const page = PaginationHelper.parse({
  page: 1,
  limit: 20,
});

// Get metadata
const meta = PaginationHelper.getMeta(100, 1, 20);

// Validate sort
const sort = PaginationHelper.validateSort('name:asc', ['name', 'email']);

// SQL pagination
const sql = PaginationHelper.toSqlPagination(1, 20, 'name', 'asc');
```

### FilterHelper

```typescript
// Parse filter string
const filters = FilterHelper.parseFilterString('status:eq:active;age:gt:18');

// Parse filter object
const filters = FilterHelper.parseFilterObject({ status: 'active' });

// Convert to SQL
const { sql, params } = FilterHelper.toSqlWhere(filters);

// Convert to MongoDB
const mongoQuery = FilterHelper.toMongoQuery(filters);
```

### ApiResponseHelper

```typescript
// Success response
ApiResponseHelper.success(res, data);

// Created response (201)
ApiResponseHelper.created(res, data);

// Paginated response
ApiResponseHelper.paginated(res, data, pagination);

// No content (204)
ApiResponseHelper.noContent(res);

// Accepted (202)
ApiResponseHelper.accepted(res);
```

## Building and Deployment

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

This generates TypeScript output to the `dist` folder.

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Best Practices

1. **Always validate input** - Use Zod schemas with validation middleware
2. **Use consistent error codes** - Reference `ErrorCode` enum
3. **Include trace IDs in errors** - Helps with debugging across services
4. **Handle async errors** - Wrap async handlers with try-catch or use error middleware
5. **Validate pagination** - Use `PaginationHelper.validatePaginationParams()`
6. **Sanitize filters** - Use `FilterHelper.sanitizeFieldName()` before database queries
7. **Set appropriate status codes** - Use `created()` for 201, `noContent()` for 204

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# API Version
API_VERSION=1.0.0
```

## Troubleshooting

### Routes returning 404

Make sure error handlers are setup **after** all routes:

```typescript
// Define routes
app.get('/api/users', handler);

// Then setup error handling
AppFactory.setupErrorHandling(app);
```

### Validation not working

Ensure you're using the correct validation middleware:

```typescript
// For body validation
ValidationMiddleware.validateBody(schema)

// For query parameters
ValidationMiddleware.validateQuery(schema)
```

### CORS issues

Configure CORS in AppFactory:

```typescript
AppFactory.createApp({
  enableCors: true,
  // CORS_ORIGIN env variable controls allowed origins
});
```

## Next Steps

- Read [INTEGRATION.md](./INTEGRATION.md) for advanced integration patterns
- Check out examples in the `/examples` directory
- Review the API documentation
- Set up tests with Jest

## Support

For issues, questions, or contributions, please refer to the project repository.
