const express = require("express");
const authController = require("../controllers/authController");
const taskController = require("../controllers/taskController");

const router=express.Router();

router.use(authController.protect);//user must be logged in to access the routes below

router.post("/",taskController.createTask);//create a task
router.get("/",taskController.getAllTasksOfUser);//get all tasks
router.patch("/:id",taskController.updateTask);//update a task
router.delete("/:id",taskController.deleteTask);//delete a task

module.exports = router;