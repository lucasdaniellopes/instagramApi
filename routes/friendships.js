const express = require("express");
const { ensureAuthenticated } = require("../auth");
const { incrementAction } = require("../utils/actionManager");

const router = express.Router();

router.post("/follow", ensureAuthenticated, async (req, res) => {
  const { username, targetUsername } = req.body;

  if (!targetUsername) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o nome de usuário do alvo (targetUsername).",
    });
  }

  try {
    const ig = req.ig;

    // Buscar o userId a partir do username do alvo
    const searchResult = await ig.user.searchExact(targetUsername);

    if (!searchResult || !searchResult.pk) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    const userId = searchResult.pk;

    // Seguir o usuário usando o userId
    await ig.friendship.create(userId);

    await incrementAction(username, "follows");

    return res.json({
      success: true,
      message: `Seguiu ${targetUsername} com sucesso!`,
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

router.post("/unfollow", ensureAuthenticated, async (req, res) => {
  const { username, targetUsername } = req.body;

  if (!targetUsername) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o nome de usuário do alvo (targetUsername).",
    });
  }

  try {
    const ig = req.ig;

    // Buscar o userId a partir do username do alvo
    const searchResult = await ig.user.searchExact(targetUsername);

    if (!searchResult || !searchResult.pk) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    const userId = searchResult.pk;

    // Deixar de seguir o usuário usando o userId
    await ig.friendship.destroy(userId);

    await incrementAction(username, "unfollows");

    return res.json({
      success: true,
      message: `Deixou de seguir ${targetUsername} com sucesso!`,
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

module.exports = router;
