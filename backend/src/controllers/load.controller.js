const Deadline = require("../models/deadline");
const StudentLoad = require("../models/studentload");
const { calculateLoad } = require("../services/loadCalculator");

exports.getLoad = async (req, res) => {
    const { studentId } = req.params;

    const deadlines = await Deadline.find();
    const result = calculateLoad(deadlines);

    const record = await StudentLoad.create({
        student_id: studentId,
        date: new Date().toISOString().split("T")[0],
        load_score: result.load,
        risk_level: result.risk
    });

    res.json(record);
};
