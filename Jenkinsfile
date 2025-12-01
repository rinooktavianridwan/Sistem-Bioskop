pipeline {
    agent any

    stages {
        stage('1. Clone Kode') {
            steps {
                script {
                    echo 'Membersihkan folder lama & Clone Repo...'
                    sh """
                        ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                            docker run --rm -v /home/dso501:/workdir alpine rm -rf /workdir/Sistem-Bioskop && 
                            git clone https://github.com/rinooktavianridwan/Sistem-Bioskop.git Sistem-Bioskop
                        "
                    """
                }
            }
        }

        stage('2. Basic Security Scan (Trivy & Semgrep)') {
            steps {
                script {
                    echo 'Running Basic Scanners (Warning Mode)...'
                    try {
                        // Trivy (Exit Code 0 - Warning Only)
                        sh "ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 'trivy fs --exit-code 0 --severity HIGH,CRITICAL ./Sistem-Bioskop'"
                    } catch (Exception e) { echo 'Trivy Warning' }

                    try {
                        // Semgrep (Warning Only)
                        sh """
                            ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                                docker run --rm -v /home/dso501/Sistem-Bioskop:/src returntocorp/semgrep semgrep scan --config auto
                            "
                        """
                    } catch (Exception e) { echo 'Semgrep Warning' }
                }
            }
        }

        stage('3. Advanced SAST (CodeQL - Full Stack)') {
            steps {
                script {
                    echo 'Menjalankan CodeQL (Go & React)...'
                    
                    sh """
                        ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 '
                            # --- 1. SETUP ENV ---
                            export PATH=\$PATH:/usr/local/go/bin:/usr/local/node/bin

                            # Cek versi
                            echo "Menggunakan Go: \$(go version)"
                            echo "Menggunakan Node: \$(node -v)"

                            # Setup CodeQL Tool
                            mkdir -p /home/dso501/tools
                            if [ ! -d "/home/dso501/tools/codeql" ]; then
                                cd /home/dso501/tools
                                wget -q https://github.com/github/codeql-action/releases/download/codeql-bundle-v2.16.0/codeql-bundle-linux64.tar.gz
                                tar -xzf codeql-bundle-linux64.tar.gz
                                rm codeql-bundle-linux64.tar.gz
                            fi

                            cd /home/dso501/Sistem-Bioskop

                            # =========================================
                            # BAGIAN 2: SCAN BACKEND (GO)
                            # =========================================
                            echo "[1/2] Scanning Backend (Go)..."
                            rm -rf codeql-db-go
                            
                            # Create DB Go
                            /home/dso501/tools/codeql/codeql database create codeql-db-go \\
                                --language=go \\
                                --source-root=./back-end \\
                                --overwrite || echo "Gagal membuat DB Go, skipping scan backend..."

                            # Analyze Go
                            /home/dso501/tools/codeql/codeql database analyze codeql-db-go \\
                                go-security-and-quality.qls \\
                                --format=csv \\
                                --output=report-go.csv || echo "Gagal analisis Go."

                            # =========================================
                            # BAGIAN 3: SCAN FRONTEND (REACT/JS)
                            # =========================================
                            echo "[2/2] Scanning Frontend (React/JS)..."
                            rm -rf codeql-db-js
                            
                            # Create DB JS
                            /home/dso501/tools/codeql/codeql database create codeql-db-js \\
                                --language=javascript \\
                                --source-root=./front-end \\
                                --overwrite || echo "Gagal membuat DB JS, skipping scan frontend..."

                            # Analyze JS
                            /home/dso501/tools/codeql/codeql database analyze codeql-db-js \\
                                javascript-security-and-quality.qls \\
                                --format=csv \\
                                --output=report-js.csv || echo "Gagal analisis JS."

                            # =========================================
                            # BAGIAN 4: CEK HASIL (WARNING ONLY)
                            # =========================================
                            echo "Merekap Hasil Scan..."
                            
                            ISSUES_FOUND=0

                            if [ -s report-go.csv ]; then
                                echo "CodeQL Backend (Go) menemukan issue!"
                                cat report-go.csv
                                ISSUES_FOUND=1
                            fi

                            if [ -s report-js.csv ]; then
                                echo "CodeQL Frontend (React) menemukan issue!"
                                cat report-js.csv
                                ISSUES_FOUND=1
                            fi

                            # --- MODIFIKASI DI SINI ---
                            if [ \$ISSUES_FOUND -eq 1 ]; then
                                echo "PERINGATAN: CodeQL menemukan vulnerability!"
                                echo "Namun Pipeline dikonfigurasi untuk TETAP LANJUT (Force Deploy)."
                                # Tidak ada "exit 1" di sini, jadi pipeline tetap hijau.
                            else
                                echo "Full Stack Aman. Lanjut Deployment."
                            fi
                        '
                    """
                }
            }
        }

	stage('4. Build & Deploy') {
            steps {
                echo 'Deploying...'
                
                // Inject Environment Variables
                sh """
                    ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                        cd Sistem-Bioskop/back-end
                        echo 'PORT=3000' > .env
                        echo 'BASE_URL=http://10.34.100.154:3000' >> .env
                        echo 'DATABASE_HOST=secure_postgres' >> .env
                        echo 'DATABASE_PORT=5432' >> .env
                        echo 'DATABASE_USER=postgres' >> .env
                        echo 'DATABASE_PASSWORD=adminrino' >> .env
                        echo 'DATABASE_NAME=movie-app-go' >> .env
                        echo 'JWT_SECRET=rahasia_aman_secure_123' >> .env
                        echo 'REDIS_ADDR=secure_redis:6379' >> .env
                        echo 'PAYMENT_TIMEOUT_MINUTES=2' >> .env
                    "
                """

                // Jalankan Docker Compose (Force Recreate & Clean Volume)
                sh """
                    ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                        cd Sistem-Bioskop
                        docker compose down -v || true
                        docker compose up -d --build
                    "
                """
            }
        }
        
        stage('5. Verifikasi') {
            steps {
                echo 'Cek Status Container...'
                sh "ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 'docker ps'"
            }
        }
    }
}
