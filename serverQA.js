/**
* March 2016, CS5003, St Andrews MSc
* serverQA.js
* Authors: Oliver and Donal, based-off Edwin's example ToDo server code.
*
**/

var http = require('http');
var express = require('express');
var json = require('express-json');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var sanitizer = require('sanitizer');

// You will also need to replace the server name with the details given by
// couchdb. Will need to include password and user name if this is setup in couchdb
// "http://user:password@addressToCouchdb"
var nano = require('nano')('http://ddm4:WTs7FPTK@pc2-090-l.cs.st-andrews.ac.uk:20049');

var qa_db = nano.db.use('questions'); // Reference to the database storing the tasks
var user_db = nano.db.use('usernames'); //Reference to the database storing usernames and passwords
// var session_db = nano.db.use('sessions'); //Reference to the database storing live sessions and usernames

/** 
*   Lists all replies to question identified by q_id 
*   in parameter of GET request. 
*   Upgrades: Should test for session cookie.  
*/
function listReplies(req, res) {
    //Helpful code to use: req.originalUrl or req.query.q_id;
    var q_id = req.query.q_id;
    
    if (req.originalUrl.match(/reply\?q_id=\d+/) === null) {
        res.status(400).send("Error. To get a list of replies for a question, use the following" +  
            "GET request path: /reply?q_id=<integer> where <integer> is replaced by the" + 
            "an integer corresponding to the question ID replies are being sought for.");  
    }
    else {
        //call db for questions doc, then find replies. 
        qa_db.get('question_info', { revs_info : true }, function (err, dbDoc) {
            if (dbDoc["question_data"][q_id] === undefined) {
                res.status(404).send('That q_id does not match any question in the db! Try another integer?');
            }
            else if (dbDoc["question_data"][q_id]["replies"] === undefined) {
                //we have said q_id, but no replies as of yet. Return empty array.
                res.status(200).send([]);
            }
            else {
                var replies = dbDoc["question_data"][q_id]["replies"];
                res.status(200).json(replies);
            }
        });
    }
}

// List all the questions information as JSON, test for valid session. 
function listQuestions(req, res) {
    if (validateSession(req.cookies.session) === true) {
        qa_db.get('question_info', { revs_info : true }, function (err, questions) {
            res.json(questions["question_data"]);
        });
    }
    else {
        res.send('No valid session cookie presented. User not logged in.');
    }
}

/*
* Get the task with the given id req.id.
*/
function getTask(req, res) {
    qa_db.get('question_info', { revs_info : true }, function (err, tasks) {
        res.json(tasks["task_data"][req.params.id]);
    });
}

/*
* Delete the task with the given id req.id.
*/
function deleteTask(req, res) {
    qa_db.get('question_info', { revs_info : true }, function (err, tasks) {
        delete tasks["task_data"][req.params.id];

        // Note that 'tasks' already contains the _rev field we need to 
        // update the data

        qa_db.insert(tasks, 'question_info', function (err, t) {
            res.json(tasks["task_data"]);
        });
    });
}

/*
* Once reply has been added, updated question doc.
* Function very much like updateqa_db 
*/
function updateTEMP(questions) {
    qa_db.insert(questions, 'question_info', function(err_t, t) { 
        console.log("Added reply to a question to CouchDB");
        //console.log(err_e);
        console.log(err_t);
    });
}

/*
* Add updated question information to CouchDB
*/
function updateqa_db(entryID, questions) {
    qa_db.insert(entryID, 'entryID', function(err_e, e) {
        qa_db.insert(questions, 'question_info', function(err_t, t) { 
            console.log("Added question to CouchDB");
            console.log(err_e);
            console.log(err_t);
        });
    });
}

/* 
* Add a new reply to a question identified by q_id body of request
* ERROR: 
*   -   var replies = questions["question_data"][q_id]["replies"];
*   -   TypeError: Cannot read property 'replies' of undefined
*/
function addReply(req, res) {   
    //supply post request in body a JSON object with a q_id and a reply text
    req.body = JSON.parse(req.body);
    var q_id = req.body.q_id;
    var reply = req.body.reply;
    console.log('before any santising: ' + reply);
    //sanitise reply input here
    reply = sanitizer.escape(reply);
    reply = sanitizer.sanitize(reply); 

    qa_db.get('question_info', { revs_info : true }, function (err, questions) {
    if (!err) {
        //should be an array of replies, or undefined;
        var replies = questions["question_data"][q_id]["replies"];
        if (replies === undefined) {
            questions["question_data"][q_id]["replies"] = [];
            replies = questions["question_data"][q_id]["replies"];

        }
        replies.push(reply);
        console.log("question: " + q_id + " had a reply added: " + reply);
                
        // Add the new data to CouchDB (separate function since
        // otherwise the callbacks get very deeply nested!)
        updateTEMP(questions);

        res.writeHead(201, {'Location' : 'Not sure this is needed?'});
        res.end();
        }
    });
}

/* 
* Add a new question with the next question id (entryID).
*    Needs to do: 
*    Adds a new question to the DB. Looks into body of 
*    post, and adds this as the question. Still a stub.
*    Only adds questions as user 'edwin'. However,
*    Upgrades to come: 
*    Provided user is logged in, reads session cookie,
*    works out who the user is, and adds appropriately 
*/
function addQuestion(req, res) {
    var question = req.body;
    //santise question here

    qa_db.get('entryID', { revs_info : true }, function (err, entryID) {
        if (!err) {
            var next_entry = entryID["next_entry"];
            qa_db.get('question_info', { revs_info : true }, function (err, questions) {
                if (!err) {
                    var now = new Date();
                    var jsonDate = now.toJSON();
                    questions["question_data"][next_entry] = { user: "edwin", question: question, submitTime:jsonDate};
                    entryID["next_entry"] = next_entry + 1;
                    console.log("user edwin submitted question: " + question);
                    // Add the new data to CouchDB (separate function since
                    // otherwise the callbacks get very deeply nested!)
                    updateqa_db(entryID, questions);

                    res.writeHead(201, {'Location' : next_entry});
                    res.end();
                }
            });
        }
    });
}


