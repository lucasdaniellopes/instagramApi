const express = require("express");
const { authenticate } = require("../auth");

const router = express.Router();

router.post("/", async (req, res) => {
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

  try {
    const ig = await authenticate(deviceName, username, password);
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
          isJoinedRecently: accountInfo.is_joined_recently,
          businessCategory: accountInfo.category,
          businessCategoryName: accountInfo.category_name,
          businessContactMethod: accountInfo.business_contact_method,
          publicPhoneNumber: accountInfo.public_phone_number,
          publicEmail: accountInfo.public_email,
          publicPhoneCountryCode: accountInfo.public_phone_country_code,
          cityName: accountInfo.city_name,
          zipCode: accountInfo.zip,
          feed: feedItems.slice(0, 3).map((item) => ({
            id: item.id,
            code: item.code,
            takenAt: formatTimeStamp(item.taken_at),
            mediaType: item.media_type,
            caption: item.caption ? item.caption.text : "Sem legenda",
            likes: item.like_count,
            comments: item.comment_count,
            viewCount: item.view_count || null,
            isVideo: item.is_video,
            location: item.location
              ? {
                  name: item.location.name,
                  city: item.location.city,
                  country: item.location.country,
                }
              : null,
            tags: item.user_tags
              ? item.user_tags.map((tag) => tag.user.username)
              : [],
            link: `https://www.instagram.com/p/${item.code}/`,
            mediaDetails: {
              images: item.image_versions2
                ? item.image_versions2.candidates
                : [],
              videos: item.video_versions || [],
            },
            carouselMedia: item.carousel_media
              ? item.carousel_media.map((mediaItem) => ({
                  mediaType: mediaItem.media_type,
                  images: mediaItem.image_versions2
                    ? mediaItem.image_versions2.candidates
                    : [],
                  videos: mediaItem.video_versions || [],
                }))
              : null,
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

function formatTimeStamp(timeStamp) {
  const date = new Date(timeStamp * 1000);
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
  return formattedDate;
}

module.exports = router;
