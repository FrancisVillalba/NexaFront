# NEXA — Frontend

Interfaz React con TypeScript, Vite y Tailwind. Login y usuarios conectados a NexaBack (ASP.NET Core 10 y PostgreSQL). Los módulos comerciales conservan sus datos locales de demostración mientras se desarrollan sus APIs. El código de src se comprueba en modo estricto con TypeScript.

## Ejecutar

El frontend se trabaja desde NEXA.Frontend.code-workspace en VS Code. NexaBack se ejecuta por separado en Visual Studio.

```powershell
npm.cmd run dev
```

Vite abre normalmente http://127.0.0.1:5173. /api se reenvía a NexaBack; la dirección predeterminada es https://localhost:44388 (perfil IIS Express).

Si el backend usa otro puerto, crear .env.local tomando .env.example y ajustar NEXA_API_URL. Reiniciar Vite después de cambiar la dirección. El perfil https de NexaBack también usa https://localhost:44388. El proxy mantiene la validación HTTPS y utiliza las autoridades certificadoras de Node y del sistema Windows.

Para servir la versión compilada con ASP.NET Core:

```powershell
npm.cmd run build
./Iniciar.ps1
```

La interfaz se sirve en http://localhost:5199 y el host reenvía /api a NexaBack con YARP. Ya no implementa login, cookies ni usuarios de demostración. NEXA_API_URL también configura este host (variable de entorno o configuración .NET). En producción debe configurarse explícitamente; una conexión remota requiere HTTPS. El certificado del backend debe ser válido y de confianza.

## Login y token

Ingresar con el nombre de usuario registrado en NexaDB, por ejemplo fvillalba, y su contraseña. El campo de acceso es Usuario, no correo electrónico.

- POST /api/usuarios/auth/login valida las credenciales en NexaBack.
- sessionStorage guarda el token y su vencimiento por defecto.
- Recordar mi sesión usa localStorage, conservando el vencimiento original de 15 minutos.
- No se guardan contraseñas, hashes ni datos personales en el registro de sesión.
- Las peticiones protegidas envían Authorization: Bearer con el token.
- Al recargar, GET /api/usuarios/auth/me verifica el token en el servidor y devuelve los datos actuales.
- Al vencer el token o recibir 401, se elimina la sesión y se vuelve al login. Un 403 no cierra la sesión.
- Cerrar sesión elimina el token local; en el modo Recordar se sincroniza el cierre entre pestañas. El backend aún no tiene revocación individual ni refresh tokens: una copia del JWT conserva su validez hasta expirar.

El token es accesible a JavaScript al usar Web Storage: evitar HTML no confiable, dependencias inseguras y scripts externos sin control. No copiar tokens a servicios externos ni registrarlos en consola. Si luego se requiere una sesión HttpOnly, habrá que implementar el flujo de cookie/BFF y protección CSRF en el backend.

## Usuarios

La pantalla consulta usuarios, personas y perfiles reales. Permite crear una cuenta seleccionando una persona activa sin usuario y un perfil activo ya registrados. No crea personas automáticamente. La activación/desactivación todavía no tiene un endpoint del backend y no se simula localmente. Las operaciones requieren Administrador.

## Módulos comerciales

Inicio, inventario, movimientos, compras, ventas, presupuestos, caja, clientes, proveedores y reportes siguen funcionando con datos de demostración en localStorage. Los comprobantes no tienen validez fiscal. La fecha comercial sigue fija en 26/10/2026.

La autenticación real no convierte esos datos en persistencia de negocio ni en autorización de servidor. Stock, cobros y demás operaciones se trasladarán a NexaBack por etapas.

## Estructura para aprender

- src/main.tsx: inicia React.
- src/App.tsx: pantallas y composición general.
- src/features/auth/Login.tsx: formulario de acceso.
- src/features/auth/useAuth.ts: estado React, restauración, vencimiento y logout.
- src/services/authService.ts: login y consulta de la sesión; adaptación de DTOs a la interfaz.
- src/services/authSession.ts: guardar, leer y borrar token y vencimiento.
- src/services/api.ts: peticiones JSON, encabezado Bearer y errores Problem Details.
- src/services/usersService.ts: consultas y altas disponibles en NexaBack.
- src/domain.ts: reglas comerciales locales de la maqueta.
- src/tailwind.css y src/styles.css: estilos actuales.
- Program.cs: host de archivos estáticos y proxy YARP.

## Verificación

```powershell
npm.cmd test
npm.cmd run build
dotnet build NEXA.csproj
```

Las pruebas de autenticación usan respuestas simuladas y no escriben en NexaDB. Se verificaron además login real, recarga, persistencia entre pestañas, cierre de sesión y consultas protegidas a través de Vite y del host .NET. Vite mantiene una advertencia por el tamaño del bundle de gráficos.

## Certificado local de IIS Express

Vite valida HTTPS con las CA de Node, las del sistema y, solo en Development y para destinos loopback, el certificado público de .certificates/nexaback.local.pem. No usa secure:false. El archivo local está excluido de Git y no incluye claves privadas. Si el certificado local cambia, iniciar NexaBack y ejecutar ./Configurar-CertificadoBackend.ps1; después reiniciar Vite. El script valida el certificado con Windows antes de exportar su parte pública. NEXA_CA_CERT permite elegir otra ruta local.

El frontend no inicia NexaBack automáticamente. Para que el login funcione, NexaBack debe estar escuchando en NEXA_API_URL. Si no está disponible, el frontend muestra la dirección exacta configurada. Los perfiles IIS Express y https del backend usan HTTPS 44388; no iniciarlos simultáneamente.

## TypeScript

Todo el código de `src/` utiliza `.ts` o `.tsx`, con comprobación estricta.
Los contratos de datos están en `src/types.ts`; las props y el contexto de la interfaz están en `src/uiTypes.ts`.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

La compilación ejecuta primero `tsc --noEmit` y después Vite. Las pruebas existentes siguen en `.mjs` e importan los módulos TypeScript mediante `tsx`.
