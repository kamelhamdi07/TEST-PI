# Jenkins Minikube Pipeline

This project includes a root `Jenkinsfile` for a complete local CI/CD flow:

- GitHub checkout
- Maven builds for Spring Boot services
- Angular build with `npm ci` and `npm run build`
- Backend tests and JaCoCo coverage
- Frontend tests and Istanbul/nyc coverage
- Root SonarQube analysis for backend and frontend
- Docker image builds for every deployable unit
- Kubernetes deployment on Minikube
- Prometheus, Grafana, kube-state-metrics and Kafka exporter deployment

## Services

| Component | Path | Docker image |
| --- | --- | --- |
| Eureka server | `Eureka-main/Eureka-main` | `pi-platform/eureka-server:<commit>` |
| API gateway | `API_Gateway` | `pi-platform/api-gateway:<commit>` |
| Payment service | `payment_Microsevices/payment_Microsevices` | `pi-platform/payment-service:<commit>` |
| Reporting service | `reporting-service` | `pi-platform/reporting-service:<commit>` |
| Frontend | `esm-front-main` | `pi-platform/frontend:<commit>` |

Each image is also tagged as `latest`.

## Jenkins prerequisites

The Jenkins agent must have these tools:

- JDK 17
- Maven 3.9+
- Node.js 22+ and npm
- Docker CLI
- Minikube
- kubectl
- SonarScanner CLI

The default `jenkins/jenkins:lts` Docker image does not include these tools. For local validation, build and run the prepared Jenkins image:

```bash
docker rm -f jenkins-local jenkins-devops || true
docker compose -f jenkins/docker-compose.yml up -d --build
```

Open Jenkins:

```text
http://localhost:8081
```

Get the first admin password:

```bash
docker exec jenkins-devops cat /var/jenkins_home/secrets/initialAdminPassword
```

Check installed tools inside the container:

```bash
docker exec jenkins-devops sh -lc "mvn -version && node -v && npm -v && docker --version && sonar-scanner --version && kubectl version --client && minikube version"
```

Create a Jenkins secret text credential:

```text
ID: sonarqube-token
Value: <your SonarQube token>
```

The pipeline uses the `SONAR_HOST_URL` parameter for the SonarQube server URL.

## Minikube setup

Start Minikube before running the pipeline:

```bash
minikube start --profile minikube --cpus 4 --memory 8192
kubectl config use-context minikube
```

By default, Jenkins builds Docker images directly inside the Minikube Docker daemon:

```bash
eval $(minikube -p minikube docker-env)
```

This avoids pushing images to an external registry during local validation.

## Pipeline parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `GIT_REPOSITORY_URL` | empty | Optional GitHub repository URL. Empty means Jenkins uses the job SCM. |
| `GIT_BRANCH` | `main` | Branch used when `GIT_REPOSITORY_URL` is set. |
| `SONAR_HOST_URL` | `http://host.docker.internal:9000` | SonarQube URL reachable from Jenkins when Jenkins runs in Docker Desktop. |
| `IMAGE_REGISTRY` | `pi-platform` | Local image namespace or registry prefix. |
| `MINIKUBE_PROFILE` | `minikube` | Minikube profile name. |
| `USE_MINIKUBE_DOCKER` | `true` | Build images inside Minikube Docker. |
| `DEPLOY_TO_MINIKUBE` | `true` | Apply Kubernetes manifests and update images. |
| `INSTALL_MONITORING` | `true` | Install Prometheus, Grafana and exporters. |

## Kubernetes deployment

The Jenkinsfile applies manifests in this order:

```bash
kubectl apply -f k8s/base/00-namespace.yaml
kubectl apply -f k8s/mysql/
kubectl apply -f k8s/eureka-server/
kubectl apply -f k8s/api-gateway/
kubectl apply -f k8s/payment-service/
kubectl apply -f k8s/reporting-service/
kubectl apply -f k8s/frontend/
```

Then it updates each Deployment with the commit-specific image tag and waits for rollout completion.

## Monitoring

Monitoring manifests are stored in `monitoring/` and include:

- Prometheus
- Grafana
- kube-state-metrics for pod, deployment, service and cluster state
- cAdvisor scraping through the Kubernetes API for CPU/RAM metrics
- Kafka exporter, enabled when Kafka is reachable at the broker address configured in `monitoring/kafka-exporter.yaml`

Services:

- Frontend: `http://$(minikube ip):30081`
- API gateway: `http://$(minikube ip):30080`
- Prometheus: `http://$(minikube ip):30090`
- Grafana: `http://$(minikube ip):30300`

Default Grafana credentials are `admin/admin` in the manifest. Change them for any shared environment.
