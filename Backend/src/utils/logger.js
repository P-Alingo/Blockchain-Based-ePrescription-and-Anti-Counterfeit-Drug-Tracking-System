const timestamp = () => new Date().toISOString();

exports.info = (...args) => console.log(`[INFO] [${timestamp()}]`, ...args);
exports.warn = (...args) => console.warn(`[WARN] [${timestamp()}]`, ...args);
exports.error = (...args) => console.error(`[ERROR] [${timestamp()}]`, ...args);
