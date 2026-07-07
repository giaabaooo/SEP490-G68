const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const jobController = require("../controllers/job.controller");

router.get("/", authOptional, jobController.getJobs);
router.get("/:id", authOptional, jobController.getJobById);
router.post("/", auth, jobController.createJob);

module.exports = router;
