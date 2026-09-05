from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class InstituicaoResponse(BaseModel):
    id: UUID
    nome: str
    imagem_url: Optional[str] = None
    video_url: Optional[str] = None
    endereco_completo: str
    bairro: str
    cep: Optional[str] = None
    categorias: List[str]
    telefone_principal: Optional[str] = None
    links_sociais: Optional[Dict[str, Any]] = {}
    mais_informacoes: Optional[str] = None
    ativo: bool

    model_config = ConfigDict(from_attributes=True)