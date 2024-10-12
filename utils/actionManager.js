const { MongoClient } = require("mongodb");
require("dotenv").config();

async function connectMongo() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("instagram_api_db");
  const sessionsCollection = db.collection("sessions");
  return { client, sessionsCollection };
}

// Função para resetar as ações a cada 24 horas
async function resetActionsIfNeeded(username) {
  const { client, sessionsCollection } = await connectMongo();

  try {
    const session = await sessionsCollection.findOne({ username });

    if (session) {
      const lastActionReset = session.lastActionReset || new Date(0);
      const now = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Recife",
      });

      // Verifica se passou 24 horas desde o último reset
      const hoursSinceReset = Math.abs(now - new Date(lastActionReset)) / 36e5;
      if (hoursSinceReset >= 24) {
        const actions = {
          likes: 0,
          follows: 0,
          comments: 0,
          unfollows: 0,
          searches: 0,
          posts: 0,
          stories_views: 0,
          direct_messages: 0,
          total_actions: 0,
        };

        await sessionsCollection.updateOne(
          { username },
          { $set: { actions, lastActionReset: now } }
        );
        console.log(`Ações resetadas para o usuário: ${username}`);
      }
    } else {
      console.log(`Usuário não encontrado: ${username}`);
    }
  } catch (err) {
    console.error("Erro ao resetar as ações:", err);
  } finally {
    await client.close();
  }
}

// Função para incrementar as ações
async function incrementAction(username, actionType) {
  const { client, sessionsCollection } = await connectMongo();

  try {
    const updateFields = {};
    updateFields[`actions.${actionType}`] = 1;
    updateFields["actions.total_actions"] = 1;

    await sessionsCollection.updateOne({ username }, { $inc: updateFields });

    console.log(`Ação ${actionType} incrementada para o usuário: ${username}`);
  } catch (err) {
    console.error("Erro ao incrementar ação:", err);
  } finally {
    await client.close();
  }
}

module.exports = {
  resetActionsIfNeeded,
  incrementAction,
};
