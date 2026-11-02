# Aprender React y TypeScript con NEXA

Usá esta guía como una secuencia de ejercicios sobre tu proyecto de ferretería. No hace falta aprender todas las bibliotecas de React para empezar.

## Estado real del proyecto

NEXA utiliza React con TypeScript: `App.tsx`, `main.tsx` y `domain.ts`. `tsconfig.json` activa el modo estricto y `npm.cmd run typecheck` verifica los tipos sin generar archivos.

El backend sigue en ASP.NET Core 10 con C#. Se canceló la migración a MVC/Razor. El login y los usuarios ya usan NexaBack y PostgreSQL; los datos comerciales siguen siendo de demostración en el navegador.

## Abrir el frontend en Visual Studio Code

Abrí el archivo `NEXA.Frontend.code-workspace` de esta carpeta. El workspace muestra la raíz que contiene `package.json` y oculta artefactos y archivos del backend en el explorador, sin borrarlos.

También podés usar Archivo → Abrir carpeta y seleccionar:

```text
C:\NEXA\front\nexa\nexa
```

No abras solo `src`: npm y Vite necesitan la raíz del proyecto.

En Terminal → Nueva terminal:

```powershell
npm.cmd run dev
```

Abrí la dirección que muestra Vite, habitualmente `http://localhost:5173`. Si faltan dependencias, ejecutá antes `npm.cmd ci`.

El login utiliza `/api/usuarios/auth/login`; el token se guarda en authSession.ts y se envía como Bearer desde api.ts. Configuramos Vite para reenviar esas llamadas al backend en `https://localhost:44388`. Ese backend debe estar funcionando; si ya lo tenés iniciado, no lo arranques por segunda vez.

Si ASP.NET Core utiliza otro puerto, tomá su URL HTTP real e iniciá Vite así:

```powershell
$env:NEXA_API_URL = 'http://localhost:49841'
npm.cmd run dev
```

El puerto es un ejemplo: reemplazalo por el tuyo. Reiniciá Vite cuando cambies esta variable. Usá puertos distintos para frontend y backend.

En el servidor de Vite, guardar un archivo actualiza la vista de desarrollo. En la aplicación servida por .NET, necesitás `npm.cmd run build` para actualizar `dist/client`. No edites `dist`: se regenera.

## Archivos para leer primero

| Archivo | Qué hace |
|---|---|
| `package.json` | Define dependencias y comandos: dev y build |
| `src/main.tsx` | Inicia React y monta App |
| `src/App.tsx` | Contiene componentes y pantallas; buscá Inventory y SaleEditor |
| `src/domain.ts` | Datos y reglas de la maqueta; buscá checkout y applyMovement |
| `src/styles.css` | Diseño general y adaptación a celular |
| `src/features/auth/Login.tsx` | Formulario de acceso con clases de Tailwind |
| `src/tailwind.css` | Entrada de estilos y colores del tema |
| `public/assets` | Logo y fotos |
| `vite.config.mjs` | Configuración de Vite y proxy de API |

Usá Ctrl+P para abrir archivos y Ctrl+Shift+F para buscar. `App.tsx` es grande porque nació como maqueta: conviene dividirlo gradualmente, no usarlo como modelo definitivo de organización.

## Conceptos desde tu experiencia con C#

| Concepto | Cómo entenderlo |
|---|---|
| Componente | Función que describe una parte de la pantalla mediante JSX |
| Props | Parámetros de entrada; no se modifican desde el componente receptor |
| State / useState | Datos que cambian y provocan un nuevo render al actualizarse |
| JSX / TSX | Sintaxis para describir interfaz dentro del código |
| Evento | Función que responde a un clic, escritura o envío |
| type / interface | Contrato de TypeScript; no valida por sí solo una respuesta HTTP |
| useEffect | Sincroniza con un sistema externo; no es necesario para cada cálculo |

Los datos bajan a los componentes y las acciones se comunican mediante funciones. Evitá modificar manualmente el DOM que controla React.

## Buenas prácticas aplicadas al proyecto

1. **Componentes con responsabilidad clara.** Extraé primero Login a su archivo; después Inventory y SaleEditor. Compartí controles pequeños como Button y Modal.
2. **Separá pantalla, API y reglas.** La pantalla muestra datos y eventos; un servicio hace HTTP; las funciones puras calculan. En producción, stock, cobros, precios y permisos deben validarse también en C#.
3. **Contratos tipados.** Tipá productos, usuarios, props y respuestas. Usá uniones para estados conocidos y evitá resolver todos los errores con `any`.
4. **Mínimo estado.** Guardá el texto de búsqueda y calculá la lista filtrada. No guardes copias de información que ya podés derivar.
5. **Actualizaciones inmutables.** Usá map, filter y copias. Si el siguiente valor depende del anterior, preferí `setCantidad(anterior => anterior + 1)`.
6. **Efectos con propósito.** Un filtro o total normalmente no necesita useEffect. Confirmar una venta pertenece al evento del botón, no a un efecto que observa cambios de estado.
7. **Estados completos de UI.** Contemplá cargando, vacío, éxito y error. Deshabilitá el envío mientras se procesa y evitá ocultar errores con un catch vacío.
8. **Accesibilidad.** Labels para inputs, botones nativos, foco visible, teclado y claves estables como `key={producto.id}`.
9. **Tipos no equivalen a seguridad.** TypeScript no reemplaza validación ni autorización del servidor. No pongas secretos ni contraseñas reales en el frontend o variables VITE_*.
10. **Cambios pequeños y comprobables.** Una venta debe descontar stock una sola vez; una venta inválida debe rechazarse. Usá Git para guardar avances y revisar diferencias.

