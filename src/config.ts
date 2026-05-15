const nome    = process.env.REACT_APP_EMPRESA_NOME    || 'OpSuite';
const sigla   = process.env.REACT_APP_EMPRESA_SIGLA   || 'OP';
const tagline = process.env.REACT_APP_EMPRESA_TAGLINE || 'Plataforma Operacional';
const tokenKey = `${sigla.toLowerCase().replace(/[^a-z0-9]/g, '_')}_token`;

// Aplica cores customizadas como CSS variables (opcional por cliente)
const corNavbar   = process.env.REACT_APP_COR_NAVBAR;
const corDestaque = process.env.REACT_APP_COR_DESTAQUE;
if (corNavbar)   { document.documentElement.style.setProperty('--text',   corNavbar);
                   document.documentElement.style.setProperty('--accent', corNavbar); }
if (corDestaque) { document.documentElement.style.setProperty('--blue',   corDestaque);
                   document.documentElement.style.setProperty('--blue-mid', corDestaque); }

const cfg = { nome, sigla, tagline, tokenKey, corNavbar, corDestaque };
export default cfg;
