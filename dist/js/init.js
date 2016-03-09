
/*
 * Retrieve the question list by making an AJAX request
 */
function getQuestions() {
    var req = new XMLHttpRequest();
    req.open("GET", "questions");
    req.setRequestHeader("Content-Type", "text/plain");
    req.onreadystatechange = function() {
        //should call function display questions
        //console.log(JSON.parse(req.responseText));
    }
    req.send(null);
}

/*Add a new question by making POST request to node server
	question = a new question from user
**/
function sendQuestion(question){
    var req = new XMLHttpRequest();
    req.open("POST", "questions");
    req.setRequestHeader("Content-Type", "text/plain");
    req.onreadystatechange = function() {
        getQuestions();
    }
    req.send(question);

}

function init() {

	//event handler for new question submission
	$("#q_submit").click(function(event) {

			// Get data form question input element. 
			var entry = $("#q_id").val();
			//Send a post request to the server to add question to db
			sendQuestion(entry);
	});

	//event handler for a reply to a question
	$("#rep_submit").click(function(event) {

			var li_tag = $(event.target).parent();

			//almost the unique ID for the question 
			var unique_id = $(li_tag).find("#unique_id").html();
		
			//need to get the text of the reply
		
			// Get data form question input element. 
				//event.parent
			// var question_id = $("#unique_id").val();
			// console.log('question id is:' + question_id);
		
	});
}

$(init);