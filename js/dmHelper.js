/**
 * dm-helper logic.
 * ----------------
 * author: Kevin Richardson <kevin@triageworks.net>
 * date:   8-Jun-11 2:22GMT
 */

var characters;
var tempCharacters;
var dataStore;
var converter;

/**
 * character object:
 * ------------------
 * id:	    int
 * name:    string
 * curHP:   int
 * maxHP:   int
 * init:    int
 * notes:   string
 * deleted: boolean
 */


$(
	function()
	{
		// Setup the characters array (temporary) and persistent datastore.
		characters  = [];
		dataStore   = new Persist.Store('dmhelper', {about: "This database stores character templates for the DM Helper."});

		// Setup the showdown markdown converter.
		converter = new Showdown.converter();

		// Load the selected template when the button is clicked.
		$("#loadTemplate").click(
			function()
			{
				var key       = $("#charTemplate").val();
				var charJSON  = dataStore.get(key);
				var character = JSON.parse(charJSON);

				$("#formCharName").val(character.name);
				$("#formCharHP").val(character.maxHP);
				$("#formCharInit").val(character.init);
				$("#formCharNotes").val(character.notes);

				$("#formCharInit").focus();
			}
		);

		// Delete the selected template when the button is clicked.
		$("#deleteTemplate").click(
			function()
			{
				var key = $("#charTemplate").val();
				var character = JSON.parse(dataStore.get(key));
				dataStore.remove(key)

				$("#formCharName").focus();

				buildTemplates();

				$.n(character.name + " has been removed from the templates.");
			}
		);
	}
);


$(document).ready(
	function()
	{
		// Create the template list from the persistent datastore.
		buildTemplates();

		// Click handler for character update form.
		$("#updateChar").click(
			function()
			{
				var playerId  = $("#playerId").text();
				var character = characters[playerId];

				var hpChange    = $("#changeValue").val();
				var operation   = hpChange.charAt(0);
				var changeValue = hpChange.substring(1);

				var curHP = character.curHP;

				if(operation == "+")
				{
					curHP = parseInt(curHP) + parseInt(changeValue);
				}

				else if(operation == "-")
				{
					curHP = parseInt(curHP) - parseInt(changeValue);
				}

				character.curHP = curHP;

				$("#changeValue").val("");
				$("#playerCurHP").text("Current HP: " + curHP);

				character.notes = $("#playerNotes").val();

				characters[playerId] = character;

				buildTable();

				charClickHandlers(character);
			}
		);


		// Click handler for character addition form.
		$("#addChar").click(
			function()
			{
				var id		= characters.length; 
				var name 	= $("#formCharName").val();
				var curHP	= $("#formCharHP").val();
				var maxHP   = curHP; 
				var init 	= $("#formCharInit").val();
				var notes 	= $("#formCharNotes").val();

				$("#formCharName").val("");
				$("#formCharHP").val("");
				$("#formCharInit").val("");
				$("#formCharNotes").val("");

				var character     = new Object;
				character.id 	  = id;
				character.name	  = name
				character.curHP   = curHP
				character.maxHP   = maxHP;
				character.init    = init;
				character.notes   = notes;
				character.deleted = false;

				characters[id] = character;

				buildTable();

				charClickHandlers(character);
			}
		);
	}
);


/**
 * Build the initiative table from the characters array.
 */
function buildTable()
{
	tempCharacters = JSON.parse(JSON.stringify(characters)); 
	tempCharacters.sort(compareInitiative);

	$("#initiativeRows").empty();
				
	tempCharacters.forEach(
		function(character)
		{
			if(character.deleted == false)
			{
				var newRow = "<tr>"
					   	   + "<td>" + character.name + "</td>"
	           		       + "<td>" + character.init + "</td>"
	                       + "<td";

	   			if(character.curHP <= (character.maxHP / 2))
	   		    {
	   				newRow += " class=\"bloodied\"";
	   		    }
			    		
	   		    newRow    += ">" + character.curHP + "</td>"
	     			      + "<td>" + character.maxHP + "</td>"
		                  + "<td>" + converter.makeHtml(character.notes) + "</td>"
		  			      + "<td class=\"options\"><img title=\"edit this character\" class=\"edit\" src=\"img/scroll.png\">"
		                  + "<img title=\"save as template\" class=\"save\" src=\"img/quill-pen.png\">"
		 				  + "<img title=\"remove this character\" class=\"delete\" src=\"img/skull.png\"></td>"
		   			      + "<td class=\"hidden\">" + character.id + "</td>"
		   			      + "</tr>";

				$("#initiativeRows").append(newRow)
			}
		}
	);

	$("#initiativeTable").slideDown();
}

/**
 * Build the templates list based off the persistent datastore.
 */
function buildTemplates()
{
	$("#charTemplate").empty();
	$("#charTemplate").append("<option value='' disabled>select a template...</option>");

	// Add each item in the datastore to an array so it can be sorted by
	// character name.
	var templates = [];

	for(var i in dataStore.store)
	{
		var keyString = i.split(">");
		var key       = keyString[1];

		var character = JSON.parse(dataStore.get(key));

		if(character)
		{
			character.key = key;
			templates.push(character);
		}
	}

	templates.sort(compareNames);

	// Add each character template to the list.
	templates.forEach(
		function(character)
		{
			$("#charTemplate").append("<option value='" + character.key + "'>" + character.name + "</option>");
		}
	);
}

/**
 * Establish click handlers for each character row option.
 */
function charClickHandlers(character)
{
	// Delete the row when the delete icon is clicked.
	// Also mark the character as deleted.
	$("#initiativeRows img.delete").click(
		function()
		{
			var playerId         = $(this).parent().parent().children().last().text();
			var character        = characters[playerId];
			character.deleted    = true;
			characters[playerId] = character;

			$(this).parent().parent().remove();
		}
	);

	// When the edit icon is clicked, load the row's information into
	// the form for viewing and editing.
	$("#initiativeRows img.edit").click(
		function()
		{
			var playerId  = $(this).parent().parent().children().last().text();
			var character = characters[playerId];

			$('#playerId').text(character.id);
			$('#playerName').text(character.name);
			$('#playerCurHP').text("Current HP: " + character.curHP);
			$('#playerNotes').text(character.notes);
			$('#playerInfo').css('display', 'table');
		}
	);

	// Save the character (as JSON) to the persistent database
	// when the save icon is clicked.
	$("#initiativeRows img.save").click(
		function()
		{
			character.id = "";
			var charJSON = JSON.stringify(character);

			var d = new Date();
			dataStore.set(d.getTime(), charJSON);

			
			$.n(character.name + " has been added as a template.");

			buildTemplates();
		}
	);


	// Highlight a row when it is clicked.
	$("#initiativeRows tr td").click(
		function()
		{
			$(".currentTurn").removeClass("currentTurn");
			$(this).parent().children().addClass("currentTurn");
		}
	);
}

// Sort initiative (of characters a and b) in descending order.
function compareInitiative(a, b)
{
	var initA = a.init;
	var initB = b.init;

	return initB - initA;
}

// Sort character names in ascending order.
function compareNames(a, b)
{
	var x = a.name.toLowerCase();
	var y = b.name.toLowerCase();

	return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}
