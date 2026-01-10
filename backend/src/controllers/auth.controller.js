const supabase = require("../config/supabase");
const User = require("../models/user");

exports.signup = async (req, res) => {
  const { email, password, name, role } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return res.status(400).json({ error: error.message });

  const user = await User.create({
    supabase_id: data.user.id,
    email,
    name,
    role
  });

  res.json(user);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(400).json({ error: error.message });

  const user = await User.findOne({ email });
  res.json(user);
};
