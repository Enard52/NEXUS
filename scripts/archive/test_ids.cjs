const https = require("https");

const ids = [
  "1550989460-0adf9ea622e2",
  "1558002038-1055907df827",
  "1593784991095-a205069470b6",
  "1543512214-318c7553f230",
  "1584345636043-41c618645ea9",
  "1527814050087-379369506644",
  "1585659722983-38ca40d421dc",
  "1557322984-7a62e402f741",
  "1626301614741-698f12d5d85f",
  "1584622650111-993a426fbf0a",
  "1613038411933-2ba8472f85fa",
  "1632757279375-92759f21f1c7",
  "1589824781478-f86a60db6202",
  "1513694203237-09fc22dd1817",
];

ids.forEach((id) => {
  const url = `https://images.unsplash.com/photo-${id}?w=10`;
  https
    .get(url, (res) => {
      console.log(`${id}: ${res.statusCode}`);
    })
    .on("error", (e) => {
      console.error(e);
    });
});
