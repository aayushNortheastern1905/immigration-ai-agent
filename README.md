# 🚀 DocuPal: Immigration AI Agent

> **AI-powered immigration paperwork automation for F-1, OPT, and H-1B visa holders**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/serverless/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green.svg)](https://www.python.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Immigration AI Agent** is a full-stack serverless application that automates immigration paperwork management for international students and workers navigating F-1, OPT, and H-1B visa processes.

### The Problem
International students and workers face:
- Complex immigration paperwork with high stakes
- Constantly changing USCIS policies
- Critical deadlines that can't be missed
- Hours spent manually filling forms

### The Solution
An AI-powered system that:
- ✅ Monitors immigration policy changes 24/7
- ✅ Processes documents with OCR and AI extraction
- ✅ Pre-fills immigration forms automatically
- ✅ Sends proactive deadline reminders

---

## ✨ Features

### 🔄 Real-Time Policy Monitoring
- Daily scraping of USCIS website for policy updates
- AI-powered analysis of policy changes
- Plain English summaries with actionable insights
- Personalized alerts based on visa type

### 📄 Smart Document Processing
- OCR extraction from I-20, EAD cards, I-797 notices
- AI-powered data validation
- Structured data storage for form pre-filling
- Document gallery with version history

### 📝 Automated Form Generation
- Pre-filled I-765 (OPT application)
- Pre-filled I-983 (STEM OPT training plan)
- Data validation and completeness checks
- One-click PDF download

### ⏰ Intelligent Deadline Management
- Automated deadline calculations
- Escalating reminder system (90, 60, 30, 7 days)
- Visual timeline of upcoming deadlines
- Email and SMS notifications

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** AWS Lambda (Python 3.11)
- **API:** API Gateway (REST)
- **Database:** DynamoDB (NoSQL)
- **Storage:** Amazon S3
- **IaC:** AWS SAM (Serverless Application Model)
- **AI/ML:** OpenAI GPT-4 API

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Fetch API
- **Deployment:** Vercel

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions (planned)
- **Monitoring:** CloudWatch Logs
- **IAM:** AWS IAM with least privilege

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│                  Hosted on Vercel (Static)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (REST API)                    │
│              CORS enabled, Request validation                │
└───┬─────────────┬─────────────┬──────────────┬──────────────┘
    │             │             │              │
    ↓             ↓             ↓              ↓
┌───────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│Signup │   │  Login   │   │Get       │   │Policy        │
│Lambda │   │  Lambda  │   │Policies  │   │Monitor       │
│       │   │          │   │Lambda    │   │Lambda        │
└───┬───┘   └────┬─────┘   └────┬─────┘   └──────┬───────┘
    │            │              │                 │
    └────────────┴──────────────┴─────────────────┘
                     │
                     ↓
         ┌─────────────────────┐
         │   DynamoDB Tables   │
         │  - Users            │
         │  - Policies         │
         │  - Documents        │
         │  - Forms            │
         │  - Deadlines        │
         └─────────────────────┘
```

### Key Design Decisions

**1. Serverless Architecture**
- Zero server management overhead
- Auto-scaling based on demand
- Pay only for actual usage
- Perfect for MVP with unpredictable traffic

**2. NoSQL Database (DynamoDB)**
- Flexible schema for evolving requirements
- Fast single-table design patterns
- Built-in point-in-time recovery
- Free tier covers MVP needs

**3. Event-Driven Processing**
- EventBridge triggers for scheduled tasks
- Lambda functions process events asynchronously
- Decoupled architecture for maintainability

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/))
- **AWS Account** ([Sign Up](https://aws.amazon.com/))
- **AWS CLI** configured ([Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **AWS SAM CLI** ([Install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- **Git** ([Download](https://git-scm.com/))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/immigration-ai-agent.git
cd immigration-ai-agent
```

#### 2. Backend Setup

```bash
cd backend

# Install Python dependencies (if testing locally)
pip install -r lambdas/auth/requirements.txt

# Build SAM application
sam build

# Deploy to AWS
sam deploy --guided

# Note: Save the API endpoint URL from the output
```

**SAM Deploy Prompts:**
- Stack Name: `immigration-ai-backend`
- AWS Region: `us-east-1`
- Confirm changes: `Y`
- Allow IAM role creation: `Y`
- Save arguments to config: `Y`

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your API endpoint from backend deployment
# REACT_APP_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod

# Start development server
npm start
```

The app will open at `http://localhost:3000`

#### 4. Seed Sample Data (Optional)

To populate the dashboard with sample policy data:

```bash
# Coming soon: Python script to add sample policies
python scripts/seed_policies.py
```

---

## 📁 Project Structure

```
immigration-ai-agent/
├── backend/
│   ├── lambdas/
│   │   ├── auth/
│   │   │   ├── signup.py              # User registration
│   │   │   ├── login.py               # User authentication
│   │   │   └── requirements.txt
│   │   └── policies/
│   │       ├── get_policies.py        # Fetch policy updates
│   │       └── requirements.txt
│   ├── template.yaml                  # SAM infrastructure definition
│   └── samconfig.toml                 # SAM deployment config
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx            # Landing page
│   │   │   ├── Signup.tsx             # Signup form
│   │   │   ├── Login.tsx              # Login form
│   │   │   └── Dashboard.tsx          # Main dashboard
│   │   ├── components/                # Reusable components
│   │   ├── services/                  # API service layer
│   │   ├── App.tsx                    # Main app with routing
│   │   └── index.tsx                  # Entry point
│   ├── .env.example                   # Environment variables template
│   ├── package.json
│   └── tailwind.config.js
│
├── docs/                              # Documentation
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📡 API Documentation

### Base URL
```
https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod
```

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "visa_type": "F-1"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "visa_type": "F-1",
      "login_count": 0
    }
  }
}
```

#### POST `/api/auth/login`
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "visa_type": "F-1",
      "login_count": 2
    },
    "is_first_login": false
  }
}
```

### Policy Endpoints

#### GET `/api/policies`
Retrieve immigration policy updates.

**Query Parameters:**
- `visa_type` (optional): Filter by visa type (F-1, OPT, H-1B)
- `limit` (optional): Max results (default: 10, max: 50)
- `impact_level` (optional): Filter by impact (High, Medium, Low)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "policies": [
      {
        "policy_id": "pol-001",
        "title": "New H-1B Fee Announced",
        "summary": "USCIS announced...",
        "impact_level": "High",
        "affected_visas": ["H-1B"],
        "published_date": "2025-09-20",
        "action_items": ["Discuss with employer"]
      }
    ],
    "filters_applied": {
      "visa_type": "F-1",
      "limit": 5
    }
  }
}
```

