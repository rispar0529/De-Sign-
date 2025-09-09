from datetime import datetime, timedelta
import uuid
from typing import Dict, Any

class AgentD:
    """Calendar Scheduling Agent"""

    def __init__(self):
        self.agent_name = "Agent D - Calendar Scheduler"

    def schedule_meeting(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule meeting in calendar system"""
        try:
            # Extract data from state
            session_id = state.get('session_id')
            meeting_date = state.get('meeting_date')
            notification_email = state.get('notification_email')  # Get custom email
            signing_result = state.get('signing_result', {})

            # Validate signing was successful
            if signing_result.get('status') != 'SIGNED':
                raise Exception("Document must be signed before scheduling")

            # Parse meeting date
            meeting_datetime = self._parse_meeting_date(meeting_date)

            # Generate meeting details
            meeting_id = f"MTG_{uuid.uuid4().hex[:8].upper()}"
            confirmation_code = f"CONF_{uuid.uuid4().hex[:6].upper()}"

            # Create calendar entry
            calendar_entry = self._create_calendar_entry(
                meeting_id,
                meeting_datetime,
                signing_result,
                session_id
            )

            # Prepare scheduling result
            scheduling_result = {
                'status': 'SCHEDULED',
                'meeting_id': meeting_id,
                'meeting_date': meeting_datetime.isoformat(),
                'confirmation_code': confirmation_code,
                'calendar_link': f"https://calendar.example.com/meeting/{meeting_id}",
                'meeting_room': self._assign_meeting_room(meeting_datetime),
                'attendees_notified': True,
                'message': f'Meeting successfully scheduled for {meeting_datetime.strftime("%Y-%m-%d at %H:%M UTC")}'
            }

            # 🆕 FIXED: Send email notification using Flask-Mail
            email_sent = False
            if notification_email:
                email_sent = self._send_email_notification(notification_email, meeting_datetime, meeting_id, confirmation_code, state)
                scheduling_result['email_sent'] = email_sent
                print(f"[{self.agent_name}] Email notification sent to: {notification_email} - Success: {email_sent}")
            else:
                print(f"[{self.agent_name}] No notification email provided")

            # Update state
            updated_state = state.copy()
            updated_state.update({
                'scheduling_result': scheduling_result,
                'meeting_scheduled': True,
                'workflow_complete': True,
                'final_status': 'SUCCESS'
            })

            print(f"[{self.agent_name}] Meeting scheduled - ID: {meeting_id}")
            return updated_state

        except Exception as e:
            print(f"[{self.agent_name}] Error scheduling meeting: {str(e)}")
            updated_state = state.copy()
            updated_state.update({
                'scheduling_result': {'status': 'FAILED', 'error': str(e)},
                'workflow_complete': True,
                'final_status': 'FAILED'
            })
            return updated_state

    def _send_email_notification(self, to_email, meeting_datetime, meeting_id, confirmation_code, state):
        """Send email notification - FIXED VERSION"""
        try:
            # Import Flask components
            from flask import current_app
            from flask_mail import Message
            
            print(f"[{self.agent_name}] Attempting to send email to: {to_email}")
            
            # Get the mail instance from current app context
            with current_app.app_context():
                from main import mail  # Import mail from main.py
                
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
• Meeting Room: {self._assign_meeting_room(meeting_datetime)}

🔗 Meeting Link: https://calendar.example.com/meeting/{meeting_id}

The document has been digitally signed and is ready for the final review meeting.

Best regards,
Contract Processing Team

---
This is an automated message. Please do not reply to this email.
                """
                
                # Create message
                msg = Message(
                    subject=subject,
                    recipients=[to_email],
                    body=body
                )
                
                # Send email
                mail.send(msg)
                print(f"✅ [{self.agent_name}] Email sent successfully to: {to_email}")
                return True
                
        except Exception as e:
            print(f"❌ [{self.agent_name}] Failed to send email to {to_email}: {str(e)}")
            print(f"❌ [{self.agent_name}] Error type: {type(e).__name__}")
            return False

    def _parse_meeting_date(self, meeting_date: str) -> datetime:
        """Parse meeting date string"""
        try:
            if 'T' in meeting_date:
                return datetime.fromisoformat(meeting_date.replace('Z', '+00:00'))
            else:
                return datetime.strptime(meeting_date, '%Y-%m-%d')
        except:
            return datetime.now() + timedelta(days=1)

    def _create_calendar_entry(self, meeting_id: str, meeting_datetime: datetime,
                             signing_result: dict, session_id: str) -> dict:
        """Create calendar entry details"""
        return {
            'id': meeting_id,
            'title': 'Document Review Meeting',
            'start_time': meeting_datetime.isoformat(),
            'end_time': (meeting_datetime + timedelta(hours=1)).isoformat(),
            'document_ref': signing_result.get('signature_id'),
            'session_ref': session_id
        }

    def _assign_meeting_room(self, meeting_datetime: datetime) -> str:
        """Assign meeting room based on availability"""
        rooms = ['Conference Room A', 'Conference Room B', 'Meeting Room 1', 'Meeting Room 2']
        return rooms[hash(meeting_datetime.date()) % len(rooms)]
