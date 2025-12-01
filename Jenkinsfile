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

        stage('2. Security Scan') {
            steps {
                script {
                    echo 'Menjalankan Trivy dan Semgrep.'
                    
                    try {
                        echo '--- Scan Library (Trivy) ---'
                        sh "ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 'trivy fs --exit-code 0 --severity HIGH,CRITICAL ./Sistem-Bioskop'"
                    } catch (Exception e) { echo '⚠️ Trivy warning.' }

                    try {
                        echo '--- Scan Code Logic (Semgrep) ---'
                        sh """
                            ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                                docker run --rm -v /home/dso501/Sistem-Bioskop:/src returntocorp/semgrep semgrep scan --config auto
                            "
                        """
                    } catch (Exception e) { echo '⚠️ Semgrep warning.' }
                }
            }
        }

        stage('3. Build & Deploy') {
            steps {
                echo 'Injecting .env file...'
                
                sh """
                    ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                        cd Sistem-Bioskop/back-end
                        
                        # 1. Runtime Config
                        echo 'PORT=3000' > .env
                        echo 'BASE_URL=http://10.34.100.154:3000' >> .env

                        # 2. Database Config
                        echo 'DATABASE_HOST=secure_postgres' >> .env
                        echo 'DATABASE_PORT=5432' >> .env
                        echo 'DATABASE_USER=postgres' >> .env
                        echo 'DATABASE_PASSWORD=adminrino' >> .env
                        echo 'DATABASE_NAME=movie-app-go' >> .env

                        # 3. JWT Secret
                        echo 'JWT_SECRET=rahasia_aman_secure_123' >> .env

                        # 4. Redis Config (PENTING: HOSTNYA 'secure_redis')
                        echo 'REDIS_ADDR=secure_redis:6379' >> .env

                        # 5. Job Config
                        echo 'PAYMENT_TIMEOUT_MINUTES=2' >> .env

                        # Cek file
                        echo 'File .env berhasil dibuat.'
                    "
                """

                echo 'Menjalankan Docker Compose...'
                sh """
                    ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                        cd Sistem-Bioskop
                        
                        docker compose down -v || true
                        
                        docker compose up -d --build
                    "
                """
            }
        }
        
        stage('4. Verifikasi') {
            steps {
                sh "ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 'docker ps'"
            }
        }
    }
}
