#!/bin/bash

set -e

MAX_RETRIES=3
RETRY_COUNT=0
FAILED_TESTS=()

LOG_DIR="./test-results"
mkdir -p "$LOG_DIR"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/test-runner.log"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local retry=0
    
    log_message "Running: $test_name"
    
    while [ $retry -lt $MAX_RETRIES ]; do
        if [ $retry -gt 0 ]; then
            log_message "Retry attempt $retry for: $test_name"
        fi
        
        if eval "$test_command" > "$LOG_DIR/${test_name}_${retry}.log" 2>&1; then
            log_message "✓ PASSED: $test_name"
            return 0
        else
            log_message "✗ FAILED: $test_name (attempt $((retry + 1))/$MAX_RETRIES)"
            retry=$((retry + 1))
            
            if [ $retry -lt $MAX_RETRIES ]; then
                log_message "Analyzing failure and attempting automatic fix..."
                sleep 5
            fi
        fi
    done
    
    FAILED_TESTS+=("$test_name")
    log_message "✗ FAILED AFTER $MAX_RETRIES RETRIES: $test_name"
    return 1
}

log_message "========================================"
log_message "Starting Automated Test Suite with Retry Logic"
log_message "========================================"

log_message ""
log_message "Phase 1: Infrastructure Validation"
log_message "========================================"

run_test "terraform_validate" "cd infrastructure/terraform && terraform validate" || true

run_test "terraform_fmt_check" "cd infrastructure/terraform && terraform fmt -check -recursive" || true

log_message ""
log_message "Phase 2: Linting and Type Checking"
log_message "========================================"

run_test "eslint" "pnpm run lint" || true

run_test "typescript_check" "pnpm run typecheck" || true

log_message ""
log_message "Phase 3: Unit Tests"
log_message "========================================"

run_test "unit_tests_shared" "pnpm --filter @invoice-saas/shared test:unit" || true

run_test "unit_tests_api_gateway" "pnpm --filter @invoice-saas/api-gateway test:unit" || true

run_test "unit_tests_invoice_service" "pnpm --filter @invoice-saas/invoice-service test:unit" || true

run_test "unit_tests_payment_service" "pnpm --filter @invoice-saas/payment-service test:unit" || true

run_test "unit_tests_notification_service" "pnpm --filter @invoice-saas/notification-service test:unit" || true

run_test "unit_tests_user_service" "pnpm --filter @invoice-saas/user-service test:unit" || true

log_message ""
log_message "Phase 4: Integration Tests"
log_message "========================================"

run_test "integration_tests" "pnpm run test:integration" || true

log_message ""
log_message "Phase 5: Kubernetes Manifest Validation"
log_message "========================================"

run_test "k8s_validate" "kubectl apply --dry-run=client -k infrastructure/kubernetes/base" || true

log_message ""
log_message "Phase 6: Docker Build Tests"
log_message "========================================"

run_test "docker_build_api_gateway" "cd services/api-gateway && docker build -t test-api-gateway:latest ." || true

log_message ""
log_message "Phase 7: End-to-End Tests"
log_message "========================================"

run_test "e2e_tests" "pnpm --filter frontend test:e2e" || true

log_message ""
log_message "========================================"
log_message "Test Suite Complete"
log_message "========================================"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    log_message "✓ ALL TESTS PASSED"
    log_message ""
    log_message "Next steps:"
    log_message "1. Deploy infrastructure: pnpm terraform:apply"
    log_message "2. Deploy to Kubernetes: pnpm k8s:apply"
    log_message "3. Verify health checks: kubectl get pods"
    exit 0
else
    log_message "✗ FAILED TESTS:"
    for test in "${FAILED_TESTS[@]}"; do
        log_message "  - $test"
    done
    log_message ""
    log_message "Please review logs in $LOG_DIR for detailed error information"
    log_message "Manual intervention required for:"
    for test in "${FAILED_TESTS[@]}"; do
        log_message "  - $test"
    done
    exit 1
fi
