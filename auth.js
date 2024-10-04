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

// Função para aguardar o usuário autorizar manualmente
async function waitForUserToAuthorize(ig) {
  console.log(
    "Aguardando autorização manual... Complete o desafio no app ou em outro dispositivo permitido."
  );

  let isResolved = false;
  while (!isResolved) {
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Aguarda 30 segundos antes de verificar novamente
    try {
      await ig.account.currentUser(); // Tenta verificar se a conta foi autorizada
      console.log("Autorização completa!");
      isResolved = true;
    } catch (error) {
      if (error.name !== "IgCheckpointError") {
        throw new Error(
          "Erro ao verificar autorização manual: " + error.message
        );
      }
    }
  }
}

module.exports = { authenticate };
