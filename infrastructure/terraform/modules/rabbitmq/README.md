RabbitMQ Terraform Module (Placeholder)

This module provisions a highly available RabbitMQ cluster. Choose one of:
- AWS: deploy on EKS with RabbitMQ Helm chart with operators, or use Amazon MQ (RabbitMQ engine).
- GCP: deploy on GKE with Helm/operator.

Features
- Quorum queues, HA policies across AZs
- Persistent volumes with SSD
- Network policies, PodSecurityPolicies/Pod Security Standards
- Metrics and dashboards (Prometheus/Grafana)
- Backup and disaster recovery with snapshots

Inputs/Outputs
- See variables to configure replicas, storage classes, and resource sizes.
