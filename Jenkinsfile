pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timestamps()
    }

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
                        sh "ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 'trivy fs --exit-code 0 --severity HIGH,CRITICAL ./Sistem-Bioskop'"
                    } catch (Exception e) { echo 'Trivy Warning' }

                    try {
                        sh """
                            ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                                docker run --rm -v /home/dso501/Sistem-Bioskop:/src returntocorp/semgrep semgrep scan --config auto
                            "
                        """
                    } catch (Exception e) { echo 'Semgrep Warning' }
                }
            }
        }

        stage('3. Advanced SAST (CodeQL)') {
            steps {
                script {
                    echo 'Menjalankan CodeQL...'
                    sh """
                        ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 '
                            export PATH=\$PATH:/usr/local/go/bin:/usr/local/node/bin

                            if [ ! -d "/home/dso501/tools/codeql" ]; then
                                echo "CodeQL missing..."
                                exit 0
                            fi

                            cd /home/dso501/Sistem-Bioskop

                            rm -rf codeql-db-go
                            /home/dso501/tools/codeql/codeql database create codeql-db-go --language=go --source-root=./back-end --overwrite || echo "Skip Go"
                            /home/dso501/tools/codeql/codeql database analyze codeql-db-go go-security-and-quality.qls --format=csv --output=report-go.csv

                            rm -rf codeql-db-js
                            /home/dso501/tools/codeql/codeql database create codeql-db-js --language=javascript --source-root=./front-end --overwrite || echo "Skip JS"
                            /home/dso501/tools/codeql/codeql database analyze codeql-db-js javascript-security-and-quality.qls --format=csv --output=report-js.csv

                            if [ -s report-go.csv ] || [ -s report-js.csv ]; then
                                echo "CodeQL menemukan masalah di Go: "
				cat report-go.csv
				echo " ------------------------------- "

				echo "CodeQL menemukan masalah di React: "
				cat report-js.csv
				echo " ------------------------------- "
                            else
                                echo "CodeQL Clean."
                            fi
                        '
                    """
                }
            }
        }

        stage('4. Build & Deploy') {
            steps {
                echo 'Deploying Application...'
                
                // Inject .env
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

                sh """
                    ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                        cd Sistem-Bioskop
                        docker compose down -v || true
                        docker compose up -d --build
                    "
                """
                
                echo 'Menunggu 30 detik agar server siap untuk DAST...'
                sleep 30
            }
        }

        stage('5. Dynamic Security Scan (DAST - OWASP ZAP)') {
            steps {
                script {
                    echo 'Menjalankan OWASP ZAP (Baseline Scan)...'
                    
                    try {
                        sh """
                            ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 "
                                docker run --rm -v /home/dso501/Sistem-Bioskop:/zap/wrk/:rw \
                                ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
                                -t http://10.34.100.154:80 \
                                -r zap_report.html \
                                -I
                            "
                        """
                        echo 'OWASP ZAP selesai.'
                    } catch (Exception e) {
                        echo 'OWASP ZAP menemukan issue, tapi pipeline lanjut.'
                    }
                }
            }
        }

        stage('6. Verifikasi Akhir') {
            steps {
                sh "ssh -o StrictHostKeyChecking=no dso501@10.34.100.154 'docker ps'"
            }
        }
    }
}
