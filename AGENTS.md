# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. User explicitly removed Sites/OpenAI hosting integration. Build with npm run build (Vite only); ASP.NET Core serves dist/client. Do not recreate .openai or Sites scaffolding.
# Product decisions

- Approved: use the first generated concept as the dashboard and incorporate inventory and sales concepts two and three.
- Product: a hardware store / ferretería, with login, stock, purchases, invoicing, clients, suppliers, reports, cash, users and settings.
- Preserve petroleum sidebar, light background and saturated green/blue/orange/purple indicators.
- User explicitly requests .NET Core. This prototype uses ASP.NET Core 10 as the executable host, with a React frontend and local demo commercial data. Do not describe it as a production backend.

- Product name changed by the user to NEXA. Use NEXA in all visible branding.

- Branding must be exactly NEXA; omit the Gestión descriptor everywhere.

- Use the user-supplied green NEXA logo from public/assets/nexa-logo.png in login, sidebar and receipts. Preserve the original asset; use a white backing for contrast.

- Login visual selected: option 2, petroleum panel about 27% width, ample light form area, welcome heading and discreet demo access. Keep the supplied green NEXA logo.

- MVC migration canceled. User chose React with TypeScript as learning direction. Runtime still uses JavaScript; do not claim TypeScript migration is complete. Frontend workspace: NEXA.Frontend.code-workspace. Learning guide: docs/APRENDER-REACT.md. Database work deferred.

El usuario eligió Tailwind para los estilos. Tailwind 4 está integrado con prefijo tw: y sin Preflight; Login.jsx utiliza utilidades y el resto conserva styles.css en la capa legacy. No afirmar que el proyecto ya está migrado a TypeScript.


- Sidebar: omit the business card containing company name and 'Tu negocio, bajo control', as explicitly requested by the user.


- Login logo enlarged from 180x48 to 220x59; preserve proportions and compact sizing on narrow split layouts.


- Login logo: user requested larger again and horizontally centered in its panel. Target width 260px, constrained to available width, with original crop aspect ratio.


- Login: remove the decorative line and 'Ferretería · Inventario y facturación' footer from the petroleum panel, per user request.


- Login: remove demonstration access button, its divider and profile picker. Keep normal email/password login.


- Browser tab uses a green N favicon inspired by the NEXA logo, in public/favicon.svg.


- Project directory and npm package are named nexa; .NET project is NEXA.csproj. User works exclusively in VS Code; NEXA.sln was removed. Use this folder for subsequent changes.


- Removed empty unused MVC folders Controllers, Models, Services and Views. Backend routes remain in Program.cs.


- Cleanup: removed temporary work-check.txt, unused src/login.css and obsolete design-qa.md. Keep learning docs, business tests and application assets.

- 2026-10-28: El frontend autentica contra NexaBack (PostgreSQL) mediante usuario y contraseña. No restaurar login demo por correo/cookie. Los tokens van en sessionStorage por defecto o localStorage con Recordar mi sesión, y se envían como Bearer. No guardar contraseñas ni claves JWT en el frontend. Restaurar la sesión con /api/usuarios/auth/me.
- El host ASP.NET del front sirve la SPA y reenvía /api con YARP; no contiene usuarios demo. Vite usa el mismo proxy hacia NEXA_API_URL (por defecto HTTPS localhost:44388). Los módulos comerciales siguen siendo locales mientras se implementan sus endpoints.
