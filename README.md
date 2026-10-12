# Sistema de Control de Servicios - Condominio Playa La Honda

La aplicación gestiona propiedades, personal, facturación y lecturas de agua/luz con PostgreSQL, Angular y una API Spring Boot protegida con JWT.

## Stack

- **Backend:** Java 21, Spring Boot 3.2.5, Spring Security y JPA.
- **Frontend:** Angular 20 y CSS.
- **Base de datos:** PostgreSQL.

## Despliegue con Docker Compose

Docker Compose levanta PostgreSQL, la API Spring Boot y Angular servido por Nginx. PostgreSQL conserva los datos en el volumen `postgres_data`, y Flyway crea o actualiza el esquema cuando arranca la API. La aplicación se publica por el proxy compartido bajo `/proyecto2/`; la raíz queda reservada para la landing del cliente y ningún puerto interno de la aplicación se publica al host.

Requisitos: Docker Desktop en Windows (o Docker Engine y el plugin Compose en Linux), y acceso a internet para descargar imágenes y dependencias la primera vez.

Desde la raíz del proyecto, crea el archivo local de entorno y reemplaza sus marcadores:

```powershell
Copy-Item .env.example .env
notepad .env
```

`JWT_SECRET` debe tener al menos 32 bytes aleatorios y mantenerse igual entre reinicios. Las contraseñas deben tener entre 12 y 72 bytes UTF-8; guarda `.env` de forma privada y no lo incluyas en control de versiones. Define `FRONTEND_ORIGIN` como el origen público sin subruta y `PASSWORD_RESET_BASE_URL` como la dirección completa bajo `/proyecto2/`. La plantilla muestra HTTP solo para pruebas; una instalación comercial requiere HTTPS y las URL públicas correspondientes. Si PostgreSQL aún no tiene una cuenta administradora activa, define también `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD`; el backend crea esa cuenta en el primer arranque. El bootstrap no altera una cuenta administradora activa que ya exista.

Arranca los servicios desde la misma carpeta:

```powershell
docker network create web
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Si la red `web` ya existe porque otro proyecto usa el proxy, no la vuelvas a crear; compruébala con `docker network inspect web`. Inicia también el proxy compartido y abre `http://localhost/proyecto2/` en pruebas locales, o la URL HTTPS del cliente. Los QR de propiedad usan el origen de la página y la subruta desde donde se generan.

El backend y la base de datos no publican puertos al host: solo son accesibles desde la red privada de Compose. Los secretos se entregan a los contenedores desde `.env`; el ejemplo incluye los ajustes opcionales de SMTP. No compartas la salida de `docker compose config` porque puede mostrar variables resueltas.

Para actualizar después de cambiar el código, ejecuta `docker compose up -d --build`; conserva `postgres_data` y el mismo `JWT_SECRET`. No uses `docker compose down -v` en un entorno con datos que quieras mantener, porque elimina el volumen persistente de PostgreSQL. Programa respaldos de la base de datos antes de actualizar o migrar una instalación con información real.

## Puesta en marcha

### 1. Base de datos

Para una instalación nueva, crea una base de datos PostgreSQL vacía; Flyway crea y versiona el esquema automáticamente al iniciar el backend. `database_schema.sql` se conserva solo como referencia/bootstrap legado: no lo ejecutes sobre una base existente ni junto con Flyway.

Para una base existente, haz primero un respaldo. Flyway marca el esquema existente como baseline versión 1 y aplica las migraciones posteriores, incluyendo los campos y tablas nuevos. La conversión de fechas antiguas con zona horaria conserva la hora local de la zona configurada en la sesión de PostgreSQL. Mantén alineada esa zona con la del proceso Java. Hibernate valida el esquema (`ddl-auto=validate`); no elimina ni recrea datos y no debe usarse `ddl-auto=update` como mecanismo de migración.

### 2. Backend

