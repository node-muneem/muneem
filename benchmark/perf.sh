node muneem/app.js & sleep 5;
ab -k -n 50000 -c 100 -t 20 http://127.0.0.1:3002/sample | grep "Requests per second:"
pkill -f muneem/app.js;
sleep 3