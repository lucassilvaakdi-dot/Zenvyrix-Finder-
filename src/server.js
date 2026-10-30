const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.text({ limit: "1mb" }));

const FIREBASE_URL = "https://zenvyrix-finder-users-default-rtdb.asia-southeast1.firebasedatabase.app"; 

async function getUsers() {
    try {
        const res = await fetch(`${FIREBASE_URL}/users.json`);
        const data = await res.json();
        return data ? Object.values(data) : [];
    } catch (e) {
        return [];
    }
}

async function saveUser(name) {
    try {
        await fetch(`${FIREBASE_URL}/users.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(name)
        });
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

app.post("/usernames", async (req, res) => {
    const name = (req.body || "").toString().trim();
    if (name) {
        const users = await getUsers();
        if (!users.includes(name)) {
            await saveUser(name);
            console.log("[USER CADASTRADO]", name);
        }
    }
    res.send("ok");
});

app.get("/usernames", async (req, res) => {
    const users = await getUsers();
    res.type("text/plain").send(users.join("\n"));
});

app.get("/", async (req, res) => {
    const users = await getUsers();
    res.send(`
        <body style="background:#0a0b10; color:#fff; font-family:sans-serif; padding:20px;">
            <h1 style="color:#6e50ff;">Zenvyrix Finder (Users API)</h1>
            <p style="color:#14dc82;">Status: <b>Online</b></p>
            <hr style="border-color:#333;">
            <h3>Usuários Salvos no Firebase (${users.length})</h3>
            <pre style="background:#1e2332; padding:10px; border-radius:8px;">${users.join("\n") || "Nenhum usuário ainda"}</pre>
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
    console.log("Servidor rodando na porta", process.env.PORT || 3000);
});