La conexión usa estas variables de entorno; si tu instancia no es la local indicada, establece `DB_URL` con su URL JDBC completa. La contraseña de PostgreSQL ya no está guardada en el archivo de configuración:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/condominio_db"
$env:DB_USERNAME = Read-Host "Usuario de PostgreSQL"
$secureDbPassword = Read-Host "Contraseña de PostgreSQL" -AsSecureString
$dbPasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureDbPassword)
try {
    $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPasswordPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPasswordPointer)
    $secureDbPassword.Dispose()
}
```

`DB_URL` y `DB_USERNAME` tienen valores locales de desarrollo si se omiten; `DB_PASSWORD` no tiene valor predeterminado y debes configurarla cuando PostgreSQL la requiera. `JWT_SECRET` debe ser un secreto aleatorio de al menos 32 bytes, igual en cada reinicio del mismo entorno. No guardes secretos en el repositorio.

#### Cargar datos de demostración

Para poblar una instalación local con datos ficticios, ejecuta `backend/scripts/demo-data.sql` desde pgAdmin en la base `condominio_db`. El script agrega tres propiedades, personas ficticias, seis medidores, catorce lecturas y hasta siete facturas de muestra (usa las tarifas vigentes existentes y solo crea una demostrativa si no hay tarifas futuras o actuales); es transaccional e idempotente y no borra ni actualiza registros existentes. Requiere que exista al menos una cuenta activa de staff para asociar las lecturas. No lo ejecutes en producción: los datos de demostración se muestran en las mismas pantallas que los registros reales.

**Si aparece el error `JWT_SECRET no está configurado` al arrancar**, el proceso que inicia Spring Boot no recibió esa variable o su valor tiene menos de 32 bytes. Este fallo ocurre antes de que el backend se conecte a PostgreSQL o cree el administrador; no indica un problema con los datos de la base. Ejecuta `mvn spring-boot:run` desde la misma terminal PowerShell donde configuraste las variables de entorno. Si lo inicias desde IntelliJ, agrega `JWT_SECRET`, `DB_PASSWORD` y, para el primer arranque, `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD` en **Run > Edit Configurations > Environment variables** de la configuración Spring Boot. Las variables definidas en una terminal no se aplican automáticamente a una instancia de IntelliJ ya abierta.

#### Crear el primer administrador

El backend no incluye credenciales predeterminadas. Define tú mismo el nombre de usuario y una contraseña de al menos 12 caracteres y como máximo 72 bytes UTF-8 mediante `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD`. No pongas la contraseña en archivos del proyecto ni la compartas en logs.

En PowerShell, establece las variables solo en la sesión desde la que iniciarás el backend. Genera `JWT_SECRET` una vez por entorno y conserva el mismo valor entre reinicios; cambiarlo invalida los tokens existentes. La contraseña inicial se solicita de forma oculta:

```powershell
$jwtGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
$jwtBytes = New-Object byte[] 32
$jwtGenerator.GetBytes($jwtBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
$jwtGenerator.Dispose()
[Array]::Clear($jwtBytes, 0, $jwtBytes.Length)

$env:BOOTSTRAP_ADMIN_USERNAME = Read-Host "Nombre de usuario del administrador"
$securePassword = Read-Host "Contraseña inicial (12-72 bytes UTF-8)" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $env:BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $securePassword.Dispose()
}
```

El arranque crea una cuenta activa con rol `admin` si todavía no hay un administrador activo. La contraseña se almacena con BCrypt y no se imprime. Si falta una de las dos variables, falta la configuración cuando aún no existe administrador, o el usuario ya está ocupado por una cuenta no administradora, el backend falla con un mensaje explícito en vez de continuar sin una cuenta para iniciar sesión. Si ya existe un administrador activo, el bootstrap no modifica ninguna cuenta.

Inicia el backend en esa misma terminal:

```powershell
Set-Location .\backend
mvn test
mvn spring-boot:run
```

En otra terminal, inicia el frontend con los pasos de la sección 3. Una vez que esté disponible en `http://localhost:4200`, inicia sesión con el usuario y la contraseña que configuraste. El formulario acepta las cuentas configuradas; el administrador inicial tiene rol `admin`, y las cuentas posteriores pueden tener rol `admin` o `operador`.