## Primer ejemplo de React con TypeScript

Ejemplo didáctico: todavía no forma parte del runtime de NEXA.

```tsx
import { useState } from 'react';

type Producto = {
  id: number;
  nombre: string;
  stock: number;
};

type Props = {
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
};

export function BuscadorProductos({ productos, onSeleccionar }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const visibles = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <section>
      <label htmlFor="buscar-producto">Buscar producto</label>
      <input
        id="buscar-producto"
        value={busqueda}
        onChange={evento => setBusqueda(evento.target.value)}
      />
      {visibles.length === 0 ? (
        <p>No se encontraron productos.</p>
      ) : (
        <ul>
          {visibles.map(producto => (
            <li key={producto.id}>
              <button onClick={() => onSeleccionar(producto)}>
                {producto.nombre} · Stock: {producto.stock}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

Leelo en este orden: contrato Producto, props, estado, filtro calculado y JSX. El padre entrega productos y recibe la selección mediante onSeleccionar. No necesitamos un efecto para filtrar.

## TypeScript ya está configurado

- `.ts` contiene tipos y lógica sin JSX: `types.ts`, `domain.ts` y servicios.
- `.tsx` permite escribir componentes con JSX: `App.tsx`, `Login.tsx` y `ui.tsx`.
- `src/types.ts` define los contratos de la API y los modelos comerciales. Para quien viene de C#, una `interface` describe la forma de un DTO, pero desaparece al compilar: las respuestas HTTP siguen necesitando validación en ejecución.
- `src/uiTypes.ts` define las props, los formularios y el contexto compartido de React.
- `tsconfig.json` activa `strict: true`. No usamos `any` ni desactivamos la comprobación de archivos.

```powershell
npm.cmd run typecheck # Comprueba los tipos sin generar archivos
npm.cmd run build     # Comprueba los tipos y después compila con Vite
```

Por ejemplo, `api<SessionUserDto>(...)` indica qué respuesta esperamos del backend. Es comparable a `ReadFromJsonAsync<UsuarioSesionDto>()` en C#: ayuda a detectar errores de propiedades, sin sustituir la validación del servidor.

Estructura objetivo (todavía no creada):

```text
src/
  app/                # Composición, rutas y proveedores
  components/         # Controles reutilizables
  features/
    auth/             # Login y sesión
    inventory/        # Productos y movimientos
    sales/            # Ventas y presupuestos
  services/           # HTTP y comunicación con C#
  types/              # Contratos compartidos cuando haga falta
  styles/
```

No agregues Redux u otras bibliotecas por anticipado; incorporalas cuando exista un problema concreto que lo justifique.

## Ruta de aprendizaje con ejercicios

1. **JavaScript:** objetos, arrays, destructuring, map, filter, módulos y async/await. Filtrá productos por stock bajo sin modificar el array.
2. **Componentes y props:** leé Login, Button y Field. Extraé Login y verificá que se vea y funcione igual.
3. **Estado y eventos:** agregá un filtro por marca en Inventory y un botón para limpiarlo.
4. **TypeScript:** tipá Producto y un componente pequeño. Un stock con texto debe dar error de tipos antes de ejecutar.
5. **API:** revisá la función api actual. Mostrá cargando, error y respuesta al consultar un endpoint de prueba.
6. **Recorrido completo:** recorré una venta, impedí el doble envío y comprobá el stock resultante.

Primera sesión recomendada: separar y entender el login. Es un cambio pequeño y fácil de comprobar.

## Documentación oficial

- [Aprender React](https://react.dev/learn)
- [Pensar en componentes y estado](https://react.dev/learn/thinking-in-react)
- [React con TypeScript](https://react.dev/learn/typescript)
- [Cuándo no usar un efecto](https://react.dev/learn/you-might-not-need-an-effect)
- [Tipos de TypeScript](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Proxy de desarrollo en Vite](https://vite.dev/config/server-options.html#server-proxy)
- [TypeScript en Vite](https://vite.dev/guide/features.html#typescript)

## Estilos con Tailwind

El login está separado en src/features/auth/Login.tsx y utiliza Tailwind CSS. Consultá docs/TAILWIND.md para editar sus clases y colores. El resto conserva CSS durante la migración gradual.


