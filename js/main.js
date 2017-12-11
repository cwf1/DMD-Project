//authentication with Freesound------------------------------------------------------
var bearerAuth;
var client_id='CFE6l0LSAXsDwJNkxrpV';
var client_secret='TqueRikLz2QIlaFAXd2EJv5if9j91lj1GyuTqNq0';
var AuthLink = "https://freesound.org/apiv2/oauth2/authorize/?client_id="+client_id+"&response_type=code&state=xyz";
authenticate();
//---------------------------------------------------------------------------------



//these are public because only one search is done at a time and only one player is active at a time
var player;
var searchResults;



//this handles uploading a sound file and then passes it to the buildplayer function to use tonejs with it
function handleFileSelect(evt) {
	if (player)
		player.stop();
    evt.stopPropagation();
    evt.preventDefault();
	console.log(evt);
    var file = evt.path[0].files[0]; // File object.
		if (file.type.match('audio/wav.*')) {
			let url = window.URL.createObjectURL(file);
			//remove tonejs interface to reload it with this sound file
			document.getElementById("Content").innerHTML = "";
			document.getElementById("Content").innerHTML += "<div id=\"Sliders\"></div>";

			buildplayer(url,file.name);
		}else {
			alert("This is not a suitable file type!");
			return -1;
		}
}



//searches API and returns and parses/writes JSON response to html
function search() {

	if (player)
		player.stop();
	$("#output").css("border","auto solid #69605d");

	//clear the previous search data
	document.getElementById("output").innerHTML = "";

	//get the search query from the search box
	let term = document.getElementById("query").value;
	let filter = document.getElementById("wav").checked ? "wav" : null;
	//set auth to false because we defined auth = true to be the bearer auth token
	let auth = false;
	//finally pass parameters to the create request function
	createRequest(auth,processSearch,undefined,term,filter);
}




function createRequest(Auth,callback,id,query,filter) {
	//auth is true so bearer auth is used and this is a download
	if (Auth) {
		//we are downloading a sound
		let xhr=new XMLHttpRequest();
		let uri = "https://freesound.org/apiv2/sounds/"+id+"/download/";
		xhr.open("GET",uri);
		xhr.responseType='blob';
		xhr.setRequestHeader('Authorization','Bearer '+bearerAuth);
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded;charset=UTF-8');

		xhr.addEventListener('load', function(e) {
			if (xhr.readyState==4&&xhr.status==200)
				callback(xhr.response,id);
		});
		xhr.send(null);


	} else {
		//we are doing a search and basic auth is used
		let xhr = new XMLHttpRequest();
		let uri;
		if (filter)
			uri = "https://freesound.org/apiv2/search/text/?&format=json&filter=type:wav&query="+query;
		else
			uri = "https://freesound.org/apiv2/search/text/?&format=json&query="+query;
		xhr.open("GET",uri);
		xhr.setRequestHeader('Authorization','Token '+client_secret);
		xhr.addEventListener('load', function(e) {
			if (xhr.readyState==4&&xhr.status==200)
				callback(xhr.responseText);
		});
		xhr.send(null);

	}

}



//parses json and adds sound names to the results
function processSearch(response) {
	let responseData = JSON.parse(response);
	 searchResults = responseData.results;
	 results_html="";
	for (i in responseData.results)
		results_html+="<p onclick=\"nameClicked(event)\" id="+responseData.results[i].id+" class=results><span>"+responseData.results[i].name+"</span></p>";

	document.getElementById("output").innerHTML=results_html;
}

//when user clicks a name on the list of search results
function nameClicked(e) {
	//grab id of sound from clicked search results element
	let id = e.target.id;

	let auth = true;

	console.log("Section updated.");
	//if name was already clicked, return to unclicked state
	if (document.getElementById(id).innerHTML.includes("audio")) {
		$("#controller_"+id).remove();
        $("p#"+id).removeClass("active");
	//otherwise send request to download sound and add loading gif
	} else {
		//this check prevents multiple clicks from loading multiple of the same sound
		if (!(document.getElementById(id).innerHTML.includes("loading.gif"))) {
            $("p#"+id).addClass("active");
			createRequest(auth,downloadSound,id,undefined);
			let loading_text = "<div id=\"loading_sound\"><br><img width=50 height=50 src=\"images/loading.gif\"></img></div>"
			document.getElementById(id).innerHTML+=loading_text;
		}
	}

}



