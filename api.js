const express = require("express");
const bodyParser = require("body-parser");
const { IgApiClient } = require("instagram-private-api");

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post("/profiles", async (req, res) => {
  const { deviceName, username, password, targetUsernames } = req.body;

  if (
    !deviceName ||
    !username ||
    !password ||
    !Array.isArray(targetUsernames)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Por favor, forneça deviceName, username, password e uma lista de targetUsernames.",
    });
  }

  const ig = new IgApiClient();
  ig.state.generateDevice(deviceName);

  try {
    await ig.simulate.preLoginFlow();

    try {
      await ig.account.login(username, password);
    } catch (error) {
      if (error.name === "IgCheckpointError") {
        if (ig.state.checkpoint && ig.state.checkpoint.checkpointUrl) {
          const challengeUrl = `https://www.instagram.com${ig.state.checkpoint.checkpointUrl}`;
          return res.json({
            success: false,
            message: "Desafio necessário. Resolva manualmente.",
            challengeUrl,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Nenhum URL de desafio disponível.",
          });
        }
      } else {
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    const profilesData = [];
    for (const targetUsername of targetUsernames) {
      try {
        const userInfo = await ig.user.searchExact(targetUsername);
        const accountInfo = await ig.user.info(userInfo.pk);

        const userFeed = ig.feed.user(accountInfo.pk);
        const feedItems = [];
        do {
          const items = await userFeed.items();
          feedItems.push(...items);
        } while (userFeed.isMoreAvailable());

        profilesData.push({
          username: accountInfo.username,
          fullName: accountInfo.full_name,
          followers: accountInfo.follower_count,
          following: accountInfo.following_count,
          posts: accountInfo.media_count,
          feed: feedItems.map((item) => ({
            caption: item.caption ? item.caption.text : "Sem legenda",
            likes: item.like_count,
            comments: item.comment_count,
            link: `https://www.instagram.com/p/${item.code}/`,
          })),
        });
      } catch (error) {
        profilesData.push({
          username: targetUsername,
          error: `Erro ao buscar informações para o perfil: ${error.message}`,
        });
      }
    }

    res.json({ success: true, profilesData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
