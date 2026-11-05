# NEXA — Frontend

Interfaz React con TypeScript, Vite y Tailwind. Administración, Productos e Inventario conectados a NexaBack (ASP.NET Core 10 y PostgreSQL). Los módulos comerciales, Inicio y Reportes consultan las APIs reales. El código de src se comprueba en modo estricto con TypeScript.

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

Compras y Ventas registran operaciones reales mediante NexaBack y actualizan inventario. Inicio, Presupuestos y Reportes usan sus APIs reales. Las ventas tienen cobros y cuentas corrientes; no tienen facturación fiscal.

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

Los catálogos comerciales se consultan en `/api/clientes` y `/api/proveedores`, recorriendo todas las páginas y respetando los permisos de consulta. Presupuestos permite seleccionar clientes activos; Ventas usa su propia API de clientes, productos y depósitos; Compras usa su API propia para buscar proveedores y productos activos y elegir depósitos reales. No se usa un consumidor final ficticio ni contactos del template como alternativa ante errores. Los catálogos se actualizan al navegar o volver a la ventana y se mantienen en memoria, fuera de localStorage. Los IDs reales usan prefijos `clientes:` y `proveedores:` para impedir que los antiguos comprobantes locales se asocien por error a personas reales. Los contactos antiguos no disponibles se muestran como tales; no se borran los comprobantes locales anteriores.

## Compras conectadas a NexaBack

Ejecutar manualmente `back/src/NexaBack/Infrastructure/Persistence/Sql/008_Compras.sql` (desde el backend: `src/NexaBack/Infrastructure/Persistence/Sql/008_Compras.sql`). Requiere las tablas de Proveedores, Productos e Inventario ya preparadas. El arranque no crea tablas ni ejecuta SQL. Después reiniciar el backend; asignar `compras.ver`, `compras.crear`, `compras.recibir` y el nuevo `compras.cancelar` según el perfil y volver a iniciar sesión. El script no asigna permisos a perfiles.

El flujo es Pendiente → Recibida o Pendiente → Cancelada. Crear una orden guarda cabecera y detalle sin cambiar stock. La recepción es completa: valida proveedor, depósito, productos y unidades activos; registra una entrada por línea y actualiza las existencias en la misma transacción. Cada línea guarda el ID del movimiento para consultar su trazabilidad. Los reintentos de recepción no vuelven a sumar cantidades. Las versiones y la transacción serializable rechazan modificaciones simultáneas; ante un conflicto, actualizar y reintentar. Las compras recibidas no se cancelan; devoluciones y recepciones parciales quedan para una etapa posterior.

`comercial.compras` y `comercial.compras_detalles` guardan auditoría de creación y modificación. Los nombres, códigos, unidades y costos de la orden se conservan como datos históricos. El total se calcula en el servidor redondeando cada subtotal a dos decimales; no incluye impuestos, facturación fiscal ni pagos. Recibir una compra modifica existencias y movimientos, sin reemplazar automáticamente el costo ni el precio de venta del catálogo.

El front usa `comprasListado.tsx`, `comprasEdicion.tsx`, `comprasDetalle.tsx`, `comprasServicio.ts` y `comprasTipos.ts`. Los catálogos mínimos de Compras requieren `compras.crear`; no necesitan acceso administrativo a Depósitos. No se importan órdenes del template. Inicio y Reportes consultan las compras y ventas reales mediante su API.

Antecedente del SQL 010: incorporó CI, RUC, PASAPORTE y OTRO como códigos en Clientes/Proveedores. A partir del SQL 015, los tres ABM usan el catálogo compartido y envían TipoDocumentoId; ya no existe una lista fija en el front o en la validación del back. Ejecutar manualmente 010_Tipo_Documento_Comercial.sql después del 009, con el backend detenido. Los registros anteriores quedan con tipo nulo y se muestran como Sin definir, hasta que se editen para clasificarlos. El índice único es por tipo y número dentro de cada tabla; ante una coincidencia con un registro anterior sin clasificar, se solicita editar ese registro para evitar duplicarlo. Las compras nuevas conservan ProveedorTipoDocumento junto al documento histórico; las anteriores no se reclasifican con el tipo actual del proveedor. El SQL 010 no modificaba Personas; el SQL 015 sí incorpora su relación con el catálogo.

## Ventas reales

Ejecutar manualmente 011_Ventas.sql con el backend detenido, sobre la base preparada con Clientes independientes y Tipo de documento (009 y 010), Productos e Inventario. El script crea comercial.ventas y comercial.ventas_detalles, sin importar datos del template ni asignar permisos a perfiles. Reiniciar el backend y configurar ventas.ver, ventas.crear y ventas.anular según corresponda.

