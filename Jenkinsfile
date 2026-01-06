pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'diwamln/centralized-logging' 
        DOCKER_CREDS = 'docker-hub' 
        GIT_CREDS    = 'git-token'
        MANIFEST_REPO_URL = 'github.com/DevopsNaratel/deployment-manifests' 
        MANIFEST_PATH = 'centralized-logging/sys/deployment.yaml'
    }

    stages {
        stage('Checkout & Versioning') {
            steps {
                checkout scm
                script {
                    def commitHash = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                    env.BASE_TAG = "build-${BUILD_NUMBER}-${commitHash}" 
                    currentBuild.displayName = "#${BUILD_NUMBER} Backend (${env.BASE_TAG})"
                }
            }
        }

        stage('Build & Push (TEST Image)') {
            steps {
                // PERBAIKAN: Hapus blok container('docker'), langsung gunakan script docker
                script {
                    docker.withRegistry('', DOCKER_CREDS) {
                        def testTag = "${env.BASE_TAG}-test"
                        echo "Building Backend Image: ${testTag}"
                        // Perintah docker build langsung berjalan karena socket ter-mount
                        def testImage = docker.build("${DOCKER_IMAGE}:${testTag}", ".")
                        testImage.push()
                    }
                }
            }
        }

        stage('Update Manifest (TEST)') {
            steps {
                script {
                    sh 'rm -rf temp_manifests'
                    dir('temp_manifests') {
                        withCredentials([usernamePassword(credentialsId: GIT_CREDS, usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                            sh "git clone https://${GIT_USER}:${GIT_PASS}@${MANIFEST_REPO_URL} ."
                            sh 'git config user.email "jenkins@bot.com"'
                            sh 'git config user.name "Jenkins Pipeline"'
                            sh "sed -i 's|image: ${DOCKER_IMAGE}:.*|image: ${DOCKER_IMAGE}:${env.BASE_TAG}-test|g' ${MANIFEST_PATH}"
                            sh "git add ."
                            sh "git commit -m 'Deploy Backend TEST: ${env.BASE_TAG}-test [skip ci]'"
                            sh "git push origin main"
                        }
                    }
                }
            }
        }
    }
}