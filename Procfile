web: python manage.py collectstatic --noinput && python manage.py migrate && gunicorn eoffice.wsgi:application --bind 0.0.0.0:$PORT
