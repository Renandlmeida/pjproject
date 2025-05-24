"""
WSGI config para o projeto Akoni Software House.
Expõe o WSGI callable como uma variável de nível de módulo chamada 'application'.
"""
import os
from app import app, create_tables

# Cria as tabelas do banco de dados se não existirem
if os.environ.get('FLASK_ENV') != 'production':
    with app.app_context():
        create_tables()

# A variável 'application' é usada pelo servidor WSGI para servir a aplicação
application = app

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    application.run(host='0.0.0.0', port=port)
