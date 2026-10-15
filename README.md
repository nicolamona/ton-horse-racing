# TON Horse Racing — Arcade Demo

Juego de carreras arcade con ocho caballos, publicado como sitio estático.

## Estado actual

- `index.html`: interfaz adaptable a móviles, selección visual de caballo y carrera animada con ganador aleatorio.
- No hay apuestas, depósitos, premios, billetera conectada ni fondos reales.
- La carrera corre en el navegador y el resultado no es un sistema de azar certificado ni un registro compartido entre jugadores.

## Publicar gratis con GitHub Pages

1. Abrí **Settings → Pages** en este repositorio.
2. En **Build and deployment**, seleccioná **GitHub Actions** como fuente.
3. El workflow de `.github/workflows/deploy.yml` publicará el sitio cuando haya cambios en `main`.
4. Revisá la pestaña **Actions** para confirmar que la publicación terminó correctamente.

La URL esperada del sitio será:
https://nicolamona.github.io/ton-horse-racing/

La publicación puede tardar unos minutos y requiere que GitHub Pages esté habilitado en Settings.

## Próximos pasos seguros

- Mejorar los gráficos, sonidos y animaciones.
- Agregar historial local de carreras de demostración.
- Preparar un bot de Telegram que abra esta Mini App y mantenga el juego en modo arcade, sin apuestas ni pagos.

GitHub Pages aloja archivos estáticos; no ejecuta un bot Node.js ni proporciona una base de datos del servidor.
