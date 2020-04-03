import processLocales from "./index";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("usage: node find <src dir> <dest dir>");
  process.exit(1);
}

processLocales({ srcDir: args[0], destDir: args[1] })
  .then(res => console.log(JSON.stringify(res, null, 2)))
  .catch(err => console.error(err.message));
