# Digital Twin — Galpão Industrial

Viewer web interativo de um galpão industrial de **107 × 30 m** (sem teto — visão externa da planta), para o projeto de **digital twin**.

**URL (GitHub Pages):** https://jpeixer.github.io/digital-twin-galpao/

## O que é

Modelo 3D construído na Unity a partir do prefab `wall_plain_GRP_prefab` (paredes de perímetro, sem cobertura), exportado como glTF binário (`.glb`) e servido por um viewer próprio em Three.js.

No navegador (desktop ou celular):

- **Girar** — arraste com o mouse / um dedo
- **Zoom** — scroll / pinça
- **Deslocar (pan)** — botão direito / dois dedos
- **Vista inicial**, **Topo** e **Grade** — botões na barra inferior

## Estrutura

```
index.html          # página do viewer (importmap Three.js via CDN)
css/viewer.css      # estilos
js/viewer.js        # cena Three.js: OrbitControls, luz, céu, chão em grade, auto-frame
assets/warehouse.glb# modelo 3D exportado da Unity (glTFast)
.nojekyll           # serve arquivos sem processamento Jekyll
```

## Publicar / atualizar

1. Na Unity: menu **Tools → Export Warehouse GLB** (gera `docs/assets/warehouse.glb` no projeto Unity).
2. Copie o `.glb` atualizado para `assets/warehouse.glb` neste repo.
3. Commit e push na `main`.
4. GitHub → **Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)`**.

## Testar localmente

```bash
python -m http.server 8123
# abra http://localhost:8123
```

## Origem

Projeto Unity `industry fundamentals` (Unity 6, URP) — mantido localmente por ser grande (~1,1 GB de assets). Este repositório contém apenas o viewer publicável.