Flujo del front: buscar un cliente activo, seleccionar depósito y productos reales, agregar cantidades, calcular el total y confirmar la venta. El servidor calcula precios y descuentos con decimales, redondeando cada línea a dos posiciones. El cálculo no reserva stock. Al confirmar se verifican nuevamente las versiones, precios y saldos; si cambiaron, recalcular y revisar antes de confirmar. Los precios y el total no se aceptan desde el cliente como valores autoritativos.

Confirmar guarda venta, detalle, salidas de inventario y nuevos saldos en una transacción serializable. El UUID de operación y el hash de contenido permiten recuperar la venta en reintentos, sin repetir salidas. Si se pierde una respuesta, el formulario bloquea cambios y ofrece reintentar exactamente la misma confirmación. No crear otra venta hasta comprobar el resultado.

La anulación requiere permiso, versión y motivo. Devuelve toda la cantidad al depósito original mediante nuevas entradas, conserva los movimientos de salida y guarda fecha, usuario y motivo de anulación. Repetir la misma anulación no devuelve stock nuevamente. El depósito original debe estar activo; se permite devolver productos que se desactivaron después de venderlos. No hay anulaciones parciales en esta etapa.

La venta conserva nombre, tipo y número de documento del cliente; depósito; nombres, códigos, unidades, costos y precios de los productos. Confirmada describe la operación de stock: no significa Pagada. Los cobros y las cuentas corrientes de clientes usan la API real. No integra caja ni impuestos desglosados y no emite documentación fiscal. Inicio y Reportes muestran datos reales. El módulo de Presupuestos usa su API real; no importa ni convierte los presupuestos locales anteriores del template.

Código del front en ventasListado.tsx, ventasEdicion.tsx, ventasDetalle.tsx, ventasServicio.ts y ventasTipos.ts. El editor de presupuestos en presupuestosEdicion.tsx utiliza la API real. Inicio muestra las últimas ventas reales y abre su detalle conectado; no muestra comprobantes del template.

## Cobros y cuentas corrientes de clientes

Ejecutar manualmente 012_Cobros_Cuentas_Corrientes.sql, ubicado en back/src/NexaBack/Infrastructure/Persistence/Sql, después del 011 y con el backend detenido. El script crea comercial.cobros con auditoría y agrega el catálogo de permisos; no asigna permisos a perfiles ni carga datos de ejemplo. Reiniciar backend, configurar ventas.cobrar, ventas.anular_cobro y clientes.cuenta_corriente, y volver a iniciar sesión para renovar el token.

En Ventas > Ver detalle > Cobros se registran importes parciales o totales, fecha, medio, referencia y observaciones. El backend impide superar el saldo, protege operaciones simultáneas mediante transacciones y versiones y recupera reintentos con el mismo UUID. Ante una respuesta perdida, reintentar la misma operación antes de registrar otra.

Anular un cobro exige permiso y motivo, conserva su historial y reabre el saldo. No ejecuta devoluciones bancarias ni movimientos de stock. Una venta con cobros vigentes no puede anularse: primero deben anularse sus cobros.

Clientes > Cuenta corriente muestra ventas, cobros, anulaciones y saldo, incluso para clientes inactivos. Los totales se calculan con ventas confirmadas y cobros vigentes; no se almacena un saldo duplicado. Ambos historiales tienen paginación independiente. Inicio y Reportes consultan los saldos reales; no hay integración con Caja ni bancos.

El código mantiene servicios y repositorios independientes para Cobros y CuentasCorrientes. En React, los módulos principales son cobrosVenta.tsx, cobrosServicio.ts y clientesCuentaCorriente.tsx, con sus tipos y comentarios en español.

## Pagos y cuenta corriente de proveedores

Ejecutar manualmente 013_Pagos_Cuentas_Proveedores.sql (back/src/NexaBack/Infrastructure/Persistence/Sql), con el backend detenido. Requiere Compras (008) y los datos comerciales de Proveedores (009 y 010). No ejecuta los scripts anteriores ni modifica stock. Crea comercial.pagos con fechas y usuarios de creación/modificación, versiones, identificador único de operación e historial de anulación. No hay otra tabla de saldos.

Después de ejecutarlo, reiniciar backend, asignar compras.pagar, compras.anular_pago y proveedores.cuenta_corriente desde Permisos y volver a iniciar sesión. El script solo incorpora el catálogo; no amplía permisos de perfiles automáticamente. Para operar desde el detalle se requiere también compras.ver; para abrir el listado de Proveedores, proveedores.ver.

