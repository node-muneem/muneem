function fake () { /* I eat your logs*/}

exports.log = {
  fatal: fake,
  error: fake,
  warn: fake,
  info: fake,
  debug: fake,
  trace: fake
}