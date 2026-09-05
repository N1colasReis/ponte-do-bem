const API_URL = "";

// Mapeamento dos elementos do DOM
const grid = document.getElementById("grid-instituicoes");
const inputBusca = document.getElementById("input-busca");
const tagsContainer = document.getElementById("categorias-tags");
const selectBairro = document.getElementById("select-bairro");
const btnFiltro = document.getElementById("btn-filtro");
const dropdownConteudo = document.getElementById("dropdown-conteudo");

// Elementos do Modal de Vídeo
const videoModal = document.getElementById("video-modal");
const modalVideoContainer = document.getElementById("modal-video-container");
const btnCloseModal = document.getElementById("btn-close-modal");

// Elementos do Modal de Detalhes
const detailsModal = document.getElementById("details-modal");
const btnCloseDetailsModal = document.getElementById("btn-close-details-modal");
const detailsMediaContainer = document.getElementById("details-media-container");
const detailsTitle = document.getElementById("details-title");
const detailsAddress = document.getElementById("details-address");
const detailsPhone = document.getElementById("details-phone");
const detailsBadges = document.getElementById("details-badges");
const detailsInfo = document.getElementById("details-info");
const detailsSocialContainer = document.getElementById("details-social-container");

let categoriaSelecionada = "";
let debounceTimer = null;

// Algoritmo Fisher-Yates para embaralhar array
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 1. Controle do Dropdown de Filtros
if (btnFiltro && dropdownConteudo) {
    btnFiltro.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownConteudo.classList.toggle("hidden");
        btnFiltro.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!dropdownConteudo.contains(e.target) && !btnFiltro.contains(e.target)) {
            dropdownConteudo.classList.add("hidden");
            btnFiltro.classList.remove("active");
        }
    });
}

// Auxiliar para converter URLs do YouTube em URLs embed
function obterUrlEmbedYoutube(url) {
    let videoId = "";
    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/watch")) {
        const urlParams = new URLSearchParams(url.split("?")[1]);
        videoId = urlParams.get("v");
    } else if (url.includes("youtube.com/embed/")) {
        return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// 2. Controle do Modal de Vídeo
function abrirVideoModal(videoUrl, imagemPoster) {
    if (!modalVideoContainer || !videoModal) return;

    modalVideoContainer.innerHTML = "";

    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
        const embedUrl = obterUrlEmbedYoutube(videoUrl);
        modalVideoContainer.innerHTML = `
            <iframe src="${embedUrl}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        `;
    } else {
        const baseUrl = API_URL ? API_URL.replace(/\/$/, "") : window.location.origin;
        const nomeVideo = videoUrl.replace(/^(\/)?(static\/)?/i, '');
        const urlVideoCompleta = videoUrl.startsWith("http")
            ? videoUrl
            : `${baseUrl}/static/${nomeVideo}`;
        
        modalVideoContainer.innerHTML = `
            <video controls autoplay poster="${imagemPoster}">
                <source src="${urlVideoCompleta}" type="video/mp4">
                Seu navegador não suporta a reprodução deste vídeo.
            </video>
        `;
    }

    videoModal.classList.remove("hidden");
}

function fecharVideoModal() {
    if (videoModal) videoModal.classList.add("hidden");
    if (modalVideoContainer) modalVideoContainer.innerHTML = "";
}

