# SharedTable API Documentation

Complete API reference for SharedTable mobile application connecting to SharedTableWeb backend.

## Base Configuration

### Development

```
Base URL: http://localhost:3000/api
```

### Production

```
Base URL: https://sharedtable.vercel.app/api
```

## Authentication

All authenticated endpoints require the `Authorization` header:

```
Authorization: Bearer <token>
```

## API Endpoints

### 1. Authentication

#### 1.1 Create Account

```http
POST /auth/create-account
Content-Type: application/json

{
  "email": "user@stanford.edu",
  "password": "securepassword123",
  "name": "John Doe"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@stanford.edu",
      "name": "John Doe",
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_here"
  }
}

Error Response: 400 Bad Request
{
  "success": false,
  "error": "Email already exists"
}
```

#### 1.2 Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@stanford.edu",
  "password": "securepassword123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@stanford.edu",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### 1.3 Logout

```http
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 1.4 Get Session

```http
GET /auth/session
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@stanford.edu",
    "name": "John Doe",
    "profileCompleted": true
  }
}
```

#### 1.5 Request Password Reset

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@stanford.edu"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 2. User Profile

#### 2.1 Get User Profile

```http
GET /user/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@stanford.edu",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "profilePhoto": "https://s3.amazonaws.com/...",
    "profile": {
      "major": "Computer Science",
      "year": "Junior",
      "graduationYear": 2025,
      "interests": ["hiking", "cooking", "music"],
      "bio": "CS student interested in...",
      "dietary": ["vegetarian"],
      "personality": {
        "extroversion": 7,
        "spontaneity": 5,
        "nightOwl": 3
      },
      "preferences": {
        "ageRange": [20, 25],
        "genderPreference": "all"
      }
    }
  }
}
```

#### 2.2 Update Profile

```http
PUT /user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "profile": {
    "major": "Computer Science",
    "year": "Senior",
    "interests": ["hiking", "cooking"],
    "bio": "Updated bio...",
    "dietary": ["vegetarian", "gluten-free"]
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Profile updated successfully",
    "profile": { ... }
  }
}
```

#### 2.3 Upload Profile Photo

```http
POST /user/profile-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <binary_data>

Response: 200 OK
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/profile/user_123.jpg"
  }
}
```

### 3. Events & Reservations

#### 3.1 Get Available Events

```http
GET /reservations/available?type=friends&date=2024-01-15
Authorization: Bearer <token>

Query Parameters:
- type: "friends" | "singles" (optional)
- date: ISO date string (optional)
- limit: number (default: 20)
- offset: number (default: 0)

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "event_123",
      "title": "Friday Night Dinner",
      "type": "friends",
      "date": "2024-01-15T19:00:00Z",
      "location": "Coupa Cafe",
      "address": "123 University Ave, Stanford, CA",
      "spotsAvailable": 3,
      "totalSpots": 8,
      "price": 10,
      "description": "Casual dinner to meet new people",
      "host": {
        "name": "SharedTable Team",
        "photo": "..."
      },
      "tags": ["casual", "vegetarian-friendly"]
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 3.2 Get Event Details

```http
GET /reservations/event/:eventId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "event_123",
    "title": "Friday Night Dinner",
    "type": "friends",
    "date": "2024-01-15T19:00:00Z",
    "location": "Coupa Cafe",
    "address": "123 University Ave, Stanford, CA",
    "spotsAvailable": 3,
    "totalSpots": 8,
    "price": 10,
    "description": "Join us for a casual dinner...",
    "requirements": ["Stanford student", "Deposit required"],
    "whatToBring": ["Good conversation", "Open mind"],
    "attendees": 5,
    "photos": ["url1", "url2"]
  }
}
```

#### 3.3 Book Event

```http
POST /reservations/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "event_123",
  "paymentMethodId": "pm_123",  // Stripe payment method
  "guestCount": 1,
  "dietaryRestrictions": "Vegetarian",
  "notes": "Looking forward to meeting everyone!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "bookingId": "booking_456",
    "confirmationNumber": "ST-2024-0456",
    "event": { ... },
    "paymentStatus": "succeeded",
    "message": "Booking confirmed! Check your email for details."
  }
}
```

### 4. Bookings

#### 4.1 Get My Bookings

```http
GET /bookings/my-bookings?status=upcoming
Authorization: Bearer <token>

Query Parameters:
- status: "upcoming" | "past" | "cancelled" | "all" (default: "all")
- limit: number (default: 20)
- offset: number (default: 0)

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "booking_456",
      "confirmationNumber": "ST-2024-0456",
      "status": "confirmed",
      "event": {
        "id": "event_123",
        "title": "Friday Night Dinner",
        "date": "2024-01-15T19:00:00Z",
        "location": "Coupa Cafe",
        "type": "friends"
      },
      "bookedAt": "2024-01-10T10:00:00Z",
      "guestCount": 1,
      "totalPaid": 10,
      "canCancel": true,
      "cancelDeadline": "2024-01-14T19:00:00Z"
    }
  ]
}
```

#### 4.2 Get Booking Details

