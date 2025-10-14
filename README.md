# Sistema Bioskop - DevSecOps Vulnerability Assessment

Aplikasi sistem manajemen bioskop yang dibangun dengan arsitektur microservices untuk demonstrasi keamanan dan vulnerability assessment dalam konteks DevSecOps.

## 📋 Tech Stack

### Backend
- **Go** dengan framework [Gin](https://gin-gonic.com/) - REST API server
- **GORM** - Object Relational Mapping
- **PostgreSQL** - Database utama
- **Redis** - Queue management dan caching
- **Asynq** - Background job processing
- **JWT** - Authentication & Authorization
- **Docker** - Containerization

### Frontend
- **React 18** dengan TypeScript
- **Vite** - Build tool dan development server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library

### Infrastructure & DevOps
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy dan load balancer
- **Nginx Proxy Manager** - SSL dan domain management
- **WordPress** - Content Management System
- **Python** - Automation scripts untuk proxy setup

### Development Tools  
- **ESLint** - JavaScript/TypeScript linting
- **PostCSS** - CSS processing
- **Golang Migrate** - Database migrations

## 🔒 Security Vulnerabilities

### 1. Authentication Service Vulnerabilities

#### Admin Privilege Escalation
**Location:** [`back-end/internal/modules/iam/requests/register.request.go`](back-end/internal/modules/iam/requests/register.request.go)

**Vulnerability Details:**
- User dapat register langsung sebagai admin dengan mengirim `is_admin: true` dalam request body
- Tidak ada validasi server-side yang mencegah user biasa menjadi admin saat registrasi
- Bypass authorization controls melalui client-side manipulation

### 2. Order Service Vulnerabilities

#### Race Condition dalam Transaksi
**Location:** [`back-end/internal/modules/order/repositories/transaction.repository.go`](back-end/internal/modules/order/repositories/transaction.repository.go) (line 126+)  
**Location:** [`back-end/internal/modules/order/services/transaction.service.go`](back-end/internal/modules/order/services/transaction.service.go) (line 171+)

**Vulnerability Details:**
- User dapat melakukan order lebih dari satu secara bersamaan tanpa ada pembatasan waktu untuk pembayaran
- Backend memungkinkan user memesan semua kursi dalam satu transaksi (frontend dibatasi maksimal 5 tiket)
- Implementasi `WithTransactionNoTx` yang rentan terhadap race conditions
- Seat booking dapat di-double book pada kondisi concurrent access
- Tidak ada proper transaction isolation untuk seat reservation

### 3. Cross-Site Scripting (XSS) Vulnerabilities

#### XSS pada Title Movie di 3 Halaman Frontend

**1. Movies Page**  
**Location:** [`front-end/src/pages/movie/movie.page.tsx`](front-end/src/pages/movie/movie.page.tsx) (line 71+)

**2. Movie Detail Page**  
**Location:** [`front-end/src/pages/movie/movie.detail.page.tsx`](front-end/src/pages/movie/movie.detail.page.tsx) (line 48+)

**3. Schedule Page**  
**Location:** [`front-end/src/pages/schedule/schedule.page.tsx`](front-end/src/pages/schedule/schedule.page.tsx) (line 191+ dan 211+)

**Vulnerability Details:**
- Penggunaan `dangerouslySetInnerHTML` untuk menampilkan movie title dan overview tanpa sanitization
- Memungkinkan injeksi script tag atau HTML berbahaya melalui field movie title/overview
- Dapat dieksploitasi untuk melakukan client-side attacks seperti session hijacking atau cookie theft
- Terdapat pada 3 halaman utama: Movies listing, Movie detail, dan Schedule listing

### 4. WordPress Integration Vulnerabilities

**Vulnerability Plugins:**
- 
- 
- 
- 

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (untuk development)
- Go 1.19+ (untuk development)

### Setup & Installation

1. **Clone repository:**
```bash
git clone <repository-url>
cd Sistem-Bioskop
```

2. **Setup environment variables:**
```bash
# Backend
cp back-end/.env.example back-end/.env
# Frontend  
cp front-end/.env.example front-end/.env
```

3. **Start services dengan Docker Compose:**
```bash
docker-compose up -d
```

4. **Access aplikasi:**
- Frontend: http://lb-cinema.site
- Backend API: http://api.lb-cinema.site
- WordPress: http://wp.lb-cinema.site
- Admin Panel: Login sebagai admin untuk akses dashboard

### Development Mode

**Backend:**
```bash
cd back-end
go mod tidy
go run cmd/main.go
```

**Frontend:**
```bash
cd front-end
npm install
npm run dev
```

### Automated Security Scanning
```bash
# Container scanning  
docker scout cves movieapp_backend
docker scout cves movieapp_frontend

# SAST scanning
semgrep --config=auto back-end/
npm audit --audit-level=moderate
```


**⚠️ Disclaimer:** Aplikasi ini dibuat untuk tujuan pendidikan dan vulnerability assessment. Jangan deploy ke production tanpa memperbaiki semua security issues yang telah diidentifikasi.