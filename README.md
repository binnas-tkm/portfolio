# Portfólio · Vinicius Teixeira

Landing page de portfólio de Vinicius Teixeira, Supervisor de Comunicação Digital no Cineteatro São Luiz, em Fortaleza.

Site estático em uma página: HTML, CSS e JavaScript puros, sem etapa de build. A identidade visual segue o manual da marca Vinni 2026 (Unbounded, Manrope e Instrument Serif; paleta Noite, Brasa, Âmbar e Névoa).

## Estrutura

```
index.html               página única, com o CSS da página
robots.txt
assets/
  app.js                 interações, carrosséis, textos dos materiais
  boot.js                ajuste de rolagem antes do carregamento
  glass-folder.js        anel de pastas de vidro dos carrosséis
  icones.js              símbolos das ferramentas
  fonts/                 WOFF (com TTF de reserva)
  video/                 assinatura animada do hero
  capas/ fotos/          imagens em WebP
  carrosseis/            lâminas em WebP; mini/ guarda as miniaturas
  marca/                 logotipos em SVG e textura de grão
```

## Rodar localmente

Qualquer servidor estático serve. Por exemplo:

```bash
ruby -run -e httpd . -p 8765
```

Depois, abra http://localhost:8765.

## Publicar

Por ser estático, o site pode ir direto para o GitHub Pages, Netlify ou Vercel. Duas proteções precisam do servidor e não podem ir na página: o cabeçalho `frame-ancestors` (impede o site de ser embutido em outros) e a compressão gzip ou Brotli.

Desenvolvido por Vinicius Teixeira com o Claude Code.
