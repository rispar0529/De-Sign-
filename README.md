# De-Sign
### Contract Management and Verification System

---

## Project Name and Short Description
**De-Sign** is a stateful, multi-agent application orchestrated by LangGraph. The system manages a document’s journey from initial upload to final scheduling through a series of specialized agents, pausing for critical human intervention when necessary.

---

## Team Name and Members
**Team Name:** ALT+F4  
**Members:** Prayas Chaware, Rishabh Parihar, Jay Gheewala, Punit Chaurasia, Laxman Rathod

---

## Hackathon Theme / Challenge Addressed
**Theme:** Productivity & The Future of Work  
This project showcases an autonomous system that reduces manual effort, minimizes errors, and accelerates contract approval, representing the future of automated professional services.

---

## What We Built

### Features
1. **User Authentication & Authorization** – Secure login using Descope.  
2. **User Registration via API** – New users can be registered with Descope’s management API.  
3. **Contract Upload** – Upload contract files through the interface.  
4. **Contract Verification Interface** – Verify, summarize, and give clause suggestions.  
5. **Approval Workflow** – Approve or reject contracts based on results.  
6. **Meeting Scheduling & Notifications** – Schedule meetings and send emails automatically.  

---

## How to Run

### Backend Application Setup

#### Prerequisites
- Python 3.8 or higher  
- pip (comes with Python)  

#### Steps
1. Clone the Repository  
   ```bash
   git clone https://github.com/rispar0529/De-Sign-.git
   ```  

2. Navigate to the Backend Directory  
   ```bash
   cd De-Sign-/backend
   ```  

3. Create and Activate Virtual Environment  
   - On Windows:  
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```  
   - On macOS/Linux:  
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```  

4. Install Dependencies  
   ```bash
   pip install -r requirements.txt
   ```  

5. Configure Environment Variables  
   Create a `.env` file in the backend directory and add:  
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

   > **Note:** Use a 16-character Gmail App Password for `EMAIL_PASS`, not your regular Google password.  

6. Start the Backend Server  
   ```bash
   python main.py
   ```  

By default, the server will run in development mode.  

---

### Frontend Application Setup

#### Prerequisites
- [Node.js](https://nodejs.org/) (Recommended version >= 14.x)  
- npm (comes with Node.js)  

#### Steps
1. Get out of Backend Directory
   ```bash
   cd ..
   ```  

2. Navigate to the Frontend Directory  
   ```bash
   cd De-Sign-/frontend
   ```  

3. Install Dependencies  
   ```bash
   npm install
   ```  

4. Start the Development Server  
   ```bash
   npm start
   ```  

The frontend will be available at: `http://localhost:3000`  

---

## Tech Stack Used
- **Agent & Workflow Orchestration:** LangGraph  
- **Generative AI:** Google Gemini 1.5 Flash (reasoning & analysis), Google text-embedding-004 (embeddings)  
- **Vector Database:** Pinecone (RAG knowledge base)  
- **Backend Server:** Flask  
- **Authentication & Authorization:** Descope API  
- **Document Processing:** PyPDF2, python-docx, Pytesseract (OCR)  
- **Email Notifications:** Gmail SMTP with App Password  
- **Frontend:** React.js  

---

## Demo Video Link
https://www.youtube.com/watch?v=gxOaIBGAUio

---

## What We’d Do With More Time
- **Contract Chatbot**  
  A conversational AI assistant that can answer user questions about contracts and guide them through the review process, making the system more interactive and user-friendly.  

- **Role-Based Access (Admin & User)**  
  Separate interfaces for admins (company members reviewing contracts) and users (clients uploading contracts).  
  - Users: Upload contracts and receive automated notifications.  
  - Admins: Review, validate, and act on contracts via a secure dashboard.  

- **Automated Company Workflow**  
  Contracts tied to specific companies, eliminating the need for manual email entry.  
  - If issues are found, the client company is automatically notified.  
  - If valid, the contract still requires **admin approval** before scheduling a meeting, ensuring human oversight.  

- **Company Dashboard & Prioritization**  
  A dashboard for admins showing all incoming requests from companies.  
  - Requests prioritized by company profile, with high-profile companies at the top.  
  - Admins can drill down into each company’s request for detailed analysis and action.  

- **Request Management Service**  
  A background service to intelligently organize and prioritize contract requests by company importance, ensuring high-value requests receive prompt attention.  
