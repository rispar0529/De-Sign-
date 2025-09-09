from flask import Flask, request, jsonify, g
from flask_cors import CORS
import os
from datetime import datetime
import uuid
from werkzeug.utils import secure_filename
from functools import wraps  # Add this import
import asyncio  # Add this import
from auth.login import LoginHandler
from flask_mail import Mail, Message  # 🆕 Add this
from agents.email_service import send_meeting_confirmation_email 



# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Fix imports
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Rest of your imports...
from auth.descope_auth import require_auth, DescopeAuth
from workflow import DocumentWorkflow, WorkflowState
# from agents.agent_b import AgentB

from agents.AgentB.verifier import (
    verify_contract_clauses,
    generate_clause_suggestion,
    generate_plain_english_summary,
    answer_contract_question,
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_image
)



# Initialize Flask app
app = Flask(__name__)

CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# CORS(app)

app.config.update({
    'MAIL_SERVER': 'smtp.gmail.com',
    'MAIL_PORT': 587,                    # Use 587 for TLS
    'MAIL_USE_TLS': True,               # Enable TLS
    'MAIL_USE_SSL': False,              # Disable SSL when using TLS
    'MAIL_USERNAME': os.getenv('EMAIL_USER'),
    'MAIL_PASSWORD': os.getenv('EMAIL_PASS'),
    'MAIL_DEFAULT_SENDER': os.getenv('EMAIL_USER'),
    'MAIL_DEBUG': True,                 # Enable debugging
    'MAIL_SUPPRESS_SEND': False,        # Allow actual sending
    'MAIL_FAIL_SILENTLY': False,        # Show errors
    'TESTING': False                    # Disable testing mode
})



app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

mail = Mail(app)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize components
workflow_manager = DocumentWorkflow()
# agent_b = AgentB()
auth_handler = DescopeAuth()

# In-memory storage (use database in production)
sessions = {}

# Async wrapper for Flask routes
# def async_route(f):
#     @wraps(f)
#     def wrapper(*args, **kwargs):
#         try:
#             # Check if there's a running event loop
#             loop = asyncio.get_event_loop()
#             if loop.is_running():
#                 # If there's a running loop, we need to handle it differently
#                 # For Flask with async support, just return the coroutine
#                 return asyncio.create_task(f(*args, **kwargs))
#             else:
#                 # No running loop, safe to use asyncio.run
#                 return asyncio.run(f(*args, **kwargs))
#         except RuntimeError:
#             # No event loop, create one
#             return asyncio.run(f(*args, **kwargs))
#     return wrapper

def sync_async(async_func):
    @wraps(async_func)
    def wrapper(*args, **kwargs):
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(async_func(*args, **kwargs))
            finally:
                loop.close()
        except Exception as e:
            print(f"Async execution error: {e}")
            raise
    return wrapper

def extract_text_from_uploaded_file(file_path: str, content_type: str) -> str:
    try:
        with open(file_path, 'rb') as file:
            file_bytes = file.read()
            
        if content_type == "application/pdf":
            return extract_text_from_pdf(file_bytes)
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return extract_text_from_docx(file_bytes)
        elif content_type in ["image/jpeg", "image/png"]:
            return extract_text_from_image(file_bytes)
        else:
            return ""
    except Exception as e:
        print(f"Error extracting text from file: {e}")
        return ""



def extract_text_from_uploaded_file(file_path: str, content_type: str) -> str:
    """Extract text from uploaded file"""
    try:
        with open(file_path, 'rb') as file:
            file_bytes = file.read()
            
        # Use the extraction functions from agents.AgentB.verifier.py
        if content_type == "application/pdf":
            from agents.AgentB.verifier import extract_text_from_pdf
            return extract_text_from_pdf(file_bytes)
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            from agents.AgentB.verifier import extract_text_from_docx
            return extract_text_from_docx(file_bytes)
        elif content_type in ["image/jpeg", "image/png"]:
            from agents.AgentB.verifier import extract_text_from_image
            return extract_text_from_image(file_bytes)
        else:
            return ""
    except Exception as e:
        print(f"Error extracting text from file: {e}")
        return ""


