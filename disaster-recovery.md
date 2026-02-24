# Disaster Recovery Runbook

## Purpose
This runbook provides step-by-step procedures for restoring database services in the event of data loss, corruption, or infrastructure failure. It ensures business continuity and compliance with recovery objectives.

---

## Recovery Objectives
- **RPO (Recovery Point Objective):** ≤ 1 hour (hourly backups + WAL logs).
- **RTO (Recovery Time Objective):** ≤ 2 hours for full restoration.
- **Retention:** 30 days PITR, 6 months weekly backups.

---

## Recovery Scenarios
1. **Accidental Data Deletion**
   - Restore latest backup.
   - Apply WAL logs to recover up to deletion time.
2. **Database Corruption**
   - Provision new DB instance.
   - Restore last verified backup.
   - Apply WAL logs.
3. **Regional Outage**
   - Switch to cross-region backup.
   - Provision DB in secondary region.
   - Restore backup + WAL logs.
4. **Security Breach**
   - Isolate compromised DB.
   - Restore clean backup.
   - Rotate credentials and keys.

---

## Recovery Steps
1. **Identify Incident**
   - Monitor alerts (backup failures, DB errors).
   - Confirm scope of outage.
2. **Provision New Database**
   - Launch new DB instance in primary or secondary region.
   - Configure networking and security groups.
3. **Restore Backup**
   - Retrieve latest encrypted backup from storage.
   - Decrypt using KMS key.
   - Import backup into new DB.
4. **Apply WAL Logs (PITR)**
   - Replay logs up to desired timestamp.
   - Validate consistency.
5. **Verify Restoration**
   - Run automated integrity tests.
   - Validate application connectivity.
6. **Switch Traffic**
   - Update connection strings.
   - Point services to restored DB.
7. **Post-Recovery Actions**
   - Document incident.
   - Notify stakeholders.
   - Schedule follow-up review.

---

## Monitoring & Alerts
- **Backup Failures:** Alert via Slack/email.
- **Restore Failures:** Escalate to DBA team.
- **Retention Policy:** Auto-delete expired backups, log events.

---

## Testing Schedule
- **Monthly Restore Drill:** Restore backup into staging DB.
- **Quarterly Failover Drill:** Simulate regional outage, restore cross-region backup.
- **Annual Full Audit:** Verify PITR functionality for 30 days.

---

## Roles & Responsibilities
- **DBA Team:** Execute recovery steps.
- **DevOps Team:** Provision infrastructure.
- **Security Team:** Handle breach scenarios.
- **Management:** Approve failover decisions.

---

## References
- Backup Service (`backend/src/backup/backup.service.ts`)
- Monitoring Dashboard
- Cloud Storage Policies
