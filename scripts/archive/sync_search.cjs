const fs = require("fs");

const homeHtml = fs.readFileSync("stitch-home.html", "utf8");
let smartHtml = fs.readFileSync("stitch-smart.html", "utf8");

// Extract the AI search bar block from stitch-home.html
const searchRegex = /(<!-- BEGIN: NEXUS AI Input[\s\S]*?<!-- END: NEXUS AI Input -->)/;
const searchMatch = homeHtml.match(searchRegex);

if (searchMatch) {
  const searchBlock = searchMatch[0];

  // Replace the old Search Bar Area in stitch-smart.html
  const oldSearchRegex = /(<!-- BEGIN: Search Bar Area -->[\s\S]*?<!-- END: Search Bar Area -->)/;
  if (oldSearchRegex.test(smartHtml)) {
    smartHtml = smartHtml.replace(oldSearchRegex, searchBlock);
    fs.writeFileSync("stitch-smart.html", smartHtml, "utf8");
    console.log("Synchronized AI search input in stitch-smart.html");
  } else {
    console.log("Could not find Search Bar Area in stitch-smart.html");
  }
} else {
  console.log("Could not find NEXUS AI Input in stitch-home.html");
}
