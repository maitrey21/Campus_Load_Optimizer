exports.calculateLoad = (deadlines) => {
  let load = 0;

  deadlines.forEach(d => {
    const daysLeft = Math.ceil(
      (new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    let urgency = 1;
    if (daysLeft <= 1) urgency = 5;
    else if (daysLeft <= 3) urgency = 3;
    else if (daysLeft <= 7) urgency = 2;

    load += d.difficulty * urgency;
  });

  load = Math.min(load, 100);

  let risk = "safe";
  if (load > 70) risk = "danger";
  else if (load > 40) risk = "warning";

  return { load, risk };
};
