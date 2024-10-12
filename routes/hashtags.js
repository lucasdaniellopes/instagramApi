const express = require("express");
const { ensureAuthenticated } = require("../auth");
const { incrementAction } = require("../utils/actionManager");

const router = express.Router();

// Endpoint para obter posts de uma hashtag específica usando tag.section via POST
router.post("/posts", ensureAuthenticated, async (req, res) => {
  const { username, hashtag } = req.body;

  if (!hashtag) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o hashtag.",
    });
  }

  try {
    const ig = req.ig;
    await incrementAction(username, "posts");

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

    const sectionData = await ig.request.send({
      url: `/api/v1/tags/${tagResult.id}/sections/`,
      method: "POST",
      qs: {
        timezone_offset: -10800,
        tab: "recent",
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

    return res.json({ success: true, posts: postsData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Endpoint para buscar hashtags
router.post("/search", ensureAuthenticated, async (req, res) => {
  const { username, query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o termo de busca da hashtag.",
    });
  }

  try {
    const ig = req.ig;
    await incrementAction(username, "searches");

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

    return res.json({ success: true, hashtags: hashtagData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Endpoint para obter informações de uma hashtag específica
router.post("/info", ensureAuthenticated, async (req, res) => {
  const { username, hashtag } = req.body;

  if (!hashtag) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o hashtag.",
    });
  }

  try {
    const ig = req.ig;
    await incrementAction(username, "hashtag_info");

    // Obter informações da hashtag
    const tagInfo = await ig.tag.info(hashtag);

    // Usar o feed da hashtag para obter posts recentes
    const tagFeed = ig.feed.tag(hashtag);
    const posts = await tagFeed.items();

    if (!posts.length) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma postagem encontrada para essa hashtag.",
      });
    }

    // Retorna as primeiras 10 postagens da hashtag
    const hashtagPosts = posts.slice(0, 10).map((post) => ({
      id: post.id,
      caption: post.caption ? post.caption.text : "Sem legenda",
      mediaType: post.media_type,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      takenAt: new Date(post.taken_at * 1000).toISOString(),
      user: {
        username: post.user.username,
        fullName: post.user.full_name,
      },
    }));

    // Retorna informações da hashtag e posts recentes
    return res.json({
      success: true,
      hashtagInfo: {
        id: tagInfo.id,
        name: tagInfo.name,
        mediaCount: tagInfo.media_count,
        following: tagInfo.following,
        isTopMediaOnly: tagInfo.is_top_media_only,
      },
      posts: hashtagPosts,
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

module.exports = router;
