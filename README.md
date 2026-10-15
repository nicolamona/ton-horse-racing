# TON Horse Racing — Arcade Demo

Mini juego de carreras arcade publicado como sitio estático.

## Estado actual

- `index.html`: interfaz adaptable a móviles, ocho caballos, carrera animada y ganador aleatorio para entretenimiento.
- Conexión opcional mediante TON Connect: muestra una dirección pública abreviada. No solicita firmas ni envía transacciones.
- Saldo inicial de 1.000 fichas arcade ficticias, separado por perfil invitado o dirección de wallet en ese dispositivo; se puede restablecer a 1.000.
- Campo para elegir cuántas fichas virtuales se asignan a cada carrera; la cantidad se descuenta del saldo ficticio, se recuerda por perfil y aparece en el historial de las últimas 10 carreras.
- Historial local de las últimas 10 carreras guardado en el navegador del jugador.
- `backend/`: infraestructura opcional de API demo para Cloudflare Workers + D1, con comprobación de salud e historial de carreras ficticias.
- **Las fichas son puntos ficticios de arcade, no tokens TON reales.** No se pueden comprar ni retirar, no tienen valor monetario y no hay apuestas con dinero, premios, pagos ni transacciones blockchain. Las rutas de pagos/transacciones del backend están deshabilitadas.

## Publicación del frontend

1. En GitHub, abrí **Settings → Pages**.
2. En **Build and deployment**, seleccioná **GitHub Actions** como fuente.
3. El workflow de `.github/workflows/deploy.yml` publica el sitio cuando hay cambios en `main`.
4. Revisá **Actions** para confirmar que la publicación terminó correctamente.

URL: https://nicolamona.github.io/ton-horse-racing/

## Backend demo opcional

GitHub Pages no ejecuta un servidor ni ofrece una base de datos. La carpeta `backend/` contiene un Worker de ejemplo y el esquema D1 para guardar únicamente resultados ficticios. **Todavía no está desplegado** y requiere una cuenta de Cloudflare y crear una base D1.

Consultá [backend/README.md](backend/README.md) para la configuración. No publiques el Worker hasta reemplazar el identificador de base de datos de ejemplo y aplicar el esquema.

## Seguridad y límites

- Nunca ingreses ni compartas frases semilla o claves privadas.
- No guardamos direcciones de wallet en el backend.
- La conexión de wallet es opcional y de solo visualización.
- El historial local vive en el navegador y puede borrarse al limpiar los datos del sitio.
- El saldo de fichas y el historial se guardan localmente en ese navegador; no se sincronizan entre dispositivos y pueden borrarse al limpiar los datos del sitio.
- Los resultados del juego no son aleatorios certificados ni un registro oficial compartido entre jugadores.
- No hay infraestructura de detección o confirmación de depósitos porque los pagos y las transacciones reales están deliberadamente deshabilitados.
