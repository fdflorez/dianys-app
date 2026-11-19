# Dianys Technology · Tienda online (app móvil híbrida)

Aplicación móvil híbrida de la tienda **Dianys Technology**, construida con **Ionic 9 + Angular 22 + Capacitor 8**.
Un solo código fuente genera la app de **Android** (carpeta `android/`) y de **iOS** (carpeta `ios/`).

Proyecto del curso *Desarrollo de Aplicaciones Móviles Híbridas* (Ingeniería de Software, Fundación Universitaria UCompensar),
etapa **Demuestra · Actividad 6: publicación y distribución**.

| | |
|---|---|
| Identificador (appId / Bundle ID) | `com.dianystech.app` |
| Versión | `1.0.0` · versionCode / Build `1` |
| Android | minSdk 24 · targetSdk / compileSdk **36** |
| iOS | Xcode 16+ · Swift Package Manager |
| Política de privacidad | <https://fdflorez.github.io/dianys-app/privacidad.html> |

## Funcionalidades exigidas

| Requisito | Dónde está | Qué hace |
|---|---|---|
| **Autenticación** | `src/app/services/auth.service.ts`, `src/app/login/`, `src/app/guards/auth.guard.ts` | Inicio de sesión contra `POST /auth/login` (token JWT), validación del token con `GET /auth/perfil`, sesión persistente, guard que protege las pestañas y cierre de sesión. |
| **Servicios API** | `src/app/services/catalogo.service.ts` | Consume la API REST de la tienda (PHP + MySQL): catálogo `GET /dispositivos` con búsqueda, y autenticación. Prueba varias URL y tiene catálogo de respaldo sin conexión. |
| **Carrito de compras** | `src/app/services/carrito.service.ts`, `src/app/tab4/` | Agregar, quitar, cambiar cantidades (sin superar el stock), total, distintivo en la pestaña, confirmación del pedido por WhatsApp e historial de pedidos. |
| **Almacenamiento local** | `@capacitor/preferences`, `@capacitor/filesystem` | Guarda sesión, carrito, pedidos, URL de la API y fotos; todo sigue ahí al cerrar y abrir la app. |

Pestañas: **Catálogo** · **Carrito** · **Fotos** (cámara para el servicio técnico) · **Tienda** (cuenta, servicios y ajustes).

## Requisitos

- Node.js 22 o superior y npm
- Android Studio (SDK 36 y JDK 21 incluido)
- Xcode 16 o superior en macOS (solo para compilar iOS)
- XAMPP con el proyecto web `dianys_technology` (la API REST) encendido

## Instalación y ejecución

```bash
npm install
npm start                 # navegador: http://localhost:4200 (proxy a XAMPP)
npm test -- --watch=false # pruebas unitarias (Vitest)
npm run lint              # ESLint
```

Cuentas de prueba de la API (base de datos de ejemplo del proyecto web):

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `cliente@dianystech.com` | `cliente123` |
| Administrador | `admin@dianystech.com` | `admin123` |

### URL de la API

| Dónde corre la app | URL |
|---|---|
| Navegador | `http://localhost:4200/dianys_technology/api/v1` (proxy) |
| Emulador Android | `http://10.0.2.2/dianys_technology/api/v1` |
| Celular por USB | `http://127.0.0.1/dianys_technology/api/v1` + `adb reverse tcp:80 tcp:80` |
| Celular por Wi-Fi | IP del PC, por ejemplo `http://192.168.1.10/dianys_technology/api/v1` |

La URL se cambia en **Login › Configurar servidor** o en **Tienda › Conexión con la API REST**.

## De Ionic a las tiendas en 6 pasos

### Paso 0 · Preparación (común a Android e iOS)

1. **Identificador único:** `com.dianystech.app` en `capacitor.config.ts` (no se puede cambiar después de publicar).
2. **Íconos y splash:** a partir de `assets/icon-only.png` (1024 × 1024) y `assets/splash.png`:
   `npx @capacitor/assets generate --android --ios`
3. **Versión:** `1.0.0 (1)` → Android: `versionName` / `versionCode` en `android/app/build.gradle`;
   iOS: `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`. Se aumenta en cada actualización.
