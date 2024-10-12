const { MongoClient } = require("mongodb");
require("dotenv").config();

async function updateActions(username) {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db("instagram_api_db");
    const sessionsCollection = db.collection("sessions");

    // Defina os campos "actions" com valores iniciais e o campo lastActionReset
    const actions = {
      likes: 0,
      follows: 0,
      comments: 0,
      unfollows: 0,
      searches: 0, // Busca geral (se necessário)
      profile_search: 0, // Busca de perfis de usuário
      location_search: 0, // Busca de localizações
      hashtag_search: 0, // Busca de hashtags
      posts: 0,
      stories_views: 0,
      direct_messages: 0,
      total_actions: 0,
    };

    const currentDate = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Recife",
    });

    const result = await sessionsCollection.updateOne(
      { username: username }, // Filtro para encontrar o documento correto
      { $set: { actions: actions, lastActionReset: currentDate } } // Atualiza os campos "actions" e "lastActionReset"
    );

    if (result.matchedCount > 0) {
      console.log("Ações e lastActionReset atualizados com sucesso!");
    } else {
      console.log("Usuário não encontrado.");
    }
  } catch (err) {
    console.error("Erro ao atualizar as ações:", err);
  } finally {
    await client.close();
  }
}

// Chame a função com o nome de usuário que deseja atualizar
updateActions("jao_guils");
updateActions("lucasdanielopes");
updateActions("diogovieiraweb");
updateActions("thiago_ks");
