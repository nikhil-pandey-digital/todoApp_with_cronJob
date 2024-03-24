const mongoose = require("mongoose");

const subTaskSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "task",
    required: true,
  },
  status: {
    type: String,
    enum: ["0", "1"],
    default: "0",
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default:null,
  },
  deleted_at: {
    type: Date,
    default: null,
  },
});

subTaskSchema.pre("save",function(next){
if(!this.isNew) this.updated_at=Date.now();
  next();
});

subTaskSchema.pre(['findByIdAndUpdate', 'findOneAndUpdate', 'update'], function(next) {
  this._update.updated_at = Date.now();
  next();
});

const subTaskModel = mongoose.model("subTask", subTaskSchema);

module.exports = subTaskModel;