```http
GET /bookings/:bookingId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "booking_456",
    "confirmationNumber": "ST-2024-0456",
    "status": "confirmed",
    "event": { ... },
    "payment": {
      "amount": 10,
      "status": "succeeded",
      "refundable": true
    },
    "qrCode": "data:image/png;base64,...",
    "specialInstructions": "Please arrive 10 minutes early"
  }
}
```

#### 4.3 Cancel Booking

```http
DELETE /bookings/:bookingId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Booking cancelled successfully",
    "refund": {
      "amount": 10,
      "status": "processing",
      "estimatedDate": "2024-01-12"
    }
  }
}
```

### 5. Notifications

#### 5.1 Get Notifications

```http
GET /notifications?limit=20&unreadOnly=false
Authorization: Bearer <token>

Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- unreadOnly: boolean (default: false)
- type: "booking" | "reminder" | "social" | "system" (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_789",
        "type": "booking",
        "title": "Booking Confirmed",
        "message": "Your spot for Friday Night Dinner is confirmed!",
        "isRead": false,
        "createdAt": "2024-01-10T10:00:00Z",
        "data": {
          "bookingId": "booking_456",
          "eventId": "event_123"
        }
      }
    ],
    "unreadCount": 3,
    "hasMore": true
  }
}
```

#### 5.2 Mark Notification as Read

```http
PUT /notifications/:notificationId/read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Notification marked as read"
  }
}
```

#### 5.3 Mark All as Read

```http
PUT /notifications/mark-all-read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "All notifications marked as read",
    "count": 5
  }
}
```

#### 5.4 Get Unread Count

```http
GET /notifications/unread-count
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

#### 5.5 Register Push Token

```http
POST /notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxx]",
  "platform": "ios" | "android"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Push token registered"
  }
}
```

### 6. Payments (Stripe)

#### 6.1 Create Payment Intent

```http
POST /stripe/create-payment-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000,  // in cents ($10.00)
  "eventId": "event_123",
  "metadata": {
    "bookingType": "friends"
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 1000,
    "currency": "usd"
  }
}
```

#### 6.2 Confirm Payment

```http
POST /stripe/confirm-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx",
  "paymentMethodId": "pm_xxx"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "status": "succeeded",
    "receiptUrl": "https://pay.stripe.com/receipts/..."
  }
}
```

#### 6.3 Get Payment Methods

```http
GET /stripe/payment-methods
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "pm_xxx",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "isDefault": true
    }
  ]
}
```

### 7. Search & Discovery

#### 7.1 Search Events

```http
GET /search/events?q=dinner&filters=vegetarian
Authorization: Bearer <token>

Query Parameters:
- q: string (search query)
- filters: comma-separated filters
- sortBy: "date" | "price" | "popularity"
- limit: number
- offset: number

Response: 200 OK
{
  "success": true,
  "data": {
    "results": [ ... ],
    "totalCount": 15,
    "facets": {
      "types": {
        "friends": 10,
        "singles": 5
      },
      "locations": {
        "campus": 8,
        "downtown": 7
      }
    }
  }
}
```

#### 7.2 Get Recommendations

```http
GET /recommendations/events
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "reason": "Based on your interests",
      "events": [ ... ]
    },
    {
      "reason": "Popular this week",
      "events": [ ... ]
    }
  ]
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

| Code               | Status | Description                       |
| ------------------ | ------ | --------------------------------- |
| `UNAUTHORIZED`     | 401    | Missing or invalid authentication |
| `FORBIDDEN`        | 403    | Insufficient permissions          |
| `NOT_FOUND`        | 404    | Resource not found                |
| `VALIDATION_ERROR` | 400    | Input validation failed           |
| `RATE_LIMITED`     | 429    | Too many requests                 |
| `SERVER_ERROR`     | 500    | Internal server error             |
| `PAYMENT_REQUIRED` | 402    | Payment failed or required        |

## Rate Limiting

The API implements rate limiting:

- **Authenticated requests**: 100 requests per minute
- **Unauthenticated requests**: 20 requests per minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Pagination

List endpoints support pagination:

```
GET /api/events?limit=20&offset=40
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

## Webhooks

The backend sends webhooks for certain events (configured separately):

### Event Types

- `booking.confirmed`
- `booking.cancelled`
- `payment.succeeded`
- `payment.failed`
- `event.reminder`

## API Versioning

Currently using v1 (implicit). Future versions will use:

```
/api/v2/endpoint
```

## Testing

### Test Endpoints (Development Only)

```http
GET /health
Response: { "status": "ok", "timestamp": "..." }

GET /test/auth
Authorization: Bearer <token>
Response: { "authenticated": true, "user": {...} }
```

## SDK Usage Example

```typescript
// Initialize API client
import { api } from '@/services/api';

// Make authenticated request
const fetchUserEvents = async () => {
  try {
    const response = await api.getMyBookings();
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
};
```

## Notes

1. All dates are in ISO 8601 format
2. All amounts are in cents (multiply by 100)
3. File uploads use multipart/form-data
4. Stanford email required for registration
5. Tokens expire after 30 days
6. API responses are gzip compressed