Para retirar las variables de bootstrap, detén el backend con `Ctrl+C`, ejecuta lo siguiente y vuelve a iniciarlo. La cuenta creada permanece en PostgreSQL:

```powershell
Remove-Item Env:BOOTSTRAP_ADMIN_USERNAME
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
```

Las cuentas de personal se crean desde **Gestión de Staff** con una contraseña de al menos 12 caracteres; también se almacena con BCrypt. Para cambiar una contraseña, edita la cuenta y escribe una nueva; dejar el campo vacío conserva el hash actual. El login de API está disponible en `POST /api/auth/login`. Las rutas administrativas requieren rol `admin`; el personal autenticado puede consultar información de medidores por QR y registrar lecturas. La API solo permite el origen indicado en `FRONTEND_ORIGIN` (por defecto `http://localhost:4200`).

#### Recuperar una contraseña

Para recuperar una cuenta por correo, configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `MAIL_FROM`, `PASSWORD_RESET_BASE_URL` y opcionalmente `PASSWORD_RESET_EXPIRATION_MINUTES`. La dirección debe estar asociada a una cuenta activa. El backend envía un enlace de un solo uso; guarda solo el hash SHA-256 del token y expira de forma configurable. La respuesta de solicitud no revela si el correo existe. Si SMTP no está configurado, la interfaz muestra el error de configuración explícitamente. El restablecimiento invalida las sesiones JWT previas. El correo no se usa para solicitudes de propietarios no aprobadas.

Si no puedes acceder al administrador o no hay correo asociado, recupera la cuenta mediante un arranque controlado: en **Run > Edit Configurations > Environment variables** de IntelliJ agrega `ADMIN_RECOVERY_USERNAME` con el usuario existente del administrador activo y `ADMIN_RECOVERY_PASSWORD` con una contraseña nueva de 12 a 72 bytes UTF-8. Inicia el backend una vez; el proceso reemplaza la contraseña usando BCrypt. Si el usuario indicado no existe y la base no tiene ningún administrador activo, crea un primer administrador con ese usuario y contraseña; si ya existe otro administrador, no crea cuentas y debes indicar exactamente su usuario. Luego detén el backend, elimina ambas variables de la configuración de ejecución y vuelve a iniciarlo normalmente. No dejes estas variables configuradas: cada arranque mientras estén presentes vuelve a establecer esa contraseña.

Para otros usuarios, un administrador autenticado puede crear cuentas de staff en **Administración > Staff > Crear usuario de staff** o cambiar la contraseña desde la edición de la cuenta. Los propietarios solicitan cuenta desde el enlace de la pantalla de inicio de sesión; el administrador verifica y aprueba la solicitud en la misma sección.

Los propietarios pueden solicitar una cuenta desde **¿Eres propietario? Solicita una cuenta** en la página de inicio de sesión. Deben enviar sus datos de identidad, un usuario, una contraseña de al menos 12 caracteres y el código interno o número de casa. La solicitud no crea una cuenta activa ni da acceso hasta que un administrador la revise en **Gestión de Staff > Solicitudes de propietarios**, verifique los datos y la asocie al inmueble indicado. Al aprobarse, el propietario podrá iniciar sesión y consultar sus inmuebles asociados, lecturas y facturas; no podrá registrar lecturas ni entrar a las funciones administrativas. Las solicitudes rechazadas se eliminan. Si la solicitud tiene correo, el sistema envía un mensaje de aprobación o rechazo. El SMTP debe estar configurado antes de resolver solicitudes con correo; si el envío falla, la operación se revierte y administración recibe un error explícito.

La tabla de solicitudes pendientes y las de notificaciones/tokens se crean mediante migraciones; no es necesario borrar ni recrear la base de datos.

