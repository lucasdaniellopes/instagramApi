const express = require("express");
const bodyParser = require("body-parser");
const profileRoutes = require("./routes/profiles");
const locationRoutes = require("./routes/locations");
const hashtagRoutes = require("./routes/hashtags");

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use("/profiles", profileRoutes);
app.use("/locations", locationRoutes);
app.use("/hashtags", hashtagRoutes);

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
