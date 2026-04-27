# API-CELL - Bot de Telegram

API con autenticación OTP y bot de Telegram integrado.

## 🚀 Despliegue Gratis 24/7 en Render

### Pasos para desplegar:

#### 1. Crea una cuenta en GitHub
- Ve a https://github.com
- Crea una cuenta gratuita

#### 2. Sube tu proyecto a GitHub
- Ve a https://github.com/new
- Crea un nuevo repositorio llamado "api-cell"
- En tu PC, abre una terminal y ejecuta:
```bash
cd c:\Users\USER\Desktop\API-CELL
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/api-cell.git
git push -u origin main
```
*(Reemplaza TU_USUARIO con tu nombre de usuario de GitHub)*

#### 3. Despliega en Render
1. Ve a https://render.com y crea una cuenta
2. Click en "New +" → "Web Service"
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio "api-cell"
5. Configura:
   - **Name:** api-cell
   - **Build Command:** (dejar vacío)
   - **Start Command:** node server.js
6. Click en "Create Web Service"

#### 4. Configura las variables de entorno
En Render, ve a "Environment" y agrega:
- `BOT_TOKEN` = tu token de Telegram
- `ADMIN_IDS` = tu ID de Telegram
- `PORT` = 3000

#### 5. ¡Listo!
Tu bot estará vivo 24/7 en la URL de Render

---

## 📱 Comandos del Bot

- `/start` - Menú principal
- `/registro` - Registrarse
- `/otp` - Generar OTP
- `/verificar` - Verificar OTP
- `/cuenta` - Mi cuenta
- `/ayuda` - Ayuda

---

## 🔧 Desarrollo local

```bash
# Instalar dependencias
npm install

# Ejecutar
node server.js
```

## 📄 Archivos del proyecto

- `server.js` - Servidor principal
- `package.json` - Dependencias
- `Procfile` - Configuración de despliegue
- `.env` - Variables de entorno (no subir a Git)