const express = require("express");
const { ensureAuthenticated } = require("../auth");
const { incrementAction } = require("../utils/actionManager");

const router = express.Router();

// Endpoint para obter posts populares/explorar
router.post("/", ensureAuthenticated, async (req, res) => {
  const { username } = req.body;

  try {
    await incrementAction(username, "explore_posts");
    const ig = req.ig;

    // Obter o feed de exploração (explore feed)
    const exploreFeed = ig.feed.explore();
    const posts = await exploreFeed.items();

    const postsData = posts.map((post) => ({
      id: post.id,
      code: post.code,
      takenAt: new Date(post.taken_at * 1000).toISOString(),
      caption: post.caption ? post.caption.text : "Sem legenda",
      likeCount: post.like_count,
      commentCount: post.comment_count,
      mediaType: post.media_type,
      isVideo: post.is_video,
      images: post.image_versions2 ? post.image_versions2.candidates : [],
      videos: post.video_versions || [],
      user: {
        username: post.user.username,
        fullName: post.user.full_name,
      },
    }));

    return res.json({ success: true, posts: postsData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

module.exports = router;
