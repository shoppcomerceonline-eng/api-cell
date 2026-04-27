# 📖 GUÍA EXACTA PARA SUBIR TU CÓDIGO A GITHUB

## Paso 1: Crear cuenta en GitHub

1. Abre tu navegador (Chrome, Edge, etc.)
2. Ve a: https://github.com
3. Click en **"Sign up"** (Registrarse)
4. Ingresa tu correo electrónico
5. Crea una contraseña
6. Ingresa un nombre de usuario (recuerda este nombre)
7. Verifica tu correo electrónico
8. **¡Listo! Ya tienes cuenta en GitHub**

---

## Paso 2: Crear el repositorio (donde se guardará tu código)

1. Ve a: https://github.com
2. Click en el botón **"+"** (arriba a la derecha)
3. Click en **"New repository"**
4. En **"Repository name"** escribe exactamente:
```
api-cell
```
5. En **"Description"** escribe:
```
Bot de Telegram con OTP
```
6. Deja marcado **"Public"**
7. NO marques ninguna otra opción
8. Click en el botón verde **"Create repository"**
9. **¡No cierres esta página! La necesitarás después**

---

## Paso 3: Subir el código (los comandos exactos)

### 3.1 Abrir la terminal

1. Presiona las teclas **Windows + R** juntas
2. Escribe: `powershell`
3. Presiona **Enter**
4. Se abrirá una ventana negra (la terminal)

### 3.2 Ir a tu proyecto

En esa ventana negra, escribe esto y presiona **Enter**:

```
cd c:\Users\USER\Desktop\API-CELL
```

(Debería aparecer algo como `PS C:\Users\USER\Desktop\API-CELL>`)

### 3.3 Inicializar Git

Escribe este comando y presiona **Enter**:

```
git init
```

### 3.4 Agregar archivos

Escribe este comando y presiona **Enter**:

```
git add .
```

### 3.5 Guardar cambios

Escribe este comando y presiona **Enter**:

```
git commit -m "Mi bot de Telegram"
```

### 3.6 Configurar tu nombre en Git (una sola vez)

Escribe estos dos comandos UNO POR UNO, presionando Enter después de cada uno:

```
git config --global user.name "TuNombre"
```

(Donde dice TuNombre, pon tu nombre, por ejemplo: Juan)

```
git config --global user.email "tu@email.com"
```

(Donde dice tu@email.com, pon el correo que usaste en GitHub)

### 3.7 Cambiar nombre de rama

Escribe este comando y presiona **Enter**:

```
git branch -M main
```

### 3.8 Conectar con GitHub

**Vuelve a la página de GitHub que dejaste abierta**

En la página del repositorio, busca un botón que dice **"http"** y copia la URL que aparece debajo

(Algo como: `https://github.com/tu-usuario/api-cell.git`)

**En la terminal**, escribe esto (reemplaza TU_URL con lo que copiaste):

```
git remote add origin TU_URL
```

Por ejemplo:
```
git remote add origin https://github.com/MiUsuario/api-cell.git
```

### 3.9 Subir el código (¡EL ÚLTIMO COMANDO!)

Escribe este comando y presiona **Enter**:

```
git push -u origin main
```

**Puede pedirte tu usuario y contraseña de GitHub**

---

## ✅ VERIFICAR QUE TODO SALIÓ BIEN

1. Vuelve a la página de GitHub
2. Presiona la tecla **F5** para actualizar
3. Si ves tus archivos (server.js, package.json, etc.) → **¡FELICIDADES!**
4. Si ves un error → Copia el mensaje y pégamelo

---

## 📋 Resumen de comandos (para tener a la mano)

Copia y pega cada línea en la terminal, presionando Enter después de cada una:

```
cd c:\Users\USER\Desktop\API-CELL
git init
git add .
git commit -m "Mi bot de Telegram"
git config --global user.name "TuNombre"
git config --global user.email "tu@email.com"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/api-cell.git
git push -u origin main
```

---

## ❓ Si algo sale mal

**Error: "git no se reconoce"**
- Git no está instalado correctamente
- Cierra la terminal y ábrela de nuevo como Administrador

**Error: "remote origin already exists"**
- Ejecuta este comando:
```
git remote remove origin
```
- Luego repite el paso 3.8

**Pide usuario y contraseña**
- Ingresa tu usuario de GitHub
- Ingresa tu contraseña (no verás las letras, pero escribe y presiona Enter)

---

## 🎉 Una vez subido el código

¡Ya tienes tu código en GitHub! Ahora el siguiente paso es desplegarlo en Render para que tu bot funcione 24/7.

Dime cuando hayas terminado de subir el código y te ayudo con el siguiente paso.