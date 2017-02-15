module.exports = {
    port: 3000,
    session: {
        secret: 'blog',
        key: 'blog',
        maxAge: 2592000000
    },
    mongodb: 'mongodb://admin:admin@localhost:27017/blog'
};