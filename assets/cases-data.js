// Dados da seção Cases (inventário). Os textos de cada material (o quê, por quê, como, habilidades e
// ferramentas) continuam em app.js, em MATERIAIS; aqui ficam só os campos do inventário.
// `caso` e `idx` apontam para MATERIAIS[caso][idx].
//
// PENDENTE: `nivel` (1–6) e `atributos` (0–100) são valores provisórios, até o Vinicius definir os dele.

const CSL = { caso: "csl", meta: "Cineteatro São Luiz · Gestão de comunicação digital", loot: ["assets/modelos/loot-gema.glb", "assets/modelos/loot-cubo.glb"] };
const EA = { caso: "ea", meta: "Enem Action · Analista de marketing digital", loot: ["assets/modelos/loot-moeda.glb", "assets/modelos/loot-gema.glb"] };
const MODA = { caso: "moda", loot: ["assets/modelos/loot-cubo.glb", "assets/modelos/loot-moeda.glb"] };

const OKR = [
  { label: "Resultados-chave", valor: "17", fonte: "Plano 2027–2030, em 6 objetivos" },
  { label: "Sprints", valor: "16", fonte: "trimestrais, com revisão ao fim de cada um" },
];
const LEADS = [{ label: "Leads", valor: "44,5%", fonte: "dos leads Enem Action em 2024 vieram das campanhas em que atuei" }];

export const PROJECTS = [
  { ...CSL, idx: 0, vertical: true, data: "set/2026", tipo: "plano", acento: "do diagnóstico à execução", nivel: 6,
    atributos: [["Estratégia", 95], ["Dados", 85], ["Conteúdo", 60], ["Mídia", 45]],
    resultados: OKR, thumb: "assets/capas/plano-doc.webp", model: "assets/modelos/plano-doc.glb",
    orbita: { raio: "380%", fov: "30deg", inclinacao: "-4deg" }, luz: { y: 0, escala: 1.08 } },
  { ...CSL, idx: 1, data: "out/2026", tipo: "slides", acento: "a tese em poucos minutos", nivel: 4,
    atributos: [["Estratégia", 80], ["Dados", 70], ["Conteúdo", 75], ["Design", 65]],
    resultados: [], thumb: "assets/capas/plano-apresentacao.webp", model: "assets/modelos/plano-apresentacao.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "0deg" }, luz: { y: 2, escala: 1.05 } },
  { ...CSL, idx: 2, data: "ago/2026", tipo: "dashboard", acento: "dados para a curadoria", nivel: 5,
    atributos: [["Dados", 95], ["Estratégia", 70], ["Automação e Inteligência Artificial", 80], ["Conteúdo", 20]],
    resultados: [], thumb: "assets/capas/dash-curva-abc.webp", model: "assets/modelos/dash-curva-abc.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "3deg" }, luz: { y: -2, escala: 1.1 } },
  { ...CSL, idx: 3, data: "set/2025", tipo: "dashboard", acento: "o plano como rotina de decisão", nivel: 5,
    atributos: [["Dados", 90], ["Estratégia", 85], ["Automação e Inteligência Artificial", 75], ["Conteúdo", 25]],
    resultados: OKR, thumb: "assets/capas/dash-okrs.webp", model: "assets/modelos/dash-okrs.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "-3deg" }, luz: { y: 1, escala: 1.06 } },
  { ...CSL, idx: 4, data: "set/2025", tipo: "guia", acento: "40% da pauta em repertório", nivel: 4,
    atributos: [["Conteúdo", 95], ["Estratégia", 75], ["Dados", 60], ["Mídia", 50]],
    resultados: [{ label: "Repertório", valor: "40%", fonte: "da pauta, com as seis editorias" }],
    thumb: "assets/capas/linha-editorial.webp", model: "assets/modelos/linha-editorial.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "2deg" }, luz: { y: 3, escala: 1.04 } },

  { ...EA, idx: 0, vertical: true, data: "jul/2023", tipo: "e-book", acento: "férias com conteúdo", nivel: 3,
    atributos: [["Conteúdo", 90], ["Mídia", 70], ["Estratégia", 60], ["Dados", 55]],
    resultados: LEADS, thumb: "assets/capas/ebook-cinema.webp", model: "assets/modelos/ebook-cinema.glb",
    orbita: { raio: "380%", fov: "30deg", inclinacao: "-5deg" }, luz: { y: 0, escala: 1.07 } },
  { ...EA, idx: 1, vertical: true, data: "jul/2023", tipo: "e-book", acento: "repertório que vira lead", nivel: 3,
    atributos: [["Conteúdo", 90], ["Mídia", 70], ["Estratégia", 60], ["Dados", 55]],
    resultados: LEADS, thumb: "assets/capas/ebook-moda.webp", model: "assets/modelos/ebook-moda.glb",
    orbita: { raio: "380%", fov: "30deg", inclinacao: "4deg" }, luz: { y: 2, escala: 1.05 } },
  { ...EA, idx: 2, data: "set/2023", tipo: "planner", acento: "30 dias até a prova", nivel: 3,
    atributos: [["Conteúdo", 85], ["Mídia", 70], ["Estratégia", 65], ["Dados", 55]],
    resultados: LEADS, thumb: "assets/capas/planner-redacao.webp", model: "assets/modelos/planner-redacao.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "-3deg" }, luz: { y: -1, escala: 1.09 } },
  { ...EA, idx: 3, data: "jun/2025", tipo: "relatório", acento: "o ano das redes em decisões", nivel: 4,
    atributos: [["Dados", 90], ["Estratégia", 70], ["Conteúdo", 50], ["Mídia", 60]],
    resultados: [], thumb: "assets/capas/relatorio-2025.webp", model: "assets/modelos/relatorio-2025.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "2deg" }, luz: { y: 1, escala: 1.06 } },

  { ...MODA, idx: 0, data: "ago/2021", meta: "Fargo · Concepção, produção e styling", tipo: "campanha", acento: "campanha e ensaio, do conceito à imagem", nivel: 4,
    atributos: [["Criação", 95], ["Produção", 85], ["Conteúdo", 70], ["Mídia", 40]],
    resultados: [], thumb: "assets/moda/fargo-faz-sol-1.webp", thumb2: "assets/moda/fargo-faz-sol-2.webp", model: "assets/modelos/fargo-faz-sol.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "-3deg" }, luz: { y: 0, escala: 1.1 } },
  { ...MODA, idx: 2, data: "out/2020", meta: "Vila Sol · Concepção, produção e styling", tipo: "campanha", acento: "um dia no paraíso, da campanha ao ensaio", nivel: 4,
    atributos: [["Criação", 95], ["Produção", 85], ["Conteúdo", 65], ["Mídia", 40]],
    resultados: [], thumb: "assets/moda/vila-sol-oasis-1.webp", thumb2: "assets/moda/vila-sol-oasis-2.webp", model: "assets/modelos/vila-sol-oasis.glb",
    orbita: { raio: "400%", fov: "30deg", inclinacao: "3deg" }, luz: { y: 2, escala: 1.06 } },
];

export const FILTROS = [
  { id: "todos", nome: "Todos" },
  { id: "csl", nome: "Cineteatro São Luiz" },
  { id: "ea", nome: "Enem Action" },
  { id: "moda", nome: "Moda" },
];
