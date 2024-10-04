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
      console.log("Checkpoint necessário. Tentando resolver o desafio...");

      try {
        // Tenta selecionar o método de verificação
        const verificationMethod = await ig.challenge.selectVerifyMethod(
          "email"
        ); // ou 'phone' para SMS

        if (verificationMethod && verificationMethod.status === "ok") {
          const verificationCode = await promptUserForCode();
          await ig.challenge.sendSecurityCode(verificationCode);
          console.log("Desafio resolvido com sucesso!");
          return ig;
        }
      } catch (verificationError) {
        console.log(
          "Método de verificação não disponível ou falhou. Aguardando autorização manual..."
        );
      }

      await waitForUserToAuthorize(ig);
      return ig;
    } else {
      throw new Error(error.message);
    }
  }
}

// Função para solicitar o código de verificação ao usuário
async function promptUserForCode() {
  return new Promise((resolve) => {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      "Por favor, insira o código de verificação recebido: ",
      (code) => {
        readline.close();
        resolve(code.trim());
      }
    );
  });
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
      await ig.account.currentUser();
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
