from descope import DescopeClient

# Initialize Descope client with your project ID
descope_client = DescopeClient(project_id="P31h8HXVFEQBpb7JQO4p5zFT2ju3")

login_id = "john.doe@example.com"
password = "SecurePassword123!"
audience = None  # Optional, or provide your audience if needed

try:
    resp = descope_client.password.sign_in(
        login_id=login_id,
        password=password,
        audience=audience
    )
    print("Successfully signed in!")
    print(resp)
except Exception as error:
    print("Failed to sign in:", error)
