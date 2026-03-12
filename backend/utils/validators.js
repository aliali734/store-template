function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordPolicy(pw) {
  // min 8, upper, lower, number, special
  const ok =
    typeof pw === "string" &&
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  return ok;
}

module.exports = { isValidEmail, passwordPolicy };