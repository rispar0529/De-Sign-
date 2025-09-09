import os
from flask_mail import Message
from flask import current_app


def send_meeting_confirmation_email(self, to_email, meeting_datetime, meeting_id, confirmation_code, state):
    """Send email notification - FIXED VERSION"""
    try:
        print(f"[{self.agent_name}] Attempting to send email to: {to_email}")
        
        # Import Flask mail from the current app
        from flask import current_app
        from flask_mail import Message
        
        # Get mail instance - NO app_context() wrapper needed
        from main import mail
        
        # Prepare email content
        subject = "🗓️ Meeting Scheduled - Contract Processing Complete"
        body = f"""
Dear User,

✅ Your contract processing workflow has been completed successfully!

📄 CONTRACT DETAILS:
• File: {state.get('filename', 'Contract Document')}
• Status: Approved and Signed

📅 MEETING SCHEDULED:
• Date & Time: {meeting_datetime.strftime("%Y-%m-%d at %H:%M UTC")}
• Meeting ID: {meeting_id}
• Confirmation Code: {confirmation_code}

🔗 Meeting Link: https://calendar.example.com/meeting/{meeting_id}

Best regards,
Contract Processing Team
        """
        
        # Create and send message
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=body
        )
        
        mail.send(msg)
        print(f"✅ [{self.agent_name}] Email sent successfully to: {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ [{self.agent_name}] Failed to send email to {to_email}: {str(e)}")
        print(f"❌ [{self.agent_name}] Error type: {type(e).__name__}")
        return False
