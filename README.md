# NEXA — Frontend

Interfaz React con TypeScript, Vite y Tailwind. Administración, Productos e Inventario conectados a NexaBack (ASP.NET Core 10 y PostgreSQL). El resto de los módulos comerciales conserva datos locales de demostración mientras se desarrollan sus APIs. El código de src se comprueba en modo estricto con TypeScript.

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
- Recordar mi sesión usa localStorage, conservando el vencimiento original de 30 minutos.
- No se guardan contraseñas, hashes ni datos personales en el registro de sesión.
- Las peticiones protegidas envían Authorization: Bearer con el token.
- Al recargar, GET /api/usuarios/auth/me verifica el token en el servidor y devuelve los datos actuales.
- Al vencer el token o recibir 401, se elimina la sesión y se vuelve al login. Un 403 no cierra la sesión.
- Cerrar sesión elimina el token local; en el modo Recordar se sincroniza el cierre entre pestañas. El backend aún no tiene revocación individual ni refresh tokens: una copia del JWT conserva su validez hasta expirar.

El token es accesible a JavaScript al usar Web Storage: evitar HTML no confiable, dependencias inseguras y scripts externos sin control. No copiar tokens a servicios externos ni registrarlos en consola. Si luego se requiere una sesión HttpOnly, habrá que implementar el flujo de cookie/BFF y protección CSRF en el backend.

## Usuarios

La pantalla consulta usuarios, personas y perfiles reales. Permite crear una cuenta seleccionando una persona activa sin usuario y un perfil activo ya registrados. No crea personas automáticamente. La activación/desactivación todavía no tiene un endpoint del backend y no se simula localmente. Las operaciones requieren Administrador.

## Personas

El menú **Personas**, disponible para Administrador, consulta PostgreSQL mediante NexaBack.
Permite buscar por nombre, apellido, documento o correo; filtrar por estado; paginar;
crear, editar, desactivar y reactivar personas. La baja es lógica y no borra relaciones.
No se permite desactivar a la persona del último administrador activo.

El código comentado está en `src/modulos/personas/Personas.tsx` y `personasServicio.ts`.

## Módulos comerciales

Productos, Inventario y Movimientos de stock consultan NexaBack. Inventario requiere ejecutar manualmente el script `back/src/NexaBack/Infrastructure/Persistence/Sql/003_Inventario.sql` sobre una base que ya tenga `catalogo.productos`.

Desde Inventario se registran entradas, salidas, ajustes a saldo final y transferencias entre depósitos. Las acciones dependen de los permisos del token. Las existencias iniciales se cargan con una entrada; no se importan productos ni saldos locales de demostración.

Clientes y Proveedores consultan NexaBack y mantienen datos propios para particulares o empresas. No dependen del ABM de Personas. Los permisos provienen del token.

Los archivos `clientesListado.tsx`, `clientesServicio.ts`, `proveedoresListado.tsx` y `proveedoresServicio.ts` usan los componentes compartidos de `src/modulos/contactos`. Incluyen comentarios para seguir el flujo entre formulario, servicio HTTP y backend.

Inicio, ventas, presupuestos y reportes siguen funcionando con datos de demostración en localStorage y no modifican el inventario real. Los selectores y nombres de clientes/proveedores provienen ahora del backend. Los comprobantes y cuentas corrientes siguen siendo locales; la validación de crédito del simulador usa el límite consultado, sin registrar operaciones en PostgreSQL. Los comprobantes no tienen validez fiscal. La fecha comercial sigue fija en 26/10/2026.

La autenticación real no convierte esos datos en persistencia de negocio ni en autorización de servidor. Stock, cobros y demás operaciones se trasladarán a NexaBack por etapas.

## Estructura para aprender

- src/main.tsx: inicia React.
- src/App.tsx: punto de entrada del espacio de trabajo.
- src/modulos/autenticacion/autenticacionInicioSesion.tsx: formulario de acceso.
- src/modulos/autenticacion/autenticacionSesion.ts: estado React, restauración, vencimiento y logout.
- src/services/autenticacionServicio.ts: login y consulta de la sesión; adaptación de DTOs a la interfaz.
- src/services/authSession.ts: guardar, leer y borrar token y vencimiento.
- src/services/api.ts: peticiones JSON, encabezado Bearer y errores Problem Details.
- src/services/usuariosServicio.ts: consultas y altas disponibles en NexaBack.
- src/modulos/productos/productosListado.tsx y productosServicio.ts: ABM real de productos.
- src/modulos/inventario/inventarioListado.tsx e inventarioServicio.ts: consulta real de existencias.
- src/modulos/inventario/inventarioMovimiento.tsx: formulario de entradas, salidas, ajustes y transferencias.
- src/modulos/movimientos/movimientosListado.tsx y movimientosServicio.ts: historial real y registro.
- src/modulos/inventario/inventarioDemostracion.ts: cálculos de los módulos comerciales que todavía son una demostración.
- src/tailwind.css y src/styles.css: estilos actuales.
- Program.cs: host de archivos estáticos y proxy YARP.

