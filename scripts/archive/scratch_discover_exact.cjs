const fs = require("fs");

const homeFile = "c:/Users/ensar/Desktop/NEXUS-main/stitch-home.html";
const discoverFile = "c:/Users/ensar/Desktop/NEXUS-main/stitch-discover.html";

const homeHtml = fs.readFileSync(homeFile, "utf8");
let discoverHtml = fs.readFileSync(discoverFile, "utf8");

// 1. Extract the Home Selector button from stitch-home.html
const buttonStart = homeHtml.indexOf("<!-- Home Selector -->");
const buttonEnd = homeHtml.indexOf("</button>", buttonStart) + 9;
const homeButtonHtml = homeHtml.substring(buttonStart, buttonEnd);

// 2. Extract the Modal and script from stitch-home.html
const modalStart = homeHtml.indexOf("<!-- Home Selector Modal -->");
const modalEnd = homeHtml.indexOf("</script>", modalStart) + 9;
const modalHtmlBlock = homeHtml.substring(modalStart, modalEnd);

// 3. Replace the button in stitch-discover.html
const oldButtonStart = discoverHtml.indexOf("<!-- Home Selector -->");
const oldButtonEnd = discoverHtml.indexOf("</button>", oldButtonStart) + 9;

if (oldButtonStart !== -1 && oldButtonEnd !== -1) {
  discoverHtml =
    discoverHtml.substring(0, oldButtonStart) +
    homeButtonHtml +
    discoverHtml.substring(oldButtonEnd);
}

// 4. Inject the modal if it's not there
if (!discoverHtml.includes("<!-- Home Selector Modal -->")) {
  discoverHtml = discoverHtml.replace("</body>", modalHtmlBlock + "\n</body>");
} else {
  // replace existing modal
  const oldModalStart = discoverHtml.indexOf("<!-- Home Selector Modal -->");
  const oldModalEnd = discoverHtml.indexOf("</script>", oldModalStart) + 9;
  discoverHtml =
    discoverHtml.substring(0, oldModalStart) + modalHtmlBlock + discoverHtml.substring(oldModalEnd);
}

fs.writeFileSync(discoverFile, discoverHtml, "utf8");
console.log("Successfully perfectly cloned the Home Selector and Modal to stitch-discover.html");
