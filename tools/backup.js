const exec = require('child_process').exec;
const moment = require('moment');
const config = require('config-lite');

exports.autoBackup = () => {
  const backup = () => {
    const day = moment().format('YYYY-MM-DD');
    const time = moment().format('H-mm-ss');
    const oldDay = moment().subtract(7, 'days').format('YYYY-MM-DD');
    exec(`${config.database.mongodump} -d ${config.database.name} -u ${config.database.user} -p ${config.database.password} -o ${config.database.output}\\${day}\\${time}`, (err, stdout, stderr) => {
      exec(`${config.lsCMD}${config.database.output}`, (err, stdout, stderr) => {
        const list = stdout.split('\r\n');
        list.pop();
        list.forEach((filename) => {
          if (moment(filename, 'YYYY-MM-DD') < moment(oldDay, 'YYYY-MM-DD')) {
            exec(`${config.delCMD}${config.database.output}\\${filename}`);
          }
        });
      });
    });
  };

  // backup();  // test

  setInterval(backup, 14400000); // 4小时备份一次
};