Compras > Ver detalle > Pagos permite registrar pagos parciales o totales de compras recibidas, con fecha, medio, referencia y observaciones. Las compras pendientes y canceladas no generan deuda ni admiten pagos. Los proveedores inactivos conservan su cuenta y se permite pagar sus compras ya recibidas.

El backend calcula el saldo y no acepta sobrepagos. La operación modifica la versión de la compra y registra el pago en una transacción serializable para proteger pagos simultáneos. El UUID y el hash de contenido permiten recuperar una respuesta perdida sin duplicar el pago; la pantalla bloquea cambios y ofrece reintentar la misma operación. Un conflicto requiere actualizar y revisar el saldo antes de continuar.

Anular un pago exige permiso, versión y motivo: conserva el registro, fecha y usuario de anulación y reabre el saldo. No modifica inventario ni realiza transferencias bancarias o movimientos de Caja. Una compra recibida sigue sin poder cancelarse; las devoluciones quedan para otra etapa.

Proveedores > Cuenta corriente muestra compras, pagos y saldo pendiente, con dos historiales paginados y acceso al detalle si se dispone de compras.ver. La deuda se calcula únicamente con compras recibidas menos pagos vigentes, en una instantánea consistente de lectura. El historial conserva compras pendientes/canceladas y pagos anulados sin sumarlos a la deuda.

El backend usa IPagoRepository/PagoRepository, IPagoService/PagoService y sus equivalentes CuentaProveedor. El front mantiene pagosCompra.tsx, pagosServicio.ts, pagosTipos.ts y proveedoresCuentaCorriente.tsx con su servicio y tipos. Inicio y Reportes reflejan estas operaciones reales.

## Presupuestos reales

Ejecutar manualmente 014_Presupuestos.sql, ubicado en back/src/NexaBack/Infrastructure/Persistence/Sql, con el backend detenido. Requiere Clientes independientes (009/010), Productos, Inventario y Ventas (011). Crea comercial.presupuestos y comercial.presupuestos_detalles, con auditoría de cabecera/líneas, versiones y vínculo único a la venta. No importa propuestas del template ni modifica existencias. No hay ejecución automática de scripts al iniciar.

Reiniciar backend y renovar la sesión después de asignar presupuestos.ver/crear/editar/aprobar/cancelar/convertir. El script no amplía permisos de perfiles y desactiva el antiguo presupuestos.eliminar: las propuestas se cancelan con motivo, conservando historial. Convertir exige simultáneamente presupuestos.convertir y ventas.crear; consultar la venta exige ventas.ver. Los catálogos y el cálculo permiten crear o editar según los permisos firmados en el token, sin exigir acceso administrativo.

El circuito es Borrador → Aprobado → Convertido. Solo se editan borradores. Borradores y aprobados se pueden cancelar con motivo; un presupuesto convertido no se cancela ni vuelve a convertirse, aunque luego se anule su venta. Vencido es una condición calculada, no un cambio automático de estado: la fecha es inclusiva según el calendario de Argentina. Un borrador vencido puede editarse para renovar su vencimiento; un aprobado vencido ya no se convierte.

Crear o editar permite buscar cliente activo, depósito y productos reales, cantidades, descuento, observaciones y vencimiento. Calcular total consulta el backend y guardar valida que no hayan cambiado las versiones revisadas. Se conservan nombre/documento del cliente, depósito, códigos/nombres/unidades/precios de productos e importes históricos. Los presupuestos no reservan ni descuentan stock y pueden superar las existencias actuales. Se exige un total positivo y se redondea por línea a dos decimales.

Desde el detalle, aprobar congela el borrador. Revisar y convertir consulta precios y stock actuales: muestra precios originales frente a actuales, descuento conservado y nuevo total. El usuario debe confirmar la revisión. La venta usa precios actuales del catálogo y cantidades del presupuesto; si cambia un producto o falta stock después de revisar, la API rechaza la confirmación y exige recalcular. Los importes originales del presupuesto no se reemplazan por los de la venta.

Venta, movimientos de salida, existencias y estado/vínculo del presupuesto se guardan en una sola transacción serializable. La conversión reutiliza el repositorio de Ventas dentro de esa unidad de trabajo. UUID, hash de contenido, versión del presupuesto y de productos impiden duplicar ventas en reintentos o convertir dos veces. Si se pierde una respuesta, las pantallas bloquean edición y permiten reenviar la misma operación. Crear y editar también conservan su identificador de reintento. Las anulaciones/cobros de la venta siguen usando su circuito normal.

