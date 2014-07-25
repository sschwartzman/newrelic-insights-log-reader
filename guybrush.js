var Insights = require('insights')
, Tail = require('always-tail')
, fs = require('fs')
, trim = require('trim');

var cfile = __dirname + "/config.json";
var config = JSON.parse(fs.readFileSync(cfile));

if(!config.match || !config.accountid || !config.apikey || !config.logfile || !config.headers) {
	console.log('There are missing config options in ' + cfile);
	return;
}

var insights = new Insights(config.accountid, config.apikey, {max_events: 50, min_events: 10});

if (!fs.existsSync(config.logfile)) {
	console.log('There has been an error reading ' + config.logfile);
	return;
}

var tail = new Tail(config.logfile, '\n');

tail.on('line', function(data) {
	//console.log("got line:", data);
	if (!data.length) { return; }
	try {
		var insight = {};
		var captured = data.match(config.match);
		var i = 1;
		config.headers.forEach(function(header) {
			insight[header] = trim(captured[i]);
			i++;
		});
		console.debug(insight);
		insights.addEvent('LogEvent', insight);
	} catch (err) {
		//console.debug(err);
	}
});

tail.on('error', function(data) {
	console.log("error:", data);
});

tail.watch();