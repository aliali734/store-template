const SIZE_OPTIONS = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  accessories: ["One Size"]
};

function getSizesForDepartment(department) {
  const key = String(department || "").toLowerCase();
  return SIZE_OPTIONS[key] || [];
}

window.SIZE_OPTIONS = SIZE_OPTIONS;
window.getSizesForDepartment = getSizesForDepartment;