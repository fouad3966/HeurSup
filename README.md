<h1 align="center">HeurSup 🎓</h1>

<p align="center">
  <img src="./FRONTEND/src/assets/AuthPage_assets/logowhiteHSonly.png" alt="HeurSup Logo" width="120" />
</p>

<p align="center">
  <strong>Plateforme intelligente de gestion des heures supplémentaires pour enseignants universitaires.</strong>
</p>

<p align="center">
  <a href="#about">À Propos</a> •
  <a href="#features">Fonctionnalités</a> •
  <a href="#tech-stack">Technologies</a> •
  <a href="#getting-started">Installation</a> •
  <a href="ARCHITECTURE.md">Architecture</a>
</p>

---

## 📖 About (À Propos)

**HeurSup** (Heures Supplémentaires) is a comprehensive web application designed to automate and simplify the tracking, management, and calculation of supplementary teaching hours for university professors. 

Built with modern web technologies, HeurSup provides administrators with a beautiful, intuitive dashboard to manage teacher profiles, track class schedules (Cours, TD, TP), log absences, and automatically calculate the financial compensation for overtime hours based on their academic grade (Professeur, MCA, MCB).

## ✨ Features

- **🔒 Secure Authentication:** JWT-based secure login for administrators with encrypted passwords (bcrypt).
- **👥 Teacher Management:** Add and manage teacher profiles, including their academic rank, affiliation, and teaching load.
- **📅 Dynamic Planning:** Interactive calendar interface to schedule teaching sessions (Cours, TD, TP) and manage public holidays.
- **❌ Absence Tracking:** Log teacher absences and distinguish between justified and unjustified absences.
- **💰 Overtime Calculation Engine:** Automatically calculates total supplementary hours based on the teacher's base load, deductions from absences, and scheduled sessions.
- **📊 Reporting & Analytics:** Generate detailed activity reports and financial statements for payroll integration.
- **🎨 Premium UI/UX:** A visually stunning, responsive interface featuring glassmorphism, smooth animations, and a cohesive design system.

## 🛠️ Tech Stack

### Frontend (Client)
- **React.js** (via **Vite**) - Fast, modern UI library
- **React Router** - Client-side routing
- **Axios** - Interceptor-based API client for authenticated requests
- **Vanilla CSS3** - Custom design system using CSS Variables and responsive flex/grid layouts

### Backend (API)
- **Node.js & Express.js** - Robust RESTful API server
- **Prisma ORM** - Type-safe database access (utilizing `@prisma/adapter-pg`)
- **PostgreSQL** - Relational database for robust data integrity
- **JWT & Bcrypt** - Security and authentication
- **Multer & Cloudinary** - Cloud-based image upload for profile pictures

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Cloudinary Account (for image uploads)

### 1. Clone the repository
```bash
git clone https://github.com/fouad3966/HeurSup.git
cd HeurSup
```

### 2. Database Setup
Create a PostgreSQL database. Then, configure your environment variables in the `BACKEND` directory:

Create a `.env` file in `BACKEND/`:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/heursup_db?schema=public"
JWT_SECRET="your_super_secret_jwt_key"

# Cloudinary Config
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Install Dependencies & Seed Database

**Backend:**
```bash
cd BACKEND
npm install
npx prisma generate
npx prisma db push
node prisma/seed_profs.js  # Populates the DB with dummy data and an admin account
```
*Note: The default admin credentials from the seeder are `admin@example.com` / `admin`.*

**Frontend:**
```bash
cd ../FRONTEND
npm install
```
Create a `.env` file in `FRONTEND/`:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the Application

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd BACKEND
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd FRONTEND
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📂 Project Structure Overview

For a deep dive into how the system is architected, how the database is structured, and how the API communicates with the client, please refer to the [ARCHITECTURE.md](ARCHITECTURE.md) file.

## 🤝 Contributing
This project is currently developed as a portfolio showcase. Feel free to fork and submit pull requests if you have suggestions for improvements.

---
*Designed & Developed for Modern University Administration.*