## Verificación

```powershell
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
npm.cmd run build
```

La compilación ejecuta primero `tsc --noEmit` y después Vite.

Clientes y Proveedores guardan nombre o razón social, documento / RUC, correo, teléfono y dirección en sus propias tablas. Personas queda destinada a los usuarios del sistema. Los registros comerciales no exigen apellidos ni seleccionan o crean una Persona. Un mismo documento puede existir en Personas, Clientes y Proveedores; dentro de cada tabla comercial se controla la duplicación por tipo y número de documento. El alta y la edición modifican únicamente el módulo correspondiente, con auditoría y control de versión.

Sobre una instalación que ya tenga comercial.clientes y comercial.proveedores, ejecutar manualmente 009_Clientes_Proveedores_Datos_Propios.sql con el backend detenido. Copia los datos antes asociados a Personas, conserva IDs, auditoría y compras, y elimina PersonaId de las tablas comerciales. No elimina personas existentes. Si faltan datos obligatorios de origen, aborta sin dejar cambios parciales para permitir corregirlos y repetir el script. Luego reiniciar backend y recargar front; no requiere permisos nuevos.

Si ya se ejecutó la versión del 006 que conservaba `vinculos_respaldo`, ejecutar manualmente `007_Eliminar_Vinculos_Respaldo.sql` para quitar esa tabla.

Los catálogos comerciales se consultan en `/api/clientes` y `/api/proveedores`, recorriendo todas las páginas y respetando los permisos de consulta. Ventas y Presupuestos permiten seleccionar clientes activos; Compras usa su API propia para buscar proveedores y productos activos y elegir depósitos reales. No se usa un consumidor final ficticio ni contactos del template como alternativa ante errores. Los catálogos se actualizan al navegar o volver a la ventana y se mantienen en memoria, fuera de localStorage. Los IDs reales usan prefijos `clientes:` y `proveedores:` para impedir que los antiguos comprobantes locales se asocien por error a personas reales. Los contactos antiguos no disponibles se muestran como tales; no se borran los comprobantes locales anteriores.

## Compras conectadas a NexaBack

Ejecutar manualmente `back/src/NexaBack/Infrastructure/Persistence/Sql/008_Compras.sql` (desde el backend: `src/NexaBack/Infrastructure/Persistence/Sql/008_Compras.sql`). Requiere las tablas de Proveedores, Productos e Inventario ya preparadas. El arranque no crea tablas ni ejecuta SQL. Después reiniciar el backend; asignar `compras.ver`, `compras.crear`, `compras.recibir` y el nuevo `compras.cancelar` según el perfil y volver a iniciar sesión. El script no asigna permisos a perfiles.

El flujo es Pendiente → Recibida o Pendiente → Cancelada. Crear una orden guarda cabecera y detalle sin cambiar stock. La recepción es completa: valida proveedor, depósito, productos y unidades activos; registra una entrada por línea y actualiza las existencias en la misma transacción. Cada línea guarda el ID del movimiento para consultar su trazabilidad. Los reintentos de recepción no vuelven a sumar cantidades. Las versiones y la transacción serializable rechazan modificaciones simultáneas; ante un conflicto, actualizar y reintentar. Las compras recibidas no se cancelan; devoluciones y recepciones parciales quedan para una etapa posterior.

`comercial.compras` y `comercial.compras_detalles` guardan auditoría de creación y modificación. Los nombres, códigos, unidades y costos de la orden se conservan como datos históricos. El total se calcula en el servidor redondeando cada subtotal a dos decimales; no incluye impuestos, facturación fiscal ni pagos. Recibir una compra modifica existencias y movimientos, sin reemplazar automáticamente el costo ni el precio de venta del catálogo.

El front usa `comprasListado.tsx`, `comprasEdicion.tsx`, `comprasDetalle.tsx`, `comprasServicio.ts` y `comprasTipos.ts`. Los catálogos mínimos de Compras requieren `compras.crear`; no necesitan acceso administrativo a Depósitos. No se importan órdenes del template. Ventas, Presupuestos, Inicio y Reportes todavía conservan su demostración local y no reflejan automáticamente las compras reales.

Tipo de documento comercial: los ABM de Clientes y Proveedores exigen seleccionar CI (Cédula de identidad), RUC, PASAPORTE u OTRO. El backend valida el catálogo y normaliza el código. Ejecutar manualmente 010_Tipo_Documento_Comercial.sql después del 009, con el backend detenido. Los registros anteriores quedan con tipo nulo y se muestran como Sin definir, hasta que se editen para clasificarlos. El índice único es por tipo y número dentro de cada tabla; ante una coincidencia con un registro anterior sin clasificar, se solicita editar ese registro para evitar duplicarlo. Las compras nuevas conservan ProveedorTipoDocumento junto al documento histórico; las anteriores no se reclasifican con el tipo actual del proveedor. No se modificó el esquema de Personas.
