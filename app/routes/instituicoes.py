from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from thefuzz import fuzz

from ..database import get_db
from ..models import Instituicao
from ..schemas import InstituicaoResponse

router = APIRouter(prefix="/api/instituicoes", tags=["Instituições"])


@router.get("/", response_model=List[InstituicaoResponse])
def listar_instituicoes(
    nome: Optional[str] = Query(None, description="Busca por nome da instituição"),
    categoria: Optional[List[str]] = Query(None, description="Filtro por lista de categorias"),
    bairro: Optional[str] = Query(None, description="Filtro por bairro"),
    db: Session = Depends(get_db)
):
    query = db.query(Instituicao).filter(Instituicao.ativo == True)

    # 1. Filtro por Bairro
    if bairro:
        query = query.filter(Instituicao.bairro.ilike(f"%{bairro}%"))

    # 2. Filtro por Categorias
    if categoria:
        for cat in categoria:
            query = query.filter(Instituicao.categorias.any(cat.lower()))

    todas_instituicoes = query.all()

    # 3. Busca tolerante a erros por Nome (Fuzzy Search)
    if nome:
        nome_busca = nome.strip().lower()
        instituicoes_filtradas = []

        for inst in todas_instituicoes:
            nome_inst = inst.nome.lower()
            
            # Avalia a similaridade entre o texto buscado e o nome no banco
            score_parcial = fuzz.partial_ratio(nome_busca, nome_inst)
            score_token = fuzz.token_set_ratio(nome_busca, nome_inst)
            score_max = max(score_parcial, score_token)

            # Aceita combinações com pelo menos 60% de similaridade
            if score_max >= 60:
                instituicoes_filtradas.append((inst, score_max))

        # Ordena as instituições das mais similares para as menos similares
        instituicoes_filtradas.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in instituicoes_filtradas]

    return todas_instituicoes


# Rotas estáticas vêm antes de parâmetros dinâmicos ({instituicao_id})
@router.get("/bairros", response_model=List[str])
def listar_bairros(db: Session = Depends(get_db)):
    """
    Retorna a lista de bairros únicos onde existem instituições ativas.
    """
    bairros = db.query(Instituicao.bairro)\
                .filter(Instituicao.ativo == True, Instituicao.bairro.isnot(None))\
                .distinct()\
                .order_by(Instituicao.bairro)\
                .all()
    
    return [b[0] for b in bairros]


@router.get("/{instituicao_id}", response_model=InstituicaoResponse)
def obter_instituicao(instituicao_id: str, db: Session = Depends(get_db)):
    """
    Retorna os detalhes de uma instituição específica a partir do seu ID.
    """
    instituicao = db.query(Instituicao).filter(
        Instituicao.id == instituicao_id, 
        Instituicao.ativo == True
    ).first()
    
    if not instituicao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Instituição não encontrada"
        )
    return instituicao