// 3. Controle do Modal de Detalhes
function abrirDetalhesModal(item, urlImagemCompleta) {
    if (!detailsModal) return;

    detailsTitle.textContent = item.nome;
    detailsAddress.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${item.endereco_completo || ''} ${item.bairro ? '- ' + item.bairro : ''}`;
    
    if (item.telefone_principal) {
        detailsPhone.style.display = "block";
        detailsPhone.innerHTML = `<i class="fa-solid fa-phone"></i> ${item.telefone_principal}`;
    } else {
        detailsPhone.style.display = "none";
    }

    // Exibe apenas a imagem no modal de detalhes
    detailsMediaContainer.innerHTML = `<img src="${urlImagemCompleta}" alt="${item.nome}">`;

    detailsBadges.innerHTML = Array.isArray(item.categorias)
        ? item.categorias.map(cat => `<span class="badge">${cat}</span>`).join("")
        : "";

    detailsInfo.textContent = item.mais_informacoes || "Nenhuma informação adicional cadastrada.";

    detailsSocialContainer.innerHTML = "";
    if (item.links_sociais && typeof item.links_sociais === "object") {
        Object.entries(item.links_sociais).forEach(([rede, url]) => {
            if (url) {
                const btn = document.createElement("a");
                btn.className = "btn-social";
                btn.href = url;
                btn.target = "_blank";
                btn.rel = "noopener noreferrer";

                let icone = "fa-solid fa-link";
                const redeLower = rede.toLowerCase();
                if (redeLower.includes("instagram")) icone = "fa-brands fa-instagram";
                else if (redeLower.includes("facebook")) icone = "fa-brands fa-facebook";
                else if (redeLower.includes("whatsapp")) icone = "fa-brands fa-whatsapp";
                else if (redeLower.includes("site") || redeLower.includes("web")) icone = "fa-solid fa-globe";

                btn.innerHTML = `<i class="${icone}"></i> ${rede.charAt(0).toUpperCase() + rede.slice(1)}`;
                detailsSocialContainer.appendChild(btn);
            }
        });
    }

    detailsModal.classList.remove("hidden");
}

function fecharDetalhesModal() {
    if (detailsModal) {
        detailsModal.classList.add("hidden");
        if (detailsMediaContainer) detailsMediaContainer.innerHTML = "";
    }
}

// Event Listeners dos Modais
if (btnCloseModal) btnCloseModal.addEventListener("click", fecharVideoModal);
if (btnCloseDetailsModal) btnCloseDetailsModal.addEventListener("click", fecharDetalhesModal);

window.addEventListener("click", (e) => {
    if (e.target === videoModal) fecharVideoModal();
    if (e.target === detailsModal) fecharDetalhesModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        fecharVideoModal();
        fecharDetalhesModal();
    }
});

// 4. Carrega a lista de bairros
async function carregarBairros() {
    if (!selectBairro) return;

    try {
        const baseUrl = API_URL ? API_URL.replace(/\/$/, "") : window.location.origin;
        const urlBairros = `${baseUrl}/api/instituicoes/bairros`;
        
        const response = await fetch(urlBairros);
        
        if (!response.ok) throw new Error("Erro ao buscar bairros");

        const bairros = await response.json();

        selectBairro.innerHTML = '<option value="">Todos os bairros</option>';
        bairros.forEach(bairro => {
            const option = document.createElement("option");
            option.value = bairro;
            option.textContent = bairro;
            selectBairro.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar lista de bairros:", error);
        selectBairro.innerHTML = '<option value="">Erro ao carregar bairros</option>';
    }
}

// 5. Renderiza Skeleton Loaders
function exibirSkeletons() {
    if (!grid) return;
    grid.innerHTML = "";
    
    for (let i = 0; i < 6; i++) {
        const skeletonCard = document.createElement("div");
        skeletonCard.className = "card-skeleton";
        skeletonCard.innerHTML = `
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text-short"></div>
                <div class="skeleton-badges">
                    <div class="skeleton skeleton-badge"></div>
                    <div class="skeleton skeleton-badge"></div>
                    <div class="skeleton skeleton-badge"></div>
                </div>
            </div>
        `;
        grid.appendChild(skeletonCard);
    }
}

// 6. Busca instituições na API
async function carregarInstituicoes() {
    if (!grid) return;
    exibirSkeletons();

    try {
        // Se API_URL estiver vazia, pega a origem atual do site (ex: https://ponte-do-bem.onrender.com)
        const baseUrl = API_URL ? API_URL.replace(/\/$/, "") : window.location.origin;
        const url = new URL(`${baseUrl}/api/instituicoes/`);
        
        const termoBusca = inputBusca ? inputBusca.value.trim() : "";
        const bairroSelecionado = selectBairro ? selectBairro.value : "";

        if (termoBusca) url.searchParams.set("nome", termoBusca);
        if (categoriaSelecionada) url.searchParams.set("categoria", categoriaSelecionada);
        if (bairroSelecionado) url.searchParams.set("bairro", bairroSelecionado);

        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar dados da API");

        let instituicoes = await response.json();
        
        if (!termoBusca) {
            instituicoes = embaralharArray(instituicoes);
        }

        renderizarCards(instituicoes);

    } catch (error) {
        console.error(error);
        grid.innerHTML = "<p style='color:red;'>Erro ao carregar os dados. Verifique se o servidor FastAPI está rodando!</p>";
    }
}

function renderizarCards(lista) {
    if (!grid) return;
    grid.innerHTML = "";

    if (!lista || lista.length === 0) {
        grid.innerHTML = "<p>Nenhuma instituição encontrada.</p>";
        return;
    }

    lista.forEach(item => {
        const baseUrl = API_URL ? API_URL.replace(/\/$/, "") : window.location.origin;
        const nomeImagem = item.imagem_url ? item.imagem_url.replace(/^(\/)?(static\/)?/i, '') : '';
        const urlImagemCompleta = nomeImagem 
            ? `${baseUrl}/static/${nomeImagem}` 
            : 'https://placehold.co/300x180?text=Sem+Imagem';

        const possuiVideo = Boolean(item.video_url);

        const badgesHtml = Array.isArray(item.categorias)
            ? item.categorias.map(cat => `<span class="badge">${cat}</span>`).join("")
            : "";

        const card = document.createElement("div");
        card.className = "card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="card-media-wrapper" style="position: relative;">
                <img 
                    src="${urlImagemCompleta}" 
                    alt="${item.nome}" 
                    class="card-img" 
                    onerror="this.onerror=null; this.src='https://placehold.co/300x180?text=Sem+Imagem';"
                >
                ${possuiVideo ? `
                    <button type="button" class="btn-card-play" title="Assistir vídeo institucional" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: rgba(0, 0, 0, 0.7);
                        color: #fff;
                        border: none;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        font-size: 1.2rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2;
                        transition: transform 0.2s, background 0.2s;
                    ">
                        <i class="fa-solid fa-play" style="margin-left: 3px;"></i>
                    </button>
                ` : ''}
            </div>
            <div class="card-body">
                <h3 class="card-title">${item.nome}</h3>
                
                <p class="card-address">
                    <i class="fa-solid fa-location-dot"></i> 
                    ${item.endereco_completo || ''} ${item.bairro ? '- ' + item.bairro : ''}
                </p>

                ${item.telefone_principal ? `
                    <p class="card-phone">
                        <i class="fa-solid fa-phone"></i> ${item.telefone_principal}
                    </p>
                ` : ''}

                <p class="card-info">
                    ${item.mais_informacoes ? item.mais_informacoes.substring(0, 110) + '...' : 'Sem informações adicionais.'}
                </p>

                <div class="badge-container">
                    ${badgesHtml}
                </div>
            </div>
        `;

        // Clique geral no card abre o modal de detalhes
        card.addEventListener("click", () => {
            abrirDetalhesModal(item, urlImagemCompleta);
        });

        // Clique no botão de play abre diretamente o modal de vídeo sem acionar o modal de detalhes
        if (possuiVideo) {
            const btnPlayCard = card.querySelector(".btn-card-play");
            if (btnPlayCard) {
                btnPlayCard.addEventListener("click", (e) => {
                    e.stopPropagation();
                    abrirVideoModal(item.video_url, urlImagemCompleta);
                });
            }
        }

        grid.appendChild(card);
    });
}

// Event Listeners dos Filtros
if (inputBusca) {
    inputBusca.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            carregarInstituicoes();
        }, 350);
    });
}

if (selectBairro) {
    selectBairro.addEventListener("change", carregarInstituicoes);
}

if (tagsContainer) {
    tagsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("tag-btn")) {
            document.querySelectorAll(".tag-btn").forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");

            categoriaSelecionada = e.target.getAttribute("data-categoria") || "";
            carregarInstituicoes();
        }
    });
}

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", () => {
    carregarBairros();
    carregarInstituicoes();
});