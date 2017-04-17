#!/bin/bash
echo "cd /root/ysucsdn/"
cd /root/ysucsdn/
echo "pulling source code..."
git pull
echo "restart index"
pm2 restart index --update-env
echo "Finished."