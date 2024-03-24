const cron = require("node-cron");
const twilio = require("twilio");
const Task = require("./models/taskModel");
const User = require("./models/userModel");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// This cron job will run every minute, and update the priority of each task based on its due date
cron.schedule("* * * * *", async () => {
  const tasks = await Task.find();

  tasks.forEach(async (task) => {
    const dueDate = new Date(task.due_date);
    const now = new Date();

    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    const differenceInMilliseconds = dueDate - now;

    if (differenceInMilliseconds < oneDayInMilliseconds) {
      // The difference is 1 day or less
      task.priority = "0";
    } else if (
      differenceInMilliseconds >= oneDayInMilliseconds &&
      differenceInMilliseconds <= 2 * oneDayInMilliseconds
    ) {
      // 2 days
      task.priority = "1";
    } else if (
      differenceInMilliseconds >= 2 * oneDayInMilliseconds &&
      differenceInMilliseconds <= 4 * oneDayInMilliseconds
    ) {
      task.priority = "2";
    } else {
      task.priority = "3";
    }

    await task.save();
  });
});

//cron job for voice call
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const tasks = await Task.find({ due_date: { $lt: now }, deleted_at: null })
      .populate("assignee")
      .exec();

    console.log(tasks);

    for (const task of tasks) {
      task.assignee.sort((a, b) => Number(a.priority) - Number(b.priority));

      for (const user of task.assignee) {
        const call = await client.calls.create({
          url: "http://demo.twilio.com/docs/voice.xml",
          to: `+91${user.phone_number}`,
          from: "+16562194062",
        });
        console.log(call.sid);
        if (call.status === "completed") break;
      }
    }
  } catch (error) {
    console.log(error);
  }
});
