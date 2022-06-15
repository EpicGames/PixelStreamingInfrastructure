// Copyright Epic Games, Inc. All Rights Reserved.

const fs = require('fs');
const { Console } = require('console');

var loggers=[];
var logFunctions=[];
var logColorFunctions=[];

console.log = function(msg, ...args) {
	logFunctions.forEach((logFunction) => {
		logFunction(msg, ...args);
	});
}

console.logColor = function(color, msg, ...args) {
	logColorFunctions.forEach((logColorFunction) => {
		logColorFunction(color, msg, ...args);
	});
}

const AllAttributesOff = '\x1b[0m';
const BoldOn = '\x1b[1m';
const Black = '\x1b[30m';
const Red = '\x1b[31m';
const Green = '\x1b[32m';
const Yellow = '\x1b[33m';
const Blue = '\x1b[34m';
const Magenta = '\x1b[35m';
const Cyan = '\x1b[36m';
const White = '\x1b[37m';

/**
 * Pad the start of the given number with zeros so it takes up the number of digits.
 * e.g. zeroPad(5, 3) = '005' and zeroPad(23, 2) = '23'.
 */
function zeroPad(number, digits) {
	let string = number.toString();
	while (string.length < digits) {
		string = '0' + string;
	}
	return string;
}

/**
 * Create a string of the form 'YEAR.MONTH.DATE.HOURS.MINUTES.SECONDS'.
 */
function dateTimeToString() {
	let date = new Date();
	return `${date.getFullYear()}.${zeroPad(date.getMonth(), 2)}.${zeroPad(date.getDate(), 2)}.${zeroPad(date.getHours(), 2)}.${zeroPad(date.getMinutes(), 2)}.${zeroPad(date.getSeconds(), 2)}`;
}

/**
 * Create a string of the form 'HOURS.MINUTES.SECONDS.MILLISECONDS'.
 */
function timeToString() {
	let date = new Date();
	return `${zeroPad(date.getHours(), 2)}:${zeroPad(date.getMinutes(), 2)}:${zeroPad(date.getSeconds(), 2)}.${zeroPad(date.getMilliseconds(), 3)}`;
}

function RegisterFileLogger(path) {
	if(path == null)
		path = './';
	
	if (!fs.existsSync(path))
		fs.mkdirSync(path);
	
	var output = fs.createWriteStream(`./logs/${dateTimeToString()}.log`);
	var fileLogger = new Console(output);
	logFunctions.push(function(msg, ...args) {
		fileLogger.log(`${timeToString()} ${msg}`, ...args);
	});
	
	logColorFunctions.push(function(color, msg, ...args) {
		fileLogger.log(`${timeToString()} ${msg}`, ...args);
	});
	loggers.push(fileLogger);
}
	
function RegisterConsoleLogger() {
	var consoleLogger = new Console(process.stdout, process.stderr)
	logFunctions.push(function(msg, ...args) {
		consoleLogger.log(`${timeToString()} ${msg}`, ...args);
	});
	
	logColorFunctions.push(function(color, msg, ...args) {
		consoleLogger.log(`${BoldOn}${color}${timeToString()} ${msg}${AllAttributesOff}`, ...args);
	});
	loggers.push(consoleLogger);
}

module.exports = {
	//Functions
	RegisterFileLogger,
	RegisterConsoleLogger,
	
	//Variables
	AllAttributesOff,
	BoldOn,
	Black,
	Red,
	Green,
	Yellow,
	Blue,
	Magenta,
	Cyan,
	White
}