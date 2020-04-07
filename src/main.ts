import processLocales, { Opts } from "./index";

function parseArguments() {
  const opts: Partial<Opts> = {};
  const args = process.argv.slice(2);

  let i = 0;
  const params = [] as string[];
  while (i < args.length) {
    switch (args[i]) {
      case "-j":
        opts.ts = false;
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
      "usage: l10n-tool [-j] <src dir> <dest dir>"
    );
    process.exit(1);
  }

  opts.srcDir = params[0];
  opts.destDir = params[1];
  return opts;
}

processLocales(parseArguments()).catch(err => console.error(err.message));
