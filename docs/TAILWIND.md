# Tailwind en NEXA

Tailwind CSS 4 está integrado con Vite. El login ya usa Tailwind; las demás pantallas conservan sus estilos CSS y pueden migrarse por etapas.

## Dónde editar

- `src/modulos/autenticacion/autenticacionInicioSesion.tsx`: estructura, comportamiento y clases del login.
- `src/tailwind.css`: entrada de estilos y colores de NEXA definidos con `@theme`.
- `src/styles.css`: estilos existentes de las otras pantallas.
- `src/components/ui.tsx`: componentes compartidos.

Usamos el prefijo `tw:` para evitar conflictos con las clases existentes. No activamos Preflight durante esta migración para preservar las pantallas actuales.

## Ejemplo

```jsx
<button className="tw:rounded-lg tw:bg-nexa-blue tw:px-4 tw:py-2 tw:text-white tw:hover:bg-nexa-blue-hover">
  Guardar
</button>
```

- `rounded-lg`: esquinas redondeadas.
- `bg-nexa-blue`: color de fondo definido en el tema.
- `px-4` y `py-2`: espacio interior horizontal y vertical.
- `text-white`: texto blanco.
- `hover:bg-nexa-blue-hover`: color al pasar el cursor.
- `md:grid-cols-2`: dos columnas desde el tamaño mediano; con prefijo se escribe `tw:md:grid-cols-2`.

Para modificar el azul de la marca, cambiá `--color-nexa-blue` en `src/tailwind.css`. Se actualizan todos los elementos que utilizan esa clase.

Escribí las clases completas: `activo ? 'tw:bg-green-600' : 'tw:bg-gray-300'`. Evitá construir nombres como `tw:bg-${color}-600`, porque el compilador necesita detectar los nombres completos.

## Probar cambios

Ejecutá `npm.cmd run dev` y guardá el componente para ver los cambios. Para actualizar la versión servida por .NET, ejecutá `npm.cmd run build`.

En VS Code podés instalar la extensión oficial Tailwind CSS IntelliSense, identificador `bradlc.vscode-tailwindcss`, para obtener sugerencias de clases.

Referencia: https://tailwindcss.com/docs/installation/using-vite