@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'Multi-Agent Document Processing API',
        'status': 'running',
        'version': '1.0',
        
    })

@app.route('/test-email', methods=['POST'])
def test_email():
    """Test email sending directly"""
    try:
        data = request.get_json() or {}
        test_email = data.get('email', 'rishabhparihar511@gmail.com')
        
        print(f"[TEST] Sending test email to: {test_email}")
        print(f"[TEST] SMTP Config - Server: {app.config['MAIL_SERVER']}, Port: {app.config['MAIL_PORT']}")
        print(f"[TEST] Username: {app.config['MAIL_USERNAME']}")
        
        msg = Message(
            subject="Test Email from Flask",
            recipients=[test_email],
            body="This is a simple test email to verify SMTP configuration works!"
        )
        
        mail.send(msg)
        print(f"✅ [TEST] Email sent successfully to {test_email}")
        return jsonify({'success': True, 'message': f'Test email sent to {test_email}'}), 200
        
    except Exception as e:
        print(f"❌ [TEST] Email sending failed: {str(e)}")
        print(f"❌ [TEST] Error type: {type(e).__name__}")
        return jsonify({'success': False, 'error': str(e)}), 500


login_handler = LoginHandler()

@app.route('/auth/login', methods=['POST'])
def login():
    """Login endpoint - authenticate user with Descope"""
    try:
        # Check content type
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
            
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'JSON body is required'}), 400
            
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        print(f"Login attempt for email: {email}")
        
        # Authenticate with Descope
        try:
            auth_result = login_handler.authenticate_user(email, password)
        except Exception as e:
            print(f"Login handler error: {e}")
            return jsonify({'error': 'Authentication service unavailable'}), 500
        
        if auth_result['success']:
            print(f"Login successful for: {email}")
            return jsonify({
                'success': True,
                'token': auth_result['token'],
                'refresh_token': auth_result.get('refresh_token'),
                'user': auth_result['user']
            }), 200
        else:
            print(f"Login failed for: {email} - {auth_result['error']}")
            return jsonify({'error': auth_result['error']}), 401
            
    except Exception as e:
        print(f"Login route error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# Fixed profile route
@app.route('/auth/profile', methods=['GET'])
def get_profile():
    """Get user profile - updated to use login handler validation"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        print(f"Profile request with token: {token[:20]}...")
        
        # Validate session using login handler
        try:
            validation_result = login_handler.validate_session(token)
        except Exception as e:
            print(f"Profile validation error: {e}")
            return jsonify({'error': 'Token validation failed'}), 500
        
        if validation_result['success']:
            return jsonify({
                'user': validation_result['user'],
                'permissions': auth_handler.permissions,
                'message': 'Authentication successful'
            }), 200
        else:
            return jsonify({'error': validation_result['error']}), 401
            
    except Exception as e:
        print(f"Profile route error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500


@app.route('/upload', methods=['POST'])
@require_auth()
@sync_async  # Add this decorator since we'll use async
async def upload_and_start_workflow():
    """Combined: Handle file upload, risk assessment, and start workflow"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Create uploads directory if it doesn't exist
        upload_dir = app.config['UPLOAD_FOLDER']
        os.makedirs(upload_dir, exist_ok=True)

        # Save file
        filename = secure_filename(file.filename)
        session_id = str(uuid.uuid4())
        file_path = os.path.join(upload_dir, f"{session_id}_{filename}")
        file.save(file_path)

        print(f"File saved to: {file_path}")
        content_type = file.content_type or "application/octet-stream"

        # ✅ NEW: AI-Powered Risk Assessment using your verifier
        with open(file_path, 'rb') as f:
            file_bytes = f.read()

        # Call your existing verifier function
        analysis_result = await verify_contract_clauses(
            file_bytes=file_bytes,
            content_type=content_type,
            api_key=GOOGLE_API_KEY
        )

        if "error" in analysis_result:
            os.remove(file_path)  # Clean up
            return jsonify({'error': analysis_result["error"]}), 400

        # ✅ Extract risk levels from analysis
        risk_levels = [clause.get('risk_level', 'Low') for clause in analysis_result.get('analysis', [])]

        # ✅ Map risk levels to numeric values and find maximum
        def risk_value(level):
            mapping = {'Low': 1, 'Medium': 2, 'High': 3}
            return mapping.get(level, 0)

        if risk_levels:
            max_risk_level = max(risk_levels, key=risk_value)
        else:
            max_risk_level = 'Low'  # Default if no analysis

        # ✅ Create comprehensive risk assessment
        risk_assessment = {
            'risk_level': max_risk_level,
            'analyzed_at': datetime.now().isoformat(),
            'total_clauses_analyzed': len(analysis_result.get('analysis', [])),
            'high_risk_clauses': len([r for r in risk_levels if r == 'High']),
            'medium_risk_clauses': len([r for r in risk_levels if r == 'Medium']),
            'low_risk_clauses': len([r for r in risk_levels if r == 'Low']),
            'details': analysis_result,  # Include full analysis
            'assessor': 'AI Contract Analyzer'
        }

        print(f"[DEBUG] Risk assessment created: {risk_assessment['risk_level']}")

        # Create initial workflow state WITH risk assessment
        initial_state = WorkflowState(
            session_id=session_id,
            user_id=g.current_user['user_id'],
            file_path=file_path,
            filename=filename,
            risk_assessment=risk_assessment,  # ✅ NOW INCLUDED!
            notification_email='',  # 🆕 Initialize empty
            user_approved=False,
            meeting_date='',
            signing_result={},
            scheduling_result={},
            workflow_complete=False,
            final_status='',
            error='',
            waiting_for_input=True,
            input_type='',
            human_input=None,
            next_node=''
        )

        print(f"Starting workflow for session: {session_id}")

        # Start the workflow immediately
        workflow_result = workflow_manager.start_workflow(initial_state)

        # Store session data with risk assessment and workflow state
        sessions[session_id] = {
            'user_id': g.current_user['user_id'],
            'user_email': g.current_user['email'],
            'file_path': file_path,
            'filename': filename,
            'content-type': content_type,
            'risk_assessment': risk_assessment,  # ✅ Store it
            'workflow_state': workflow_result,
            'created_at': datetime.now().isoformat(),
            'status': 'workflow_started'
        }

        print(f"Session created and workflow started: {session_id}")

        return jsonify({
            'session_id': session_id,
            'risk_assessment': risk_assessment,  # ✅ Return to frontend
            'content-type': content_type,
            'workflow_started': True,
            'waiting_for_input': workflow_result.get('waiting_for_input', False),
            'input_type': workflow_result.get('input_type', ''),
            'status': 'analysis_complete_workflow_started',
            'user': g.current_user['email'],
            'message': 'File analyzed and workflow started. Please review the risk assessment and approve or reject.'
        })

    except Exception as e:
        print(f"Upload and workflow start error: {str(e)}")
        if 'file_path' in locals():
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({'error': str(e)}), 500

@app.route('/contract-verify', methods=['GET'])
@require_auth()
@sync_async
async def contract_verify():
    """GET - Analyze contract clauses (session_id as query param)"""
    try:
        session_id = request.args.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'session_id query parameter is required'}), 400

        if session_id not in sessions:
            return jsonify({'error': 'Invalid session ID'}), 400

        session_data = sessions[session_id]
        
        # Check authorization
        if session_data['user_id'] != g.current_user['user_id']:
            return jsonify({'error': 'Unauthorized access to session'}), 403

        # Check if analysis already exists (cached)
        if 'contract_analysis' in session_data:
            return jsonify({
                'session_id': session_id,
                'analysis': session_data['contract_analysis'],
                'status': 'cached_result',
                'message': 'Contract analysis retrieved from cache'
            })

        # Get API key from header for fresh analysis
        # gemini_api_key = request.headers.get('X-API-Key')
        # if not gemini_api_key:
        #     return jsonify({'error': 'Gemini API key required in X-API-Key header'}), 400

        # Perform fresh analysis
        file_path = session_data['file_path']
        # content_type = session_data['content_type']
        content_type = sessions[session_id].get('content-type')

        
        with open(file_path, 'rb') as file:
            file_bytes = file.read()

        verification_result = await verify_contract_clauses(
            file_bytes=file_bytes,
            content_type=content_type,
            api_key=GOOGLE_API_KEY
        )

        if "error" in verification_result:
            return jsonify({'error': verification_result["error"]}), 400

        # Cache the result
        sessions[session_id]['contract_analysis'] = verification_result

        return jsonify({
            'session_id': session_id,
            'analysis': verification_result.get('analysis', []),
            'status': 'fresh_analysis',
            'message': 'Contract analysis completed and cached'
        })

    except Exception as e:
        print(f"Contract verification error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/contract-summarize', methods=['GET'])
@require_auth()
@sync_async
async def contract_summarize():
    """GET - Generate contract summary (session_id as query param)"""
    try:
        session_id = request.args.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'session_id query parameter is required'}), 400

        if session_id not in sessions:
            return jsonify({'error': 'Invalid session ID'}), 400

        session_data = sessions[session_id]
        
        # Check authorization
        if session_data['user_id'] != g.current_user['user_id']:
            return jsonify({'error': 'Unauthorized access to session'}), 403

        # Check if summary already exists (cached)
        if 'contract_summary' in session_data:
            return jsonify({
                'session_id': session_id,
                'summary': session_data['contract_summary'],
                'status': 'cached_result',
                'message': 'Contract summary retrieved from cache'
            })

        # Get API key for fresh summary
        # gemini_api_key = request.headers.get('X-API-Key')
        # if not gemini_api_key:
        #     return jsonify({'error': 'Gemini API key required in X-API-Key header'}), 400

        # Extract text and generate summary
        file_path = session_data['file_path']
        content_type = sessions[session_id].get('content-type')
        
        contract_text = extract_text_from_uploaded_file(file_path, content_type)
        if not contract_text:
            return jsonify({'error': 'Could not extract text from file'}), 400

        summary = await generate_plain_english_summary(contract_text, GOOGLE_API_KEY)

        # Cache the result
        sessions[session_id]['contract_summary'] = summary

        return jsonify({
            'session_id': session_id,
            'summary': summary,
            'status': 'fresh_summary',
            'message': 'Contract summary generated and cached'
        })

    except Exception as e:
        print(f"Contract summarization error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/contract-suggest-clause', methods=['POST'])
@require_auth()
@sync_async
async def contract_suggest_clause():
    """POST - Get clause suggestions (data in JSON body)"""
    try:
        # Get JSON data from request body
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'JSON body is required'}), 400
            
        session_id = data.get('session_id')
        clause_name = data.get('clause_name')
        risky_text = data.get('risky_text', '')
        
        if not session_id:
            return jsonify({'error': 'session_id is required in JSON body'}), 400
        
        if not clause_name:
            return jsonify({'error': 'clause_name is required in JSON body'}), 400

        if session_id not in sessions:
            return jsonify({'error': 'Invalid session ID'}), 400

        session_data = sessions[session_id]
        
        # Check authorization
        if session_data['user_id'] != g.current_user['user_id']:
            return jsonify({'error': 'Unauthorized access to session'}), 403

        # Generate suggestion
        suggestion = await generate_clause_suggestion(
            clause_name=clause_name,
            api_key=GOOGLE_API_KEY,
            risky_text=risky_text
        )

        return jsonify({
            'session_id': session_id,
            'clause_name': clause_name,
            'suggestion': suggestion,
            'risky_text': risky_text,
            'status': 'suggestion_generated',
            'message': f'Clause suggestion for "{clause_name}" generated'
        })

    except Exception as e:
        print(f"Clause suggestion error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# @app.route('/start-workflow', methods=['POST'])
# @require_auth(permission='upload_file')
# def start_workflow():
#     """Step 2: Start workflow after risk assessment"""
#     try:
#         data = request.get_json()
#         session_id = data.get('session_id')
        
#         if not session_id:
#             return jsonify({'error': 'Session ID is required'}), 400
        
#         if session_id not in sessions:
#             return jsonify({'error': 'Invalid session ID'}), 400
        
#         session_data = sessions[session_id]
        
#         # Check if user owns this session
#         if session_data['user_id'] != g.current_user['user_id']:
#             return jsonify({'error': 'Unauthorized access to session'}), 403
        
#         # Create initial workflow state
#         initial_state = WorkflowState(
#             session_id=session_id,
#             user_id=g.current_user['user_id'],
#             file_path=session_data.get('file_path', ''),
#             filename=session_data.get('filename', ''),
#             risk_assessment=session_data.get('risk_assessment', {}),
#             user_approved=False,
#             meeting_date='',
#             signing_result={},
#             scheduling_result={},
#             workflow_complete=False,
#             final_status='',
#             error='',
#             waiting_for_input=True,
#             input_type='',
#             human_input=None,
#             next_node=''
#         )
        
#         print(f"Starting workflow for session: {session_id}")
        
#         # Start the workflow
#         result = workflow_manager.start_workflow(initial_state)
        
#         # Update session
#         sessions[session_id]['workflow_state'] = result
#         sessions[session_id]['status'] = 'workflow_started'
        
#         print(f"Workflow started, waiting for: {result.get('input_type', 'unknown')}")
        
#         return jsonify({
#             'session_id': session_id,
#             'workflow_started': True,
#             'waiting_for_input': result.get('waiting_for_input', False),
#             'input_type': result.get('input_type', ''),
#             'risk_assessment': session_data.get('risk_assessment', {}),
#             'message': 'Workflow started. Please review the risk assessment and approve or reject.'
#         })
        
#     except Exception as e:
#         print(f"Start workflow error: {str(e)}")
#         return jsonify({'error': str(e)}), 500

@app.route('/provide-input', methods=['POST'])
@require_auth()
def provide_input():
    """Step 3: Provide human input to continue workflow"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        input_data = data.get('input_data')

        print(f"[DEBUG] Available sessions: {list(sessions.keys())}")
        print(f"[DEBUG] Requested session: {session_id}")

        if not session_id or not input_data:
            return jsonify({'error': 'Session ID and input data are required'}), 400

        if session_id not in sessions:
            print(f"[ERROR] Session {session_id} not found in sessions")
            return jsonify({'error': 'Invalid session ID'}), 400

        # Get current workflow state
        current_state = workflow_manager.get_workflow_state(session_id)
        
        if not current_state:
            print(f"[ERROR] No workflow state found for session: {session_id}")
            if session_id in sessions:
                print("[DEBUG] Session exists in sessions but no LangGraph state")
                return jsonify({'error': 'Workflow was not started properly. Please restart the workflow.'}), 400
            else:
                return jsonify({'error': 'No active workflow found'}), 400

        # Validate input based on expected type
        input_type = current_state.get('input_type')
        print(f"Providing input for session: {session_id}, type: {input_type}, data: {input_data}")

        if input_type == 'approval':
            if 'approved' not in input_data:
                return jsonify({'error': 'Approval decision required'}), 400
        elif input_type == 'meeting_date':
            if 'meeting_date' not in input_data or not input_data['meeting_date']:
                return jsonify({'error': 'Meeting date required'}), 400

        # Continue workflow with input
        result = workflow_manager.continue_workflow(session_id, input_data)

        # Update session
        sessions[session_id]['workflow_state'] = result

        # DEBUG: Add this line to see what the workflow returns
        print(f"[DEBUG] Workflow result: {result}")

        # ✅ NEW: Handle LangGraph interrupts properly
        if '__interrupt__' in result and result['__interrupt__']:
            interrupt_info = result['__interrupt__'][0] if result['__interrupt__'] else None
            if interrupt_info and 'meeting date' in str(interrupt_info.value).lower():
                # Override the state to show we're waiting for meeting date
                result['waiting_for_input'] = True
                result['input_type'] = 'meeting_date'
                print("[DEBUG] ✅ Detected meeting date interrupt, updating state")

        # Prepare response based on workflow state
        response = {
            'session_id': session_id,
            'workflow_complete': result.get('workflow_complete', False),
            'waiting_for_input': result.get('waiting_for_input', False),
            'input_type': result.get('input_type', ''),
            'final_status': result.get('final_status', ''),
        }

        # Add specific results if available
        if result.get('signing_result'):
            response['signing_result'] = result['signing_result']

        if result.get('scheduling_result'):
            response['scheduling_result'] = result['scheduling_result']

        if result.get('error'):
            response['error'] = result['error']

        # Add appropriate message
        if result.get('workflow_complete'):
            if result.get('final_status') == 'SUCCESS':
                response['message'] = 'Workflow completed successfully!'
                response['final_response'] = 'YES'
                sessions[session_id]['status'] = 'completed_success'
            else:
                response['message'] = 'Workflow completed with errors.'
                response['final_response'] = 'NO'
                sessions[session_id]['status'] = 'completed_failed'
        elif result.get('waiting_for_input'):
            if result.get('input_type') == 'meeting_date':
                response['message'] = 'Please provide a meeting date to continue.'
                sessions[session_id]['status'] = 'waiting_meeting_date'
            else:
                response['message'] = f'Waiting for {result.get("input_type", "input")}.'
        else:
            response['message'] = 'Processing workflow...'

        # IMPORTANT: Add this debug line
        print(f"[DEBUG] ✅ Final response being sent: {response}")

        return jsonify(response)

    except Exception as e:
        print(f"Provide input error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/workflow-status/<session_id>', methods=['GET'])
@require_auth(permission='view_status')
def get_workflow_status(session_id):
    """Get current workflow status"""
    try:
        if session_id not in sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = sessions[session_id]
        
        # Check authorization
        if (session_data['user_id'] != g.current_user['user_id'] and 
            'admin' not in g.current_user.get('roles', [])):
            return jsonify({'error': 'Unauthorized access to session'}), 403
        
        # Get current workflow state
        workflow_state = workflow_manager.get_workflow_state(session_id)
        
        return jsonify({
            'session_id': session_id,
            'workflow_state': workflow_state,
            'session_data': {
                'status': session_data.get('status', 'unknown'),
                'created_at': session_data.get('created_at'),
                'user_email': session_data.get('user_email'),
                'filename': session_data.get('filename'),
                'risk_level': session_data.get('risk_assessment', {}).get('risk_level', 'unknown')
            }
        })
        
    except Exception as e:
        print(f"Get status error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/sessions', methods=['GET'])
@require_auth()
def list_sessions():
    """List all sessions for current user (for debugging)"""
    user_sessions = {}
    for session_id, session_data in sessions.items():
        if session_data['user_id'] == g.current_user['user_id']:
            user_sessions[session_id] = {
                'status': session_data.get('status', 'unknown'),
                'created_at': session_data.get('created_at'),
                'filename': session_data.get('filename'),
                'risk_level': session_data.get('risk_assessment', {}).get('risk_level', 'unknown')
            }
    
    return jsonify({
        'user_id': g.current_user['user_id'],
        'sessions': user_sessions,
        'total_sessions': len(user_sessions)
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Multi-Agent Document Processing Server...")
    print("Available endpoints:")
    print("  GET  / - Health check")
    print("  GET  /auth/profile - Get user profile")
    print("  POST /upload - Upload file for analysis")
    print("  POST /start-workflow - Start workflow")
    print("  POST /provide-input - Provide human input")
    print("  GET  /workflow-status/<session_id> - Get workflow status")
    print("  GET  /sessions - List user sessions")
    print("\nServer running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
