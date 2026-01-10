const router = require("express").Router();
const controller = require("../controllers/deadline.controller");

router.post("/", controller.createDeadline);
router.get("/", controller.getDeadlines);
router.put("/:id", controller.updateDeadline);
router.delete("/:id", controller.deleteDeadline);

module.exports = router;
