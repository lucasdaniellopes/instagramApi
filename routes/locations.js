const express = require("express");
const { authenticate } = require("../auth");

const router = express.Router();

// Endpoint para buscar localizações por termo
router.post("/search", async (req, res) => {
  const { deviceName, username, password, query } = req.body;

  if (!deviceName || !username || !password || !query) {
    return res.status(400).json({
      success: false,
      message:
        "Por favor, forneça deviceName, username, password e query (termo de localização).",
    });
  }

  try {
    const ig = await authenticate(deviceName, username, password);
    const locations = await ig.fbsearch.places(query);

    const locationData = locations.list.map((place) => ({
      id: place.location.pk,
      name: place.location.name,
      address: place.location.address,
      city: place.location.city,
      lat: place.location.lat,
      lng: place.location.lng,
    }));

    res.json({ success: true, locations: locationData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para obter posts de uma localização específica usando o locationId
router.post("/posts", async (req, res) => {
  const { deviceName, username, password, locationId } = req.body;

  if (!deviceName || !username || !password || !locationId) {
    return res.status(400).json({
      success: false,
      message:
        "Por favor, forneça deviceName, username, password e locationId.",
    });
  }

  try {
    const ig = await authenticate(deviceName, username, password);
    const locationFeed = ig.feed.location(locationId);
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

    res.json({ success: true, posts: postsData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
