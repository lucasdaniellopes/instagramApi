const express = require("express");
const { ensureAuthenticated } = require("../auth");
const { incrementAction } = require("../utils/actionManager");

const router = express.Router();

// Endpoint para buscar localizações por termo
router.post("/search", ensureAuthenticated, async (req, res) => {
  const { username, query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça um query (termo de localização).",
    });
  }

  try {
    await incrementAction(username, "searches");
    const ig = req.ig;
    const locations = await ig.fbsearch.places(query);

    const locationData = locations.items.map((place) => ({
      id: place.location.pk,
      name: place.location.name,
      address: place.location.address || "Sem endereço",
      city: place.location.city || "Sem cidade",
      lat: place.location.lat,
      lng: place.location.lng,
      short_name: place.location.short_name,
      facebook_places_id: place.location.facebook_places_id,
      external_source: place.location.external_source,
      has_viewer_saved: place.location.has_viewer_saved,
    }));

    if (locationData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma localização encontrada com o termo de busca.",
      });
    }

    return res.json({ success: true, locations: locationData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

// posts de uma localização específica usando termo
router.post("/posts", ensureAuthenticated, async (req, res) => {
  const { username, query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o termo de localização (query).",
    });
  }

  try {
    await incrementAction(username, "posts");
    const ig = req.ig;

    const locations = await ig.fbsearch.places(query);

    if (!locations.items.length) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma localização encontrada com o termo de busca.",
      });
    }

    const locationId = locations.items[0].location.pk;
    const locationFeed = ig.feed.location(locationId, "recent");
    const posts = await locationFeed.items();

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

// stories de uma localização específica
router.post("/stories", ensureAuthenticated, async (req, res) => {
  const { username, query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Por favor, forneça o termo de localização (query).",
    });
  }

  try {
    await incrementAction(username, "stories_views");
    const ig = req.ig;

    const locations = await ig.fbsearch.places(query);

    if (!locations.items.length) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma localização encontrada com o termo de busca.",
      });
    }

    const locationId = locations.items[0].location.pk;

    const storyFeed = await ig.location.story(locationId);

    if (!storyFeed.reel || !storyFeed.reel.items) {
      return res.status(404).json({
        success: false,
        message: "Nenhum story encontrado para essa localização.",
      });
    }

    const storiesData = storyFeed.reel.items.map((story) => ({
      id: story.id,
      mediaType: story.media_type,
      takenAt: new Date(story.taken_at * 1000).toISOString(),
      viewCount: story.view_count || 0,
      images: story.image_versions2 ? story.image_versions2.candidates : [],
      videos: story.video_versions || [],
      user: {
        username: story.user.username,
        fullName: story.user.full_name,
      },
    }));

    return res.json({ success: true, stories: storiesData });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

module.exports = router;
