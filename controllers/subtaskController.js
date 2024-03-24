const SubTask = require('../models/subTaskModel');
const Task = require('../models/taskModel');

exports.createSubTask = async (req, res) => {
    try {
        const {task_id}=req.body;

        if(!task_id){
            return res.status(400).json({
                status:"fail",
                message:"task_id is required to create a subtask"
            });
        }
        let task=await Task.findById(task_id);

        if(!task){
            return res.status(404).json({
                status:"fail",
                message:"No task exists with this task_id enter valid task_id to create a subtask"
            });
        }
        if(task.deleted_at){
            return res.status(404).json({
                status:"fail",
                message:"Task with this task_id has been deleted"
            });
        }

        if(task.user.toString()!==req.user._id.toString()){
            return res.status(401).json({
                status:"fail",
                message:"You are not authorized to create a subtask for this task"
            });
        }

        const subtask= await SubTask.create({task_id,user:req.user._id});

        //update task with subtask
        task.subTasks.push({
            subTask_id:subtask._id,
            status:subtask.status
        });

        await task.save();

        return res.status(201).json({
            status:"success",
            data:{
                subtask
            }
        });
    } catch (error) {
        return res.status(500).json({
            status:"fail",
            message:error.message
        })
    }
}

exports.getAllSubtasks= async (req,res)=>{
    try {
        let filter={};

        if(req.query.task_id){
            filter.task_id=req.query.task_id;
        }

        filter.user=req.user._id;

        const subtasks=await SubTask.find({...filter, deleted_at:null});

        return res.status(200).json({
            stauts:"success",
            data:{
                subtasks
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            status:"fail",
            message:error.message
        
        })
    }
};

exports.updateSubtask= async (req,res)=>{
    try {
           const {status}=req.body;

           if(!status){
                return res.status(400).json({
                     status:"fail",
                     message:"only status is required to update a subtask"
                });
           }

        const subtask=await SubTask.findById(req.params.id);

        if(!subtask){
            return res.status(404).json({
                status:"fail",
                message:"No subtask found with the given id"
            });
        }
        if(subtask.deleted_at){
            return res.status(404).json({
                status:"fail",
                message:"Subtask with this id has been deleted"
            });
        }

        if(subtask.user.toString()!==req.user._id.toString()){
            return res.status(401).json({
                status:"fail",
                message:"You are not authorized to update this subtask"
            });
        }

        const updatedSubtask=await SubTask.findByIdAndUpdate(req.params.id,{status},{
            new:true,
            runValidators:true
        });

        const task=await Task.findById(updatedSubtask.task_id);
       
        task.subTasks.forEach(ele=>{
            if(ele.subTask_id.toString()===updatedSubtask._id.toString()){
                ele.status=updatedSubtask.status;
            }
        })

        task.markModified('subTasks');

        await task.save();
 
        return res.status(200).json({
            status:"success",
            data:{
                updatedSubtask
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            status:"fail",
            message:error.message,
        })
    }
};
exports.deleteSubtask= async (req,res)=>{
    try {
        const subtask=await SubTask.findById(req.params.id);

        if(!subtask){
            return res.status(404).json({
                status:"fail",
                message:"No subtask found with the given id"
            });
        }
        if(subtask.deleted_at){
            return res.status(404).json({
                status:"fail",
                message:"Subtask with this id has been deleted"
            });
        }

        if(subtask.user.toString()!==req.user._id.toString()){
            return res.status(401).json({
                status:"fail",
                message:"You are not authorized to delete this subtask"
            });
        }

        await SubTask.findByIdAndUpdate(req.params.id,{deleted_at:Date.now()});

        const task=await Task.findById(subtask.task_id);

        task.subTasks=task.subTasks.filter(ele=>ele.subTask_id.toString()!==req.params.id);

        await task.save();

        return res.status(204).json({
            status:"success",
            data:null
        });
        
    } catch (error) {
        return res.status(500).json({
            status:"fail",
            message:error.message
        })
    }
};