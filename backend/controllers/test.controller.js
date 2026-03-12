const testRoute = (req, res) => {
  res.status(200).json({ success: true, message: "Backend structure is working 🚀" });
};

module.exports = { testRoute };

