const prefix = '[NemoRewrite]';

const logger = Object.freeze({
    debug: (...values) => console.debug(prefix, ...values),
    info: (...values) => console.info(prefix, ...values),
    warn: (...values) => console.warn(prefix, ...values),
    error: (...values) => console.error(prefix, ...values),
});

export default logger;
