import os
import subprocess

print("Mengambil data dari database lokal (MySQL)...")
os.environ['DATABASE_URL'] = 'mysql://root:@127.0.0.1:3306/eoffice'
subprocess.run([
    'python', 'manage.py', 'dumpdata', 
    'auth', 'accounts', 
    '--exclude', 'auth.Permission', 
    '--exclude', 'auth.Group', 
    '--natural-foreign', 
    '-o', 'db_dump.json'
], check=True)

print("Membersihkan tabel di TiDB (Cloud)...")
os.environ['DATABASE_URL'] = 'mysql://47QNHumxXTdzkYj.root:jW3yimgDD9TtbzeZ@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/eoffice'
subprocess.run(['python', 'manage.py', 'flush', '--no-input'], check=True)

print("Mentransfer data ke TiDB (Cloud)...")
subprocess.run(['python', 'manage.py', 'loaddata', 'db_dump.json'], check=True)

print("SELSEAI! Semua data Anda telah pindah ke server.")
