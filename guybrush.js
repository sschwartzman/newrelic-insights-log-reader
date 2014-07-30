var Insights = require('insights')
, Tail = require('always-tail')
, fs = require('fs')
, trim = require('trim');

console.log("Guybrush: Log Reader for New Relic Insights");

var cfile = __dirname + "/config.json";
var config = JSON.parse(fs.readFileSync(cfile));
var bookmark = 0; //Start at beginning of log unless otherwise spec'd
var insights_options = {};

if(!config.match || !config.accountid || !config.apikey || !config.logfile || !config.headers) {
	console.log("There are missing config options in " + cfile);
	return;
}

insights_options.interval = config.send_interval || 10;
insights_options.max_events = config.send_max_events || 50;
insights_options.min_events = config.send_min_events || 5;
console.log("Event-sending options:");
console.log(insights_options);
var insights = new Insights(config.accountid, config.apikey, insights_options);

if (!fs.existsSync(config.logfile)) {
	console.log("There has been an error reading " + config.logfile);
	return;
}

if(config.newmsgs) {
	var stats = fs.statSync(config.logfile);
	bookmark = stats.size;
	console.log("Starting log reading at byte " + stats.size);
} else {
	console.log("Starting log reading at beginning of file.");
}


//var tail = new Tail(config.logfile, '\n', ); 
var tail = new Tail(config.logfile, '\n', { start: bookmark, interval: 10000 });

tail.on('line', function(data) {
	// console.log("got line:", data); //Debug
	if (!data.length) { return; }
	try {
		var insight = {};
		var captured = data.match(config.match);
		var i = 1;
		config.headers.forEach(function(header) {
			insight[header] = trim(captured[i]);
			i++;
		});
		// console.log(insight); //Debug
		insights.addEvent('LogEvent', insight);
	} catch (err) {
		// console.log(err); //Debug
	}
});

tail.on('error', function(data) {
	console.log("error:", data);
});

tail.watch();
