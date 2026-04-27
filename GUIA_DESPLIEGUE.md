# GUÍA COMPLETA: Desplegar Bot de Telegram 24/7 Gratis

## Requisitos previos
- ✅ Git instalado (verificado)
- ✅ Cuenta de GitHub creada
- ✅ Token de tu bot de Telegram

---

## PASOS DETALLADOS

### Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com y inicia sesión
2. Click en el botón verde "+" → "New repository"
3. Configura:
   - **Repository name:** api-cell
   - **Description:** Bot de Telegram con OTP
   - **Public:** ✅ seleccionado
   - **Add a README file:** ⬜ (no marcar)
   - **Add .gitignore:** ⬜ (no marcar)
4. Click en "Create repository"
5. En la siguiente página, copia la URL que aparece en "…or push an existing repository from the command line"

---

### Paso 2: Subir código a GitHub

Abre una terminal (PowerShell o CMD) y ejecuta estos comandos UNO POR UNO:

```powershell
cd c:\Users\USER\Desktop\API-CELL
```

```powershell
git init
```

```powershell
git add .
```

```powershell
git commit -m "Primer commit - Bot de Telegram"
```

```powershell
git branch -M main
```

```powershell
git remote add origin https://github.com/TU_USUARIO/api-cell.git
```

*(Reemplaza TU_USUARIO con tu usuario de GitHub)*

```powershell
git push -u origin main
```

**⚠️ IMPORTANTE:** Cuando ejecutes el último comando, GitHub te pedira iniciar sesión.

---

### Paso 3: Desplegar en Render (Gratis)

1. Ve a https://render.com y click en "Sign Up"
2. Selecciona "GitHub" para registrarte
3. Autoriza a Render a acceder tu cuenta de GitHub
4. Una vez dentro, click en "New +" → "Web Service"
5. En la lista de repositorios, busca "api-cell" y selecciónalo
6. Configura los siguientes campos:

| Campo | Valor |
|-------|-------|
| **Name** | api-cell |
| **Environment** | Node |
| **Build Command** | (dejar vacío) |
| **Start Command** | node server.js |
| **Free Instance** | ✅ seleccionado |

7. Click en "Create Web Service"

---

### Paso 4: Configurar variables de entorno

1. En Render, cuando se cree el servicio, ve a la pestaña "Environment"
2. Click en "Add Environment Variable"
3. Agrega estas variables UNA POR UNA:

| Key | Value |
|-----|-------|
| `BOT_TOKEN` | 8102735746:AAGKoM_aifaS-PTVzO0jtqFf92ByckxKmmI |
| `ADMIN_IDS` | 8377339402 |
| `PORT` | 3000 |

4. Click en "Changes to be deployed" → "Deploy"

---

### Paso 5: Verificar que funciona

1. Espera unos 2-3 minutos a que se despliegue
2. Verifica que el estado sea "Live" (verde)
3. Copia la URL que aparece (algo como: https://api-cell-xxxx.onrender.com)

---

### Paso 6: Probar el bot

1. Abre Telegram y busca tu bot
2. Envía el comando `/start`
3. Debería aparecer el menú con botones

---

## 🔧 Si el menú no aparece en Telegram

El problema puede ser que el bot está en polling y solo funciona localmente. Para que funcione en la nube, necesitas hacer un cambio:

### Opción A: Usar Webhooks (RECOMENDADO)

Edita el archivo `server.js` y cambia el método de conexión del bot:

```javascript
// Cambia esto:
bot = new TelegramBot(process.env.BOT_TOKEN, { 
  polling: true,
  filepath: false
});

// Por esto:
bot = new TelegramBot(process.env.BOT_TOKEN, { 
  polling: false 
});

// Establecer webhook
const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
if (webhookUrl) {
  bot.setWebhook(`${webhookUrl}/bot${process.env.BOT_TOKEN}`).catch(err => {
    console.log("Webhook:", err.message);
  });
}
```

### Opción B: Mantener polling (para desarrollo local)

Si solo quieres probar localmente, el código actual funciona. Ejecuta:

```powershell
cd c:\Users\USER\Desktop\API-CELL
node server.js
```

Luego ve a Telegram y envía `/start`

---

## 📋 Comandos para verificar el estado

```powershell
# Ver si Git está instalado
git --version

# Ver estado del repositorio
git status

# Ver remote configurado
git remote -v
```

---

## ❓ Solución de problemas

### "git no se reconoce"
Cierra la terminal y ábrela de nuevo como Administrador.

### "remote origin already exists"
Ejecuta:
```powershell
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/api-cell.git
```

### El bot no responde en la nube
- Verifica que el servicio esté "Live" en Render
- Revisa los logs en Render → "Logs"
- Asegúrate de que las variables de entorno estén configuradas

---

## 📞 Soporte

Si tienes problemas, copia y pega los mensajes de error que aparezcan.