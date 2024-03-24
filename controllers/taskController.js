const Task = require("../models/taskModel");
const User = require("../models/userModel");
const SubTask = require("../models/subTaskModel");

exports.createTask = async (req, res) => {
  try {
    const { title, description, due_date } = req.body;

    let assignees = [];
    if (req.body.assignees) {
      assignees = JSON.parse(req.body.assignees);
    }

    if (!title || !due_date) {
      return res.status(400).json({
        status: "fail",
        message: "title and due_date are required to create a task",
      });
    }
    let assigneeIds = [];

    if (assignees.length > 0) {
      assigneeIds = await Promise.all(
        assignees.map(async (assignee) => {
          const user = await User.findOne({ phone_number: assignee });
          if (!user) {
            throw new Error(
              `No user exists with phone number: ${assignee}. add valid phone number of assignees`
            );
          }
          return user._id;
        })
      );
    }

    if (
      !assigneeIds.map((id) => id.toString()).includes(req.user._id.toString())
    )
      assigneeIds.push(req.user._id); //add current user as assignees

    const task = await Task.create({
      title,
      description,
      due_date,
      assignee: assigneeIds,
      user: req.user._id,
    });

    return res.status(201).json({
      status: "success",
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.getAllTasksOfUser = async (req, res) => {
  try {
    const filter = {
      user: req.user._id,
    };
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    if (req.query.due_date) {
      filter.due_date = req.query.due_date;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({...filter,deleted_at:null}).skip(skip).limit(limit);;
  
    res.status(200).json({
      status: "success",
      data: {
        tasks,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateTask=async(req,res)=>{
  try{
    const {status,due_date}=req.body;

    if(!status && !due_date){
      return res.status(400).json({
        status:"fail",
        message:"status or due_date is required to update a task"
      });
    }

    const task=await Task.findById(req.params.id);
    if(!task){
      return res.status(404).json({
        status:"fail",
        message:"No task found with the given id"
      });
    }
    if(task.user.toString()!==req.user._id.toString()){
      return res.status(401).json({
        status:"fail",
        message:"You are not authorized to update this task"
      });
    }

    if(status){
      task.status=status;
    }
    if(due_date){
      task.due_date=due_date;
    }

    if(status){

      if(status==="DONE"){
         for(let ele of task.subTasks){
           await SubTask.findByIdAndUpdate(ele.subTask_id,{status:"1"});
           ele.status="1";
         }
      }
      else if(status==="TODO"){
        for(let ele of task.subTasks){
          await SubTask.findByIdAndUpdate(ele.subTask_id,{status:"0"});
          ele.status="0";
        }
      }
    }
    await task.save();

    return res.status(200).json({
      status:"success",
      data:{
        task
      }
    });

  }catch(err){
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteTask=async(req,res)=>{
  try {
     const task=  await Task.findById(req.params.id);
      if(!task){
        return res.status(404).json({
          status:"fail",
          message:"No task found with the given id"
        });
      }

      if(task.user.toString()!==req.user._id.toString()){
        return res.status(401).json({
          status:"fail",
          message:"You are not authorized to delete this task"
        });
      }


      task.deleted_at=Date.now();
      await task.save();

      //delete the corresoinding subtasks
     await Promise.all(task.subTasks.map(async(ele)=>{
      await SubTask.findByIdAndUpdate(ele.subTask_id,{deleted_at:Date.now()});
    })) ;

      return res.status(204).json({
        status:"success",
         message:"task deleted successfully"

      });

  } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
  }
};