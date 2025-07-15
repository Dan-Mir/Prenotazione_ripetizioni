from flask import Flask, request, jsonify
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from flask_cors import CORS
from datetime import datetime, timedelta
import smtplib
import os
from dotenv import load_dotenv
from email.message import EmailMessage

app = Flask(__name__)
CORS(app)

load_dotenv()  # Carica le variabili dal file .env

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

CREDENTIALS_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_google_service():
    creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    return build('calendar', 'v3', credentials=creds)

def get_available_slots(date_str):
    service = get_google_service()

    day_start = datetime.strptime(date_str, '%Y-%m-%d')
    day_end = day_start + timedelta(days=1)

    events_result = service.events().list(
        calendarId='primary',
        timeMin=day_start.isoformat() + 'Z',
        timeMax=day_end.isoformat() + 'Z',
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    events = events_result.get('items', [])

    all_slots = [f"{h:02}:{m:02}" for h in range(9, 20) for m in (0, 30)]
    booked_intervals = []

    for event in events:
        start = event['start'].get('dateTime')
        end = event['end'].get('dateTime')
        if start and end:
            booked_intervals.append((start[11:16], end[11:16]))

    available = []
    for slot in all_slots:
        slot_start = datetime.strptime(slot, '%H:%M')
        slot_end = slot_start + timedelta(minutes=30)
        overlaps = any(
            slot_start < datetime.strptime(end, '%H:%M') and
            slot_end > datetime.strptime(start, '%H:%M')
            for start, end in booked_intervals
        )
        if not overlaps:
            available.append(slot)
    return available

@app.route('/available-slots', methods=['GET'])
def available_slots():
    date = request.args.get('date')
    if not date:
        return jsonify({"error": "Nessuna data specificata"}), 400
    slots = get_available_slots(date)
    return jsonify({"date": date, "available_slots": slots})

@app.route('/book-lesson', methods=['POST'])
def book_lesson():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    date = data.get("date")
    time = data.get("time")
    duration = int(data.get("duration", 30))

    if not all([name, email, phone, date, time]):
        return jsonify({"error": "Dati mancanti"}), 400

    start_datetime = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    end_datetime = start_datetime + timedelta(minutes=duration)

    event = {
        'summary': f'Lezione con {name}',
        'description': f'Telefono: {phone}\\nEmail: {email}',
        'start': {'dateTime': start_datetime.isoformat(), 'timeZone': 'Europe/Rome'},
        'end': {'dateTime': end_datetime.isoformat(), 'timeZone': 'Europe/Rome'},
    }

    service = get_google_service()
    created_event = service.events().insert(calendarId='primary', body=event).execute()

    subject_admin = f"Prenotazione lezione: {name}"
    body_admin = f"""
Hai ricevuto una nuova prenotazione:

Nome: {name}
Email: {email}
Telefono: {phone}
Data: {date}
Ora: {time}
Durata: {duration} minuti
"""

    subject_student = "Conferma prenotazione lezione"
    body_student = f"""
Ciao {name},

La tua lezione è stata prenotata con successo!

Data: {date}
Ora: {time}
Durata: {duration} minuti

Contatti insegnante:
Email: {EMAIL_ADDRESS}

A presto!
"""

    def send_email(to, subject, body):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to
        msg.set_content(body)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

    try:
        send_email(EMAIL_ADDRESS, subject_admin, body_admin)
        send_email(email, subject_student, body_student)
    except Exception as e:
        print("Errore invio email:", e)
        return jsonify({"error": "Prenotazione registrata, ma email fallita."}), 500

    return jsonify({"message": "Prenotazione avvenuta con successo!"})

if __name__ == '__main__':
    app.run(port=5000)

