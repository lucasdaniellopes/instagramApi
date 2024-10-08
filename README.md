# Instagram Profile Data Fetcher API

This Node.js API allows you to fetch detailed profile data from Instagram for a list of specified usernames. It uses the `instagram-private-api` library to authenticate and retrieve data, including follower counts, posts, likes, and comments. This API is intended for personal or educational use only.

## Features

- Authenticate with Instagram using a username and password.
- Fetch information about specified Instagram profiles.
- Retrieve detailed data such as follower count, following count, posts, likes, comments, and more.
- Provides a challenge URL for manual resolution in case of login checkpoint errors.

## Prerequisites

- Node.js (version 12 or higher)
- Instagram account credentials
- `instagram-private-api` package

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/instagram-profile-fetcher.git
   cd instagram-profile-fetcher
   ```

2. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the server:

   ```
   node app.js
   ```

   The API will run at `http://localhost:3000`.

2. Make a POST request to `/profiles` with the following JSON body:

   ```json
   {
     "deviceName": "your_device_name",
     "username": "your_instagram_username",
     "password": "your_instagram_password",
     "targetUsernames": ["target_username_1", "target_username_2"]
   }
   ```

   - `deviceName`: A unique identifier for the device.
   - `username`: Your Instagram username.
   - `password`: Your Instagram password.
   - `targetUsernames`: An array of Instagram usernames whose profile data you want to fetch.

3. Example Response:
   ```json
   {
     "success": true,
     "profilesData": [
       {
         "username": "target_username_1",
         "fullName": "Full Name",
         "followers": 1234,
         "following": 567,
         "posts": 89,
         "feed": [
           {
             "caption": "Post caption",
             "likes": 100,
             "comments": 10,
             "link": "https://www.instagram.com/p/POST_CODE/"
           }
         ]
       }
     ]
   }
   ```

## Error Handling

- If login fails due to a checkpoint, the response will include a `challengeUrl` which can be accessed manually to resolve the challenge.
- If any error occurs while fetching profile data, an error message specific to the profile will be included in the response.

## Dependencies

- [express](https://www.npmjs.com/package/express)
- [body-parser](https://www.npmjs.com/package/body-parser)
- [instagram-private-api](https://www.npmjs.com/package/instagram-private-api)

## Security Note

Be cautious when handling your Instagram credentials. This API is for personal and educational use, and sharing your credentials with others is not recommended. Instagram may lock or disable your account if it detects suspicious activity.

## License

This project is open-source and available under the MIT License. See the `LICENSE` file for more details.

---

Feel free to contribute by opening issues or submitting pull requests. Enjoy using the Instagram Profile Data Fetcher API!
+++
