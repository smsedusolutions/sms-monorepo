# 🚨 Data Breach Response Runbook — SMS Edu Solutions

> **DPDP Act 2023 (India) — §8 Breach Notification Obligation**  
> The Data Fiduciary must notify the **Data Protection Board of India (DPBI)** within **72 hours** of becoming aware of a personal data breach. Data principals must be notified **without undue delay** after DPBI notification.

> [!CAUTION]
> This runbook is a **compliance draft**. [LEGAL REVIEW REQUIRED] before first use. Validate contact details, escalation tree, and notification templates with a lawyer.

---

## ⏱️ Response Timeline

```
DISCOVERY
    │
    ├─── T+0h   → Incident Confirmed → Page Security Lead + DPO
    ├─── T+4h   → Initial Assessment Complete → Severity Classified
    ├─── T+12h  → Containment Actions Taken
    ├─── T+24h  → Internal Stakeholders Briefed
    ├─── T+48h  → DPBI Notification Filed (72h deadline)
    ├─── T+60h  → Affected User Notifications Sent
    └─── T+72h  → ⚠️ STATUTORY DEADLINE — DPBI must be notified by now
```

---

## 1. Detection & Classification

### Detection Sources
- [ ] Automated monitoring alert (database access anomaly, auth spike)
- [ ] Employee report
- [ ] Third-party security researcher / responsible disclosure
- [ ] User complaint
- [ ] Vendor notification (e.g. MongoDB Atlas, hosting provider)

### Severity Classification

| Level | Description | Examples | Response SLA |
|-------|-------------|---------|-------------|
| **P0 — Critical** | Mass exposure of sensitive PII | Database dump leaked, auth bypass | Immediate (24/7) |
| **P1 — High** | Targeted exposure of personal data | Single school's data accessed | 4h response |
| **P2 — Medium** | Potential exposure, unconfirmed | Anomalous access patterns | 24h response |
| **P3 — Low** | Internal misconfiguration, no external exposure | Log file with PII accessible internally | 72h response |

---

## 2. Escalation Tree

> [LEGAL REVIEW REQUIRED] Replace with actual names and contacts before go-live.

```
Security Analyst / First Responder
        │
        ▼
Security Lead — [NAME] | [PHONE] | [EMAIL]
        │
        ▼
Data Protection Officer (DPO) — [NAME] | [PHONE] | [EMAIL]
        │
        ├──▶ CEO / Management — [NAME] | [PHONE]
        │
        ├──▶ Legal Counsel — [NAME/FIRM] | [PHONE]
        │
        └──▶ DPBI Notification Officer — [NAME] | [PHONE]
```

**After hours escalation:** [DESCRIBE ON-CALL PROCEDURE]  
**Incident tracking:** [JIRA / LINEAR / GITHUB ISSUES — specify]

---

## 3. Immediate Containment Checklist

- [ ] Identify and isolate the affected system / service
- [ ] Revoke compromised credentials / API keys
- [ ] Block malicious IP addresses (CORS / firewall)
- [ ] Preserve system logs (do NOT delete — evidence)
- [ ] Snapshot database state (before any remediation)
- [ ] Assess what data was accessed, by whom, and for how long
- [ ] Identify all affected Data Principals (users)
- [ ] Determine whether breach is ongoing or contained

---

## 4. DPBI Notification Template (72-hour deadline)

> **Submit at:** https://dpboard.gov.in (official portal)  
> [LEGAL REVIEW REQUIRED] Template below is indicative; confirm required fields with DPBI guidelines.