4. **Build de producción:** `npm run build:prod` (sin `console.log`, sin mapas de código, `enableProdMode`).
5. **Política de privacidad:** `docs/privacidad.html`, publicada con GitHub Pages.
6. **Material de la ficha:** `docs/ficha/` (descripciones, ícono 512 × 512, gráfico 1024 × 500) y capturas en `docs/pruebas/`.

### Pasos 1 a 6

```bash
npm run build:prod        # 1. Compilar la web (carpeta www)
npx cap add android       # 2. Agregar plataformas (ya incluidas en el repositorio)
npx cap add ios
npx cap sync              # 3. Copiar la web y los plugins a cada plataforma
npx cap open android      # 4. Abrir el IDE (o: npx cap open ios)
```

5. **Android – firmar:** Android Studio › *Build › Generate Signed Bundle / APK* › *Android App Bundle*.
   Por consola: crear `android/keystore.properties` (ver plantilla abajo) y ejecutar `npm run android:bundle`.
   Resultado: `android/app/build/outputs/bundle/release/app-release.aab`.
6. **iOS – archivar (macOS):** Xcode › seleccionar *Any iOS Device* › *Product › Archive* › *Distribute App* › *App Store Connect*.

Plantilla de `android/keystore.properties` (este archivo y el `.jks` **no** se suben al repositorio):

```properties
storeFile=C:/ruta/segura/dianys-upload.jks
storePassword=********
keyAlias=dianys
keyPassword=********
```

### Google Play (requiere cuenta de desarrollador, US$25)

1. Crear la cuenta en Play Console y verificar la identidad.
2. Generar el `.aab` firmado (paso 5).
3. Crear la app: nombre, idioma, app, gratis.
4. Completar *Contenido de la app*: política de privacidad, seguridad de los datos, clasificación, público objetivo y anuncios (ver `docs/ficha/ficha-tienda.md`).
5. Armar la ficha: descripciones, ícono 512 × 512, gráfico de funciones 1024 × 500 y capturas.
6. Subir el `.aab` a **Prueba cerrada**.
7. Mantener **12 testers durante 14 días** (cuentas personales creadas después del 13 nov 2023).
8. Solicitar acceso a producción.
9. Publicar en Producción.
10. Actualizar: cada versión nueva lleva un `versionCode` mayor y apunta a la API 36.

### App Store (requiere Apple Developer Program, US$99/año)

En App Store Connect se crea la app con el Bundle ID `com.dianystech.app`, se sube el archivo desde Xcode,
se prueba con TestFlight y se envía a revisión con la misma ficha y política de privacidad.

## Seguridad

- Contraseñas cifradas con bcrypt en el servidor; la app solo guarda el token JWT, que vence en 2 horas.
- Las rutas de la tienda están protegidas por un guard; un token vencido o rechazado (401) cierra la sesión.
- `android:allowBackup="false"` evita que la sesión se copie en respaldos.
- El keystore de firma y sus claves están fuera del repositorio (`.gitignore`).
- `usesCleartextTraffic` y `NSAllowsLocalNetworking` solo existen para consumir la API local de XAMPP por `http`;
  en producción la API debe publicarse con HTTPS y esas opciones se retiran.

## Estructura

```
dianys-app/
├── android/                  Proyecto nativo Android (firma en build.gradle)
├── ios/                      Proyecto nativo iOS (Xcode)
├── assets/                   Ícono y splash fuente (1024 / 2732 px)
├── docs/                     GitHub Pages: privacidad, ficha y evidencias de pruebas
├── capacitor.config.ts       appId com.dianystech.app
└── src/app/
    ├── login/                Inicio de sesión
    ├── guards/               Protección de rutas
    ├── services/             auth, catálogo (API), carrito, fotos
    ├── tab1/                 Catálogo
    ├── tab2/                 Fotos del equipo
    ├── tab3/                 Tienda y cuenta
    └── tab4/                 Carrito y pedidos
```

## Equipo

- Laura Vanessa Medina Perdomo
- Andrés Sebastián Cabrera Monguí
- Fabian David Flórez Puerta

Docente: Julio Cesar Bolano Pérez · 2026
