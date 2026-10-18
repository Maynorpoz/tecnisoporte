const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
});
