ARLEYMC STORE

La tienda usa Cloudflare Pages + Pages Functions para mantener las credenciales privadas.

ARCHIVOS IMPORTANTES
- index.html: tienda pública.
- functions/api/create-order.js: crea orders de Mercado Pago en servidor.
- functions/api/webhook.js: recibe y valida Webhooks de Mercado Pago y avisa a Discord.
- _routes.json: limita las Functions a /api/*.

SECRETOS DE CLOUDFLARE (NO subir a GitHub)
- MP_ACCESS_TOKEN = Access Token de Mercado Pago.
- MP_WEBHOOK_SECRET = clave secreta de Webhooks de Mercado Pago.
- DISCORD_WEBHOOK_URL = Webhook URL privado del canal de compras.

FLUJO
Cliente -> tienda -> Mercado Pago -> Webhook -> Discord -> revisión manual -> entrega en Minecraft.

IMPORTANTE
Nunca pongas Access Token, contraseña, CVV ni otras credenciales privadas en index.html o GitHub.
Primero probar con credenciales de prueba de Mercado Pago. Después cambiar a credenciales productivas.
