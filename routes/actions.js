const express = require("express");
const { ensureAuthenticated } = require("../auth");
const { MongoClient } = require("mongodb");

const router = express.Router();

// Endpoint para retornar as ações de um usuário
router.get("/", ensureAuthenticated, async (req, res) => {
  const { username } = req.body;

  try {
    const client = await MongoClient.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db("instagram_api_db");
    const session = await db.collection("sessions").findOne({ username });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    // Retorna as ações do usuário
    return res.json({ success: true, actions: session.actions });
  } catch (error) {
    console.error("Erro ao buscar ações:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
