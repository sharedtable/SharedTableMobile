 SharedTable Matching Algorithm - Service API Documentation

  Overview

  The system consists of 5 microservices that process data in sequence to
  match people into dining groups and assign them to restaurants.

  Service Flow

  1. User Preferences Processing → 2. People Matching → 3. Group Preference
   Aggregation → 4. Restaurant Matching

  Services

  1. User Food Preferences Preprocessing

  Port: 8001Purpose: Processes individual user embeddings into normalized
  preference vectorsAPI Docs: http://localhost:8001/docs

  Endpoints:

  - POST /process-user - Process single user
  - POST /process-batch - Process multiple users

  Request Format:

  {
    "user_id": "user_123",
    "embedding_1": [0.1, 0.2, ...],  // 768-dimensional array
    "embedding_2": [0.1, 0.2, ...],  // 768-dimensional array
    "embedding_3": [0.1, 0.2, ...],  // 768-dimensional array
    "weights": [0.5, 0.3, 0.2]       // Optional, defaults to [0.5, 0.3, 
  0.2]
  }

  Response:

  {
    "user_id": "user_123",
    "preference_vector": [0.15, 0.25, ...],  // 768-dimensional normalized 
  vector
    "processing_time": 0.023
  }

  ---
  2. People Matcher

  Port: 8002Purpose: Groups individuals into compatible dining parties of
  4-5 peopleAPI Docs: http://localhost:8002/docs

  Endpoints:

  - POST /api/v1/match - Match people into groups

  Request Format:

  {
    "participants": [
      {
        "user_id": "user_1",
        "name": "John Doe",
        "dietary_restrictions": ["vegetarian"],
        "budget": "medium",  // "low", "medium", "high"
        "location": {"lat": 37.7749, "lng": -122.4194},
        "preference_vector": [0.1, 0.2, ...]  // 768-dimensional array from
   service 1
      }
      // ... minimum 12 participants required
    ]
  }

  Response:

  {
    "groups": [
      {
        "group_id": "group_1",
        "members": ["user_1", "user_2", "user_3", "user_4"],
        "size": 4,
        "compatibility_score": 0.85
      }
    ],
    "unmatched_users": []
  }

  ---
  3. Group Food Preferences Aggregator

  Port: 8004Purpose: Combines individual preferences into group profilesAPI
   Docs: http://localhost:8004/docs

  Endpoints:

  - POST /aggregate-group - Aggregate single group preferences
  - POST /aggregate-batch - Process multiple groups

  Request Format:

  {
    "group_id": "group_1",
    "members": [
      {
        "user_id": "user_1",
        "dietary_restrictions": ["vegetarian"],
        "budget": "medium",
        "preference_vector": [0.1, 0.2, ...]  // 768-dimensional array
      }
      // ... all group members
    ]
  }

  Response:

  {
    "group_id": "group_1",
    "aggregated_preference_vector": [0.15, 0.25, ...],  // 768-dimensional
    "dietary_restrictions": ["vegetarian", "gluten-free"],  // Combined
    "budget_range": {"min": 20, "max": 50},
    "member_count": 4
  }

  ---
  4. Restaurant Matcher

  Port: 8005Purpose: Matches groups to suitable restaurants based on
  preferencesAPI Docs: http://localhost:8005/docs

  Endpoints:

  - POST /match-groups - Match multiple groups to restaurants
  - POST /match-single-group - Match single group

  Request Format:

  {
    "groups": [
      {
        "group_id": "group_1",
        "preference_vector": [0.15, 0.25, ...],  // From service 3
        "dietary_restrictions": ["vegetarian"],
        "budget_range": {"min": 20, "max": 50},
        "location": {"lat": 37.7749, "lng": -122.4194}
      }
    ],
    "restaurants": [
      {
        "restaurant_id": "rest_1",
        "name": "The Green Table",
        "cuisine_vector": [0.2, 0.3, ...],  // 768-dimensional
        "dietary_options": ["vegetarian", "vegan", "gluten-free"],
        "price_range": {"min": 15, "max": 40},
        "location": {"lat": 37.7750, "lng": -122.4180},
        "capacity": 20,
        "rating": 4.5
      }
    ],
    "max_distance_km": 5.0  // Optional, default 5km
  }

  Response:

  {
    "matches": [
      {
        "group_id": "group_1",
        "restaurant_id": "rest_1",
        "restaurant_name": "The Green Table",
        "similarity_score": 0.92,
        "distance_km": 0.15,
        "match_reasons": [
          "High cuisine preference match",
          "All dietary restrictions met",
          "Within budget range"
        ]
      }
    ],
    "unmatched_groups": []
  }

  ---
  5. Data Processor (Optional)

  Port: 8000Purpose: Validates and preprocesses raw input dataAPI Docs:
  http://localhost:8000/docsNote: Currently requires Gemini API key for
  full functionality

  ---
  Quick Start Commands

  Start All Services:

  cd /Users/jingzhougaryxue/CascadeProjects/SharedTableMatchingAlgorithm
  python3 start_services.py

  Test Services:

  ./quick_test.sh  # Quick health check

  Stop All Services:

  Press Ctrl+C in the terminal running start_services.py

  Important Notes:

  1. All vectors are 768-dimensional (compatible with modern LLM
  embeddings)
  2. Services must be called in sequence (1→2→3→4)
  3. Minimum 12 participants required for people matching
  4. All services use JSON request/response format
  5. Check /docs endpoint for interactive API testing

  Health Check Endpoints:

  - http://localhost:8000/api/v1/health
  - http://localhost:8001/health
  - http://localhost:8002/api/v1/health
  - http://localhost:8004/health
  - http://localhost:8005/health