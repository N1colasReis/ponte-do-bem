from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routes import instituicoes

app = FastAPI(title="API Ponte do Bem", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Monta a pasta static para as imagens das instituições
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. Registra as rotas da API
app.include_router(instituicoes.router)

# 3. Rotas para entregar o Front-end diretamente pela raiz
@app.get("/")
def serve_index():
    return FileResponse("index.html")

@app.get("/script.js")
def serve_script():
    return FileResponse("script.js")

@app.get("/styles.css")
def serve_style():
    return FileResponse("styles.css")