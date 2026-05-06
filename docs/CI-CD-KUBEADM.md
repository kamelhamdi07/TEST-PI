# CI/CD and kubeadm Deployment

This repository is prepared with separated CI and CD pipelines per deployable unit.

For a Jenkins-based local pipeline with SonarQube, Docker, Minikube, Prometheus and Grafana, see:

- `Jenkinsfile`
- `docs/JENKINS-MINIKUBE-PIPELINE.md`

## Pipeline layout

Backend:

- `CI eureka-server` -> `CD eureka-server`
- `CI api-gateway` -> `CD api-gateway`
- `CI payment-service` -> `CD payment-service`
- `CI reporting-service` -> `CD reporting-service`

Frontend:

- `CI frontend` -> `CD frontend`

Each CI workflow is independent. Each CD workflow is also independent and is triggered with `workflow_run` after the matching CI workflow succeeds.

## Required GitHub secrets

- `SONAR_HOST_URL`: SonarQube URL, for example `http://sonarqube.example.com`
- `SONAR_TOKEN`: token with permission to analyze projects
- `KUBE_CONFIG_BASE64`: base64 encoded kubeconfig for the kubeadm cluster

For local validation with GitHub-hosted runners, `http://localhost:9000` does not work because it points to the GitHub runner, not to the developer machine. Expose local SonarQube temporarily with Cloudflare Tunnel or ngrok, then use the public HTTPS URL as `SONAR_HOST_URL`.

Current local validation example:

```text
SONAR_HOST_URL=https://presentations-possibly-spirits-mathematical.trycloudflare.com
```

Keep Docker Desktop, the `sonarqube` container, and the tunnel process running while GitHub Actions is executing.

Create the kubeconfig secret from a trusted machine:

```bash
base64 -w 0 ~/.kube/config
```

On macOS:

```bash
base64 ~/.kube/config | tr -d '\n'
```

## kubeadm expectation

The manifests target a real Kubernetes cluster created with kubeadm, not Minikube.

Cluster prerequisites:

- Container runtime installed on every node
- kubeadm, kubelet and kubectl installed
- CNI installed after `kubeadm init`
- A default StorageClass, or a manually provisioned PV for `mysql-data`
- Network access from GitHub Actions runner to the cluster API server

## Deploy manually

```bash
kubectl apply -f k8s/base/00-namespace.yaml
kubectl apply -f k8s/mysql/
kubectl apply -f k8s/eureka-server/
kubectl apply -f k8s/api-gateway/
kubectl apply -f k8s/payment-service/
kubectl apply -f k8s/reporting-service/
kubectl apply -f k8s/frontend/
```

NodePorts:

- API Gateway: `30080`
- Frontend: `30081`

## Monitoring

Install monitoring:

```bash
kubectl apply -f monitoring/namespace.yaml
kubectl apply -f monitoring/
```

NodePorts:

- Prometheus: `30090`
- Grafana: `30300`

Default Grafana credentials in the manifest are `admin/admin`. Change them before production validation.

## Kafka monitoring

`monitoring/kafka-exporter.yaml` expects Kafka at:

```text
kafka.kafka.svc.cluster.local:9092
```

Change `KAFKA_BROKERS` if your Kafka cluster uses another namespace/service.

## Image flow

CI builds and pushes images to GHCR using:

```text
ghcr.io/<github-owner>/<service>:<commit-sha>
ghcr.io/<github-owner>/<service>:latest
```

CD applies the Kubernetes manifests and updates the deployed image to the commit SHA that passed CI.
