const express = require("express");
const controller = require("../controllers/keywordController");

const router = express.Router();

router.get("/", controller.getKeywords);
router.post("/", controller.createKeyword);
router.delete("/:id", controller.deleteKeyword);

module.exports = router;
