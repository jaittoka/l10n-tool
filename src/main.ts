import processLocales, { Opts } from "./index";

function makeRegexMatcher(re: string) {
  const regexp = new RegExp(re);
  return (path: string) => regexp.test(path);
}

function parseArguments() {
  const opts: Partial<Opts> = {};
  const args = process.argv.slice(2);

  function checkOpt(v: string | undefined, msg: string): string {
    if (!v) {
      console.error(msg);
      process.exit(1);
    }
    return v;
  }

  let i = 0;
  const params = [] as string[];
  while (i < args.length) {
    switch (args[i]) {
      case "-j":
        opts.ts = false;
        break;
      case "-p":
        opts.prefix = checkOpt(args[++i], "-p option needs a prefix string");
        break;
      case "-r":
        opts.isLocaleFile = makeRegexMatcher(
          checkOpt(args[++i], "-r option needs a regular expression.")
        );
        break;
      case '-c':
        opts.comments = true;
        break;
      default:
        params.push(args[i]);
        break;
    }
    i++;
  }

  if (params.length < 2) {
    console.log(
      "usage: node find [-j] [-p <prefix>] [-r regex] <src dir> <dest dir>"
    );
    process.exit(1);
  }

  opts.srcDir = params[0];
  opts.destDir = params[1];
  return opts;
}

processLocales(parseArguments()).catch(err => console.error(err.message));
