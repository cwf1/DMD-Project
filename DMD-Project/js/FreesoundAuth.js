
function authenticate() {
	
//if no access token is present, then make initial OAuth2 request and store Bearer token in localStorage
if (localStorage.getItem("access_token") === null) {
	console.log("Getting brand new access token");
	window.location.href = AuthLink;	
	let href = window.location.href;
	let code = href.split('code=')[1];		
	let body = "client_id="+client_id+"&client_secret="+client_secret+"&grant_type=authorization_code&code="+code;
	//create request
	let xhr = new XMLHttpRequest();
	let response;
	xhr.open("POST","https://freesound.org/apiv2/oauth2/access_token/");
	xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded;charset=UTF-8');
	xhr.onreadystatechange = function() {
												
		if (xhr.readyState==4&&xhr.status==200) {
			response = JSON.parse(xhr.responseText);
			for (item in response) {
				localStorage.setItem(item, response[item]);
			}
			localStorage.setItem('dateCreated',new Date());
			console.log(JSON.parse(xhr.responseText));
			bearerAuth=response.access_token;
			
		} else 
			console.log("error");		
	};
	xhr.send(body);
	
		
//We know Auth code exists, but we need to check if it's valid
}else {
	//prepare to check how much time is left on the access token in localStorage
	var tokenMade=new Date(localStorage.getItem('dateCreated'));
	var current=new Date();
	
	current=current.getTime();
	tokenMade=tokenMade.getTime();
	console.log("BearerAuth code: " + localStorage.getItem("access_token") + " has " + (24.0-((current-tokenMade)/(1000*60*60)).toFixed(3)) + " hours left before deauthentication");
	//calculate the difference between the timestamp in localStorage and current time
	//and if it is invalid, make a new request with the refresh token from localStorage.
	
	//check if token has less than or equal to a half hour left
	if ( (current-tokenMade)/(1000*60*60).toFixed(3) >= 23.5 ) {
		console.log("Getting new access token using refresh token");
		//create request
		let request = new XMLHttpRequest();
		let uri = "https://freesound.org/apiv2/oauth2/access_token/";
		let body = "client_id="+client_id+"&client_secret="+client_secret+"&grant_type=refresh_token&refresh_token="+localStorage.getItem('refresh_token');
		let theResp;
		request.open("POST",uri);
		request.setRequestHeader('Content-Type','application/x-www-form-urlencoded;charset=UTF-8');
		request.onreadystatechange = function() {												
			if (request.readyState==4&&request.status==200) {
				theResp = JSON.parse(request.responseText);
				for (item in theResp) {
					localStorage.setItem(item, theResp[item]);
				}
				console.log(JSON.parse(request.responseText));
				bearerAuth=theResp.access_token;	
				localStorage.setItem('dateCreated',new Date());
			} else 
				console.log("error");		
		};
		request.send(body);
	} //The access token from localStorage is still valid, so apply it.
     else 
		console.log("Using access token from local storage");
		bearerAuth=localStorage.getItem("access_token");
}

}