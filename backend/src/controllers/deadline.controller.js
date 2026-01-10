const Deadline = require("../models/deadline");

exports.createDeadline = async (req, res) => {
  const deadline = await Deadline.create(req.body);
  res.json(deadline);
};

exports.getDeadlines = async (req, res) => {
  const deadlines = await Deadline.find();
  res.json(deadlines);
};

exports.updateDeadline = async (req, res) => {
  const updated = await Deadline.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

exports.deleteDeadline = async (req, res) => {
  await Deadline.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