function downloadSound(response,id) {
	//remove loading element because the request is successful
	$("#loading_sound").remove();

	//create blob object url and add it to html with html5 audio element
	let blob = new Blob([response],{type:'audio/wav'});
	let dwn = window.URL.createObjectURL(blob);
	document.getElementById(id).innerHTML+="<div class=\"contr\"id=\"controller_"+id+"\"><audio controls><source src=\""+dwn+"\" type=\"audio/wav\"></source></audio><div onclick=selectsound(event) class=\"select_btn\"id=btn_"+id+">Choose this sound</div>";
}




//user selects sound to use in tonejs grainplayer
 function selectsound(e) {
	//disable the outer onclick event firing and only allow the inner
	if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();

	//grab sound id from the element that fired the event
	let id = e.target.id;
	id = id.split("_")[1];

	//get position in the returned json using the id
	let pos = 0;
	for (i in searchResults)
		if (searchResults[i].id==id)
			pos=i;

	//get the blob url of the sound clicked
	let audio_controls = document.getElementById("controller_"+id).childNodes[0];
	let src = audio_controls.childNodes[0];
	let url = src.getAttribute("src");

	//remove tonejs interface to reload it with this sound file
	document.getElementById("Content").innerHTML = "";
	document.getElementById("Content").innerHTML += "<div id=\"Sliders\"></div>";
	buildplayer(url,searchResults[pos].name);

	//this function takes a url to a sound file/object and a name to display above it and then creates the tonejs grainplayer interface
}

function buildplayer(url,name) {
	if (url=="")
		$("#Content").css("pointer-events" ,"none");
	else
		$("#Content").css("pointer-events" ,"");
	if (player)
		player.stop();
	player = new Tone.GrainPlayer({
			"url" : url,
			"loop" : true,
			"grainSize" : 0.1,
			"overlap" : 0.05,
			"decay" : 0.1,
	}).toMaster();
	//Interface.Loader();

	$("#Sliders").append("<br><div id=\"soundname\">"+name+"</div><br>");

	Interface.Button({
			text : "Start",
			activeText : "Stop",
			type : "toggle",
			start : function() {
					player.start();
			},
			end : function(){
				player.stop();
			}
	});
	Interface.Button({
			text : "Download",
			activeText : "Download",
			//type : "toggle",
			start : function(){
				let filename;
				if (name)
					filename=name;
				var link = document.createElement('a');
				link.setAttribute('href',url);
				link.setAttribute('download',filename);
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
				link.dispatchEvent(event);
			},
			end : function(){

			}
		});
	Interface.Slider({
			param : "playbackRate",
			name : "playbackRate",
			parent : $("#Sliders"),
			tone : player,
			min : 0.5,
			max : 2,
		});
		$("#playbackRate").before("<div class=\"sliderStyle\">Playback Rate</div><div id=\"playbackRatevalue\" class=\"slidervalue\"></div>");

		Interface.Slider({
			param : "detune",
			name : "detune",
			parent : $("#Sliders"),
			tone : player,
			min : -1200,
			max : 1200,
		});
		$("#detune").before("<div class=\"silderStyle\">Detune</div><div id=\"detunevalue\" class=\"slidervalue\"></div>");

		Interface.Slider({
			param : "grainSize",
			name : "grainSize",
			parent : $("#Sliders"),
			tone : player,
			min : 0.01,
			max : 0.2,
		});
		$("#grainSize").before("<div class=\"sliderStyle\">Grain Size</div><div id=\"grainSizevalue\" class=\"slidervalue\"></div>");
		Interface.Slider({
			param : "overlap",
			name : "overlap",
			parent : $("#Sliders"),
			tone : player,
			min : 0,
			max : 0.2,
		});
		$("#overlap").before("<div class=\"sliderStyle\">Overlap</div><div id=\"overlapvalue\" class=\"slidervalue\"></div>");

		Interface.Slider({
			param : "decay",
			name : "decay",
			parent : $("#Sliders"),
			tone : player,
			min : 0.005,
			max : 2,
			exp : 2,
		});
		$("#decay").before("<div class=\"sliderStyle\">Decay</div><div id=\"decayvalue\" class=\"slidervalue\"></div>");
		$("#Content").css("border","2px solid black");
}




//this function updates and displays the values of the sliders when they are moved
 function updatevalue(val,slider) {
	$('#'+slider+'value').text(val.toFixed(4));
}
