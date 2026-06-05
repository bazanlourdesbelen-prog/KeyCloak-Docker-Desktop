// auth/routes.js

const express = require("express");
const axios = require("axios");
const { generatePKCE } = require("./pkce");

const router = express.Router();

// ⚠️ almacenamiento simple (solo testing)
let pkceStore = {};

// 🔹 LOGIN
router.get("/login", (req, res) => {
  const { code_verifier } = generatePKCE();

  // guardamos el verifier
  pkceStore.code_verifier = code_verifier;

  const authUrl =
    "http://localhost:8081/realms/dds-tareas/protocol/openid-connect/auth?" +
    "client_id=dds-tareas-node-backend&" +
    "response_type=code&" +
    "scope=openid&" +
    "redirect_uri=http://localhost:3000/auth/callback&" +
    `code_challenge=${code_verifier}&` +
    "code_challenge_method=plain";

  res.redirect(authUrl);
});

// 🔹 CALLBACK
router.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send("❌ Error desde Keycloak: " + error);
  }

  if (!code) {
    return res.send("❌ No recibió el code");
  }

  try {
    const tokenResponse = await axios.post(
      "http://localhost:8081/realms/dds-tareas/protocol/openid-connect/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: "dds-tareas-node-backend",
        code: code,
        redirect_uri: "http://localhost:3000/auth/callback",
        code_verifier: pkceStore.code_verifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json(tokenResponse.data);
  } catch (error) {
    console.error("ERROR TOKEN:", error.response?.data || error.message);
    res.send("❌ Error obteniendo token");
  }
});

module.exports = router;