---

## 🗓️ Roadmap

### ✅ Phase 1: MVP (Week 1-2) - COMPLETED
- [x] Backend infrastructure with SAM
- [x] User authentication (signup/login)
- [x] Policy updates API
- [x] Landing page + Dashboard UI
- [x] Deployed to AWS

### 🚧 Phase 2: Core Features (Week 3-4) - IN PROGRESS
- [ ] Document upload and OCR processing
- [ ] Policy monitoring agent (daily scraping)
- [ ] Form generation (I-765)
- [ ] Deadline calculation engine

### 📅 Phase 3: Enhancement (Week 5-6)
- [ ] Email notifications
- [ ] Advanced form support (I-983, I-129)
- [ ] Document gallery UI
- [ ] Timeline visualization

### 🎯 Phase 4: Polish (Week 7-8)
- [ ] Unit and integration tests
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Comprehensive documentation

### 🚀 Future Enhancements
- [ ] JWT-based authentication
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] RAG-based Q&A chatbot
- [ ] USCIS case status tracking
- [ ] Green card application support

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Tests
```bash
npm run test:e2e
```

---

## 🔒 Security

- **Data Encryption:** All data encrypted at rest (DynamoDB, S3)
- **HTTPS Only:** TLS 1.2+ for all API communication
- **IAM Roles:** Least privilege access for Lambda functions
- **Input Validation:** Request validation at API Gateway
- **Password Hashing:** SHA-256 hashing (migrating to bcrypt)
- **No Hardcoded Secrets:** AWS Secrets Manager integration

**Note:** This is an informational tool. Always consult an immigration attorney for legal advice.

---

## 📊 AWS Resources Created

- **Lambda Functions:** 3 (Signup, Login, GetPolicies)
- **DynamoDB Tables:** 2 (Users, Policies)
- **API Gateway:** 1 REST API
- **CloudWatch Log Groups:** Auto-created per Lambda
- **IAM Roles:** Auto-created by SAM

**Estimated Monthly Cost:** $0-5 (within AWS Free Tier)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for TypeScript/React
- Write unit tests for new features
- Update documentation for API changes

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- Portfolio: [yourwebsite.com](https://yourwebsite.com)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Built as part of a portfolio project demonstrating AI/ML and cloud architecture skills
- Inspired by the challenges faced by international students
- Thanks to the open-source community for amazing tools and libraries

---

## 📞 Support

For questions or issues:
- 📧 Email: your.email@example.com
- 💬 [Open an issue](https://github.com/yourusername/immigration-ai-agent/issues)
- 🐦 Twitter: [@yourhandle](https://twitter.com/yourhandle)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for international students navigating the complex world of U.S. immigration

</div>
