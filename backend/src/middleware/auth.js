const jwt = require("jsonwebtoken");
const env = require("../config/env");


function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Falta el token de autenticación." });
  }
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Sesión inválida o expirada. Inicia sesión de nuevo." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "Tu rol no tiene permiso para esta acción." });
    }
    next();
  };
}


const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { authenticate, authorize, wrap };
