// Copyright Epic Games, Inc. All Rights Reserved.
const fs = require('fs');
const path = require('path');

// Read in users from file
let records = [];
let usersFile = path.join(__dirname, './users.json');
if (fs.existsSync(usersFile)) {
  console.log(`Reading users from '${usersFile}'`)
  var content = fs.readFileSync(usersFile, 'utf8');
  try {
    records = JSON.parse(content);
  } catch(e) {
    console.log(`ERROR: Failed to parse users from file '${usersFile}'`)
  }
}

exports.findById = function(id, cb) {
    var idx = id - 1;
    if (records[idx]) {
      cb(null, records[idx]);
    } else {
      cb(new Error('User ' + id + ' does not exist'));
    }
}

exports.findByUsername = function(username, cb) {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
}
