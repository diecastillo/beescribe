import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587")) if os.getenv("SMTP_PORT") else 587
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_from = os.getenv("SMTP_FROM", self.smtp_user)
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    def send_share_notification(self, dest_email: str, meeting_title: str, sender_name: str, meeting_id: int):
        """
        Envía un correo electrónico notificando que se ha compartido una reunión.
        Si no hay SMTP configurado, loggea el contenido por consola como fallback.
        """
        subject = f"{sender_name} ha compartido una reunión contigo en Bee-Scribe"
        link = f"{self.frontend_url}/results/{meeting_id}"
        
        if not self.smtp_host or not self.smtp_user or not self.smtp_password:
            print(f"⚠️ [Email Mock] Notificación para {dest_email}:")
            print(f"   Asunto: {subject}")
            print(f"   Mensaje: {sender_name} compartió '{meeting_title}'. Ver en: {link}")
            return True

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; color: #111827; font-size: 24px;">Bee-Scribe</h1>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <h2 style="margin-top: 0; color: #111827;">¡Hola!</h2>
                        <p style="font-size: 16px;"><strong>{sender_name}</strong> ha compartido una reunión contigo: <span style="color: #d97706; font-weight: bold;">{meeting_title}</span>.</p>
                        <p style="font-size: 14px; color: #4b5563;">Ahora puedes acceder a la transcripción completa, el resumen generado por IA y el mapa mental interactivo.</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="{link}" style="background-color: #fbbf24; color: #111827; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Ver Reunión en Bee-Scribe</a>
                        </div>
                        
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Nota: Deberás iniciar sesión con tu cuenta para acceder al contenido.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 11px; color: #9ca3af;">Bee-Scribe - Extrae la miel de tus reuniones</p>
                    </div>
                </div>
            </body>
        </html>
        """

        msg = MIMEMultipart()
        msg['From'] = self.smtp_from
        msg['To'] = dest_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        try:
            # Detectar si es SSL (465) o STARTTLS (587)
            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            
            print(f"✅ Email de notificación enviado a {dest_email}")
            return True
        except Exception as e:
            print(f"❌ Error crítico enviando email a {dest_email}: {e}")
            return False

email_service = EmailService()
