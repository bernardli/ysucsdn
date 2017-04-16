module.exports = {
  port: 3000, // 端口
  session: {
    secret: '',
    key: '',
    maxAge: 2592000000,
  },
  adminID: '', // 管理员id
  transporter: { // smtp设置
    host: 'smtp.ym.163.com', // smtp地址 这里是163邮箱的
    port: 994, // 端口 这里是163邮箱的
    secure: true, // 是否https加密
    auth: {
      user: '', // 邮箱
      pass: '', //密码
    },
  },
  database: {
    name: '', // 数据库名字
    mongodump: '', // mongodump位置
    user: '', // 数据库管理员
    password: '', // 数据库密码
    output: '', // 输出路径
  },
  delCMD: '', // 删除命令
  lsCMD: '',
  adminEmail: '', // 管理员邮箱
  mongodb: 'mongodb://name:password@localhost:27017/database', //连接数据库
};
