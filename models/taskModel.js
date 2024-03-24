const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  due_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["TODO", "IN_PROGRESS", "DONE"],
    default: "TODO",
  },
  priority: {
    type: String,
    enum: ["0", "1", "2", "3"], //decide by cronjob
    default: "3",
  },
  assignee: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  subTasks: [
    {
      subTask_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subTask",
      },
      status: {
        type: String,
        enum: ["0", "1"],
      },
    },
  ],

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
    default: null,
  },
  deleted_at: {
    type: Date,
    default: null,
  },
});

taskSchema.pre("save", function (next) {
  if (this.isNew) {
    const currentDate = new Date();
    const dueDate = new Date(this.due_date);

    if (dueDate - currentDate <= 1 * 24 * 60 * 60 * 1000) {
      this.priority = "0";
    } else if (dueDate - currentDate <= 2 * 24 * 60 * 60 * 1000) {
      this.priority = "1";
    } else if (dueDate - currentDate <= 4 * 24 * 60 * 60 * 1000) {
      this.priority = "2";
    } else {
      this.priority = "3";
    }
  }
  if (!this.isNew) this.updated_at = Date.now();

  next();
});

taskSchema.pre(
  ["findByIdAndUpdate", "findOneAndUpdate", "update"],
  function (next) {
    this._update.updated_at = Date.now();
    next();
  }
);

taskSchema.post(
  ["findOneAndUpdate", "findByIdAndUpdate", "update", "save"],
  async function (doc) {
    const updatedDoc = await Task.findById(doc._id);

    const allSubtasksCompleted =  updatedDoc.subTasks.length > 0?updatedDoc.subTasks.every(
      (subTask) => subTask.status === "1"
    ):false;

    const anySubtaskCompleted = updatedDoc.subTasks.some(
      (subTask) => subTask.status === "1"
    );

    console.log(allSubtasksCompleted, anySubtaskCompleted);

    if (allSubtasksCompleted && updatedDoc.status !== "DONE") {
      await Task.findByIdAndUpdate(updatedDoc._id, { status: "DONE" });
    } else if (
      updatedDoc.subTasks.length > 1 &&
      anySubtaskCompleted &&
      !allSubtasksCompleted &&
      updatedDoc.status !== "IN_PROGRESS"
    ) {
      await Task.findByIdAndUpdate(updatedDoc._id, { status: "IN_PROGRESS" });
    } else if (!anySubtaskCompleted && updatedDoc.status !== "TODO") {
      await Task.findByIdAndUpdate(updatedDoc._id, { status: "TODO" });
    }
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
