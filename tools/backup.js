const exec = require('child_process').exec;
const moment = require('moment');
const config = require('config-lite')(__dirname);

exports.autoBackup = () => {
  const backup = () => {
    const day = moment().format('YYYY-MM-DD');
    const time = moment().format('H-mm-ss');
    const oldDay = moment().subtract(7, 'days').format('YYYY-MM-DD');
    exec(`${config.database.mongodump} -d ${config.database.name} -u ${config.database.user} -p ${config.database.password} -o ${config.database.output}/${day}/${time}`, (err, stdout, stderr) => {
      if (config.LOrW === 'W') {
        exec(`DIR /ON /B ${config.database.output}`, (err, stdout, stderr) => {
          const list = stdout.split('\r\n');
          list.pop();
          list.forEach((filename) => {
            if (moment(filename, 'YYYY-MM-DD') < moment(oldDay, 'YYYY-MM-DD')) {
              exec(`rd /s /q ${config.database.output}/${filename}`);
            }
          });
        });
      } else {
        exec(`ls ${config.database.output}`, (err, stdout, stderr) => {
          const list = stdout.split('\n');
          list.forEach((filename) => {
            if (moment(filename, 'YYYY-MM-DD') < moment(oldDay, 'YYYY-MM-DD')) {
              exec(`rm -rf ${config.database.output}/${filename}`);
            }
          });
        });
      }
    });
  };
  backup();
  setInterval(backup, 14400000); // 4小时备份一次
};
