const fs = require("fs");

let household = fs.readFileSync("stitch-household.html", "utf8");
household = household.replace(
  '<a aria-label="Geri" class="p-1" href="stitch-profile.html">',
  '<a aria-label="Geri" class="p-1" href="javascript:void(0)" onclick="window.history.length > 1 ? history.back() : window.location.href=\'stitch-home.html\'">',
);
fs.writeFileSync("stitch-household.html", household, "utf8");
console.log("Fixed back button in stitch-household.html");
