# API-Gateway-Core 🌐

**Enterprise REST API Design, OpenAPI, and Route Patterns**

A comprehensive API design toolkit with OpenAPI/Swagger templates, REST patterns, request/response standards, and middleware pipeline.

## What is API-Gateway-Core?

API-Gateway-Core provides:

- ✅ **OpenAPI/Swagger Templates** - Auto-generate API documentation
- ✅ **REST Best Practices** - Resource-based endpoints, HTTP semantics
- ✅ **Request/Response Standards** - Consistent JSON schema
- ✅ **Error Handling** - Standardized error responses
- ✅ **Validation Middleware** - Input validation with Zod/Joi
- ✅ **Pagination** - Cursor and offset-based pagination
- ✅ **Filtering** - Query parameter parsing and validation
- ✅ **Versioning** - URL-based and header-based API versioning
- ✅ **CORS Configuration** - Security-first CORS setup
- ✅ **Rate Limiting** - Per-route and global rate limits
- ✅ **Compression** - Automatic response compression
- ✅ **Logging** - Request/response logging middleware
- ✅ **Health Checks** - Readiness and liveness probes

## Quick Start

### 1. Copy API-Gateway-Core

```bash
cp -r api-gateway-core/src your-project/src/api-gateway
cp api-gateway-core/openapi.yaml your-project/
```

### 2. Create Express App with Patterns

```typescript
import { createApp } from '@api-gateway/app';

const app = createApp({
  version: 'v1',
  title: 'My API',
  description: 'Production API',
  basePath: '/api/v1'
});

// Your routes
app.listen(3000);
```

### 3. Define Routes with Validation

```typescript
import { route, validate } from '@api-gateway/decorators';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['user', 'admin']).default('user')
});

@route('POST', '/users')
@validate(createUserSchema)
async createUser(req, res) {
  // req.body is validated and typed
  const user = await db.users.create(req.body);
  res.status(201).json(user);
}
```

### 4. Generate OpenAPI Docs

```bash
npm run generate:openapi
# Creates Openapi.yaml with all routes, validations, and examples
```

### 5. Access Swagger UI

```bash
# Swagger UI automatically available
curl http://localhost:3000/docs
curl http://localhost:3000/docs/json  # OpenAPI JSON
```

## Directory Structure

```
api-gateway-core/
├── src/
│   ├── routes/
│   │   ├── users.routes.ts
│   │   ├── posts.routes.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   └── posts.controller.ts
│   ├── middleware/
│   │   ├── validation.middleware.ts
│   │   ├── error-handler.middleware.ts
│   │   ├── request-logger.middleware.ts
│   │   └── cors.middleware.ts
│   ├── validators/
│   │   ├── user.schema.ts
│   │   ├── post.schema.ts
│   │   └── common.schema.ts
│   ├── utils/
│   │   ├── api-response.ts
│   │   ├── error-handler.ts
│   │   ├── pagination.ts
│   │   └── filtering.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── api-response.ts
│   │   └── error.ts
│   ├── app.ts
│   └── index.ts
├── openapi.yaml
├── openapi-generator.ts
├── examples/
│   ├── basic-api.ts
│   ├── rest-crud.ts
│   ├── validation.ts
│   └── error-handling.ts
├── docs/
│   ├── REST_PATTERNS.md
│   ├── VALIDATION.md
│   ├── ERROR_HANDLING.md
│   ├── PAGINATION.md
│   └── VERSIONING.md
├── package.json
├── tsconfig.json
├── GETTING_STARTED.md
├── INTEGRATION.md
└── README.md
```

## Key Features

### 🏗️ REST Patterns

```typescript
// Create resource
POST /api/v1/users
Request: { email, name, role }
Response: 201 { id, email, name, role, createdAt }

// Read resource
GET /api/v1/users/:id
Response: 200 { id, email, name, role }

// Update resource
PATCH /api/v1/users/:id
Request: { name?, role? }
Response: 200 { id, email, name, role, updatedAt }

// Delete resource
DELETE /api/v1/users/:id
Response: 204 (no content)

// List resources
GET /api/v1/users?page=1&limit=10
Response: 200 { data: [], pagination: { page, limit, total } }
```

### 📋 OpenAPI/Swagger

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
```

### ✅ Input Validation

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short'),
  age: z.number().int().min(18, 'Must be 18+').optional()
});

app.post('/users', validate(userSchema), (req, res) => {
  // req.body is type-safe and validated
  res.json(req.body);
});
```

### 📄 Pagination

```typescript
// Cursor-based pagination
GET /api/v1/users?cursor=xxx&limit=10

// Offset-based pagination
GET /api/v1/users?page=2&limit=10&sort=-createdAt

// Response
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 150,
    "hasMore": true
  }
}
```

### 🔍 Filtering & Sorting

```typescript
// Filter
GET /api/v1/users?role=admin&status=active&email_like=john

// Sort
GET /api/v1/users?sort=name,-createdAt

// Combined
GET /api/v1/posts?author=123&status=published&sort=-createdAt&page=1
```

### 🎯 Error Handling

```typescript
// Standardized error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "status": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 🔀 Versioning

```typescript
// URL-based versioning
GET /api/v1/users
GET /api/v2/users  // Different response structure

// Header-based versioning
GET /api/users
Header: X-API-Version: 2
```

## Integration Examples

### Express + Zod Validation

```typescript
import express from 'express';
import { z } from 'zod';
import { validate } from '@api-gateway/middleware';

const app = express();
app.use(express.json());

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

app.post('/users', validate(userSchema), async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201).json(user);
});
```

### NestJS + Class-Validator

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

## API Response Standards

### Success Response

```typescript
{
  "success": true,
  "status": 200,
  "data": { /* resource */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [{ "field": "email", "message": "..." }]
  }
}
```

### Paginated Response

```typescript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasMore": true
  }
}
```

## Configuration

```typescript
// config/api.ts
export const apiConfig = {
  version: 'v1',
  basePath: '/api',
  title: 'My API',
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100  // requests per window
  },
  
  validation: {
    stripUnknown: true,
    abortEarly: false
  }
};
```

## Testing

```bash
npm run test
npm run test:e2e
npm run docs:generate
```

---

**Consistent. Secure. Documented. Production-ready.** 🌐
