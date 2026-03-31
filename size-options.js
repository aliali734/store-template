const SIZE_OPTIONS = {
  clothing: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y","XS", "S", "M", "L", "XL", "XXL"],
  shoes: ["25","26", "27", "28", "29", "30", "31", "32", "33", "34", "35","36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  accessories: ["One Size"]
};

function getSizesForDepartment(department) {
  const key = String(department || "").toLowerCase();
  return SIZE_OPTIONS[key] || [];
}

window.SIZE_OPTIONS = SIZE_OPTIONS;
window.getSizesForDepartment = getSizesForDepartment;