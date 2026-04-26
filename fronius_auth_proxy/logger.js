const ts = () => new Date().toISOString();
const log = (...a) => console.log(ts(), ...a);
const err = (...a) => console.error(ts(), ...a);
module.exports = { log, err };
