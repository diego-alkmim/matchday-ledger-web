# Matchday Ledger Web

## Rodando local
1. `cp .env.example .env.local`
2. Ajuste `NEXT_PUBLIC_API_URL` para sua API (Render ou local).
3. `npm ci`
4. `npm run dev`

## Deploy Vercel
- Configure env `NEXT_PUBLIC_API_URL=https://<render-api>`.
- Axios já usa `withCredentials`. Garanta CORS no backend permitindo domínio Vercel e cookies Secure/SameSite=None.

## Auth flow
- Login chama `/auth/login`, refresh cookie HttpOnly fica no navegador; access token fica só em memória (zustand).
- Interceptor chama `/auth/refresh` com header `x-csrf-token` quando 401.
