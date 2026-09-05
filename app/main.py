from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routes import instituicoes

app = FastAPI(title="API Ponte do Bem", version="2.0")

# Libera o acesso para o Frontend chamar a API sem bloqueios no navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve as imagens salvas na pasta static
app.mount("/static", StaticFiles(directory="static"), name="static")

# Registra as rotas da aplicação
app.include_router(instituicoes.router)

@app.get("/")
def home():
    return {"status": "API Ponte do Bem rodando com sucesso em Pindamonhangaba!"}