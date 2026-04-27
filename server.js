require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// ==================
// 📱 APP EXPRESS
// ==================
const app = express();
app.use(cors());
app.use(express.json());

// ==================
// 💾 BASE DE DATOS LOCAL (JSON)
// ==================
const DB_FILE = path.join(__dirname, "database.json");

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error cargando DB:", err);
  }
  return { users: [] };
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadDB();
console.log("✅ Base de datos local cargada");

// ==================
// 📦 MODELO USUARIO (simulado)
// ==================
const userSchema = {
  nombre: "",
  pais: "",
  estado: "",
  telefono: "",
  email: "",
  password: "",
  isBlocked: false,
  isActive: true,  // Todos activos por defecto
  otp: null,
  otpExp: null,
  createdAt: new Date()
};

// ==================
// ⚙️ CONFIGURACIÓN DE ADMIN
// ==================
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",").map(id => id.trim()) : [];
const PENDING_USERS = []; // Usuarios pendientes de aprobación

// ==================
// � REGISTRO DE USUARIO
// ==================
app.post("/register", async (req, res) => {
  try {
    const { nombre, pais, estado, telefono, email, password } = req.body;
    
    // Validación de campos requeridos
    if (!nombre || !telefono || !email || !password) {
      return res.status(400).json({ error: "❌ Todos los campos son requeridos" });
    }
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "❌ Email inválido" });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = db.users.find(u => u.email === email || u.telefono === telefono);
    if (existingUser) {
      return res.status(409).json({ error: "❌ Email o teléfono ya registrado" });
    }
    
    // Hash de contraseña
    const hash = await bcrypt.hash(password, 10);
    
    const newUser = {
      _id: Date.now().toString(),
      nombre,
      pais: pais || "No especificado",
      estado: estado || "No especificado",
      telefono,
      email,
      password: hash,
      isBlocked: false,
      isActive: true,
      otp: null,
      otpExp: null,
      createdAt: new Date()
    };
    
    db.users.push(newUser);
    saveDB(db);
    
    res.json({ 
      msg: "✅ Registro exitoso",
      user: { telefono, email, nombre }
    });
  } catch (err) {
    console.error("❌ Error registro:", err);
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// 🔑 LOGIN DE USUARIO
// ==================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "❌ Email y contraseña requeridos" });
    }
    
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: "❌ Usuario no encontrado" });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: "❌ Usuario bloqueado" });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "❌ Contraseña incorrecta" });
    }
    
    res.json({ 
      msg: "✅ Login exitoso",
      user: { 
        telefono: user.telefono, 
        email: user.email, 
        nombre: user.nombre,
        pais: user.pais,
        estado: user.estado
      }
    });
  } catch (err) {
    console.error("❌ Error login:", err);
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// �🔐 GENERAR OTP (auto-crea usuario si no existe)
// ==================
app.post("/generate-otp", async (req, res) => {
  try {
    const { telefono } = req.body;
    
    if (!telefono) {
      return res.status(400).json({ error: "❌ Teléfono requerido" });
    }
    
    // Validar formato de teléfono (mínimo 8 dígitos)
    const phoneRegex = /^\d{8,15}$/;
    if (!phoneRegex.test(telefono.replace(/\D/g, ''))) {
      return res.status(400).json({ error: "❌ Formato de teléfono inválido" });
    }
    
    // Buscar usuario o crear uno nuevo
    let user = db.users.find(u => u.telefono === telefono);
    
    if (!user) {
      // Crear usuario automáticamente
      user = {
        _id: Date.now().toString(),
        telefono: telefono,
        isBlocked: false,
        otp: null,
        otpExp: null,
        createdAt: new Date()
      };
      db.users.push(user);
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: "❌ Usuario bloqueado" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExp = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = code;
    user.otpExp = otpExp;
    saveDB(db);

    res.json({ 
      msg: "✅ OTP generado", 
      otp: code,
      expiresIn: "5 minutos" 
    });
  } catch (err) {
    console.error("❌ Error OTP:", err);
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// ✅ VERIFICAR OTP
// ==================
app.post("/verify-otp", async (req, res) => {
  try {
    const { telefono, otp } = req.body;

    // Validar campos requeridos
    if (!telefono || !otp) {
      return res.status(400).json({ error: "❌ Teléfono y OTP requeridos" });
    }
    
    // Validar formato de OTP (6 dígitos)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json({ error: "❌ Formato de OTP inválido" });
    }

    const user = db.users.find(u => u.telefono === telefono);
    if (!user) return res.status(404).json({ error: "❌ Usuario no encontrado" });

    if (user.otp !== otp) {
      return res.status(400).json({ error: "❌ OTP incorrecto" });
    }

    if (new Date(user.otpExp) < new Date()) {
      return res.status(400).json({ error: "⏳ OTP expirado" });
    }

    user.otp = null;
    user.otpExp = null;
    saveDB(db);

    res.json({ msg: "✅ Verificación exitosa", success: true });
  } catch (err) {
    console.error("❌ Error verificación:", err);
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// 👤 OBTENER USUARIO
// ==================
app.get("/user/:telefono", async (req, res) => {
  try {
    const { telefono } = req.params;
    
    // Validar formato de teléfono
    if (!telefono || telefono.length < 8) {
      return res.status(400).json({ error: "❌ Teléfono inválido" });
    }
    
    const user = db.users.find(u => u.telefono === telefono);
    if (!user) return res.status(404).json({ error: "❌ Usuario no encontrado" });

    res.json({ 
      nombre: user.nombre,
      pais: user.pais,
      estado: user.estado,
      telefono: user.telefono,
      email: user.email,
      isActive: user.isActive
    });
  } catch (err) {
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// 📋 OBTENER USUARIOS PENDIENTES
// ==================
app.get("/pending-users", async (req, res) => {
  try {
    const pending = db.users.filter(u => !u.isActive && !u.isBlocked);
    res.json({ 
      count: pending.length,
      users: pending.map(u => ({ 
        id: u._id, 
        nombre: u.nombre, 
        telefono: u.telefono, 
        email: u.email,
        pais: u.pais,
        createdAt: u.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// ✅ APROBAR USUARIO
// ==================
app.post("/approve-user", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "❌ ID de usuario requerido" });
    }

    const user = db.users.find(u => u._id === userId);
    if (!user) {
      return res.status(404).json({ error: "❌ Usuario no encontrado" });
    }

    user.isActive = true;
    saveDB(db);

    res.json({ msg: "✅ Usuario aprobado correctamente", success: true });
  } catch (err) {
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// ❌ RECHAZAR USUARIO
// ==================
app.post("/reject-user", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "❌ ID de usuario requerido" });
    }

    const userIndex = db.users.findIndex(u => u._id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "❌ Usuario no encontrado" });
    }

    db.users.splice(userIndex, 1);
    saveDB(db);

    res.json({ msg: "❌ Usuario rechazado y eliminado", success: true });
  } catch (err) {
    res.status(500).json({ error: "❌ Error en el servidor" });
  }
});

// ==================
// 🤖 BOT TELEGRAM (Webhooks para nube)
// ==================
let bot;
let botReady = false;

function startBot() {
  try {
    const TOKEN = process.env.BOT_TOKEN;
    if (!TOKEN) {
      console.log("⚠️ BOT_TOKEN no configurado");
      return;
    }
    
    bot = new TelegramBot(TOKEN, { polling: false });
    console.log("✅ Bot de Telegram inicializado");
    
    // Configurar webhook automáticamente
    const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
    
    if (webhookUrl) {
      const webhookPath = `/webhook/${TOKEN}`;
      const fullUrl = `${webhookUrl}${webhookPath}`;
      
      // Configurar el webhook en Telegram
      bot.setWebhook(fullUrl).then(() => {
        console.log("✅ Webhook configurado:", fullUrl);
        botReady = true;
      }).catch(err => {
        console.log("⚠️ Error configurando webhook:", err.message);
        // Intentar con polling como respaldo
        tryPolling();
      });
    } else {
      // Sin URL de webhook, usar polling local
      tryPolling();
    }
    
  } catch (err) {
    console.error("❌ Error Bot Telegram:", err.message);
  }
}

function tryPolling() {
  try {
    const TOKEN = process.env.BOT_TOKEN;
    if (TOKEN) {
      const pollingBot = new TelegramBot(TOKEN, { polling: true });
      bot = pollingBot;
      console.log("✅ Bot de Telegram conectado (polling)");
      botReady = true;
    }
  } catch (err) {
    console.error("❌ Error al iniciar polling:", err.message);
  }
}

// ==================
// 📥 RUTAS DE WEBHOOK
// ==================

// Webhook principal con el token del bot
app.post("/webhook", express.json(), (req, res) => {
  console.log("📥 Webhook recibido:", JSON.stringify(req.body).substring(0, 100));
  
  if (!bot) {
    console.log("❌ Bot no inicializado");
    return res.status(500).send("Bot no inicializado");
  }
  
  const { message, callback_query, edited_message } = req.body;
  
  if (message) {
    console.log("📨 Mensaje recibido de:", message.chat?.id);
    bot.emit("message", message);
  } else if (callback_query) {
    console.log("🔘 Callback query recibido");
    bot.emit("callback_query", callback_query);
  } else if (edited_message) {
    console.log("✏️ Mensaje editado");
  } else {
    console.log("⚠️ Tipo de update no reconocido");
  }
  
  res.send("OK");
});

// Iniciar el bot
startBot();

// 📝 Flujo de registro por pasos
const registroFlow = {}; // Almacena el estado del registro por usuario

// 🔧 Verificar si es admin
function isAdmin(chatId) {
  return ADMIN_IDS.includes(chatId.toString());
}

// 🎯 MENÚ PRINCIPAL
const lastMenuSent = {}; // Evitar menú repetido

function sendMenu(chatId, text = "🔐 *OTP SYSTEM* - Menú Principal") {
  if (!bot) {
    console.log("❌ Bot no está inicializado");
    return;
  }
  
  // Evitar enviar el menú más de una vez cada 10 segundos
  const now = Date.now();
  if (lastMenuSent[chatId] && (now - lastMenuSent[chatId]) < 10000) {
    console.log("⏳ Menú omitido (cooldown)", chatId);
    return;
  }
  lastMenuSent[chatId] = now;
  
  const keyboard = {
    keyboard: [
      [{ text: "📝 Registrarse" }, { text: "📲 Generar OTP" }],
      [{ text: "✅ Verificar OTP" }, { text: "👤 Mi Cuenta" }],
      [{ text: "❓ Ayuda" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
  
  // Agregar opciones de admin si es admin
  if (isAdmin(chatId)) {
    keyboard.keyboard.unshift([{ text: "⚙️ Panel Admin" }]);
  }
  
  try {
    bot.sendMessage(chatId, text + "\n\n👇 *Selecciona una opción:*", {
      parse_mode: "Markdown",
      reply_markup: keyboard
    }).then(() => {
      console.log("✅ Menú enviado a", chatId);
    }).catch(err => {
      console.error("❌ Error al enviar menú:", err.message);
    });
  } catch (err) {
    console.error("❌ Error en sendMenu:", err.message);
  }
}

// ⚙️ MENÚ DE ADMIN
function sendAdminMenu(chatId) {
  if (!bot) return;
  
  const pendingCount = db.users.filter(u => !u.isActive && !u.isBlocked).length;
  
  bot.sendMessage(chatId, 
`⚙️ *PANEL DE ADMINISTRADOR*

━━━━━━━━━━━━━━━━
📊 *Usuarios pendientes:* ${pendingCount}

Selecciona una opción:`, 
{ 
  parse_mode: "Markdown",
  reply_markup: {
    keyboard: [
      [{ text: "📋 Ver Pendientes" }, { text: "🔄 Actualizar" }],
      [{ text: "⬅️ Volver" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
});
}

// 📋 Mostrar usuarios pendientes al admin con botones inline
function showPendingUsers(chatId) {
  if (!bot) return;
  
  const pending = db.users.filter(u => !u.isActive && !u.isBlocked);
  
  if (pending.length === 0) {
    bot.sendMessage(chatId, "✅ *No hay usuarios pendientes.*", { parse_mode: "Markdown" });
    return;
  }
  
  // Mostrar cada usuario con botones inline
  pending.forEach((user, index) => {
    const message = 
`📋 *USUARIO ${index + 1}*

━━━━━━━━━━━━━━━━
📛 *Nombre:* ${user.nombre}
🌎 *País:* ${user.pais}
📍 *Estado:* ${user.estado}
📱 *Teléfono:* ${user.telefono}
📧 *Email:* ${user.email}
⏰ *Registrado:* ${new Date(user.createdAt).toLocaleString()}
━━━━━━━━━━━━━━━━`;

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Aprobar", callback_data: `approve_${user._id}` },
            { text: "❌ Rechazar", callback_data: `reject_${user._id}` }
          ]
        ]
      }
    });
  });
  
  bot.sendMessage(chatId, "👆 *Usa los botones acima para aprobar o rechazar cada usuario.*", { parse_mode: "Markdown" });
}

// 📝 Iniciar proceso de registro
async function startRegistro(chatId) {
  if (!bot) return;
  
  // Verificar si ya está registrado
  const existingUser = db.users.find(u => u.telefono === chatId.toString());
  if (existingUser) {
    bot.sendMessage(chatId, "⚠️ *Ya estás registrado.*\n\nTu teléfono: `📱 " + existingUser.telefono + "`", { parse_mode: "Markdown" });
    return;
  }
  
  // Iniciar flujo de registro
  registroFlow[chatId] = { step: 1 };
  
  bot.sendMessage(chatId, 
`📝 *REGISTRO - Paso 1 de 6*

👤 *Ingresa tu nombre:*`, 
{ parse_mode: "Markdown" });
}

// 📲 GENERAR OTP DESDE TELEGRAM
async function handleGenerateOTP(chatId) {
  if (!bot) return;
  
  // Buscar usuario por chatId de Telegram O por teléfono
  let user = db.users.find(u => u.telefono === chatId.toString());
  
  // Si no encuentra por chatId, buscar por teléfono guardado previamente
  if (!user) {
    // Buscar si hay algún usuario que se haya registrado desde este chat
    user = db.users.find(u => u.chatId === chatId.toString());
  }
  
  if (!user) {
    // Buscar por cualquier usuario activo (permitir generar OTP a cualquiera)
    // Primero verificar si hay usuarios registrados
    const allUsers = db.users;
    if (allUsers.length > 0) {
      // Si hay usuarios, buscar el primero que no esté bloqueado
      user = allUsers.find(u => !u.isBlocked && u.isActive);
    }
  }
  
  if (!user) {
    // Si no hay usuarios registrados, crear uno automáticamente con el chatId
    user = {
      _id: Date.now().toString(),
      chatId: chatId.toString(),
      telefono: chatId.toString(),
      nombre: "Usuario Telegram",
      pais: "No especificado",
      estado: "No especificado",
      email: "",
      isBlocked: false,
      isActive: true,
      otp: null,
      otpExp: null,
      createdAt: new Date()
    };
    db.users.push(user);
    saveDB(db);
    console.log("✅ Usuario automático creado para chatId:", chatId);
  }
  
  if (user.isBlocked) {
    bot.sendMessage(chatId, "❌ *Tu cuenta está bloqueada.*\n\n📞 Contacta al soporte.", { parse_mode: "Markdown" });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExp = new Date(Date.now() + 5 * 60 * 1000);

  user.otp = code;
  user.otpExp = otpExp;
  saveDB(db);

  bot.sendMessage(chatId, 
`🔢 *Tu OTP:*

\`\`\`
${code}
\`\`\`

⏳ *Expira en 5 minutos*`, 
{ parse_mode: "Markdown" });
}

// ✅ VERIFICAR OTP DESDE TELEGRAM
async function handleVerifyOTP(chatId) {
  if (!bot) return;
  
  bot.sendMessage(chatId, "✏️ *Escribe tu código OTP:*", { parse_mode: "Markdown" });
  
  const handler = async (msg) => {
    if (msg.chat.id !== chatId || !msg.text) return;
    
    // Buscar usuario por chatId o teléfono
    let user = db.users.find(u => u.telefono === chatId.toString());
    if (!user) {
      user = db.users.find(u => u.chatId === chatId.toString());
    }
    if (!user) {
      user = db.users.find(u => !u.isBlocked && u.isActive);
    }
    
    if (!user) {
      bot.sendMessage(chatId, "⚠️ *No estás registrado.*\n\n📝 Usa /registro para registrarte.", { parse_mode: "Markdown" });
      bot.removeListener("message", handler);
      return;
    }

    const inputOTP = msg.text.trim();
    
    if (user.otp !== inputOTP) {
      bot.sendMessage(chatId, "❌ *OTP incorrecto.*\n\nIntenta de nuevo.", { parse_mode: "Markdown" });
      return;
    }

    if (new Date(user.otpExp) < new Date()) {
      bot.sendMessage(chatId, "⏳ *OTP expirado.*\n\nGenera uno nuevo.", { parse_mode: "Markdown" });
      return;
    }

    user.otp = null;
    user.otpExp = null;
    saveDB(db);
    
    bot.sendMessage(chatId, "✅ *¡Verificación exitosa!*\n\nBienvenido/a.", { parse_mode: "Markdown" });
    bot.removeListener("message", handler);
  };
  
  bot.on("message", handler);
}

// 👤 VER CUENTA
async function handleMyAccount(chatId) {
  if (!bot) return;
  
  // Buscar usuario por chatId o teléfono
  let user = db.users.find(u => u.telefono === chatId.toString());
  if (!user) {
    user = db.users.find(u => u.chatId === chatId.toString());
  }
  if (!user) {
    user = db.users.find(u => !u.isBlocked && u.isActive);
  }
  
  if (!user) {
    bot.sendMessage(chatId, "⚠️ *No estás registrado.*\n\n📝 Usa /registro para registrarte.", { parse_mode: "Markdown" });
    return;
  }

  bot.sendMessage(chatId, 
`👤 *MI CUENTA*

━━━━━━━━━━━━━━━━
📛 *Nombre:* ${user.nombre}
🌎 *País:* ${user.pais}
📍 *Estado:* ${user.estado}
📱 *Teléfono:* ${user.telefono}
📧 *Email:* ${user.email}
━━━━━━━━━━━━━━━━`, 
{ parse_mode: "Markdown" });
}

// ❓ AYUDA
function handleHelp(chatId) {
  if (!bot) return;
  
  bot.sendMessage(chatId, 
`📌 *AYUDA*

━━━━━━━━━━━━━━━━
*Comandos disponibles:*

� /registro - Registrarse en el sistema
�📲 /otp - Generar nuevo OTP
✅ /verificar - Verificar OTP
👤 /cuenta - Mi cuenta
❓ /ayuda - Este menú
🔄 /start - Menú principal
━━━━━━━━━━━━━━━━`, 
{ parse_mode: "Markdown" });
}

// ==================
// 📡 EVENTOS TELEGRAM
// ==================
if (bot) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
`👋 *¡Bienvenido a OTP SYSTEM!*

Selecciona una opción del menú:`, 
{ parse_mode: "Markdown" });
    sendMenu(chatId);
  });

  bot.onText(/\/registro/, (msg) => {
    startRegistro(msg.chat.id);
  });

  bot.onText(/\/admin/, (msg) => {
    if (isAdmin(msg.chat.id)) {
      sendAdminMenu(msg.chat.id);
    } else {
      bot.sendMessage(msg.chat.id, "❌ *No tienes acceso de administrador.*", { parse_mode: "Markdown" });
    }
  });

  bot.onText(/\/aprobar (.+)/, (msg, match) => {
    if (!isAdmin(msg.chat.id)) {
      bot.sendMessage(msg.chat.id, "❌ *No tienes acceso de administrador.*", { parse_mode: "Markdown" });
      return;
    }
    
    const userId = match[1].trim();
    const user = db.users.find(u => u._id === userId);
    
    if (!user) {
      bot.sendMessage(msg.chat.id, "❌ *Usuario no encontrado.*", { parse_mode: "Markdown" });
      return;
    }
    
    user.isActive = true;
    saveDB(db);
    
    bot.sendMessage(msg.chat.id, `✅ *Usuario aprobado:* ${user.nombre}\n📱 Tel: ${user.telefono}`, { parse_mode: "Markdown" });
    
    // Notificar al usuario
    bot.sendMessage(user.telefono, "🎉 *¡Tu cuenta ha sido activada!*\n\nYa puedes usar todos los servicios del bot.", { parse_mode: "Markdown" });
  });

  bot.onText(/\/rechazar (.+)/, (msg, match) => {
    if (!isAdmin(msg.chat.id)) {
      bot.sendMessage(msg.chat.id, "❌ *No tienes acceso de administrador.*", { parse_mode: "Markdown" });
      return;
    }
    
    const userId = match[1].trim();
    const userIndex = db.users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      bot.sendMessage(msg.chat.id, "❌ *Usuario no encontrado.*", { parse_mode: "Markdown" });
      return;
    }
    
    const user = db.users[userIndex];
    db.users.splice(userIndex, 1);
    saveDB(db);
    
    bot.sendMessage(msg.chat.id, `❌ *Usuario rechazado y eliminado:* ${user.nombre}`, { parse_mode: "Markdown" });
  });

  bot.onText(/\/otp/, (msg) => {
    handleGenerateOTP(msg.chat.id);
  });

  bot.onText(/\/verificar/, (msg) => {
    handleVerifyOTP(msg.chat.id);
  });

  bot.onText(/\/cuenta/, (msg) => {
    handleMyAccount(msg.chat.id);
  });

  bot.onText(/\/ayuda/, (msg) => {
    handleHelp(msg.chat.id);
  });

  // 📱 Manejar botones inline (callback queries)
  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    // Responder al callback para quitar el estado de "cargando"
    bot.answerCallbackQuery(callbackQuery.id);
    
    // Verificar si es admin
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, "❌ *No tienes acceso de administrador.*", { parse_mode: "Markdown" });
      return;
    }
    
    // Procesar approve_[userId]
    if (data.startsWith("approve_")) {
      const userId = data.replace("approve_", "");
      const user = db.users.find(u => u._id === userId);
      
      if (!user) {
        bot.sendMessage(chatId, "❌ *Usuario no encontrado.*", { parse_mode: "Markdown" });
        return;
      }
      
      user.isActive = true;
      saveDB(db);
      
      bot.sendMessage(chatId, `✅ *Usuario aprobado:* ${user.nombre}\n📱 Tel: ${user.telefono}`, { parse_mode: "Markdown" });
      
      // Notificar al usuario
      try {
        bot.sendMessage(user.telefono, "🎉 *¡Tu cuenta ha sido activada!*\n\nYa puedes usar todos los servicios del bot.", { parse_mode: "Markdown" });
      } catch (err) {
        console.log("No se pudo notificar al usuario:", err.message);
      }
      
      // Actualizar lista de pendientes
      showPendingUsers(chatId);
    }
    
    // Procesar reject_[userId]
    if (data.startsWith("reject_")) {
      const userId = data.replace("reject_", "");
      const userIndex = db.users.findIndex(u => u._id === userId);
      
      if (userIndex === -1) {
        bot.sendMessage(chatId, "❌ *Usuario no encontrado.*", { parse_mode: "Markdown" });
        return;
      }
      
      const user = db.users[userIndex];
      db.users.splice(userIndex, 1);
      saveDB(db);
      
      bot.sendMessage(chatId, `❌ *Usuario rechazado y eliminado:* ${user.nombre}`, { parse_mode: "Markdown" });
      
      // Actualizar lista de pendientes
      showPendingUsers(chatId);
    }
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // 📝 Manejar flujo de registro
    if (registroFlow[chatId]) {
      const flow = registroFlow[chatId];
      const userData = flow.userData || {};
      
      // Validar que no sea un comando
      if (text.startsWith("/")) {
        bot.sendMessage(chatId, "⚠️ *Por favor completa tu registro primero.*\n\nEscribe tu respuesta o presiona /start para ver el menú.", { parse_mode: "Markdown" });
        return;
      }
      
      switch (flow.step) {
        case 1: // Nombre
          userData.nombre = text.trim();
          flow.step = 2;
          flow.userData = userData;
          bot.sendMessage(chatId, 
`📝 *REGISTRO - Paso 2 de 6*

🌎 *Ingresa tu país:*`, 
{ parse_mode: "Markdown" });
          break;
          
        case 2: // País
          userData.pais = text.trim();
          flow.step = 3;
          flow.userData = userData;
          bot.sendMessage(chatId, 
`📝 *REGISTRO - Paso 3 de 6*

📍 *Ingresa tu estado/región:*`, 
{ parse_mode: "Markdown" });
          break;
          
        case 3: // Estado
          userData.estado = text.trim();
          flow.step = 4;
          flow.userData = userData;
          bot.sendMessage(chatId, 
`📝 *REGISTRO - Paso 4 de 6*

📱 *Ingresa tu número de teléfono:*`, 
{ parse_mode: "Markdown" });
          break;
          
        case 4: // Teléfono
          userData.telefono = text.trim();
          flow.step = 5;
          flow.userData = userData;
          bot.sendMessage(chatId, 
`📝 *REGISTRO - Paso 5 de 6*

📧 *Ingresa tu correo electrónico:*`, 
{ parse_mode: "Markdown" });
          break;
          
        case 5: // Email
          userData.email = text.trim();
          flow.step = 6;
          flow.userData = userData;
          bot.sendMessage(chatId, 
`📝 *REGISTRO - Paso 6 de 6*

🔐 *Ingresa una contraseña:*`, 
{ parse_mode: "Markdown" });
          break;
          
        case 6: // Password - Finalizar registro
          userData.password = text.trim();
          
          // Verificar si el usuario ya existe
          const existingUser = db.users.find(u => u.email === userData.email || u.telefono === userData.telefono);
          if (existingUser) {
            bot.sendMessage(chatId, "❌ *Email o teléfono ya registrado.*\n\nPor favor inicia sesión o usa otros datos.", { parse_mode: "Markdown" });
            delete registroFlow[chatId];
            return;
          }
          
          try {
            const hash = await bcrypt.hash(userData.password, 10);
            const newUser = {
              _id: Date.now().toString(),
              chatId: chatId.toString(), // Guardar el ID de Telegram
              nombre: userData.nombre,
              pais: userData.pais || "No especificado",
              estado: userData.estado || "No especificado",
              telefono: userData.telefono,
              email: userData.email,
              password: hash,
              isBlocked: false,
              isActive: true,
              otp: null,
              otpExp: null,
              createdAt: new Date()
            };

            db.users.push(newUser);
            saveDB(db);

            bot.sendMessage(chatId, 
`✅ *¡Registro completado!*

📋 *Datos registrados:*
━━━━━━━━━━━━━━━━
📛 Nombre: ${userData.nombre}
🌎 País: ${userData.pais}
📱 Tel: ${userData.telefono}
📧 Email: ${userData.email}
━━━━━━━━━━━━━━━━

Ya puedes usar todos los servicios del bot.`, 
{ parse_mode: "Markdown" });
            
            delete registroFlow[chatId];
            sendMenu(chatId);
          } catch (err) {
            bot.sendMessage(chatId, "❌ *Error al registrar.*\n\nPor favor intenta de nuevo.", { parse_mode: "Markdown" });
            delete registroFlow[chatId];
          }
          break;
      }
      return;
    }

    // 📋 Menú de botones
    if (text === "📝 Registrarse") {
      await startRegistro(chatId);
    } else if (text === "📲 Generar OTP") {
      await handleGenerateOTP(chatId);
    } else if (text === "✅ Verificar OTP") {
      await handleVerifyOTP(chatId);
    } else if (text === "👤 Mi Cuenta") {
      await handleMyAccount(chatId);
    } else if (text === "❓ Ayuda") {
      handleHelp(chatId);
    } else if (text === "⚙️ Panel Admin" && isAdmin(chatId)) {
      sendAdminMenu(chatId);
    } else if (text === "📋 Ver Pendientes" && isAdmin(chatId)) {
      showPendingUsers(chatId);
    } else if (text === "🔄 Actualizar" && isAdmin(chatId)) {
      sendAdminMenu(chatId);
    } else if (text === "⬅️ Volver") {
      sendMenu(chatId);
    } else if (text && text.includes("|")) {
      // Registro desde Telegram (formato antiguo)
      const parts = text.split("|");
      if (parts.length === 6) {
        const [nombre, pais, estado, telefono, email, password] = parts;
        
        const existingUser = db.users.find(u => u.email === email || u.telefono === telefono);
        if (existingUser) {
          bot.sendMessage(chatId, "❌ *Email o teléfono ya registrado.*", { parse_mode: "Markdown" });
          return;
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = {
          _id: Date.now().toString(),
          nombre,
          pais: pais || "No especificado",
          estado: estado || "No especificado",
          telefono: telefono,
          email,
          password: hash,
          isBlocked: false,
          isActive: true,  // Todos activos por defecto
          otp: null,
          otpExp: null,
          createdAt: new Date()
        };

        db.users.push(newUser);
        saveDB(db);

        bot.sendMessage(chatId, "✅ *¡Registro completado!*\n\nYa puedes usar todos los servicios del bot.", { parse_mode: "Markdown" });
      }
    }
  });
}

// ==================
// 🌐 RUTA PRINCIPAL
// ==================
app.get("/", (req, res) => {
  res.json({ 
    msg: "API-CELL Bot de Telegram", 
    status: "Online",
    version: "1.0.0"
  });
});

// ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API-CELL corriendo en puerto ${PORT}`);
});
