def BACKEND_SERVICES = [
    [name: 'eureka-server', dir: 'Eureka-main/Eureka-main', container: 'eureka-server'],
    [name: 'api-gateway', dir: 'API_Gateway', container: 'api-gateway'],
    [name: 'payment-service', dir: 'payment_Microsevices/payment_Microsevices', container: 'payment-service'],
    [name: 'reporting-service', dir: 'reporting-service', container: 'reporting-service']
]

def FRONTEND_SERVICE = [name: 'frontend', dir: 'esm-front-main', container: 'frontend']

pipeline {
    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'GIT_REPOSITORY_URL', defaultValue: '', description: 'Optional GitHub repository URL. Empty value uses the Jenkins job SCM.')
        string(name: 'GIT_BRANCH', defaultValue: 'main', description: 'Branch used when GIT_REPOSITORY_URL is provided.')
        string(name: 'SONAR_HOST_URL', defaultValue: 'http://localhost:9000', description: 'SonarQube server URL reachable from the Jenkins agent.')
        string(name: 'IMAGE_REGISTRY', defaultValue: 'pi-platform', description: 'Image namespace/registry used for Minikube images.')
        string(name: 'MINIKUBE_PROFILE', defaultValue: 'minikube', description: 'Minikube profile used by kubectl and Docker.')
        booleanParam(name: 'USE_MINIKUBE_DOCKER', defaultValue: true, description: 'Build images directly inside the Minikube Docker daemon.')
        booleanParam(name: 'DEPLOY_TO_MINIKUBE', defaultValue: true, description: 'Apply Kubernetes manifests and deploy the generated images.')
        booleanParam(name: 'INSTALL_MONITORING', defaultValue: true, description: 'Apply Prometheus, Grafana, kube-state-metrics and Kafka exporter manifests.')
    }

    environment {
        APP_NAMESPACE = 'pi-platform'
        MONITORING_NAMESPACE = 'monitoring'
        MAVEN_OPTS = '-Dmaven.repo.local=.m2/repository'
        CI = 'true'
    }

    stages {
        stage('Checkout GitHub') {
            steps {
                script {
                    if (params.GIT_REPOSITORY_URL?.trim()) {
                        git branch: params.GIT_BRANCH, url: params.GIT_REPOSITORY_URL
                    } else {
                        checkout scm
                    }

                    env.IMAGE_TAG = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
                    currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    BACKEND_SERVICES.each { service ->
                        dir(service.dir) {
                            sh 'mvn -B -DskipTests clean package'
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir(FRONTEND_SERVICE.dir) {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Tests Backend') {
            steps {
                script {
                    BACKEND_SERVICES.each { service ->
                        dir(service.dir) {
                            sh 'mvn -B test'
                        }
                    }
                }
            }
        }

        stage('Tests Frontend') {
            steps {
                dir(FRONTEND_SERVICE.dir) {
                    script {
                        def hasTestScript = sh(script: 'npm pkg get scripts.test --silent | grep -vq null', returnStatus: true) == 0
                        if (hasTestScript) {
                            sh 'npm test -- --watch=false'
                        } else {
                            echo 'No frontend npm test script found; skipping frontend tests.'
                        }
                    }
                }
            }
        }

        stage('Code Coverage') {
            parallel {
                stage('Backend JaCoCo') {
                    steps {
                        script {
                            BACKEND_SERVICES.each { service ->
                                dir(service.dir) {
                                    sh 'mvn -B verify'
                                }
                            }
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                            archiveArtifacts allowEmptyArchive: true, artifacts: '**/target/site/jacoco/jacoco.xml,**/target/site/jacoco/index.html'
                        }
                    }
                }

                stage('Frontend Istanbul') {
                    steps {
                        dir(FRONTEND_SERVICE.dir) {
                            script {
                                def hasCoverageScript = sh(script: 'npm pkg get scripts.coverage --silent | grep -vq null', returnStatus: true) == 0
                                if (hasCoverageScript) {
                                    sh 'npm run coverage'
                                } else {
                                    sh 'npm test -- --watch=false --coverage'
                                }
                            }
                        }
                    }
                    post {
                        always {
                            archiveArtifacts allowEmptyArchive: true, artifacts: 'esm-front-main/coverage/**/*.lcov,esm-front-main/coverage/**/lcov.info,esm-front-main/coverage/**/*'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        sonar-scanner \
                          -Dsonar.host.url="${SONAR_HOST_URL}" \
                          -Dsonar.token="${SONAR_TOKEN}" \
                          -Dsonar.projectVersion="${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('Docker Images') {
            steps {
                script {
                    def services = BACKEND_SERVICES + [FRONTEND_SERVICE]
                    def dockerEnv = params.USE_MINIKUBE_DOCKER
                        ? "eval \\$(minikube -p ${params.MINIKUBE_PROFILE} docker-env)"
                        : 'true'

                    services.each { service ->
                        sh """
                            ${dockerEnv}
                            docker build \
                              -t ${params.IMAGE_REGISTRY}/${service.name}:${env.IMAGE_TAG} \
                              -t ${params.IMAGE_REGISTRY}/${service.name}:latest \
                              ${service.dir}
                        """
                    }
                }
            }
        }

        stage('Deploy Kubernetes Minikube') {
            when {
                expression { return params.DEPLOY_TO_MINIKUBE }
            }
            steps {
                script {
                    sh "minikube -p ${params.MINIKUBE_PROFILE} status"
                    sh 'kubectl apply -f k8s/base/00-namespace.yaml'
                    sh 'kubectl apply -f k8s/mysql/'
                    sh 'kubectl apply -f k8s/eureka-server/'
                    sh 'kubectl apply -f k8s/api-gateway/'
                    sh 'kubectl apply -f k8s/payment-service/'
                    sh 'kubectl apply -f k8s/reporting-service/'
                    sh 'kubectl apply -f k8s/frontend/'

                    (BACKEND_SERVICES + [FRONTEND_SERVICE]).each { service ->
                        sh """
                            kubectl -n ${env.APP_NAMESPACE} set image deployment/${service.name} \
                              ${service.container}=${params.IMAGE_REGISTRY}/${service.name}:${env.IMAGE_TAG}
                            kubectl -n ${env.APP_NAMESPACE} rollout status deployment/${service.name} --timeout=180s
                        """
                    }
                }
            }
        }

        stage('Monitoring Prometheus Grafana') {
            when {
                expression { return params.DEPLOY_TO_MINIKUBE && params.INSTALL_MONITORING }
            }
            steps {
                sh 'kubectl apply -f monitoring/namespace.yaml'
                sh 'kubectl apply -f monitoring/'
                sh "kubectl -n ${env.MONITORING_NAMESPACE} rollout status deployment/prometheus --timeout=180s"
                sh "kubectl -n ${env.MONITORING_NAMESPACE} rollout status deployment/grafana --timeout=180s"
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true, artifacts: '**/target/*.jar,esm-front-main/dist/**/*,**/target/site/jacoco/**/*,esm-front-main/coverage/**/*'
        }
        success {
            echo "Pipeline completed. Images tagged with ${env.IMAGE_TAG} and latest."
        }
    }
}
