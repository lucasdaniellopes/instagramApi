require("dotenv").config();
const { MongoClient } = require("mongodb");
const { IgApiClient } = require("instagram-private-api");
const {
  resetActionsIfNeeded,
  incrementAction,
} = require("./utils/actionManager");

let mongoClient;
let db;
let sessionsCollection;
let lastSessionState = null;

// Conectar a DB e configurar a coleção de sessões
async function connectMongo() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db("instagram_api_db");
    sessionsCollection = db.collection("sessions");
  }
}

async function authenticate(deviceName, username, password, res) {
  await connectMongo();

  const ig = new IgApiClient();
  ig.state.generateDevice(deviceName);

  // Função para salvar sessão no MongoDB
  async function saveSession(data) {
    try {
      const sessionString = JSON.stringify(data);
      const currentDate = new Date();

      const session = await sessionsCollection.findOne({
        username: username,
      });

      if (session) {
        // Atualiza a sessão
        await sessionsCollection.updateOne(
          { username: username },
          {
            $set: {
              session: sessionString,
              password: password,
              updatedAt: currentDate,
            },
          }
        );
      } else {
        // Cria nova sessão
        await sessionsCollection.insertOne({
          username: username,
          password: password,
          session: sessionString,
          createdAt: currentDate,
          updatedAt: currentDate,
        });
      }

      lastSessionState = sessionString;
      console.log("Sessão salva com sucesso na DataBase!");
    } catch (error) {
      console.error("Erro ao salvar a sessão na DataBase:", error);
    }
  }

  // Função para carregar sessão do MongoDB
  async function loadSession() {
    try {
      const result = await sessionsCollection.findOne({ username: username });
      if (result && result.session) {
        lastSessionState = result.session;
        return result.session;
      } else {
        console.log("Nenhuma sessão encontrada na DataBase.");
        return null;
      }
    } catch (error) {
      console.error("Erro ao carregar a sessão na DataBase:", error);
      return null;
    }
  }

  // Monitora o final de cada requisição e salva a sessão apenas se necessário
  ig.request.end$.subscribe(async () => {
    try {
      const serialized = await ig.state.serialize();
      delete serialized.constants;
      await saveSession(serialized);
    } catch (error) {
      console.error("Erro ao serializar a sessão:", error);
    }
  });

  // Verifica se já existe uma sessão válida
  try {
    const sessionData = await loadSession();
    if (sessionData) {
      await ig.state.deserialize(JSON.parse(sessionData));
      await ig.account.currentUser();
      console.log("Sessão carregada com sucesso!");
      return ig;
    } else {
      console.log(
        "Nenhuma sessão encontrada ou sessão inválida. Realizando login..."
      );
      return await loginAndSaveSession(ig, username, password, res);
    }
  } catch (error) {
    console.log("Erro ao carregar sessão, realizando novo login...");
    return await loginAndSaveSession(ig, username, password, res);
  }
}

// Função para realizar login e salvar a sessão na DB
async function loginAndSaveSession(ig, username, password, res) {
  console.log("Tentando fazer login...");
  await ig.simulate.preLoginFlow();

  try {
    const loginResult = await ig.account.login(username, password);

    if (loginResult && loginResult.pk) {
      console.log(`Login bem-sucedido! Usuário: ${loginResult.username}`);
      await ig.simulate.postLoginFlow();

      const serialized = await ig.state.serialize();
      delete serialized.constants;

      await saveSession(serialized);

      if (!res.headersSent) {
        return res
          .status(200)
          .json({ message: "Login bem-sucedido e sessão salva na DataBase." });
      }
    } else {
      if (!res.headersSent) {
        return res.status(500).json({ message: "Falha no login." });
      }
    }
  } catch (error) {
    if (
      error.response &&
      error.response.statusCode === 403 &&
      error.message.includes("login_required")
    ) {
      // Deleta a sessão existente na DB se o cookie tiver expirado
      console.error("Login requerido. Deletando sessão e refazendo login...");
      await sessionsCollection.deleteOne({ username: username });
      console.log("Sessão deletada. Tentando refazer o login...");
      return await loginAndSaveSession(ig, username, password, res);
    } else if (error.response && error.response.statusCode === 404) {
      console.error(
        "Rota não encontrada (404). Continuando o fluxo de autenticação."
      );
      if (!res.headersSent) {
        return res
          .status(200)
          .json({ message: "Login bem-sucedido, ignorando erro 404." });
      }
    } else {
      console.error("Erro ao realizar login:", error.message);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ message: "Erro ao realizar login: " + error.message });
      }
    }
  }
}

// Função para realizar login e salvar a sessão na DB
async function loginAndSaveSession(ig, username, password, res) {
  console.log("Tentando fazer login...");
  await ig.simulate.preLoginFlow();

  try {
    const loginResult = await ig.account.login(username, password);

    if (loginResult && loginResult.pk) {
      console.log(`Login bem-sucedido! Usuário: ${loginResult.username}`);
      await ig.simulate.postLoginFlow();

      const serialized = await ig.state.serialize();
      delete serialized.constants;

      await saveSession(serialized);

      if (!res.headersSent) {
        return res
          .status(200)
          .json({ message: "Login bem-sucedido e sessão salva na DataBase." });
      }
    } else {
      if (!res.headersSent) {
        return res.status(500).json({ message: "Falha no login." });
      }
    }
  } catch (error) {
    if (
      error.response &&
      error.response.statusCode === 403 &&
      error.message.includes("login_required")
    ) {
      // Deleta a sessão existente na DB se o cookie tiver expirado
      console.error("Login requerido. Deletando sessão e refazendo login...");
      await sessionsCollection.deleteOne({ username: username });
      console.log("Sessão deletada. Tentando refazer o login...");
      return await loginAndSaveSession(ig, username, password, res);
    } else if (error.response && error.response.statusCode === 404) {
      console.error(
        "Rota não encontrada (404). Continuando o fluxo de autenticação."
      );
      if (!res.headersSent) {
        return res
          .status(200)
          .json({ message: "Login bem-sucedido, ignorando erro 404." });
      }
    } else {
      console.error("Erro ao realizar login:", error.message);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ message: "Erro ao realizar login: " + error.message });
      }
    }
  }
}

//verificar se a sessão está válida antes de acessar os endpoints
async function ensureAuthenticated(req, res, next) {
  const { deviceName, username, password } = req.body;

  if (!deviceName || !username || !password) {
    if (!res.headersSent) {
      return res.status(400).json({
        message:
          "Credenciais ausentes. Por favor, forneça deviceName, username e password.",
      });
    } else {
      console.log("Resposta já enviada.");
      return;
    }
  }

  try {
    const ig = await authenticate(deviceName, username, password, res);
    req.ig = ig;
    next();
  } catch (error) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Erro ao autenticar: " + error.message });
    } else {
      console.log("Resposta já enviada.");
      return;
    }
  }
}

module.exports = { authenticate, ensureAuthenticated };
