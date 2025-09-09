from descope import DescopeClient, AuthException
import os
from dotenv import load_dotenv

load_dotenv()

class LoginHandler:
    def __init__(self):
        self.project_id = os.getenv('DESCOPE_PROJECT_ID')
        if not self.project_id:
            raise ValueError("DESCOPE_PROJECT_ID not found in environment variables")
        
        try:
            self.descope_client = DescopeClient(project_id=self.project_id)
            print(f"Login handler initialized successfully with project: {self.project_id[:10]}...")
        except Exception as e:
            raise ValueError(f"Failed to initialize Descope client: {e}")
    
    # Replace your authenticate_user method in login.py with this:

    def authenticate_user(self, login_id: str, password: str):
        """Authenticate user with Descope and return user info + token"""
        try:
            print(f"Attempting to authenticate user: {login_id}")
            
            # Sign in with Descope
            resp = self.descope_client.password.sign_in(
                login_id=login_id,
                password=password
            )
            
            print(f"Authentication successful for user: {login_id}")
            
            # CORRECT: Extract the JWT string from the nested structure
            session_token_obj = resp.get('sessionToken', {})
            session_jwt = session_token_obj.get('jwt')
            
            refresh_token_obj = resp.get('refreshSessionToken', {})
            refresh_jwt = refresh_token_obj.get('jwt')
            
            if not session_jwt:
                print(f"ERROR: No JWT found in sessionToken!")
                return {'success': False, 'error': 'No JWT token in response'}
            
            # Extract user information
            user_data = resp.get('user', {})
            user_info = {
                'user_id': user_data.get('userId', 'unknown'),
                'email': user_data.get('email', login_id),
                'name': user_data.get('name', ''),
                'roles': user_data.get('roleNames', []),
                'permissions': resp.get('permissions', [])
            }
            
            print(f"Extracted JWT (first 20 chars): {session_jwt[:20]}...")
            print(f"JWT segments: {len(session_jwt.split('.'))}")
            
            return {
                'success': True,
                'token': session_jwt,  # This is now the actual JWT string
                'refresh_token': refresh_jwt,
                'user': user_info
            }
            
        except AuthException as e:
            print(f"Descope authentication failed: {e}")
            return {'success': False, 'error': 'Invalid credentials'}
        except Exception as e:
            print(f"Unexpected login error: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return {'success': False, 'error': f'Login failed: {str(e)}'}


    
    def validate_session(self, token: str):
        """Validate session token with Descope"""
        try:
            print(f"Validating session token: {token[:20]}...")
            
            # Make sure we're passing the JWT string correctly
            jwt_response = self.descope_client.validate_session(session_token=token)
            
            user_info = {
                'user_id': jwt_response.get('sub'),
                'email': jwt_response.get('email'),
                'name': jwt_response.get('name', ''),
                'roles': jwt_response.get('roles', []),  # Note: might be 'roleNames' 
                'permissions': jwt_response.get('permissions', [])
            }
            
            print(f"Session validation successful for user: {user_info['email']}")
            return {'success': True, 'user': user_info}
            
        except AuthException as e:
            print(f"Token validation failed: {e}")
            return {'success': False, 'error': 'Invalid or expired token'}
        except Exception as e:
            print(f"Validation error: {e}")
            return {'success': False, 'error': f'Token validation failed: {str(e)}'}

