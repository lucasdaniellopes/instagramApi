const { IgApiClient } = require("instagram-private-api");

async function authenticate(deviceName, username, password) {
  const ig = new IgApiClient();
  ig.state.generateDevice(deviceName);

  try {
    await ig.simulate.preLoginFlow();
    await ig.account.login(username, password);
    return ig;
  } catch (error) {
    if (error.name === "IgCheckpointError") {
      console.log("Checkpoint necessário. Aguardando autorização manual...");

      await waitForUserToAuthorize(ig);
      return ig;
    } else {
      throw new Error(error.message);
    }
  }
}

async function waitForUserToAuthorize(ig) {
  console.log(
    "Aguardando autorização manual... Complete o desafio no app ou em outro dispositivo permitido."
  );

  // Loop indefinido até que o usuário autorize
  while (true) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Espera 30 segundos antes de verificar novamente
      await ig.account.currentUser();
      console.log("Autorização completa!");
      break;
    } catch (error) {
      if (error.name === "IgCheckpointError") {
        console.log(
          "Autorização ainda não concluída, continuando a aguardar..."
        );
      } else {
        throw new Error(
          "Erro ao verificar autorização manual: " + error.message
        );
      }
    }
  }
}

module.exports = { authenticate };
