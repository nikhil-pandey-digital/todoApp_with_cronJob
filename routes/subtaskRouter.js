const express = require("express");
const authController = require("../controllers/authController");
const subtaskController = require("../controllers/subtaskController");

const router=express.Router();

router.use(authController.protect);//user must be logged in to access the routes below

router.post("/",subtaskController.createSubTask);//create a subtask
router.get("/",subtaskController.getAllSubtasks);//get all subtasks || get all subtasks of a task
router.patch("/:id",subtaskController.updateSubtask);//update a subtask
router.delete("/:id",subtaskController.deleteSubtask);//delete a subtask

module.exports= router;