### 3. Frontend

En desarrollo, `frontend/src/environments/environment.ts` usa `http://localhost:8080/api`. El build de producción usa `/api` relativo, para servir la aplicación detrás de un reverse proxy que reenvíe `/api` al backend sin fijar un proveedor de hosting. Ejecuta:

```powershell
Set-Location .\frontend
npm install
npm run start
```

El token se conserva durante la sesión del navegador y se adjunta a las solicitudes protegidas. La integración continua en `.github/workflows/ci.yml` ejecuta pruebas backend y build de producción Angular.

### Correo Gmail / SMTP

El backend queda preparado para Gmail SMTP con TLS explícito en el puerto 587. En la cuenta remitente activa la verificación en dos pasos y genera una **contraseña de aplicación** para esta aplicación; no uses la contraseña normal de Gmail. Configura las variables en **IntelliJ > Run > Edit Configurations > Environment variables** de la ejecución del backend (o en el gestor de secretos del servidor). Nunca compartas ni guardes la contraseña en el repositorio.

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<correo completo de Gmail>
SMTP_PASSWORD=<contraseña de aplicación de Google>
SMTP_AUTH=true
SMTP_STARTTLS=true
SMTP_STARTTLS_REQUIRED=true
MAIL_FROM=<correo remitente; por defecto SMTP_USERNAME>
PASSWORD_RESET_BASE_URL=http://localhost:4200/login/restablecer
PASSWORD_RESET_EXPIRATION_MINUTES=30
APP_TIME_ZONE=America/Lima
```

El remitente debe ser la misma cuenta de Gmail autenticada o un alias verificado en ella. Para producción, reemplaza `PASSWORD_RESET_BASE_URL` por la URL HTTPS pública del frontend. Reinicia el backend después de añadir o cambiar variables. Si falta alguna credencial, los flujos de correo responden con un error explícito en vez de intentar enviar con valores ficticios.

Los mensajes de recuperación y de aprobación/rechazo de solicitudes usan una plantilla HTML formal con los colores institucionales azul marino y turquesa, acento coral, logotipo PNG incrustado mediante CID y alternativa de texto plano. Para comprobar el envío, inicia el frontend y el backend con las variables anteriores y usa **¿Olvidaste tu contraseña?** con una dirección asociada a una cuenta activa. El mensaje de recuperación solo se envía a cuentas con correo registrado. También se envía correo cuando el administrador aprueba o rechaza una solicitud de propietario que tenga email. La respuesta del formulario no revela si la dirección está registrada.

El SMTP también se usa para notificar al propietario la decisión de su solicitud. Con la zona configurada en `APP_TIME_ZONE`, el backend marca diariamente como vencidas las facturas pendientes cuyo plazo ya pasó y crea una notificación administrativa; el horario predeterminado es 08:00. Los tokens usados/caducados se limpian diariamente. Los horarios se pueden ajustar con `APP_BILLING_OVERDUE_CRON` y `APP_PASSWORD_RESET_CLEANUP_CRON`.

## Flujos

- **Propiedades:** altas, cambios y eliminación; el responsable de pago se elige entre las personas ya registradas.
- **Medidores y tarifas:** inventario CRUD, asociación opcional de tarifa vigente y control de vigencias que evita solapamientos para cada servicio.
- **Lecturas:** historial paginado con filtros por servicio, inmueble, rango de fechas y búsqueda; la captura registra GPS opcional con permiso del navegador y acepta URL de evidencia.
- **Personal:** creación y edición de cuentas; las contraseñas se solicitan al crear o al cambiarla. No se permite eliminar una cuenta con lecturas históricas; debe desactivarse.
- **Propietarios:** autorregistro sujeto a aprobación administrativa y asociación verificada al inmueble; acceso de solo lectura a sus inmuebles, lecturas y facturas.
- **Facturación:** se generan facturas para lecturas del mes actual (sin incluir fechas futuras) que aún no tengan factura, aplicando la tarifa vigente en la fecha de emisión y con vencimiento a 15 días. El estado de pago puede actualizarse; los reportes filtrados de facturas se exportan a CSV o PDF con el logo y la identidad visual institucional. El inventario del dashboard también se exporta en ambos formatos.
- **Notificaciones:** los eventos se persisten y se entregan por separado a cada administrador activo; marcar una notificación como leída no cambia la bandeja de los demás.
- **Lecturas:** el personal escanea el QR o introduce el UUID del medidor. La lectura no puede ser menor que la última lectura guardada.

Las cuentas iniciales de personas, propiedades, medidores y tarifas deben existir en PostgreSQL antes de operar los flujos que las requieren.

## Sistema visual de la aplicación

### Tokens

| Uso | Token / valor | Contraste aproximado sobre blanco |
|---|---|---:|
| Fondo de aplicación | `#F9FAFB` | — |
| Superficie de tarjeta | `#FFFFFF` | — |
| Texto principal | `#111827` | 17.74:1 |
| Texto secundario | `#4B5563` | 7.56:1 |
| Encabezado de tabla | `#374151` | 10.31:1 |
| Borde | `#E5E7EB` | — |
| Marca | `#003B73` | 11.21:1 |
| Acento turquesa | `#007F8D` | 4.75:1 |
| Éxito | `#166534` | 7.13:1 |
| Advertencia | `#92400E` | 7.09:1 |
| Error | `#991B1B` | 8.31:1 |