/**
*   Validates a session id by querying sessionDb doc. Returns true or 
*   false indicating liveness of session. 
*   ISSUE:
*   Callback of user_db.get correctly finds if the session cookie matches
*   a userName. But, because it is asynchronous callback, it will not 
*   return true in the if statement of frontPage function!
*/
function validateSession(string) {
    //query DB doc to see if cookie is present in DB

    //------Currently this is not working because of the callback issues.----------
    // user_db.get('user_info', { revs_info : true }, function (err, user_info) {
    //     var userArray = Object.keys(user_info["userNames"]);
    //     var result = false;
    //     for (var i = 0; i<userArray.length; i++) {
    //         if (user_info["userNames"][userArray[i]]["sessionCookie"] === string) {
    //             result = true;
    //         }
    //     }
    //     return result;
    // });
    //-------END of broken code, stub used instead ---------//
    if (string === "edwinCookie" || string === "donalCookie" || string === "ollieCookie") {
        return true;
    }
    else {
        return false;
    }
}
      
/**
*   If a valid userName and password is present in post body, 
*   returns a session cookie for that user. Session cookie
*   must be presented in subsequent requests to other routes.
*   Otherwise, returns an error message. Cookies maintain state.
*   Possible upgrades:
*      -- Convert from hard-coded values for sessionCookie to dynamic
*       -- would be good to hash the passwords
*/
function login(req, res) { 
    req.body = JSON.parse(req.body);
    var userName = req.body.userName;
    var password = req.body.password;

    // -- Check if userName and password match db of users ------------------------------------
    user_db.get('user_info', { revs_info : true }, function (err, user_info) {

        if (user_info["userNames"][userName] &&
                user_info["userNames"][userName]["password"] === password) {
        // -- Response Logic -------------------------------------------             
            res.cookie("session", user_info["userNames"][userName]["sessionCookie"]);
            res.status(200).send(null);
        }
        else {
            res.status(404).send("Error: invalid login credentials. Try posting to /login with this as the body {\"userName\":\"edwin\", \"password\":\"notActually\"}")
        }
        // -- End of response logic ------------------------------------       
    });
    // ------- END of userName and password db function ---------------------------------------
}


/** 
*   If valid session cookie is in get header, return page.html.
*   Else return login.html.
*/
function frontPage(req, res){
    // --- Code on how accessing cookies in a request work --
    // Cookie: session=tempUser
    // req.cookies.session => "tempUser"
    // --- End of cookie helper code ------------------------

    var fileName;

    // -- Logic of this function -------------------------------------
    // if req.cookies.session is validated by validateSession function
    // then we have a live session and a known user. Response with
    // page.html, else login.html.
    if (validateSession(req.cookies.session) === true) {
        fileName = 'page.html'; 
    }
    else {
        fileName = 'login.html';
    }
    // -- End of logic of this function -------------------------------


    var options = {
    root: __dirname + '/dist/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
        }
    };

    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        }
        else {
        console.log('Sent:', fileName);
        }
    });

}

// --- Standard app setup for express -------------------
var app = express()
app.use(json());
app.use(express.query());
app.use(bodyParser.text()); // For parsing POST requests 
app.use(cookieParser()); //For cookie handling.

app.use(express.static('node_modules'));
app.use(express.static('dist'));
//-------------------------------------------------------


// -- Routing functions using Express as middleware follow ---------


/** If valid session cookie presented in get header, returns
*   page.html file. Else, returns login.html file. Ollie is to 
*   make login.html that will collect a user name and password. 
*   Login.html will send a post with said variables to /login. 
*/
app.get('/', frontPage);

/** If valid userName and password is present in post body,
    responds by setting the session cookie. Maintains state. 
    Otherwise, responds with an error message.  
    For now, post body as JSON: '{"userName":"edwin", "password":"notActually"}'
*/
app.post('/login/', login);


/** Returns a list of questions in JSON format. 
*   Provided valid session cookie is present.
*/
app.get('/questions/', listQuestions);


/** Adds a new question to the DB. Looks into body of 
*   post, and adds this as the question. Still a stub.
*   Only adds questions as user 'edwin'. However,
*   Upgrades to come: 
*   Provided user is logged in, reads session cookie,
*   works out who the user is, and adds appropriately 
*/
app.post('/questions/', addQuestion);


/** 
*   Responds to path /reply. If query ?q_id=<integer> parameter matches a
*   question id, responds with an array of replies for that q_id, and a 
*   status code of 200. If no query supplied (status code 400), or query is 
*   wrongly formatted (status code 400), or no such q_id exists (status code 
*   404), then response is a error message (string).
*/
app.get('/reply\?q_id=\w+|reply/', listReplies);

//add a reply to a question, need to supply question id  
// in the body of the post request as {"q_id":<VALUE>, "reply":<VALUE>}
app.post('/reply/', addReply);

app.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');    

// ------- Testing section ------------------------

// Also see backendTest.js 

// --- func validateSession ------------
// //should return true
// console.log(validateSession('tempUser'));

// //should return false
// console.log(validateSession(''));

// //should return false
// console.log(validateSession(undefined));

// //should return false
// console.log(validateSession('true'));

// //should return false
// console.log(validateSession('terls'));
// -- end of validateSession ------------