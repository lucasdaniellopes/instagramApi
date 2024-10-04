const { IgApiClient } = require("instagram-private-api");

async function authenticate(deviceName, username, password, retryCount = 0) {
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
      return ig; // Retorna o cliente autenticado após autorização manual
    } else if (error.message.includes("login_required") && retryCount < 3) {
      console.log(
        `Tentativa de reautenticação (${retryCount + 1}) em 30 segundos...`
      );
      await new Promise((resolve) => setTimeout(resolve, 30000));
      return authenticate(deviceName, username, password, retryCount + 1); // Reautentica com incremento do contador de tentativas
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
      } else if (error.message.includes("login_required")) {
        console.log("Sessão inválida, reautenticando...");
        break;
      } else {
        throw new Error(
          "Erro ao verificar autorização manual: " + error.message
        );
      }
    }
  }
}

module.exports = { authenticate };
