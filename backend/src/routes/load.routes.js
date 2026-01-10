const router = require("express").Router();
const { getLoad } = require("../controllers/load.controller");

router.get("/:studentId", getLoad);

module.exports = router;
