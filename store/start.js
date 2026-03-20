process.argv.push("-s", "dist", "-l", process.env.PORT || "3000");
require("./node_modules/serve/build/main.js");
