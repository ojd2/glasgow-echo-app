/// Run this first, to initialise the data in CouchDB

// WARNING: It will delete any existing database called 'tasks'!

// TODO: Replace 'username' and 'password' with the username and password
// given by couchdb-setup
//
// You will also need to replace the server name with the details given by
// couchdb-setup
//
// NOTE: *NOT* your school/university username and password!
var nano = require('nano')('http://ddm4:4hrH9Pmb@pc3-037-l.cs.st-andrews.ac.uk:20049');

// our application's model, populated with some entries and tags
var entryID = { "next_entry" : 10 };
var init_questions = { "question_data" :
                    {"1": {"user": "edwin", "question": "Is Turkey good for business?", "submitTime":"2016-03-25T17:11:45.385Z"},
                     "2": {"user": "edwin", "question": "Is it wrong to pay a bribe?", "submitTime":"2016-03-25T17:10:45.385Z"},
                     "3": {"user": "edwin", "question": "How do I account for a bribe in my ledger?", "submitTime":"2016-03-25T17:09:05.385Z"},
                     "4": {"user": "edwin", "question": "Is Erdogan more powerful than Putin?", "submitTime":"2016-03-25T17:12:45.385Z"},
                     "5": {"user": "edwin", "question": "Random Kurdish rebels asking for a couch-surfing request - how to say no.", "submitTime":"2016-03-25T12:42:45.385Z"},
                     "6": {"user": "edwin", "question": "I don't want to join the PKK but I think I might need some help.", "submitTime":"2016-03-25T12:12:45.385Z"},
                     "7": {"user": "edwin", "question": "How many mushroom can fill a lamp?", "submitTime":"2016-03-25T17:12:45.385Z"},
                     "8": {"user": "edwin", "question": "Computer interviewing questions and answers.", "submitTime":"2016-03-25T16:12:45.385Z"},
                     "9": {"user": "edwin", "question": "Does a PhD destroy your soul? 32 other reasons to say No!", "submitTime":"2016-03-25T13:12:45.385Z"},
                 } };
var tagKeys = {"tagKeys":{
                        "politics": [],
                    }};


nano.db.destroy('questions', function (err, body) {
   console.log(err);
});

nano.db.create('questions', function (err, body) {
    taskdb = nano.db.use('questions');
    if (!err) {
        
        // Database didn't exist, so populate it with some initial data
        taskdb.insert(init_questions, 'question_info', function(err, body) {
            if (!err) {
                console.log("Initialised question info:");
                console.log(body);
            } else {
                console.log("Error when initialising question info");
                console.log(err);
            }
        });

        taskdb.insert(entryID, 'entryID', function(err, body) {
            if (!err) {
                console.log("Initialised Entry ID:");
                console.log(body);
            } else {
                console.log("Error when initialising entry ID");
                console.log(err);
            }
        })

        taskdb.insert(tagKeys, 'tag_info', function(err, body) {
            if (!err) {
                console.log("Initialised Tags:");
                console.log(body);
            } else {
                console.log("Error when initialising Tags");
                console.log(err);
            }
        })        
    }
});

//--------------------------------------------------
// Set-up userNames document
//---------------------------------------------------
var userID = { "next_user" : 4 };
var init_userNames = {"userNames":{
                        "edwin": {"password": "notActually", "sessionCookie": "edwinCookie", "email":"ecb10@st-andrews.ac.uk"},
                        "donal": {"password": "justAnother", "sessionCookie": "donalCookie", "email":"ddm4@st-andrews.ac.uk"},
                        "ollie": {"password": "camelCase", "sessionCookie":"ollieCookie", "email":"ojd2@st-andrews.ac.uk"},
                    }};
//would be a good idea to hash the passwords
nano.db.destroy('usernames', function (err, body) {
   console.log(err);
});

nano.db.create('usernames', function (err, body) {
    taskdb = nano.db.use('usernames');
    if (!err) {
        
        // Database didn't exist, so populate it with some initial data
        taskdb.insert(init_userNames, 'user_info', function(err, body) {
            if (!err) {
                console.log("Initialised user_info:");
                console.log(body);
            } else {
                console.log("Error when initialising error_info");
                console.log(err);
            }
        });

        taskdb.insert(userID, 'userID', function(err, body) {
            if (!err) {
                console.log("Initialised user ID:");
                console.log(body);
            } else {
                console.log("Error when initialising user ID");
                console.log(err);
            }
        })
    }
});