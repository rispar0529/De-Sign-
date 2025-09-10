# De-Sign
# Contract Management and Verification System

De-Sign is a stateful, multi-agent application orchestrated by LangGraph. The system manages a document's journey from initial upload to final scheduling through a series of specialized agents, pausing for critical human intervention when necessary.

---

## Project Overview

This system provides a streamlined process to:
1. Authenticate users securely via credentials.
2. Upload contracts for verification.
3. Perform contract safety checks, summarize content, and suggest clauses.
4. Approve or reject the contract based on verification results.
5. Schedule meetings and send notification emails automatically.

---

## Features

### User Authentication and Authorization

This system uses **Descope** for secure authentication and authorization of users.  
Users must log in with their credentials (login ID and password) to access the application.

### User Registration via API

New users can be created with a curl request to Descope’s API:

```bash
curl -X POST "https://api.descope.com/v1/mgmt/user/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_DESCOPE_PROJECT_ID>:<YOUR_DESCOPE_MANAGEMENT_KEY>" \
  -d '{
    "loginId": "newuser@example.com",
    "email": "newuser@example.com",
    "password": "StrongP@ssw0rd123!",
    "name": "New User",
    "roleNames": ["user"]
  }'
```

Note: Replace `<YOUR_DESCOPE_PROJECT_ID>` and `<YOUR_DESCOPE_MANAGEMENT_KEY>` with your actual Descope credentials.

### Contract Upload

Once logged in, users can upload contract files through the interface.

### Contract Verification Interface

After uploading a contract, users are presented with options to:
- Verify the contract
- Summarize the contract
- Give clause suggestions

Based on these analyses, users can decide to approve or reject the contract.

### Approval Workflow

- If the contract is verified as safe, proceed to schedule a meeting.
- If the contract fails verification, it can be rejected.

### Meeting Scheduling and Notification

Users enter an email address, a date, and a time and click "Schedule Meeting." The system will:
- Schedule the meeting.
- Send an email notification.
- Redirect the user back to the upload page for the next contract.

---

## Setup Instructions

1. Complete backend and frontend setup as per their respective README files.

2. Start the backend server:

```bash
python main.py
```

3. Start the frontend application:

```bash
npm start
```

4. Visit the application at:

```
http://localhost:3000
```

---

## Important Notes

- Authentication and authorization are handled by Descope for secure user management.
- Use your own Descope Project ID and Management Key for user creation.
- Ensure correct environment variables are configured in the `.env` file.
- For `EMAIL_PASS`, use a 16-character Gmail App Password (generated from your Google account security settings), not your regular Google account password.

---

## Technology Stack

- Agent & Workflow Orchestration: LangGraph
- Generative AI:
    - Reasoning & Analysis (Agent B): Google Gemini 1.5 Flash
    - Embeddings: Google text-embedding-004
- Vector Database: Pinecone for the RAG knowledge base
- Backend Server: Flask
- Authentication and Authorization: Descope API
- Document Processing:
    - PyPDF2
    - python-docx
    - Pytesseract (for OCR)
- Email Notifications: Gmail SMTP with App Password
- Frontend: React.js

---

## Conclusion

This system offers a reliable and automated way to manage contracts for businesses, providing essential features for validation, summarization, and scheduling, all designed for security and efficiency.


