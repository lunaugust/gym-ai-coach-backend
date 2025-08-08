# GYM AI Coach Backend API

## Overview
The GYM AI Coach Backend provides a comprehensive RESTful API for user management, fitness profile tracking, preferences, and body measurements. It is designed for fitness applications requiring robust user data, analytics, and customization.

## Authentication
All endpoints require JWT Bearer authentication unless otherwise noted.

**Header Example:**
```
Authorization: Bearer <your-jwt-token>
```

## Main Endpoints

### User Profile
- `GET /api/users/profile` - Get complete user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile/avatar` - Upload avatar image

### Fitness Profile
- `GET /api/users/fitness-profile` - Get fitness profile
- `PUT /api/users/fitness-profile` - Update fitness profile
- `POST /api/users/fitness-profile/onboarding` - Complete onboarding

### Preferences
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update preferences
- `PUT /api/users/preferences/notifications` - Update notification settings
- `PUT /api/users/preferences/privacy` - Update privacy settings

### Measurements
- `GET /api/users/measurements` - Get measurement history (supports date range)
- `POST /api/users/measurements` - Add new measurement
- `PUT /api/users/measurements/:id` - Update measurement
- `DELETE /api/users/measurements/:id` - Delete measurement
- `GET /api/users/measurements/progress` - Get progress analytics

## Example Request (cURL)
```
curl -H "Authorization: Bearer <token>" https://api.gymcoach.com/api/users/profile
```

## Example Response
```
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://bucket.s3.amazonaws.com/avatars/user_id.jpg",
      "bio": "Fitness enthusiast...",
      "age": 25,
      "gender": "male",
      "location": "New York, NY",
      "timezone": "America/New_York",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "fitnessProfile": { /* ... */ },
    "preferences": { /* ... */ },
    "recentMeasurements": { /* ... */ }
  }
}
```

## Error Response Format
```
{
  "success": false,
  "message": "Validation failed.",
  "errorCode": "VALIDATION_ERROR",
  "details": [
    "Name must be at least 2 characters.",
    "Age must be between 13 and 100."
  ]
}
```

## Setup (Development)
1. Clone the repo
2. Install dependencies: `npm install`
3. Set up your `.env` file (see `.env.example`)
4. Run migrations: `npx prisma migrate dev`
5. Start server: `npm start`

## API Reference
- [OpenAPI (Swagger) Spec](./openapi.yaml) *(coming soon)*
- [Postman Collection](./postman/GYM-AI-Coach.postman_collection.json) *(coming soon)*

## Contributing
Pull requests welcome! For major changes, please open an issue first.

## Contact
For support, contact [your-email@example.com].
