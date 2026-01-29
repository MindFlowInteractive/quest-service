# 📊 Monitoring & observability Infrastructure

This project uses a modern observability stack (LGPG: Loki, Grafana, Prometheus, Jaeger) to monitor microservice health, aggregate logs, and trace requests.

## 🚀 Accessing the Dashboards

| Tool | Purpose | URL | Credentials |
| :--- | :--- | :--- | :--- |
| **Grafana** | Data Visualization | [http://localhost:3003](http://localhost:3003) | `admin` / `admin` |
| **Prometheus** | Metrics Collection | [http://localhost:9090](http://localhost:9090) | None |
| **Jaeger** | Distributed Tracing | [http://localhost:16686](http://localhost:16686) | None |
| **Loki** | Log Aggregation | Managed via Grafana | None |

---

## 🛠️ Stack Components

1.  **Prometheus:** Scrapes `/metrics` endpoints from all microservices every 15 seconds.
2.  **Loki:** A horizontally scalable, highly available, multi-tenant log aggregation system.
3.  **Promtail:** An agent which ships local Docker container logs to Loki.
4.  **Jaeger:** Provides distributed tracing to help debug performance bottlenecks and request flows across microservices.
5.  **Grafana:** The central UI used to query and visualize data from Prometheus, Loki, and Jaeger.

---

## 📖 Runbooks (Troubleshooting)

### 1. Service appears as "DOWN" in Prometheus
*   **Symptom:** Prometheus targets page shows red for a microservice.
*   **Action:** 
    1. Check if the container is running: `docker-compose ps`.
    2. Check container logs for crashes: `docker-compose logs <service-name>`.
    3. Ensure the service is correctly exporting metrics at the `:3000/metrics` path.

### 2. No logs appearing in Grafana
*   **Symptom:** The Explore tab in Grafana shows no data when selecting the Loki datasource.
*   **Action:**
    1. Ensure the `promtail` container is running.
    2. Check that the path `/var/lib/docker/containers` is correctly mounted in `docker-compose.yml`.

### 3. Missing Traces in Jaeger
*   **Symptom:** No traces found for a specific operation.
*   **Action:**
    1. Verify the `JAEGER_ENDPOINT` environment variable is correctly set in the microservice configuration.
    2. Check if the service is correctly initialized with the OpenTelemetry/Jaeger SDK.

---

## 📈 Logging Convention
We use **Structured Logging** (JSON format) to ensure logs are easily searchable in Loki. Each log should ideally include:
- `level` (info, warn, error)
- `service_name`
- `correlation_id` (for tracing)
- `message`