Contrastes calculados según WCAG 2.1. El texto normal debe alcanzar al menos 4.5:1 y el texto grande 3:1. Las escalas tipográficas usan una sans-serif del sistema, con cuerpo de 12–14 px, títulos de módulo de 24 px y títulos de tarjetas de 13–15 px. Las superficies usan borde fino y sombra multicapa sutil (`--shadow-card`). Las transiciones comparten `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` y duran 150–250 ms; `prefers-reduced-motion` reduce el movimiento.

### Arquitectura de layout

El shell del administrador combina sidebar persistente y topbar global. La topbar queda reservada para notificaciones, perfil y cierre de sesión; el nombre del módulo aparece una sola vez en el contenido. El portal de propietarios, autenticación y captura de lecturas usan los mismos tokens, superficies y patrones de formulario en sus shells adaptados al flujo. El área de trabajo se desplaza verticalmente, conserva al menos 48 px de espacio inferior y centra contenido dentro de un ancho máximo. Los módulos usan encabezado propio con su acción principal a la derecha; el dashboard utiliza una grilla de 12 columnas para sus KPI y reorganiza los paneles en pantallas estrechas.

### Patrones de componentes

- **KPI:** superficie blanca, borde `#E5E7EB` y sombra tenue; los acentos se limitan al icono, indicador o barra de progreso.
- **Tablas:** controles de búsqueda/estado arriba; encabezados `#374151`, peso 600+; paginación inferior con filas por página y navegación.
- **Estado vacío:** icono, título, explicación y CTA directo. Si la búsqueda no encuentra coincidencias, se ofrece limpiar filtros.
- **Interacción:** foco visible, controles con nombres accesibles, movimiento corto al aparecer/hover y sin animación cuando el usuario solicita movimiento reducido.

La interfaz está implementada con componentes Angular standalone y CSS del proyecto; se conservan las dependencias existentes en lugar de introducir Tailwind o Framer Motion en un frontend Angular.

### Notificaciones

La campana consulta `GET /api/notifications` cada 30 segundos. El backend registra notificaciones persistentes cuando se envía una solicitud de propietario, se registra una lectura o se generan una o más facturas. Los endpoints `PATCH /api/notifications/{id}/read` y `PATCH /api/notifications/read-all` guardan la lectura en PostgreSQL y requieren rol administrador. Se muestran las 50 más recientes; el contador de no leídas refleja todas las notificaciones pendientes.
