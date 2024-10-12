const express = require("express");
const bodyParser = require("body-parser");
const profileRoutes = require("./routes/profiles");
const locationRoutes = require("./routes/locations");
const hashtagRoutes = require("./routes/hashtags");
const exploreRoutes = require("./routes/explore");
const friendshipRoutes = require("./routes/friendships");

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use("/profiles", profileRoutes);
app.use("/locations", locationRoutes);
app.use("/hashtags", hashtagRoutes);
app.use("/explore", exploreRoutes);
app.use("/friendships", friendshipRoutes);

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
