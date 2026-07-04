const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const jobController = require("../controllers/job.controller");

router.get("/", auth, jobController.getJobs);
router.post("/", auth, jobController.createJob);

module.exports = router;
