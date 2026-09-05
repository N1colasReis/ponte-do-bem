import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Correção essencial para o SQLAlchemy aceitar URLs do Supabase/Render
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Cria o motor do SQLAlchemy
engine = create_engine(DATABASE_URL)

# Criador de sessões para as requisições
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para a criação dos modelos
Base = declarative_base()

# Dependência do FastAPI para abrir e fechar o banco automaticamente por requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()