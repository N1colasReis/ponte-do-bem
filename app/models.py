import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from .database import Base


class Instituicao(Base):
    __tablename__ = "instituicoes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False, index=True)
    imagem_url = Column(String(500))
    video_url = Column(String(500), nullable=True)  # Suporta MP4 local ou link do YouTube

    # Localização
    endereco_completo = Column(Text, nullable=False)
    bairro = Column(String(100), nullable=False, index=True)
    cep = Column(String(9))

    # Categorias (Array de strings)
    categorias = Column(ARRAY(Text), nullable=False, default=[])

    # Contatos e Mídias (JSON)
    telefone_principal = Column(String(20))
    links_sociais = Column(JSONB, default={})

    # Informações extras
    mais_informacoes = Column(Text)

    # Controle
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())