```
To: Data Protection Board of India
Subject: Personal Data Breach Notification — SMS Edu Solutions — [DATE]

1. DATA FIDUCIARY DETAILS
   Name: SMS Edu Solutions
   Address: [REGISTERED ADDRESS]
   DPO Contact: [DPO NAME] | [EMAIL] | [PHONE]

2. BREACH SUMMARY
   Date/Time of Discovery: [DATETIME IST]
   Date/Time of Breach (estimated): [DATETIME IST]
   Breach Status: [ONGOING / CONTAINED]

3. NATURE OF BREACH
   Type: [Unauthorised access / Exfiltration / Accidental disclosure / Other]
   Description: [Describe what happened in plain language]

4. DATA CATEGORIES AFFECTED
   [ ] Student personal data (name, email, DoB, address, class)
   [ ] Parent/Guardian data (name, email, phone)
   [ ] Teacher data (name, email, subjects)
   [ ] Financial data (fee records, payment information)
   [ ] Authentication credentials (email + password)
   [ ] Exam marks / academic records
   [ ] Other: [SPECIFY]

5. APPROXIMATE NUMBER OF DATA PRINCIPALS AFFECTED
   Number: [NUMBER or RANGE]
   Schools affected: [LIST]

6. LIKELY CONSEQUENCES
   [Describe potential harms: identity theft, financial fraud, reputational damage, etc.]

7. MEASURES TAKEN
   Containment actions: [LIST]
   Remediation planned: [LIST]
   User notification plan: [DESCRIBE]

8. CONTACT FOR FURTHER INFORMATION
   [NAME] | [EMAIL] | [PHONE]

Signed: [AUTHORISED SIGNATORY NAME & DESIGNATION]
Date: [DATE]
```

---

## 5. Data Principal (User) Notification Template

> Send via email to all affected users. Also display in-platform banner.  
> [LEGAL REVIEW REQUIRED] Timing and exact language must be confirmed with legal counsel.

**Subject:** Important: Security Notice Regarding Your Account — SMS Edu Solutions

```
Dear [USER NAME / "SMS Edu Solutions User"],

We are writing to inform you of a security incident that may have affected 
your personal data held on the SMS Edu Solutions platform.

WHAT HAPPENED
On [DATE], we discovered that [BRIEF DESCRIPTION IN PLAIN LANGUAGE].
The incident occurred between approximately [DATE] and [DATE].

WHAT INFORMATION WAS INVOLVED
The following types of personal data may have been affected:
• [LIST DATA CATEGORIES — e.g., "Your name, email address, and class information"]

WHAT WE ARE DOING
We have:
• [ACTION 1 — e.g., Secured the affected systems]
• [ACTION 2 — e.g., Reset all potentially compromised passwords]
• [ACTION 3 — e.g., Notified the Data Protection Board of India]

WHAT YOU SHOULD DO
• Change your password immediately at [LOGIN URL]
• Be cautious of suspicious emails or calls claiming to be from SMS Edu
• Monitor your email and linked accounts for unusual activity
• [OTHER SPECIFIC ADVICE based on data type]

YOUR RIGHTS UNDER THE DPDP ACT 2023
You have the right to:
• Access the personal data we hold about you
• Request correction or erasure of your data
• Withdraw consent for non-essential data processing
• Raise a grievance with our Grievance Officer or the Data Protection Board of India

To exercise your rights: [DATA RIGHTS URL]
Grievance Officer: grievance@smsedusolutions.com

We sincerely apologise for this incident and any concern it may cause.

[COMPANY NAME]
[DATE]
[CONTACT]
```

---

## 6. Post-Incident Review Checklist

After the immediate response, complete within **30 days**:

- [ ] Full root cause analysis documented
- [ ] Technical remediation verified (penetration test / security audit)
- [ ] DPBI follow-up report filed (if required by DPBI)
- [ ] Internal post-mortem meeting held
- [ ] Security policies updated
- [ ] Staff training updated
- [ ] Consent records audited for affected users
- [ ] Legal counsel review of liability and regulatory exposure
- [ ] Insurance claim filed (if applicable)
- [ ] Lessons-learned document published internally

---

## 7. Key Contacts & Resources

| Resource | Link / Contact |
|----------|---------------|
| Data Protection Board of India | https://dpboard.gov.in |
| CERT-In (mandatory IT incident reporting) | https://www.cert-in.org.in |
| Internal Legal Counsel | [LEGAL REVIEW REQUIRED] |
| Cyber Insurance Provider | [LEGAL REVIEW REQUIRED] |
| MongoDB Atlas Support | https://support.mongodb.com |

---

*Document Version: 1.0 | Created: 2026-08-21 | Branch: compliance/dpdp*  
*[LEGAL REVIEW REQUIRED] before first operational use.*
