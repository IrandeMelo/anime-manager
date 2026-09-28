# AnimeTrack

MVP em Next.js + React + TypeScript usando Neon Auth e Neon Data API.

## Funcionalidades

- Criar conta / entrar / sair
- Cadastrar anime
- Nome, temporada, episódio atual e status
- Editar e excluir
- Incrementar/decrementar episódio em um toque
- Filtros por status
- RLS: cada usuário acessa apenas os próprios animes

## Backend Neon

- Database: `anime_manager`
- Table: `public.animes`
- Auth: Neon Managed Better Auth
- Data API: Neon Data API + RLS

## Rodar localmente

```bash
npm install
npm run dev
```
