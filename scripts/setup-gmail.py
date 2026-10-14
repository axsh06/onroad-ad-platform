#!/usr/bin/env python3
"""Interactive local setup. Never print or persist the secret outside .env.local."""
from pathlib import Path
import getpass
import os
import re
import smtplib
import ssl

root = Path(__file__).resolve().parents[1]
print('ONROAD — подключение отдельного Gmail')
print('Используйте пароль приложения Google, а не обычный пароль.')
print('Сначала включите двухэтапную аутентификацию: https://myaccount.google.com/apppasswords')
email = input('Адрес Gmail отправителя: ').strip().lower()
if not re.fullmatch(r'[a-z0-9._%+\-]+@gmail\.com', email):
    raise SystemExit('Нужен адрес отдельного Gmail вида name@gmail.com.')
secret = getpass.getpass('Пароль приложения (ввод скрыт): ').replace(' ', '')
if not re.fullmatch(r'[a-zA-Z]{16}', secret):
    raise SystemExit('Пароль приложения Google должен содержать 16 букв. Настройки не изменены.')
try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=ssl.create_default_context(), timeout=20) as client:
        client.login(email, secret)
except smtplib.SMTPAuthenticationError:
    raise SystemExit('Google отклонил вход. Проверьте пароль приложения и выбранный аккаунт. Настройки не изменены.')
except (OSError, smtplib.SMTPException):
    raise SystemExit('Не удалось подключиться к Gmail. Настройки не изменены.')
values = {'EMAIL_FROM': f'ONROAD <{email}>', 'SMTP_HOST':'smtp.gmail.com', 'SMTP_PORT':'465', 'SMTP_USER':email, 'SMTP_PASSWORD':secret}
target = root / '.env.local'
previous = target.read_text() if target.exists() else ''
# Preserve unrelated local configuration; disable the alternative sender so SMTP is selected.
keys = set(values) | {'RESEND_API_KEY'}
lines = [line for line in previous.splitlines() if line.split('=', 1)[0].strip() not in keys]
lines.extend([f'{key}="{value}"' for key,value in values.items()])
lines.append('RESEND_API_KEY=""')
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as handle:
    handle.write('\n'.join(lines) + '\n')
os.chmod(target, 0o600)
print('Gmail подключён локально. Пароль скрыт и сохранён только в .env.local.')
print('Перезапустите сервер разработки. Затем пройдите регистрацию на собственную почту.')
print('Для Vercel эти же пять параметров нужно добавить в Production и выполнить новое развёртывание.')
