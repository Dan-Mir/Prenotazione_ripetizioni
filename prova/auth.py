import json
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Definisci gli scope necessari
SCOPES = ['https://www.googleapis.com/auth/calendar']


def main():
    # Usa il file corretto per le credenziali OAuth
    flow = InstalledAppFlow.from_client_secrets_file(
        'OAuth_credentials.json', SCOPES)
    creds = flow.run_local_server(port=0)

    # Salva il token per l'accesso futuro
    with open('token.json', 'w') as token_file:
        token_file.write(creds.to_json())

if __name__ == '__main__':
    main()
