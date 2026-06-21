<div align="center">

# 🏢 AttendanceApp

### A full-stack enterprise-grade attendance management system

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-brightgreen?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![MUI](https://img.shields.io/badge/Material%20UI-v5-007FFF?style=for-the-badge&logo=mui)](https://mui.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

<br/>

> A powerful attendance tracking platform combining **QR-code check-ins**, **GPS geolocation**, **AI assistant**, **leave management**, **anomaly detection**, and **Excel/PDF exports** — all in one unified system.

</div>

---

## 📸 Screenshots

> Admin Dashboard · Employee Stats · Anomaly Reports · Dark Mode · AI Chatbot

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure login with role-based access (Admin / Employee) |
| 📷 **QR Code Check-In** | Time-rotating QR codes for tamper-proof attendance recording |
| 📍 **GPS Geolocation** | Check-ins validated against a defined office radius |
| 📊 **Real-time Dashboard** | Live stats with 30-second auto-refresh — hours worked, absences, lates, leave balance, presence rate |
| 📈 **Anomaly Detection** | Auto-detect late arrivals, early exits, absences, and insufficient hours |
| 🤖 **AI Chatbot** | Context-aware assistant (via OpenRouter) that reads real employee data to answer questions |
| 🤖 **AI Reminder Generator** | Generates personalised absence reminder emails with one click |
| 🏖️ **Leave Management** | Employees submit leave requests; admins approve/reject with full calendar view |
| 🔔 **Notification System** | Admins send notifications; employees respond with justifications and attachments |
| 📤 **Export (Excel & PDF)** | Export attendance stats, anomaly reports, and employee lists to `.xlsx` / `.pdf` |
| 🌙 **Dark / Light Mode** | Full theme switching with persistent preference |
| 🌍 **Bilingual (EN / FR)** | Complete English and French interface |
| 📱 **Responsive Design** | Adaptive layout for all screen sizes |

---

## 🏗️ Architecture Overview

```
attendance-app/
├── src/                          # Spring Boot Backend (Java 17)
│   └── main/java/com/attendance/
│       ├── ai/                   # OpenRouter AI integration (chat + reminder)
│       ├── auth/                 # JWT filter, login/register, token service
│       ├── config/               # Security config, CORS config
│       ├── conge/                # Leave request management
│       ├── notification/         # Notification system with justification flow
│       ├── pointage/             # Attendance recording, QR code service
│       ├── stats/                # Stats computation, anomaly detection, export
│       │   ├── ExportController  # Excel & PDF export endpoints
│       │   └── dto/              # Response DTOs
│       └── user/                 # User management
├── frontend/                     # React 19 Frontend
│   └── src/
│       ├── api/                  # Axios instance with JWT interceptor
│       ├── auth/                 # Auth context (login state, token)
│       ├── checkin/              # QR scan + GPS check-in page
│       ├── components/
│       │   ├── Chatbot/          # AI chatbot component
│       │   ├── Navbar.jsx        # Top navbar
│       │   ├── Sidebar.jsx       # Navigation sidebar
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   ├── LanguageContext   # EN/FR translation context
│       │   ├── ThemeModeContext  # Dark/Light theme
│       │   └── translations/     # en.js · fr.js translation files
│       ├── hooks/
│       │   └── useExport.js      # Reusable Excel & PDF export hook
│       └── pages/
│           ├── Admin/            # Employee list management
│           ├── Calendar/         # Leave calendar view
│           ├── Dashboard/        # Stats · Charts · Anomaly report
│           ├── Leave/            # Leave request flow
│           ├── Login/            # Auth pages
│           ├── Notifications/    # Notification inbox
│           └── Profile/          # User profile + photo upload
└── pom.xml
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Java** | 17 | Language |
| **Spring Boot** | 4.1.0 | Application framework |
| **Spring Security** | Built-in | Authentication & authorization |
| **Spring WebFlux** | Built-in | Reactive HTTP client (AI calls) |
| **MongoDB** | Latest | NoSQL database |
| **Spring Data MongoDB** | Built-in | Database ORM |
| **JWT (jjwt)** | 0.12.3 | Stateless token-based auth |
| **Google ZXing** | 3.5.x | QR code generation |
| **Apache POI** | 5.2.5 | Excel `.xlsx` export |
| **iText PDF** | 5.5.13.3 | PDF report generation |
| **Lombok** | Latest | Boilerplate reduction |
| **OpenRouter API** | Latest | AI chat & reminder generation (free models) |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **React Router** | v7 | Client-side routing |
| **Material UI (MUI)** | v5 | Component library |
| **Recharts** | v3 | Attendance charts & graphs |
| **Axios** | v1 | HTTP client with JWT interceptor |
| **html5-qrcode** | 2.3.8 | QR code scanning via camera |
| **xlsx (SheetJS)** | 0.18.5 | Client-side Excel export |
| **jsPDF** | 4.x | Client-side PDF generation |
| **jspdf-autotable** | 5.x | Auto-table plugin for PDF |
| **react-transition-group** | 4.x | Smooth UI animations |

---

## 🚀 Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+ & npm
- MongoDB instance (local or MongoDB Atlas)
- OpenRouter API key (free at [openrouter.ai](https://openrouter.ai))

---

### 1. Clone the repository

```bash
git clone https://github.com/othman-gr3/attendance-app.git
cd attendance-app
```

---

### 2. Backend Setup

#### Configure `application.properties`

Create or edit `src/main/resources/application.properties`:

```properties
# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/attendance_db
spring.data.mongodb.database=attendance_db

# JWT
jwt.secret=your-super-secret-key-at-least-256-bits
jwt.expiration=86400000

# Server
server.port=8080

# AI (OpenRouter)
openrouter.api.key=YOUR_OPENROUTER_API_KEY
```

#### Run the backend

```bash
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080/api`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
HTTPS=false
PORT=3000
```

Run the frontend:

```bash
npm start
```

The app will open at `http://localhost:3000`

---

## 🔑 Default Roles

| Role | Access |
|---|---|
| `ROLE_ADMIN` | Full dashboard, employee management, anomaly reports, leave approval, AI reminder, exports |
| `ROLE_EMPLOYE` | Personal check-in, own stats, leave requests, notifications, AI chatbot |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `POST` | `/api/auth/register` | Register a new user |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users *(Admin)* |
| `GET` | `/api/users/{id}` | Get user by ID |
| `PUT` | `/api/users/{id}` | Update user (name, role, photo) |
| `DELETE` | `/api/users/{id}` | Delete user *(Admin)* |

### Attendance (Pointage)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pointage` | Record a check-in or check-out |
| `GET` | `/api/pointage?userId=&date=` | Get attendance records |
| `GET` | `/api/pointage/qr` | Get current rotating QR code |

### Statistics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats?userId=&month=&year=` | Get stats for one employee |
| `GET` | `/api/stats/anomalies?userId=&month=&year=` | Detect anomalies |
| `GET` | `/api/stats/all?month=&year=` | Get all employees' stats *(Admin)* |

### Exports *(Admin only)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export/excel/stats?month=&year=` | Download stats as `.xlsx` |
| `GET` | `/api/export/pdf/stats?month=&year=` | Download stats as `.pdf` |
| `GET` | `/api/export/excel/anomalies?userId=&month=&year=` | Anomalies Excel |
| `GET` | `/api/export/pdf/anomalies?userId=&month=&year=` | Anomalies PDF |
| `GET` | `/api/export/excel/employees` | Employee list Excel |
| `GET` | `/api/export/pdf/employees` | Employee list PDF |

### Leave Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/conge` | Submit a leave request |
| `GET` | `/api/conge/my` | Get my leave requests |
| `GET` | `/api/conge/all` | Get all leave requests *(Admin)* |
| `PUT` | `/api/conge/{id}` | Approve/reject leave *(Admin)* |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/notifications` | Send notification to employee |
| `GET` | `/api/notifications/by-user/{userId}` | Get notifications for user |
| `POST` | `/api/notifications/direct-approve` | Directly approve anomaly |

### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Context-aware AI assistant |
| `POST` | `/api/ai/reminder` | Generate AI absence reminder |

---

## ✨ Feature Deep-Dives

### 📷 QR Code Attendance
- Backend generates a **time-rotating QR code** every few minutes
- Employee scans via camera (html5-qrcode) on the Check-In page
- QR is validated server-side — expired or reused codes are rejected

### 📍 GPS Geolocation
- Check-in records latitude/longitude
- Backend validates distance from the office location
- Both QR + GPS must pass for a check-in to be marked `valid`

### 🤖 AI Assistant (OpenRouter)
- Every chat message enriches the prompt with **real DB data** — attendance history, leave status, this month's stats
- Admin chatbot also receives all-employee stats for fleet-level questions
- AI Reminder generates a professional, personalized email message for absent employees

### 📊 Anomaly Detection Engine
Automatically flags:
- **Absence** — no check-in on a working day (Mon–Fri) without approved leave
- **Late Arrival** — check-in after 09:00
- **Early Exit** — check-out before 17:00
- **Insufficient Hours** — less than 8 hours worked in a day

### 📤 Export System
- **Client-side** exports (xlsx, jsPDF) from data already loaded in the page — zero extra API calls
- **Server-side** exports (Apache POI, iText) available via REST for backend-generated styled reports
- Available for: Attendance Stats, Anomaly Reports, Employee Directory

---

## 🌍 Internationalization

The app is fully bilingual:
- 🇬🇧 English (`en.js`)
- 🇫🇷 French (`fr.js`)

Language preference persists across sessions via `localStorage`. Every UI label, error message, and button text is translated.

---

## 🎨 Theme System

- Full **Dark / Light mode** toggle
- Uses Material UI `ThemeProvider` with custom palette
- Theme preference saved to `localStorage`
- Dark mode uses deep navy + slate palette; Light mode uses clean white + blue accents

---

## 📁 Environment Variables

### Backend (`application.properties`)
| Variable | Description |
|---|---|
| `spring.data.mongodb.uri` | MongoDB connection string |
| `spring.data.mongodb.database` | MongoDB database name |
| `jwt.secret` | JWT signing secret (min 256-bit) |
| `jwt.expiration` | Token TTL in milliseconds |
| `openrouter.api.key` | OpenRouter API key (get free key at openrouter.ai) |

### Frontend (`.env`)
| Variable | Description |
|---|---|
| `PORT` | Dev server port (default: 3000) |
| `HTTPS` | Enable HTTPS in dev |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👥 Team

Built with ❤️ by the **GR3** team.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if you found it useful!**

</div>
