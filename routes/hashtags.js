const express = require("express");
const { authenticate } = require("../auth");

const router = express.Router();

// Endpoint para buscar hashtags
router.post("/search", async (req, res) => {
  const { deviceName, username, password, query } = req.body;

  if (!deviceName || !username || !password || !query) {
    return res.status(400).json({
      success: false,
      message:
        "Por favor, forneça deviceName, username, password e query (termo de busca da hashtag).",
    });
  }

  try {
    const ig = await authenticate(deviceName, username, password);
    const hashtags = await ig.tag.search(query);

    if (!hashtags.results.length) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma hashtag encontrada para o termo de busca fornecido.",
      });
    }

    const hashtagData = hashtags.results.map((hashtag) => ({
      id: hashtag.id,
      name: hashtag.name,
      mediaCount: hashtag.media_count,
    }));

    res.json({ success: true, hashtags: hashtagData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para obter posts de uma hashtag específica usando tag.section via POST
router.post("/posts", async (req, res) => {
  const { deviceName, username, password, hashtag } = req.body;

  if (!deviceName || !username || !password || !hashtag) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça deviceName, username, password e hashtag.",
    });
  }

  try {
    const ig = await authenticate(deviceName, username, password);

    // Buscar o ID da hashtag
    const hashtagSearch = await ig.tag.search(hashtag);
    const tagResult = hashtagSearch.results.find(
      (h) => h.name === hashtag.toLowerCase()
    );

    if (!tagResult) {
      return res.status(404).json({
        success: false,
        message: "Hashtag não encontrada.",
      });
    }

    // Realiza a requisição POST diretamente ao endpoint de section com o ID da hashtag
    const sectionData = await ig.request.send({
      url: `/api/v1/tags/${tagResult.id}/sections/`,
      method: "POST",
      qs: {
        timezone_offset: -10800,
        tab: "recent", // Alternativamente, 'recent'
        count: 30,
      },
    });

    const postsData = sectionData.body.sections.flatMap((section) =>
      section.layout_content.medias.map((media) => ({
        id: media.media.id,
        code: media.media.code,
        takenAt: new Date(media.media.taken_at * 1000).toISOString(),
        caption: media.media.caption ? media.media.caption.text : "Sem legenda",
        likeCount: media.media.like_count,
        commentCount: media.media.comment_count,
        mediaType: media.media.media_type,
        isVideo: media.media.is_video,
        images: media.media.image_versions2
          ? media.media.image_versions2.candidates
          : [],
        videos: media.media.video_versions || [],
        user: {
          username: media.media.user.username,
          fullName: media.media.user.full_name,
        },
      }))
    );

    res.json({ success: true, posts: postsData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
