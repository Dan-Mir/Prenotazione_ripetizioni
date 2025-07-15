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

# ID del calendario dedicato alle lezioni private
# Dovrai sostituire questo con l'ID del tuo calendario specifico
LESSONS_CALENDAR_ID = os.getenv("LESSONS_CALENDAR_ID", "primary")

CREDENTIALS_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_google_service():
    creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    return build('calendar', 'v3', credentials=creds)


def get_all_calendars():
    """Recupera tutti i calendari dell'utente"""
    service = get_google_service()
    calendar_list = service.calendarList().list().execute()
    return calendar_list.get('items', [])


def get_available_slots(date_str):
    service = get_google_service()

    day_start = datetime.strptime(date_str, '%Y-%m-%d')
    day_end = day_start + timedelta(days=1)

    # Recupera tutti i calendari
    calendars = get_all_calendars()
    all_events = []

    # Recupera gli eventi da tutti i calendari
    for calendar in calendars:
        calendar_id = calendar['id']
        try:
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=day_start.isoformat() + 'Z',
                timeMax=day_end.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = events_result.get('items', [])
            # Aggiungi il nome del calendario a ogni evento per debug
            for event in events:
                event['calendar_name'] = calendar.get('summary', calendar_id)

            all_events.extend(events)
        except Exception as e:
            print(f"Errore nel recuperare eventi dal calendario {calendar.get('summary', calendar_id)}: {e}")
            continue

    # Genera tutti gli slot possibili (9:00 - 20:00, ogni 30 minuti)
    all_slots = [f"{h:02}:{m:02}" for h in range(9, 20) for m in (0, 30)]
    booked_intervals = []

    # Estrai gli intervalli occupati da tutti gli eventi
    for event in all_events:
        start = event['start'].get('dateTime')
        end = event['end'].get('dateTime')
        if start and end:
            # Converte da ISO format a solo orario
            start_time = start[11:16]
            end_time = end[11:16]
            booked_intervals.append((start_time, end_time))

    # Determina gli slot disponibili
    available = []
    for slot in all_slots:
        slot_start = datetime.strptime(slot, '%H:%M')
        slot_end = slot_start + timedelta(minutes=30)

        # Controlla se lo slot si sovrappone con qualche evento
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


@app.route('/calendars', methods=['GET'])
def list_calendars():
    """Endpoint per vedere tutti i calendari disponibili (utile per debug)"""
    try:
        calendars = get_all_calendars()
        calendar_info = []
        for cal in calendars:
            calendar_info.append({
                'id': cal['id'],
                'name': cal.get('summary', 'Senza nome'),
                'primary': cal.get('primary', False)
            })
        return jsonify({"calendars": calendar_info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

    try:
        print("LESSONS_CALENDAR_ID:", LESSONS_CALENDAR_ID)
        # Crea l'evento nel calendario dedicato alle lezioni
        created_event = service.events().insert(
            calendarId=LESSONS_CALENDAR_ID,
            body=event
        ).execute()

        print(f"Evento creato nel calendario: {LESSONS_CALENDAR_ID}")
        print(f"ID evento: {created_event.get('id')}")

    except Exception as e:
        print(f"Errore nella creazione dell'evento: {e}")
        return jsonify({"error": "Errore nella creazione dell'evento nel calendario"}), 500

    # Prepara le email
    subject_admin = f"Prenotazione lezione: {name}"
    body_admin = f"""
Hai ricevuto una nuova prenotazione:

Nome: {name}
Email: {email}
Telefono: {phone}
Data: {date}
Ora: {time}
Durata: {duration} minuti

Link evento: {created_event.get('htmlLink', 'N/A')}
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
    app.run(port=5000, debug=True)