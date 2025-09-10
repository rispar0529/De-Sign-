# Backend Application Setup

This document explains how to set up and run the backend application developed for the hackathon.

---

## Prerequisites

Make sure you have the following installed on your system:
- Python 3.8 or higher
- pip (comes with Python)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/rispar0529/De-Sign-.git
```

---

### 2. Navigate to the Backend Directory

```bash
cd De-Sign-/backend
```

---

### 3. Create and Activate Virtual Environment

#### On Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

#### On macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 4. Install Dependencies

Install all required Python packages from `requirements.txt`:

```bash
pip install -r requirements.txt
```

---

### 5. Configure Environment Variables

Create a `.env` file in the backend directory and add the following variables (replace placeholder values with your actual credentials):

```env
DESCOPE_PROJECT_ID=your_descope_project_id
DESCOPE_MANAGEMENT_KEY=your_descope_management_key
DESCOPE_BASE_URL=https://api.descope.com
FLASK_ENV=development
FLASK_DEBUG=true
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
```

> **Important Note:**  
> For `EMAIL_PASS`, use a **16-character Gmail App Password** generated from your Google account's security settings.  
> Do **not** use your regular Google account password.

---

### 6. Start the Backend Server

Run the following command to start the backend application:

```bash
python main.py
```

By default, the server will run in development mode.


