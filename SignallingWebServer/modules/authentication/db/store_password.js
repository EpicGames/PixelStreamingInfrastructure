// Copyright Epic Games, Inc. All Rights Reserved.
//
// Usage: npm run store_password -- --username <USERNAME> --password <PASSWORD>
// 	or from ./modules/authentication/db dir: node store_password.js --username <USERNAME> --password <PASSWORD>
//
// --usersFile is an optional parameter that can be used to specify a different location for the users database file
// 		use this if running the command from a different working dir. The default location is './users.json'
// 		e.g. If running from the SignallingWebServer dir use: --usersFile ./modules/authentication/db/users.json 

const argv = require('yargs').argv;
const fs = require('fs');
const bcrypt = require('bcryptjs');

var username, password;
var usersFile = './users.json'

const STORE_PLAINTEXT_PASSWORD = false;

try {
	if(typeof argv.username != 'undefined'){
		username = argv.username.toString();
    }
	
	if(typeof argv.password != 'undefined'){
		password = argv.password;
    }

    if(typeof argv.usersFile != 'undefined'){
		usersFile = argv.usersFile;
    }
} catch (e) {
    console.error(e);
    process.exit(2);
}

if(username && password){
	let existingAccounts = [];
	if (fs.existsSync(usersFile)) {
		console.log(`File '${usersFile}' exists, reading file`)
		var content = fs.readFileSync(usersFile, 'utf8');
		try{
			existingAccounts = JSON.parse(content);
		}
		catch(e){
			console.error(`Existing file '${usersFile}', has invalid JSON: ${e}`);
		}
	}

	var existingUser = existingAccounts.find( u => u.username == username)
	if(existingUser){
		console.log(`User '${username}', already exists, updating password`)
		existingUser.passwordHash = generatePasswordHash(password)
		if(STORE_PLAINTEXT_PASSWORD)
			existingUser.password = password;
		else if (existingUser.password)
			delete existingUser.password;

	} else {
		console.log(`Adding new user '${username}'`)
		let newUser = {
			id: existingAccounts.length + 1,
			username: username,
			passwordHash: generatePasswordHash(password)
		}
		if(STORE_PLAINTEXT_PASSWORD)
			newUser.password = password;

		existingAccounts.push(newUser);
	}

	console.log(`Writing updated users to '${usersFile}'`);
	var newContent = JSON.stringify(existingAccounts);
	fs.writeFileSync(usersFile, newContent);
} else {
	console.log(`Please pass in both username (${username}) and password (${password}) please`);
}

function generatePasswordHash(pass){
	return bcrypt.hashSync(pass, 12)
}