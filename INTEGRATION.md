# Integration Guide for API Gateway Core

This guide covers advanced integration patterns and how to use API Gateway Core with different backends, databases, and service architectures.

## Table of Contents

1. [Database Integration](#database-integration)
2. [Microservices Integration](#microservices-integration)
3. [Authentication & Authorization](#authentication--authorization)
4. [Advanced Error Handling](#advanced-error-handling)
5. [Custom Middleware](#custom-middleware)
6. [Request/Response Transformation](#requestresponse-transformation)
7. [Monitoring & Observability](#monitoring--observability)
8. [Rate Limiting](#rate-limiting)
9. [Caching](#caching)
10. [Testing](#testing)

---

## Database Integration

### PostgreSQL with pg

```typescript
import { Pool } from 'pg';
import { FilterHelper, PaginationHelper, ApiResponseHelper, ApiGatewayError, ErrorCode } from 'api-gateway-core';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/users', async (req, res, next) => {
  try {
    // Parse pagination
    const pagination = PaginationHelper.parse({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    // Parse filters
    const filters = FilterHelper.parseFilterObject(req.query);
    const { sql: whereSql, params: whereParams } = FilterHelper.toSqlWhere(filters);

    // Build query
    const where = whereSql ? `WHERE ${whereSql}` : '';
    const countQuery = `SELECT COUNT(*) as total FROM users ${where}`;
    const dataQuery = `
      SELECT * FROM users 
      ${where}
      ORDER BY id ASC
      LIMIT $${whereParams.length + 1}
      OFFSET $${whereParams.length + 2}
    `;

    // Execute queries
    const { rows: [{ total }] } = await pool.query(countQuery, whereParams);
    const { rows: users } = await pool.query(
      dataQuery,
      [...whereParams, pagination.limit, pagination.offset]
    );

    // Format response
    const meta = PaginationHelper.getMeta(total, pagination.page, pagination.limit);
    return ApiResponseHelper.paginated(res, users, meta);
  } catch (error) {
    next(error);
  }
});
```

### MongoDB with Mongoose

```typescript
import mongoose, { Schema } from 'mongoose';
import { FilterHelper, PaginationHelper, ApiResponseHelper } from 'api-gateway-core';

const userSchema = new Schema({
  name: String,
  email: String,
  age: Number,
});

const User = mongoose.model('User', userSchema);

app.get('/api/users', async (req, res, next) => {
  try {
    // Parse pagination
    const pagination = PaginationHelper.parse({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    // Parse filters
    const filters = FilterHelper.parseFilterObject(req.query);
    const mongoQuery = FilterHelper.toMongoQuery(filters);

    // Query database
    const total = await User.countDocuments(mongoQuery);
    const users = await User.find(mongoQuery)
      .limit(pagination.limit)
      .skip(pagination.offset);

    // Format response
    const meta = PaginationHelper.getMeta(total, pagination.page, pagination.limit);
    return ApiResponseHelper.paginated(res, users, meta);
  } catch (error) {
    next(error);
  }
});
```

### TypeORM Integration

```typescript
import { getRepository, Like, MoreThan } from 'typeorm';
import { User } from './entities/User';
import { FilterHelper, PaginationHelper, ApiResponseHelper } from 'api-gateway-core';

app.get('/api/users', async (req, res, next) => {
  try {
    const userRepo = getRepository(User);

    // Parse pagination
    const pagination = PaginationHelper.parse({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    // Parse and convert filters
    const filters = FilterHelper.parseFilterObject(req.query);
    const where: any = {};
    
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'contains':
          where[filter.field] = Like(`%${filter.value}%`);
          break;
        case 'gt':
          where[filter.field] = MoreThan(filter.value);
          break;
        // ... more operators
      }
    });

    // Query database
    const [users, total] = await userRepo.findAndCount({
      where,
      take: pagination.limit,
      skip: pagination.offset,
    });

    // Format response
    const meta = PaginationHelper.getMeta(total, pagination.page, pagination.limit);
    return ApiResponseHelper.paginated(res, users, meta);
  } catch (error) {
    next(error);
  }
});
```

---

## Microservices Integration

### HTTP Client Wrapper

```typescript
import axios, { AxiosInstance } from 'axios';
import { ApiGatewayError, ErrorCode } from 'api-gateway-core';

class ServiceClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
  }

  async get<T>(path: string, traceId?: string): Promise<T> {
    try {
      const { data } = await this.client.get(path, {
        headers: { 'X-Trace-ID': traceId },
      });
      return data;
    } catch (error: any) {
      throw new ApiGatewayError(
        ErrorCode.BAD_GATEWAY,
        502,
        `Service request failed: ${error.message}`,
        { service: this.client.defaults.baseURL }
      );
    }
  }
}

// Usage
const userService = new ServiceClient('http://user-service:3000');

app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await userService.get(`/users/${req.params.id}`, (req as any).traceId);
    return ApiResponseHelper.success(res, user);
  } catch (error) {
    next(error);
  }
});
```

### Service Gateway Pattern

```typescript
interface ServiceRoute {
  path: string;
  service: ServiceClient;
  schema?: ZodSchema;
}

class ServiceGateway {
  private routes = new Map<string, ServiceRoute>();

  register(path: string, service: ServiceClient, schema?: ZodSchema) {
    this.routes.set(path, { path, service, schema });
  }

  getRoute(path: string): ServiceRoute | undefined {
    return this.routes.get(path) || this.routes.get(path.split('/')[1]);
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const route = this.getRoute(req.path);
      if (!route) return next();

      try {
        const traceId = (req as any).traceId;
        const response = await route.service.get(req.path, traceId);
        return ApiResponseHelper.success(res, response);
      } catch (error) {
        next(error);
      }
    };
  }
}

// Setup
const gateway = new ServiceGateway();
gateway.register('users', userService);
gateway.register('orders', orderService);
app.use('/api', gateway.middleware());
```

---

## Authentication & Authorization

### JWT Middleware

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ApiGatewayError, ErrorCode } from 'api-gateway-core';

interface AuthRequest extends Request {
  user?: { id: string; email: string; roles: string[] };
  traceId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(
      new ApiGatewayError(
        ErrorCode.UNAUTHORIZED,
        401,
        'Missing authentication token'
      )
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    return next(
      new ApiGatewayError(
        ErrorCode.UNAUTHORIZED,
        401,
        'Invalid or expired token'
      )
    );
  }
};

// Role-based authorization
export const authorize = (requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ApiGatewayError(
          ErrorCode.UNAUTHORIZED,
          401,
          'User not authenticated'
        )
      );
    }

    if (!requiredRoles.some(role => req.user!.roles.includes(role))) {
      return next(
        new ApiGatewayError(
          ErrorCode.FORBIDDEN,
          403,
          'Insufficient permissions'
        )
      );
    }

    next();
  };
};

// Usage
app.get('/api/admin', authMiddleware, authorize(['admin']), (req, res) => {
  return ApiResponseHelper.success(res, { message: 'Admin access granted' });
});
```

---

## Advanced Error Handling

### Service-Specific Error Handling

```typescript
import { ApiGatewayError, ErrorCode } from 'api-gateway-core';

class DatabaseError extends ApiGatewayError {
  constructor(message: string, details?: any) {
    super(
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      message,
      details
    );
    this.name = 'DatabaseError';
  }
}

class ValidationError extends ApiGatewayError {
  constructor(message: string, validationErrors: any) {
    super(
      ErrorCode.VALIDATION_ERROR,
      400,
      message,
      { validationErrors }
    );
    this.name = 'ValidationError';
  }
}

// Usage
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await getUserFromDb(req.params.id);
    if (!user) {
      throw new ApiGatewayError(
        ErrorCode.NOT_FOUND,
        404,
        `User ${req.params.id} not found`
      );
    }
    return ApiResponseHelper.success(res, user);
  } catch (error) {
    next(error);
  }
});
```

---

## Custom Middleware

### Request Enhancement Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

export const enrichRequest = (req: Request, res: Response, next: NextFunction) => {
  const ext: any = req;

  // Add user context
  ext.user = req.headers['x-user-id'] as string;

  // Add request metadata
  ext.startTime = Date.now();
  ext.correlationId = req.headers['x-correlation-id'] as string;

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - ext.startTime;
    console.log(`Request ${req.method} ${req.path} completed in ${duration}ms`);
  });

  next();
};

app.use(enrichRequest);
```

### Request Sanitization Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { FilterHelper } from 'api-gateway-core';

export const sanitizeQuery = (req: Request, res: Response, next: NextFunction) => {
  const sanitized: Record<string, any> = {};

  Object.entries(req.query).forEach(([key, value]) => {
    const sanitizedKey = FilterHelper.sanitizeFieldName(key);
    if (sanitizedKey) {
      sanitized[sanitizedKey] = value;
    }
  });

  req.query = sanitized;
  next();
};

app.use(sanitizeQuery);
```

---

## Request/Response Transformation

### Response Interceptor

```typescript
import { Response } from 'express';

class ResponseInterceptor {
  static transform(original: Response) {
    const originalJson = original.json.bind(original);

    original.json = function(data: any) {
      // Transform data before sending
      const transformed = {
        ...data,
        _meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

      return originalJson(transformed);
    };

    return original;
  }
}

// Usage
app.use((req, res, next) => {
  ResponseInterceptor.transform(res);
  next();
});
```

---

## Monitoring & Observability

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

app.use((req, res, next) => {
  const traceId = (req as any).traceId;

  logger.info({
    traceId,
    method: req.method,
    path: req.path,
    query: req.query,
  });

  next();
});
```

### Metrics Collection

```typescript
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
});

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    }, duration);
  });

  next();
});

// Export metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

---

## Rate Limiting

### Token Bucket Rate Limiter

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const redisClient = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);

// Per-user limiter
const perUserLimiter = rateLimit({
  keyGenerator: (req: any) => req.user?.id || req.ip,
  windowMs: 60 * 1000,
  max: 30,
});

app.use('/api/users', perUserLimiter);
```

---

## Caching

### Response Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute default

export const cacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;

    // Check cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      cache.set(cacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

// Usage
app.get('/api/users', cacheMiddleware(600), async (req, res) => {
  // Your handler
});
```

### Cache Invalidation

```typescript
export const invalidateCache = (pattern?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (pattern) {
      const keys = cache.keys().filter(key => key.includes(pattern));
      keys.forEach(key => cache.del(key));
    }

    res.on('finish', () => {
      // Invalidate related caches on write operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        cache.flushAll();
      }
    });

    next();
  };
};

app.post('/api/users', invalidateCache('users'), (req, res) => {
  // Handler
});
```

---

## Testing

### Testing with Jest

```typescript
import request from 'supertest';
import { app } from './app';

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter users by status', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'active' }),
        ])
      );
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data.id');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'John' }); // Missing email

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

## Best Practices Summary

1. **Always use middleware chains** - Stack middleware for separation of concerns
2. **Implement circuit breakers** - For external service calls
3. **Use correlation IDs** - For request tracing across services
4. **Cache strategically** - Cache read-heavy operations
5. **Rate limit appropriately** - Protect against abuse
6. **Monitor performance** - Collect metrics continuously
7. **Handle errors gracefully** - Always provide meaningful error messages
8. **Validate early** - Check input before processing
9. **Log structured data** - Use JSON logging for better analysis
10. **Test thoroughly** - Unit, integration, and end-to-end tests

For more information, refer to [GETTING_STARTED.md](./GETTING_STARTED.md).