Código del front: presupuestosListado.tsx, presupuestosEdicion.tsx, presupuestosDetalle.tsx, presupuestosConversion.tsx, presupuestosServicio.ts y presupuestosTipos.ts. El listado usa paginación, búsqueda y filtros de estado/vencido. Inicio y Reportes consultan las operaciones reales. No se agregó facturación fiscal.

## Inicio y Reportes conectados

No hay SQL nuevo: solo consultas sobre las tablas ya instaladas de Productos/Inventario, Ventas, Compras, Cobros y Pagos. No guarda indicadores ni duplica saldos. Reiniciar backend y recargar front. Se conservan los permisos inicio.ver, reportes.ver y reportes.exportar; si se cambia su asignación, renovar la sesión.

El backend tiene IReportesRepository/ReportesRepository e IReportesService/ReportesService, con endpoints GET /api/inicio, /api/inicio/depositos, /api/reportes, /api/reportes/depositos y /api/reportes/exportar. Las consultas usan una transacción RepeatableRead para mantener consistentes totales, páginas, análisis y exportación. No ejecuta SaveChanges. Los depósitos se filtran por ID real, incluidos inactivos; el selector de cada pantalla es independiente de la antigua selección local por nombre del template.

Inicio muestra ventas confirmadas, compras recibidas, cobros y pagos vigentes del mes hasta hoy. También muestra deuda actual por cobrar/pagar, valorización actual del inventario, productos activos con stock menor o igual al mínimo, últimas 6 ventas confirmadas y gráfico diario de los últimos 7 días. Permite abrir el detalle real de una venta. Las categorías y el stock se consultan desde las tablas actuales, sin datos locales como alternativa ante un error. Con Todos los depósitos se suma el stock de cada producto en todos los depósitos, incluidos los inactivos, y se compara ese total con su mínimo.

Reportes ofrece Ventas, Compras recibidas, Cobros, Pagos, Inventario, Cuentas por cobrar y Cuentas por pagar. Paginación de 20 filas, totales de todos los registros y filtros por depósito y período (hasta 366 días). Ventas usa CreadoEn; compras, RecibidoEn; cobros y pagos, FechaCobro/FechaPago. El período es inclusivo según el calendario de Argentina: para timestamps se consulta desde la medianoche local hasta la medianoche posterior a Hasta. No depende de la zona horaria del servidor. El gráfico diario también agrupa con esa zona horaria.

Los reportes muestran únicamente operaciones vigentes al consultar. Una venta anulada, compra pendiente/cancelada o cobro/pago anulado no suma a sus totales operativos. Las cuentas y el inventario son actuales, de todos los períodos: no representan un cierre histórico. En ventas/compras, los importes aplicados y saldos incluyen todos los cobros/pagos vigentes de la operación, incluso si su fecha cae fuera del período elegido. Las cuentas agrupan por cliente/proveedor y conservan contactos inactivos.

El análisis de ventas incluye costo histórico de sus líneas, margen bruto estimado (total neto menos ese costo), ticket promedio, ventas por día y hasta 5 productos por importe bruto sin el descuento general. El agrupamiento de productos conserva códigos, nombres y unidades históricos. No suma unidades heterogéneas ni usa el costo actual del catálogo para estimar el margen. El inventario se valoriza al costo actual y también se agrupa por categoría actual; incluye productos inactivos para no ocultar existencias.

Inicio filtra las secciones desde el backend según los permisos firmados en el token. Reportes exige reportes.ver y, según la sección, ventas.ver, compras.ver, inventario.ver, clientes.cuenta_corriente o proveedores.cuenta_corriente. El front oculta las secciones que no corresponden; la API rechaza consultas directas sin permiso. Exportar exige además reportes.exportar. No cambia ni amplía perfiles automáticamente.

Exportar CSV completo consulta nuevamente el backend y exporta todas las filas filtradas, no solo la página visible. Cada archivo incorpora depósito, período/situación actual, fecha de generación y totales de esa misma instantánea. Máximo 10.000 filas: si se supera, solicita reducir el filtro y rechaza la exportación completa en lugar de truncarla. El CSV conserva decimales, escapa separadores/comillas y protege los textos interpretables como fórmulas. Imprimir página imprime la vista visible.

El front usa inicioServicio.ts y reportesServicio.ts/reportesTipos.ts/reportesTabla.tsx/reportesColumnas.ts/reportesGraficos.tsx, con comentarios en español. Se retiró el gráfico de demostración con fechas fijas. Configuración conserva su demostración local. No se agregó integración con Caja, bancos ni facturación fiscal.

## Catálogo de tipos de documento

