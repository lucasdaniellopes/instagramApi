const express = require("express");
const { ensureAuthenticated } = require("../auth");
const { incrementAction } = require("../utils/actionManager");

const router = express.Router();

// Busca exata de usuários
router.post("/", ensureAuthenticated, async (req, res) => {
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

  if (targetUsernames.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Nenhum perfil disponível.",
    });
  }

  try {
    const ig = req.ig;
    if (!ig) {
      return res.status(500).json({
        success: false,
        message: "Falha ao obter o cliente IG. Tente autenticar novamente.",
      });
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
          id: accountInfo.pk,
          username: accountInfo.username,
          fullName: accountInfo.full_name,
          isPrivate: accountInfo.is_private,
          isVerified: accountInfo.is_verified,
          profilePicUrl: accountInfo.profile_pic_url,
          biography: accountInfo.biography,
          externalUrl: accountInfo.external_url,
          isBusiness: accountInfo.is_business,
          accountType: accountInfo.account_type,
          followers: accountInfo.follower_count,
          following: accountInfo.following_count,
          posts: accountInfo.media_count,
          feed: feedItems.slice(0, 3).map((item) => ({
            id: item.id,
            code: item.code,
            caption: item.caption ? item.caption.text : "Sem legenda",
          })),
        });

        await incrementAction(username, "profile_search");
      } catch (error) {
        profilesData.push({
          username: targetUsername,
          error: `Erro ao buscar informações para o perfil: ${error.message}`,
        });
      }
    }

    return res.json({ success: true, profilesData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Busca ampla de usuários
router.post("/searchUsers", ensureAuthenticated, async (req, res) => {
  const { deviceName, username, password, query } = req.body;

  if (!deviceName || !username || !password || !query) {
    return res.status(400).json({
      success: false,
      message:
        "Por favor, forneça deviceName, username, password e um termo de pesquisa.",
    });
  }

  try {
    const ig = req.ig;
    const searchResults = await ig.user.search(query);

    const usersData = searchResults.users.map((user) => ({
      pk: user.pk,
      username: user.username,
      fullName: user.full_name,
      isPrivate: user.is_private,
      profilePicUrl: user.profile_pic_url,
    }));

    if (usersData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nenhum usuário encontrado com o termo de pesquisa.",
      });
    }

    await incrementAction(username, "user_search");

    return res.json({ success: true, users: usersData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

module.exports = router;
