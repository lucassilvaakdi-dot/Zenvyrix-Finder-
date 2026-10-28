const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const app = express();
app.use(express.text({ limit: "1mb" }));

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || "./data";
const DB_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
        }
    } catch (e) {}
    return { users: [] };
}

function saveDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {}
}

app.post("/logs", (req, res) => {
    const body = (req.body || "").toString().trim();
    if (body) {
        console.log("[LOG]", body);
        wss.clients.forEach(c => {
            if (c.readyState === 1) c.send(body);
        });
    }
    res.send("ok");
});

app.post("/usernames", (req, res) => {
    const name = (req.body || "").toString().trim();
    const db = getDB();
    if (name && !db.users.includes(name)) {
        db.users.push(name);
        saveDB(db);
        console.log("[USER]", name);
    }
    res.send("ok");
});

app.get("/usernames", (req, res) => {
    const db = getDB();
    res.type("text/plain").send(db.users.join("\n"));
});

app.get("/", (req, res) => {
    const db = getDB();
    res.send(`
        <body style="background:#0a0b10; color:#fff; font-family:sans-serif; padding:20px;">
            <h1 style="color:#6e50ff;">Zenvyrix Finder API</h1>
            <p style="color:#14dc82;">Status: <b>Online</b></p>
            <hr style="border-color:#333;">
            <h3>Usuários Registrados (${db.users.length})</h3>
            <pre style="background:#1e2332; padding:10px; border-radius:8px;">${db.users.join("\n") || "Nenhum usuário ainda"}</pre>
        </body>
    `);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (ws) => {
    console.log("Cliente WS conectado | total:", wss.clients.size);
    ws.on("close", () => console.log("Cliente WS saiu | total:", wss.clients.size));
    ws.on("error", (e) => console.log("WS erro:", e.message));
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Zenvyrix Finder rodando na porta", process.env.PORT || 3000);
});