Ejecutar manualmente 015_Tipos_Documento.sql (back/src/NexaBack/Infrastructure/Persistence/Sql), con el backend detenido, después de tener instalados los módulos anteriores hasta Presupuestos (014). Si ya se ejecutaron los scripts previos, ejecutar solo el 015. No volver a ejecutar el antiguo 010 sobre la estructura normalizada.

El script crea catalogo.tipos_documento con Id, Codigo único, Nombre, Activo, Version y fechas/usuarios de creación y modificación. Incorpora como referencias iniciales CI, RUC, PASAPORTE y OTRO, buscando sus IDs por código. Los IDs no están fijos en el código ni en los formularios. Los tipos adicionales cargados en esa tabla aparecen al volver a abrir los formularios, sin recompilar.

Clientes y Proveedores (comercial) y Personas (usuarios) guardan TipoDocumentoId como FK restrictiva al catálogo. El campo de texto anterior de Clientes/Proveedores se transforma mediante correspondencia de códigos y se elimina solo después de validar las relaciones. Cada módulo conserva su tabla, servicio y repositorio. El catálogo tiene ITipoDocumentoRepository/TipoDocumentoRepository e ITipoDocumentoService/TipoDocumentoService.

Las personas y contactos anteriores sin clasificar conservan TipoDocumentoId nulo; no se les asigna CI ni OTRO por suposición. En altas y ediciones, tanto tipo como número son obligatorios. Se valida en el servidor que el ID exista y esté activo. Un registro puede conservar su tipo actual si luego se desactivó; no se permite asignar un tipo inactivo a otro registro.

La unicidad pasa a (TipoDocumentoId, Documento) en cada una de las tres tablas: el mismo número puede pertenecer a tipos distintos y también a módulos distintos. Un índice adicional protege documentos históricos aún sin tipo. Si un número coincide con un registro sin clasificar, primero debe clasificarse ese registro, evitando duplicarlo. Las FKs impiden borrar un tipo utilizado.

El SQL aborta y revierte si encuentra códigos anteriores sin correspondencia, IDs contradictorios o documentos duplicados dentro del mismo tipo/sin clasificar. Conserva IDs de personas/contactos, usuarios, operaciones, stock, saldos y auditoría existente. No usa CASCADE para quitar dependencias externas; si hubiera una, se debe revisar antes de migrar.

GET /api/tipos-documento entrega Id, Codigo, Nombre y Activo. Requiere autenticación y al menos un permiso de consulta/alta/edición de Clientes, Proveedores o Personas. No agrega permisos a perfiles. Se devuelve el catálogo completo para poder representar tipos inactivos existentes; los formularios ofrecen tipos activos y, al editar, el tipo actual inactivo. No hay una lista fija ni una alternativa desde localStorage si falla la API.

Los DTO de Clientes/Proveedores y Personas devuelven tipoDocumentoId y tipoDocumento (descripción). Sus solicitudes de escritura reciben solo tipoDocumentoId numérico. Las búsquedas para Compras/Ventas/Presupuestos y las cuentas corrientes resuelven el nombre mediante la relación. La selección de personas en Usuarios también muestra el tipo para distinguir números iguales de tipos diferentes.

Compras, Ventas y Presupuestos conservan el tipo de documento como dato histórico en sus cabeceras. Los comprobantes nuevos copian la descripción completa del catálogo; los anteriores conservan el código/texto que tenían, incluso si se renombra el catálogo. El SQL amplía esas columnas a 100 caracteres, sin reescribir sus valores ni exigir relaciones nuevas a comprobantes antiguos.

El front comparte tiposDocumentoServicio.ts, tiposDocumentoEstado.ts, tiposDocumentoSelector.tsx y tiposDocumentoTipos.ts. Muestra carga/error/reintento y bloquea guardar sin una selección válida. Reiniciar backend y recargar el front después del SQL. No se agregó un ABM de mantenimiento de este catálogo; esta etapa incorpora tabla, lectura y selección en los tres formularios.

## Retiro de condiciones comerciales del contacto

Ejecutar manualmente 016_Quitar_Condiciones_Comerciales.sql con el backend detenido, después de los scripts anteriores hasta 015. Elimina PlazoPagoDias y LimiteCredito de comercial.clientes y comercial.proveedores y sus restricciones. No conserva ni traslada sus valores a comprobantes. No usa CASCADE ni modifica operaciones, inventario o cuentas corrientes. Reiniciar el backend y recargar el front.

Los formularios, listados, contratos, entidades, validaciones y catálogos del frontend ya no contienen plazo de pago o límite de crédito. Observaciones permanece disponible. Las condiciones de pago por factura quedan pendientes de implementación; este cambio no agrega campos ni reglas a Ventas/Compras.
