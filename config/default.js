module.exports = {
    port: 3000,
    session: {
        secret: 'ysucsdn',
        key: 'ysucsdn',
        maxAge: 2592000000
    },
    mongodb: 'mongodb://test:test@localhost:27017/ysucsdn'
};