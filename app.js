import express from "express";
import axios from "axios";
import crypto from "crypto";

const app = express();
const PORT = 3000;

// 🔹 CONFIG
const KEYCLOAK_URL = "http://localhost:8081";
const REALM = "dds-tareas";
const CLIENT_ID = "dds-tareas-node-backend";
const REDIRECT_URI = "http://localhost:3000/callback";

// 🔹 FUNCION PARA GENERAR STRING RANDOM (PKCE)
function base64URLEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 🔹 VARIABLE GLOBAL (simple)
let code_verifier_global = "";
let access_token_global = "";

// =============================
// 🔐 LOGIN (PLAIN)
// =============================
app.get("/login", (req, res) => {
  const code_verifier = base64URLEncode(crypto.randomBytes(32));

  // 🔥 CAMBIO IMPORTANTE (PLAIN)
  const code_challenge = code_verifier;

  code_verifier_global = code_verifier;

  const authUrl =
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&scope=openid` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&code_challenge=${code_challenge}` +
    `&code_challenge_method=plain`; // 🔥 CAMBIO IMPORTANTE

  res.redirect(authUrl);
});

// =============================
// 🔁 CALLBACK
// =============================
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No se recibió el code");
  }

  try {
    const tokenResponse = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: code_verifier_global,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // 🔥 GUARDAMOS TOKEN
    access_token_global = tokenResponse.data.access_token;

    res.send(`
      <h2>Login exitoso ✅</h2>
      <a href="/me">Ver datos del usuario</a>
    `);

  } catch (error) {
    console.error(error.response?.data);
    res.status(500).send("Error en login");
  }
});

// =============================
// 👤 USERINFO
// =============================
app.get("/me", async (req, res) => {
  try {
    const response = await axios.get(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token_global}`,
        },
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error(error.response?.data);
    res.status(500).send("Error al obtener usuario");
  }
});

// =============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});