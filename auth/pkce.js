// auth/pkce.js

const crypto = require("crypto");

function generatePKCE() {
  // para plain no hace falta hash
  const code_verifier = crypto.randomBytes(32).toString("hex");

  return {
    code_verifier,
  };
}

module.exports = { generatePKCE };