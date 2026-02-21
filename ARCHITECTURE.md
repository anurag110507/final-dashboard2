# ⚡ EV Charging Hub - Project Architecture

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Folder Structure](#folder-structure)
4. [Frontend Components](#frontend-components)
5. [Backend Components](#backend-components)
6. [Data Models](#data-models)
7. [API Endpoints](#api-endpoints)
8. [Data Flow](#data-flow)
9. [Authentication Flow](#authentication-flow)
10. [Tech Stack](#tech-stack)
11. [Features](#features)

---

## 🎯 Project Overview

**EV Charging Hub** is a full-stack MVP platform that enables users to discover, book, and manage electric vehicle (EV) charging stations. The platform includes dual-role functionality for regular users and charger owners, with gamification elements (green score tracking) and real-time availability management.

**Key Objectives:**
- ✅ Real-time charger discovery on interactive map
- ✅ Secure booking system with slot management
- ✅ Environmental impact tracking (green scores)
- ✅ Owner dashboard for charger management
- ✅ User authentication and authorization

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER (Browser)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ index.html   │  │ login.html   │  │owner-dashbrd │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                    │ (JavaScript)                                │
│         ┌──────────┴──────────┐                                 │
│         │   api.js (HTTP)     │                                 │
│         └──────────┬──────────┘                                 │
└────────────────────┼────────────────────────────────────────────┘
                     │ (REST API Calls)
                     │ http://localhost:5000
┌────────────────────┼────────────────────────────────────────────┐
│                 SERVER LAYER (Backend)                          │
│     ┌────────────────────────────────────────────────┐          │
│     │           Express.js Server                    │          │
│     │  (CORS, Static Files, HTTP Parser)            │          │
│     └────────────────────────────────────────────────┘          │
│                     │                                           │
│     ┌───────────────┼──────────────────┐                        │
│     │               │                  │                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐                  │
│  │  Routes  │  │Middleware│  │ Controllers  │                  │
│  ├──────────┤  ├──────────┤  ├──────────────┤                  │
│  │ /auth    │  │ JWT Auth │  │ authCtrl     │                  │
│  │/chargers │  │RoleCheck │  │ chargerCtrl  │                  │
│  │/bookings │  │          │  │ bookingCtrl  │                  │
│  │ /users   │  │          │  │ userCtrl     │                  │
│  └──────────┘  └──────────┘  └──────────────┘                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ (Mongoose ODM)
┌────────────────────┼────────────────────────────────────────────┐
│              DATABASE LAYER (MongoDB)                           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│  │  Users   │ │ Chargers │ │ Bookings │ │BookingRequest│       │
│  │Collection│ │Collection│ │Collection│ │ Collection   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
Energy-Share--The-hackathon-Project/
│
├── 📄 package.json                    # Project metadata & dependencies
├── 📄 README.md                       # Quick start guide
├── 📄 ARCHITECTURE.md                 # This file
│
├── 📂 public/                         # Frontend - Static Files
│   ├── 📄 index.html                  # Main user dashboard
│   ├── 📄 login.html                  # User login page
│   ├── 📄 owner.html                  # Owner registration page
│   ├── 📄 owner-login.html            # Owner login page
│   ├── 📄 owner-dashboard.html        # Owner dashboard
│   ├── 📄 dashboard.html              # User dashboard
│   │
│   ├── 📂 css/
│   │   ├── style.css                  # Main stylesheet
│   │   └── chatbot.css                # Chatbot styling
│   │
│   └── 📂 js/
│       ├── api.js                     # API wrapper & HTTP client
│       ├── auth.js                    # Authentication logic
│       ├── main.js                    # Map & charger discovery
│       ├── bookingRequest.js          # Booking management
│       ├── chatbot.js                 # Chatbot functionality
│       ├── owner-dashboard.js         # Owner controls
│       └── map.js                     # Map utilities
│
└── 📂 server/                         # Backend - Express Server
    ├── 📄 server.js                   # Express entry point
    ├── 📄 seed.js                     # Database seeding
    ├── 📄 clearAllData.js             # Database reset utility
    │
    ├── 📂 models/                     # MongoDB Schemas
    │   ├── User.js                    # User schema
    │   ├── Charger.js                 # Charger schema
    │   ├── Booking.js                 # Booking schema
    │   └── BookingRequest.js          # Booking request schema
    │
    ├── 📂 controllers/                # Business Logic
    │   ├── authController.js          # Auth logic (register, login)
    │   ├── chargerController.js       # Charger CRUD operations
    │   ├── bookingController.js       # Booking logic
    │   ├── bookingRequestController.js# Request handling
    │   └── userController.js          # User management
    │
    ├── 📂 routes/                     # API Endpoints
    │   ├── auth.js                    # /api/auth routes
    │   ├── chargers.js                # /api/chargers routes
    │   ├── bookings.js                # /api/bookings routes
    │   ├── bookingRequests.js         # /api/bookingRequests routes
    │   └── users.js                   # /api/users routes
    │
    └── 📂 middleware/                 # Custom Middleware
        ├── auth.js                    # JWT verification
        └── roleCheck.js               # Role authorization
```

---

## 🎨 Frontend Components

### HTML Pages

| Page | Purpose | Features |
|------|---------|----------|
| **index.html** | Main landing page | Hero section, features, pricing plans |
| **login.html** | User login | Email/password authentication |
| **owner.html** | Owner registration | Register as charger owner |
| **owner-login.html** | Owner authentication | Owner login page |
| **dashboard.html** | User dashboard | Bookings, green score, profile |
| **owner-dashboard.html** | Owner panel | Manage chargers, view bookings |

### JavaScript Modules

```javascript
// api.js - Centralized API communication
├── registerUser()
├── loginUser()
├── getChargers()
├── bookCharger()
├── getBookings()
├── addCharger()
└── updateCharger()

// auth.js - Authentication flow
├── handleLogin()
├── storeToken()
├── isAuthenticated()
├── redirectByRole()
└── logout()

// main.js - Map & discovery
├── initializeMap()
├── loadChargers()
├── filterChargers()
└── displayMarkers()

// bookingRequest.js - Booking management
├── createBooking()
├── getMyBookings()
├── cancelBooking()
└── updateBookingStatus()

// chatbot.js - Chat functionality
├── initChatbot()
├── sendMessage()
└── handleResponse()

// owner-dashboard.js - Owner controls
├── loadMyChargers()
├── addNewCharger()
├── editCharger()
├── deleteCharger()
└── viewBookings()
```

### Styling
- **Bootstrap 5** - Responsive framework
- **Custom CSS** - Animations, gradients, theming
- **Responsive Design** - Mobile, tablet, desktop

---

## ⚙️ Backend Components

### Models (MongoDB Schemas)

#### **User Model**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'owner']),
  greenScore: Number (default: 50),
  totalChargingTime: Number,
  totalSessions: Number,
  estimatedCO2Saved: Number,
  createdAt: Date
}
```

#### **Charger Model**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  ownerId: ObjectId (ref: User),
  latitude: Number,
  longitude: Number,
  address: String,
  chargerType: String (enum: ['DC Fast', 'Level 2', 'Level 1']),
  pricePerHour: Number,
  totalSlots: Number,
  availableSlots: Number,
  rating: Number,
  createdAt: Date
}
```

#### **Booking Model**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  chargerId: ObjectId (ref: Charger),
  startTime: Date,
  endTime: Date,
  duration: Number (minutes),
  status: String (enum: ['active', 'completed', 'cancelled']),
  totalCost: Number,
  createdAt: Date
}
```

#### **BookingRequest Model**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  chargerId: ObjectId (ref: Charger),
  requestDetails: String,
  status: String (enum: ['pending', 'approved', 'rejected']),
  createdAt: Date
}
```

### Controllers

**authController.js**
```
POST /api/auth/register
  ├── Validate input
  ├── Hash password with bcryptjs
  ├── Save user to database
  └── Return JWT token

POST /api/auth/login
  ├── Find user by email
  ├── Verify password
  ├── Generate JWT token
  └── Return token + user info
```

**chargerController.js**
```
GET /api/chargers
  └── Return all chargers with availability

GET /api/chargers/:id
  └── Return specific charger details

POST /api/chargers
  ├── Verify owner role
  ├── Validate location (lat, long)
  └── Save new charger

PUT /api/chargers/:id
  ├── Verify owner ownership
  └── Update charger details

DELETE /api/chargers/:id
  ├── Verify owner ownership
  └── Remove charger

GET /api/chargers/owner/list
  └── Get chargers owned by current user
```

**bookingController.js**
```
GET /api/bookings
  └── Get user's bookings

POST /api/bookings
  ├── Verify slot availability
  ├── Deduct available slots
  ├── Create booking record
  └── Update green score

PUT /api/bookings/:id
  └── Update booking status

DELETE /api/bookings/:id
  ├── Cancel booking
  └── Refund available slots
```

### Middleware

**auth.js (JWT Verification)**
```javascript
1. Extract token from Authorization header
2. Verify token with JWT secret
3. Attach user info to request object
4. Pass to next middleware/controller
```

**roleCheck.js (Authorization)**
```javascript
1. Check user role from req.user
2. Allow 'owner' for owner-only routes
3. Block non-owners with 401 error
4. Pass qualified users to controller
```

---

## 📊 Data Models Visualization

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ _id              │
│ name             │
│ email (unique)   │
│ password (hash)  │
│ role             │◄─────────────────┐
│ greenScore       │                  │
│ totalChargingTime│                  │
│ estimatedCO2     │                  │
└──────────────────┘                  │
         ▲                            │
         │                            │
    1    │                      1     │
  ┌──────┴───────┐         ┌─────────┴────────┐
  │              │         │                  │
  │              │    N    │                  │
  │              ├─────────►│                  │
  │              │         │                  │
┌─┴──────────────┴─┐  ┌────┴──────────────────┤
│                  │  │                       │
│   Booking        │  │      Charger         │
├──────────────────┤  ├───────────────────────┤
│ _id              │  │ _id                   │
│ userId (ref)     │  │ name                  │
│ chargerId (ref)  │  │ ownerId (ref) ───────┼─► User
│ startTime        │  │ latitude              │
│ endTime          │  │ longitude             │
│ duration         │  │ address               │
│ status           │  │ chargerType           │
│ totalCost        │  │ pricePerHour          │
│                  │  │ totalSlots            │
└──────────────────┘  │ availableSlots        │
                      │ rating                │
                      └───────────────────────┘
                                ▲
                                │
                           1    │    N
                      ┌─────────┴─────────┐
                      │                   │
                  ┌───┴──────────────────┐│
                  │  BookingRequest      ││
                  ├──────────────────────┤│
                  │ _id                  ││
                  │ userId (ref)         ││
                  │ chargerId (ref) ─────┘│
                  │ requestDetails        │
                  │ status                │
                  └───────────────────────┘
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| POST | `/api/auth/register` | Register new user/owner | ❌ No |
| POST | `/api/auth/login` | Login user/owner | ❌ No |

### Charger Routes (`/api/chargers`)
| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|-------|-------|
| GET | `/api/chargers` | Get all chargers | ❌ No | ❌ No |
| GET | `/api/chargers/:id` | Get charger details | ❌ No | ❌ No |
| GET | `/api/chargers/owner/list` | Get my chargers | ✅ Yes | 👤 Owner |
| POST | `/api/chargers` | Create new charger | ✅ Yes | 👤 Owner |
| PUT | `/api/chargers/:id` | Update charger | ✅ Yes | 👤 Owner |
| DELETE | `/api/chargers/:id` | Delete charger | ✅ Yes | 👤 Owner |

### Booking Routes (`/api/bookings`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| GET | `/api/bookings` | Get user's bookings | ✅ Yes |
| POST | `/api/bookings` | Create new booking | ✅ Yes |
| PUT | `/api/bookings/:id` | Update booking | ✅ Yes |
| DELETE | `/api/bookings/:id` | Cancel booking | ✅ Yes |

### Booking Request Routes (`/api/bookingRequests`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| GET | `/api/bookingRequests` | Get requests | ✅ Yes |
| POST | `/api/bookingRequests` | Create request | ✅ Yes |
| PUT | `/api/bookingRequests/:id` | Update request | ✅ Yes |

### User Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| GET | `/api/users/profile` | Get user profile | ✅ Yes |
| PUT | `/api/users/profile` | Update profile | ✅ Yes |
| GET | `/api/users/leaderboard` | Get leaderboard | ❌ No |

---

## 🔄 Data Flow Diagrams

### 1. User Registration Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Enters name, email, password
       ▼
┌──────────────────────┐
│  index.html/login.html│
└──────┬───────────────┘
       │ onSubmit → api.js
       ▼
┌──────────────┐
│  api.js      │
│ POST request │
└──────┬───────┘
       │ Sends to http://localhost:5000/api/auth/register
       ▼
┌───────────────────────┐
│  server.js            │
│  Express Router       │
└──────┬────────────────┘
       │ Route: /api/auth/register
       ▼
┌───────────────────────┐
│  routes/auth.js       │
└──────┬────────────────┘
       │ Pass to controller
       ▼
┌───────────────────────┐
│  authController.js    │
│ 1. Validate input     │
│ 2. Hash password      │
│ 3. Save to DB         │
└──────┬────────────────┘
       │
       ▼
┌───────────────────────┐
│  models/User.js       │
│  MongoDB              │
└──────┬────────────────┘
       │ User created
       ▼
┌───────────────────────┐
│  authController.js    │
│ Generate JWT token    │
└──────┬────────────────┘
       │ Return token + user info
       ▼
┌──────────────┐
│  api.js      │
│  Store token │
└──────┬───────┘
       │ localStorage.setItem('token', token)
       ▼
┌──────────────┐
│  User        │
│ Redirected   │
│ to Dashboard │
└──────────────┘
```

### 2. User Login Flow

```
┌──────────────┐
│  login.html  │
└──────┬───────┘
       │ User enters email & password
       ▼
┌──────────────┐
│  auth.js     │
│ handleLogin()│
└──────┬───────┘
       │ api.js → POST /api/auth/login
       ▼
┌──────────────────┐
│  authController  │
│ 1. Find user     │
│ 2. Verify pwd    │
│ 3. Generate JWT  │
└──────┬───────────┘
       │ Return JWT token
       ▼
┌──────────────┐
│  auth.js     │
│ Store token  │
│ Check role   │
└──────┬───────┘
       │
    ┌──┴───────────────┐
    │                  │
    ▼                  ▼
┌─────────────┐  ┌──────────────────┐
│  Role:User  │  │  Role:Owner      │
└──────┬──────┘  └────────┬─────────┘
       │                  │
       ▼                  ▼
┌──────────┐      ┌──────────────────┐
│dashboard │      │owner-dashboard   │
│.html     │      │.html             │
└──────────┘      └──────────────────┘
```

### 3. Charger Browse & Book Flow

```
┌──────────────┐
│ User logged  │
│ In Dashboard │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  main.js         │
│ initializeMap()  │
└──────┬───────────┘
       │ api.js → GET /api/chargers
       ▼
┌──────────────────────┐
│  chargerController   │
│ Return all chargers  │
└──────┬───────────────┘
       │
       ▼
┌───────────────────┐
│  MongoDB          │
│  Charger Collection
└──────┬────────────┘
       │ Return charger data
       ▼
┌──────────────────┐
│  main.js         │
│ Display on map   │
│ (Leaflet+OSM)    │
└──────┬───────────┘
       │
       ▼ User clicks charger
┌──────────────────┐
│ Show charger     │
│ details & slots  │
└──────┬───────────┘
       │ User clicks "Book Now"
       ▼
┌──────────────────────┐
│ bookingRequest.js    │
│ createBooking()      │
└──────┬───────────────┘
       │ api.js → POST /api/bookings
       ▼
┌──────────────────────┐
│  bookingController   │
│ 1. Verify slot avail │
│ 2. Deduct slot       │
│ 3. Create booking    │
│ 4. Update greenScore │
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│  MongoDB         │
│  Save Booking    │
│  Update Charger  │
│  Update User     │
└──────┬───────────┘
       │ Booking confirmed
       ▼
┌──────────────────┐
│  Dashboard       │
│ Show success     │
│ Updated bookings │
└──────────────────┘
```

### 4. Owner Add Charger Flow

```
┌──────────────────┐
│ Owner logged in  │
│ owner-dashboard  │
└──────┬───────────┘
       │ Click "Add Charger"
       ▼
┌──────────────────┐
│ Show form:       │
│ - Name           │
│ - Location       │
│ - Type           │
│ - Slots          │
│ - Price          │
└──────┬───────────┘
       │ Owner fills & submits
       ▼
┌───────────────────┐
│ owner-dashboard.js│
│ addNewCharger()   │
└──────┬────────────┘
       │ api.js → POST /api/chargers
       │ Header: Authorization: Bearer {token}
       ▼
┌─────────────────────┐
│  server.js          │
│  Routes → Middleware│
└──────┬──────────────┘
       │ middleware/auth.js verifies JWT
       │ middleware/roleCheck.js checks owner
       ▼
┌──────────────────────┐
│  chargerController   │
│ POST /chargers       │
│ 1. Validate input    │
│ 2. Create charger    │
│ 3. Set ownerId       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│  models/         │
│  Charger.js      │
│  Save to MongoDB │
└──────┬───────────┘
       │ Charger created
       ▼
┌──────────────────┐
│ owner-dashboard  │
│ Show charger     │
│ in "My Chargers" │
└──────────────────┘
```

### 5. Complete System Data Flow

```
                    ┌─────────────────┐
                    │  FRONTEND       │
                    │  (Browser)      │
                    │  HTML/CSS/JS    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   api.js        │
                    │ (HTTP Client)   │
                    └────────┬────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
      ▼                      ▼                      ▼
  ┌─────────┐         ┌──────────┐         ┌──────────┐
  │ Login   │         │ Browse   │         │ Booking  │
  │ Request │         │ Chargers │         │ Request  │
  └────┬────┘         └────┬─────┘         └────┬─────┘
       │                   │                     │
       ▼                   ▼                     ▼
    ┌─────────────────────────────────────────────────┐
    │         Express.js Server                       │
    │  (CORS, Static Files, JSON Parse)              │
    └─────────────────────────────────────────────────┘
       │                   │                     │
       ▼                   ▼                     ▼
    ┌─────────┐      ┌──────────┐         ┌──────────┐
    │  Routes │      │ Routes   │         │ Routes   │
    │  /auth  │      │/chargers │         │/bookings │
    └────┬────┘      └────┬─────┘         └────┬─────┘
         │                │                     │
         ▼                ▼                     ▼
    ┌────────────────────────────────────────────────┐
    │         Middleware                             │
    │  JWT Auth  |  Role Check                      │
    └────────────────────────────────────────────────┘
         │                │                     │
         ▼                ▼                     ▼
    ┌──────────────────────────────────────────────┐
    │         Controllers                          │
    │  authCtrl | chargerCtrl | bookingCtrl       │
    └────────────────────────────────────────────┘
             │                │              │
             ▼                ▼              ▼
         ┌─────────────────────────────────────┐
         │      MongoDB Connection             │
         │    (Mongoose ODM)                   │
         └─────────────────────────────────────┘
             │        │         │        │
             ▼        ▼         ▼        ▼
        ┌────────┐┌────────┐┌───────┐┌──────────┐
        │ Users  ││Chargers││Booking││BookingReq│
        │        ││        ││       ││          │
        └────────┘└────────┘└───────┘└──────────┘
```

---

## 🔐 Authentication Flow

```
Step 1: User enters credentials
        │
        ▼
Step 2: Frontend validates form
        │
        ▼
Step 3: POST /api/auth/login (email, password)
        │
        ▼
Step 4: Backend finds user in MongoDB
        │
        ├─► User not found → 404 Error
        │
        ▼
Step 5: Compare password with bcryptjs
        │
        ├─► Password mismatch → 401 Error
        │
        ▼
Step 6: Generate JWT token
        Token = jwt.sign(
          { userId, role }, 
          JWT_SECRET
        )
        │
        ▼
Step 7: Return token to frontend
        │
        ▼
Step 8: Frontend stores in localStorage
        localStorage.setItem('token', token)
        │
        ▼
Step 9: Redirect to dashboard based on role
        
        ├─► role: 'user' → /dashboard.html
        └─► role: 'owner' → /owner-dashboard.html

Step 10: Subsequent requests include token
         Headers: {
           'Authorization': 'Bearer {token}'
         }
         │
         ▼
Step 11: Middleware verifies token
         middleware/auth.js
         ├─ Extract token from header
         ├─ Verify JWT signature
         ├─ Check expiration
         └─► Attach user to req.user
         │
         ├─► Invalid token → 401 Error
         └─► Valid token → Continue to controller
```

---

## 💾 Database Connection

```
                    Express Server
                          │
                          ▼
        ┌─────────────────────────────┐
        │  MongoDB Connection Logic   │
        └──────────────┬──────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │  Configured  │      │  Connection  │
    │    URI       │      │  Attempted   │
    │ (MongoDB     │      │              │
    │  Atlas/Local)│      │              │
    └──────────────┘      └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌─────────────────┐      ┌──────────────┐
            │  ✅ Connected   │      │  ❌ Failed   │
            │  mongoConnected │      │              │
            │  flag = true    │      │  Use Demo    │
            └────────┬────────┘      │  Data        │
                     │               │  (Fallback)  │
                     │               └──────────────┘
                     │
                     ▼
            Ready for API requests
            
            GET /api/chargers
            └─ Query MongoDB Collections
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Markup structure |
| **CSS3** | Styling, animations, gradients |
| **Vanilla JavaScript** | Client-side logic |
| **Bootstrap 5** | Responsive framework |
| **Leaflet.js** | Interactive maps |
| **OpenStreetMap** | Map tiles & geocoding |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Server runtime |
| **Express.js** | Web framework |
| **Mongoose** | MongoDB object mapper |
| **MongoDB** | NoSQL database |
| **bcryptjs** | Password hashing |
| **JWT** | Token-based authentication |
| **CORS** | Cross-origin resource sharing |

### Development
| Technology | Purpose |
|-----------|---------|
| **npm** | Package manager |
| **nodemon** | Auto-restart on file changes |
| **dotenv** | Environment variables |

---

## ✨ Key Features

### For Regular Users
- ✅ **User Registration & Login**
  - Email-based authentication
  - Secure password hashing with bcryptjs
  - JWT token generation

- ✅ **Browse Chargers**
  - Interactive Leaflet map with OSM tiles
  - Real-time charger locations
  - Charger details (type, slots, ratings)
  - Filter by location, type, availability

- ✅ **Booking Management**
  - Book available charging slots
  - Real-time slot availability
  - Booking history
  - Cancel bookings

- ✅ **Green Score Gamification**
  - Track total charging hours
  - Calculate CO2 saved
  - Leaderboard ranking
  - Environmental impact metrics

- ✅ **Dashboard**
  - View active bookings
  - Personal profile
  - Booking history

### For Charger Owners
- ✅ **Owner Registration & Login**
  - Separate owner authentication
  - Owner-specific dashboard

- ✅ **Charger Management**
  - Add new charging stations
  - Edit charger details
  - Delete chargers
  - Set pricing per hour
  - Define number of slots

- ✅ **Real-time Analytics**
  - View active bookings
  - Monitor slot availability
  - Track revenue

- ✅ **Availability Management**
  - Automatic slot deduction on booking
  - Manual slot adjustment
  - Charger status (active/inactive)

### System Features
- ✅ **Secure Authentication**
  - JWT token-based auth
  - Role-based access control
  - Password encryption

- ✅ **Responsive Design**
  - Mobile-friendly interface
  - Tablet optimization
  - Desktop experience

- ✅ **Real-time Data**
  - Live availability updates
  - Instant booking confirmation
  - Dynamic charger status

- ✅ **Fallback System**
  - MongoDB fallback to demo data
  - Works offline with sample chargers

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Setup environment variables
# Create .env file with:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/ev-charging-hub
# JWT_SECRET=your-secret-key

# Start development server
npm run dev

# Start production server
npm start

# Reset database
node server/clearAllData.js

# Seed database with sample data
node server/seed.js
```

---

## 📈 Scalability Considerations

1. **Database Indexing**
   - Index on email (unique)
   - Index on location (geospatial)
   - Index on userId, chargerId

2. **API Caching**
   - Cache charger list (short TTL)
   - Cache leaderboard data

3. **Load Balancing**
   - Use PM2 for process management
   - Consider horizontal scaling

4. **Real-time Features**
   - Implement WebSockets for live updates
   - Push notifications for bookings

5. **Security Enhancements**
   - Rate limiting on API endpoints
   - Input validation & sanitization
   - HTTPS enforcement
   - CSRF protection

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check MONGODB_URI, ensure MongoDB is running |
| JWT errors | Verify JWT_SECRET is set in .env |
| CORS errors | Check CORS configuration in server.js |
| Map not loading | Verify Leaflet/OSM dependencies |
| Token not stored | Check localStorage permissions |

---

## 📝 Notes

- All passwords are hashed using bcryptjs before storage
- JWT tokens should be regenerated regularly
- Implement token refresh mechanism for better security
- Add rate limiting to prevent brute force attacks
- Consider implementing email verification
- Add payment gateway integration for future monetization

---

**Last Updated:** February 21, 2026  
**Version:** 1.0.0 (MVP)  
**Status:** Active Development
