
    document.getElementById('showFormTab').addEventListener('click', function() {
        var formTab = document.getElementById('formTabDesign')
        var noteTab = document.getElementById('notesTabDesign')
        formTab.style.display = "block";
        noteTab.style.display = "none";
    });
    document.getElementById('showNotesTab').addEventListener('click', function() {
        var formTab = document.getElementById('formTabDesign')
        var noteTab = document.getElementById('notesTabDesign')
        formTab.style.display = "none";
        noteTab.style.display = "block";
    });

    let responseObj;

    document.getElementById('formType').addEventListener('change', function() {
        var catSel = document.getElementById('categoryTypeSel')
        catSel.style.display = "block";
        getQuestions(this.value);
    });

    document.getElementById('categoryType').addEventListener('change', function() {
        var values = responseObj[1][this.value]
        parseQuestions(values);
    });

    document.getElementById('questionType').addEventListener('change', function() {
        var question = this.value
        var category = document.getElementById('categoryType').value;
        var form = document.getElementById('formType').value;
        if(form === "comfort"){
            form = "comfortability"
        }
        var clientId = '121969829';
        getAnswer(clientId, form, category, question)
    });

function getQuestions(form){
        
        var url = 'https://firestore.googleapis.com/v1/projects/new-dash-15264/databases/(default)/documents/questions/'+form

        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var json = JSON.parse(result)
                switch (form){
                    case 'personal':
                        responseObj = parsePersonality(json);
                        break;
                    case 'comfort':
                        responseObj = parseComfortability(json);
                        break;
                    case 'customRequests':
                        responseObj = parseCustomRequests(json);
                        break;     
                    
                }

                
                var catValues = responseObj[0];
               createCategoryOptions(catValues);
            })
    		.catch(err => {
                var console = document.getElementById('consoleLog')
                console.innerText = err;
            })
		
}

function parsePersonality(json){
    var questionsObj = {};    
    var categoryArray = [];
    for (var x in json.fields){
        var questionsArray = json.fields[x].mapValue.fields
        
        categoryArray.push(x)
        var fieldsObj = {};
        for (var y in questionsArray){
            fieldsObj[y] = questionsArray[y].stringValue;
        }
        questionsObj[x] = fieldsObj;
    }
    return [categoryArray, questionsObj]
}

function parseComfortability(json){
    var questionsObj = {};
    var categoryArray = [];
    for (var x in json.fields){
            var questionsArray = json.fields[x].mapValue.fields
            var fieldsObj = {};
            categoryArray.push(x);
            for (var y in questionsArray){
                var question = questionsArray[y].mapValue.fields.question.stringValue
                var type = questionsArray[y].mapValue.fields.type.stringValue
                var options = [];

                var optionsArray = questionsArray[y].mapValue.fields.options.arrayValue.values
                
                for(var i = 0; i < optionsArray.length; i++){
                    var label = optionsArray[i].mapValue.fields.label.stringValue
                    var value = optionsArray[i].mapValue.fields.value.stringValue

                    options.push({"label": label, "value": value})
                }


                fieldsObj[y] = {
                    "question": question,
                    "type": type,
                    "options": options
                }

            }

            questionsObj[x] = fieldsObj;
        }

    return [categoryArray, questionsObj]
}

function parseCustomRequests(json){
    var catSel = document.getElementById('categoryTypeSel')
    catSel.style.display = "none";

    var questionsArray = json.fields;
    var fieldsObj = {};
    for (var y in questionsArray){
        fieldsObj[y] = questionsArray[y].stringValue;
    }
    parseQuestions(fieldsObj);
}

function createCategoryOptions(values){
    var qSelect = document.getElementById('questionType');
    qSelect.length = 0;

    var select = document.getElementById('categoryType');
    select.length = 0;

    var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.text = "Choose a Category";
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
 
    for (const val of values) {
        var option = document.createElement("option");
        option.value = val;
        option.text = val.split(/(?=[A-Z])/).join(" ").toUpperCase();
        select.appendChild(option);
    }
}

function parseQuestions(values){

    var console = document.getElementById('consoleLog')
   
    var qSelect = document.getElementById('questionType');
    qSelect.length = 0;

    var qPlaceholder = document.createElement("option");
    qPlaceholder.value = "";
    qPlaceholder.text = "Choose a Question";
    qPlaceholder.disabled = true;
    qPlaceholder.selected = true;
    qSelect.appendChild(qPlaceholder);

    for(var x in values){
        var value = x;
        var label;
        if(values[x]["question"]){
            label = values[x]["question"]
        } if(!values[x]["question"]) {
            label = values[x]
        }
        var qOption = document.createElement("option");
        qOption.value = value;
        qOption.text = label;
        qSelect.appendChild(qOption);
    }
    
}

function getAnswer(clientId, form, category, question){
    var answerUrl;
        if(form === "customRequests"){
            answerUrl  = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/clients/${clientId}/info/${form}?mask.fieldPaths=${question}`
        } 
        else {
            answerUrl = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/clients/${clientId}/info/${form}?mask.fieldPaths=${category}.${question}`
        }

        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        fetch(answerUrl, requestOptions)
            .then(response => response.text())
            .then(result => {
                var json = JSON.parse(result)
                var answer;
                if(form === "customRequests"){
                    answer = json.fields[question]
                } 
                else {
                    answer = json.fields[category].mapValue.fields[question]
                }

                for(var x in answer){
                    var answerField = document.getElementById('answerText')
                    var answerRes;
                    var valueArray = [];
                          

                    if(form === "comfortability"){
                        var options = responseObj[1][category][question]["options"]
                        var type = responseObj[1][category][question]["type"]

                        if(type === 'checkboxGroup'){
                            if (answer[x]["values"]){
                                var optArray = answer[x]["values"];
                                for(var a = 0; a < optArray.length; a++){
                                    var newOpt = optArray[a].stringValue;
                                    valueArray.push(newOpt)
                                }
                            } if(answer[x]["fields"]){
                                var fields = answer[x]["fields"];
                                for(var f in fields){
                                    if(fields[f].booleanValue === true){
                                        valueArray.push(f)
                                    }
                                }
                            }
                        }

                        
                        for (var o = 0; o < options.length; o++){
                            switch (type){
                                case 'boolean':
                                    if(Boolean(options[o].value) === Boolean(answer[x])){
                                        answerRes = options[o].label
                                    }
                                    break;
                                case 'radioButtonGroup':
                                    if(Number(options[o].value) === Number(answer[x])){
                                        answerRes = options[o].label
                                    }
                                    break;
                                case 'checkboxGroup':
                                    if(o === 0){
                                        answerRes = "";
                                    }
                                    if(valueArray.includes(String(options[o].value))){
                                        answerRes += options[o].label+'<br>'      
                                    }

                                    break;     
                            
                            }
                        }
                    }
                    else {
                        answerRes = answer[x]              
                    }
                    answerField.innerHTML = JSON.parse(JSON.stringify(answerRes));
                }
                
                var console = document.getElementById('consoleLog')
                console.innerText = JSON.stringify(responseObj[1][category][question]["options"]);

            })
    		.catch(err => {
                var console = document.getElementById('consoleLog')
                console.innerText = err;
            })
		
}

    var console = document.getElementById('consoleLog');
    


    let pageToken;
    let previousToken;
    let pageSize = 6;
    let editId;
    let count = 0;

    var notesObj = {
        fan: '125139120',
        client: '190117118',
        mod: 'Bea'
        
    }

    //TESTING  BTN
    document.getElementById('testingBtn').addEventListener('click', function() {
        var contentBar = document.getElementById('notesContentBar');
        while (contentBar.firstChild) {
            contentBar.removeChild(contentBar.firstChild);
        }      
        loadNotes(notesObj.fan, pageSize, pageToken, previousToken);
    });

    var catObj = {
        spendingHabits: "Spending Habits",
        likesDislikes: "Likes & Dislikes",
        personal: "Personal",
        warnings: "Warnings",
        other: "Other"
    }

    const editBtns = document.querySelectorAll('.noteEditBtn');
    const deleteBtns = document.querySelectorAll('.noteDeleteBtn');
   
    document.getElementById('notesContentBar').addEventListener('scroll',()=>{
        const {scrollTop,clientHeight,scrollHeight} = document.getElementById('notesContentBar');
        if ((scrollTop+clientHeight)>=scrollHeight) {
            //getContent((current_page+1));
            loadNotes(notesObj.fan, pageSize, pageToken, previousToken);
            previousToken = pageToken;
        }
    });

    document.getElementById('addNoteBtn').addEventListener('click', function() {
        var logText;
        var newNoteText = document.getElementById("addNotesText");
        var newNoteCategory = document.getElementById("addFilter");


        if(this.innerText === "ADD"){
            getClientName(notesObj, newNoteText.value, newNoteCategory.value)
            newNoteText.value = "";
            newNoteCategory.value = "Add a category"        
            //logText = newNoteText + newNoteCategory
        }
        if(this.innerText === "SAVE"){
            var noteNode = document.getElementById(editId);
            var clientName = noteNode.getElementsByClassName('noteClient')[0].innerText;


            editNote(newNoteText.value, newNoteCategory.value, notesObj, editId, clientName)
            //text, category, infoObj, noteId, clientId)
            newNoteText.value = "";
            newNoteCategory.value = "Add a category"    
            //logText = "run save";
            //loadNotes('125139120', 3, pageToken)
            this.innerText = "ADD";
        } 


         //   console.innerText = logText;
    });

    document.getElementById('filterClient').addEventListener('click', function() {
        var client = document.getElementById('filterClient').value
        if(client === "👩"){
            loadClientFilter('125139120')
        }
    });

    document.getElementById('filterClient').addEventListener('change', function() {
        var client = document.getElementById('filterClient').value
        var category = document.getElementById('filterCategory').value

        filterNotes('125139120', client, category)
    });

    document.getElementById('filterCategory').addEventListener('change', function() {
        var client = document.getElementById('filterClient').value
        var category = document.getElementById('filterCategory').value

        filterNotes('125139120', client, category)   
    });

    function loadNotes(fanId, pageSize, pageTok, prevToken){
    // var url = `https://firestore.googleapis.com/v1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}/notes/${noteId}`
        var url;
        if(!pageTok){
            url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}/notes?orderBy=dateTime%20desc&pageSize=${pageSize}`
        }
        if(pageTok){
            url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}/notes?orderBy=dateTime%20desc&pageSize=${pageSize}&pageToken=${pageTok}`
        }

        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        if(prevToken === undefined || prevToken !== pageTok){
            fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                
                var parsedResult = JSON.parse(result)

                if(parsedResult["nextPageToken"]){
                    pageToken = parsedResult["nextPageToken"]
                    count += 1
                    console.innerHTML += '<br>' + count
                    console.innerHTML += '<br>' + pageToken;
                }

                var documents = parsedResult.documents
                for(var d = 0; d < documents.length; d++){
                    createNoteObj(documents[d], "load")
                }
            })  
        }

    }

    function createNoteObj(noteJson, status){
        var fields = noteJson.fields;
        var loadNoteObj = {};
        for(var f in fields){
            loadNoteObj[f] = fields[f].stringValue
        }
        var name = noteJson.name;
        var noteId = name.split('notes/')[1];
        loadNoteObj["id"] = noteId;

        var timestamp = noteJson.updateTime;
        loadNoteObj["time"] = createTimeStamp(timestamp)

        var idExists = document.getElementById('noteId')
        if(!idExists){
            createNoteDom(loadNoteObj, status)
        }

    // return loadNoteObj
    }

    function createNoteDom(noteObj, status) {
        var moxyNote = document.createElement('div');
        moxyNote.className = "moxyNote";
        moxyNote.id = noteObj.id;

        var noteFilters = document.createElement('div');
        noteFilters.className = "noteFilters";

        var noteClient = document.createElement('span');
        noteClient.className = "noteClient";
        noteClient.innerText = noteObj.clientId;

        var noteCategory = document.createElement('span');
        noteCategory.className = "noteCategory";
        noteCategory.innerText = catObj[noteObj.category];
        
        noteFilters.appendChild(noteClient);
        noteFilters.appendChild(noteCategory);
        moxyNote.appendChild(noteFilters);

        var noteContent = document.createElement('div');
        noteContent.className = "noteContent";
        noteContent.innerText = noteObj.note;

        moxyNote.appendChild(noteContent);

        var noteInfo = document.createElement('div');
        noteInfo.className = "noteInfo";

        var notePoster = document.createElement('span');
        notePoster.className = "notePoster";
        notePoster.innerText = noteObj.author;

        var noteDate = document.createElement('span');
        noteDate.className = "noteDate";
        noteDate.innerText = noteObj.time;   

        var dropdown = document.createElement('div');
        dropdown.className = "dropdown";

        var moreOptionsBtn = document.createElement('button');
        moreOptionsBtn.id = "moreOptionsBtn";
        moreOptionsBtn.innerText = "▾";
        
        var dropdownContent = document.createElement('div');
        dropdownContent.className = "dropdown-content";

        var noteEditBtn = document.createElement('a');
        noteEditBtn.href = "#";
        noteEditBtn.class = "noteEditBtn";
        noteEditBtn.innerText = "Edit";
        noteEditBtn.addEventListener('click', event => {
            editId = noteObj.id;

            var noteText = document.getElementById('addNotesText');
            noteText.value = noteObj.note;

            var noteFilter = document.getElementById('addFilter');
            noteFilter.value = noteObj.category;

            var saveBtn = document.getElementById('addNoteBtn');
            saveBtn.innerText = "SAVE";
        })

        var noteDeleteBtn = document.createElement('a');
        noteDeleteBtn.href = "#";
        noteDeleteBtn.class = "noteDeleteBtn";
        noteDeleteBtn.innerText = "Delete";
        noteDeleteBtn.addEventListener('click', event => {
            //console.innerHTML = JSON.stringify(noteObj.id);
            var fanId = '125139120';

            var deletePopup = document.getElementById("deleteModal");
            deletePopup.style.display = "block";

            var confirmDelete = document.getElementById("confirmDelete");
            confirmDelete.addEventListener('click', event => {
                deleteNote(fanId, noteObj.id)
                deletePopup.style.display = "none";
            })

            var cancelDelete = document.getElementById("cancelDelete");
            cancelDelete.addEventListener('click', event => {
                deletePopup.style.display = "none";
            })
           
        })

        dropdownContent.appendChild(noteEditBtn);
        dropdownContent.appendChild(noteDeleteBtn);
        dropdown.appendChild(moreOptionsBtn);
        dropdown.appendChild(dropdownContent);

        noteInfo.appendChild(notePoster);
        noteInfo.appendChild(noteDate);
        noteInfo.appendChild(dropdown);

        moxyNote.appendChild(noteInfo);

        var contentBar = document.getElementById("notesContentBar");

        if(status === "new"){
            contentBar.prepend(moxyNote);
        }if(status === "load"){
            contentBar.appendChild(moxyNote);
        }
        
    }

    function addNote(text, category, infoObj, clientId){
        var fanId = infoObj.fan;
        var mod = infoObj.mod;

        var url = `https://firestore.googleapis.com/v1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}/notes`
        var payload = {
            "fields": {
                "author":{
                    "stringValue": mod
                },"category":{
                    "stringValue": category
                },"note":{
                    "stringValue": text
                },"clientId":{
                    "stringValue": clientId
                },"dateTime":{
                    "timestampValue": new Date()
                }
            }
        }
        
        var rawBody = JSON.stringify(payload)
        var requestOptions = {
            method: 'POST',
            body: rawBody,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }
            
        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var parsedResult = JSON.parse(result);
                console.innerHTML = parsedResult;
                createNoteObj(parsedResult, "new")
            })

        
    }

    function getClientName(infoObj, text, category){
        var clientId = infoObj.client;
        var url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/clients/${clientId}`
        
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var parsedResult = JSON.parse(result);
                var name = parsedResult.fields["Name"].stringValue;
                
                addNote(text, category, infoObj, name)
                checkSubbedTo(infoObj.fan, name);
            })
    }

    function checkSubbedTo(fanId, clientId){
        var url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}`
        var logtext1;
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var parsedResult = JSON.parse(result);
                var subbedTo = parsedResult.fields.subbedTo.arrayValue.values;
                var subArray = [];
                for(var u = 0; u < subbedTo.length; u++){
                    subArray.push(subbedTo[u].stringValue)
                }
                if(subArray.includes(clientId)){
                    logtext1 = "Already logged"
                }
                if(!subArray.includes(clientId)){
                    subArray.push(clientId)
                    addSubbedTo(fanId, subArray)
                }
                console.innerText = JSON.stringify(logtext1);
            })
    }
    
    function addSubbedTo(fanId, subArray){
        var url = `https://firestore.googleapis.com/v1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}?updateMask.fieldPaths=subbedTo`
        var valuesArray = [];

        for(var a = 0; a < subArray.length; a++){
            var newValue = {
                "stringValue": subArray[a]
            }
            valuesArray.push(newValue)
        }

        var payload = {
            "fields":{
                "subbedTo":{
                    "arrayValue":{
                        "values": valuesArray
                    }
                }
            }
        }
        
        var rawBody = JSON.stringify(payload)
        var requestOptions = {
            method: 'PATCH',
            body: rawBody,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }
            
        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var parsedResult = JSON.parse(result);
                console.innerHTML = parsedResult;
            })
    }

    function filterNotes(fanId, client, category){
        var queryObj;
        var contentBar = document.getElementById('notesContentBar');
        while (contentBar.firstChild) {
            contentBar.removeChild(contentBar.firstChild);
        }      

        if((client === null || client === "none" || client === "👩") && (category === null || category === "none" || category === "✏️")){
            console.innerHTML = "both none";
            pageToken = "";
            loadNotes(fanId, pageSize, pageToken, previousToken)
        } else {
            console.innerHTML = "fetch time";
            var url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}:runQuery`

            if(client === null || client === "none" || client === "👩"){
                console.innerHTML += "<br> no client, fetch category"
                queryObj = {
                    "structuredQuery": {
                        "from": [
                        {
                            "collectionId": "notes",
                            "allDescendants": false
                        }
                        ],
                        "where": {
                            "fieldFilter": {
                                "field": {
                                    "fieldPath": "category"
                                },
                                "op": "EQUAL",
                                "value": {
                                    "stringValue": category
                                }
                            }
                        },
                        "orderBy": [{
                            "field": {
                                "fieldPath": "dateTime"
                            },
                            "direction": "DESCENDING"
                        }]
                    }
                }
            }
            if(category === null || category === "none" || category === "✏️"){
                console.innerHTML += "<br> no category, fetch client"    
                queryObj = {
                    "structuredQuery": {
                        "from": [
                        {
                            "collectionId": "notes",
                            "allDescendants": false
                        }
                        ],
                        "where": {
                            "fieldFilter": {
                                "field": {
                                    "fieldPath": "clientId"
                                },
                                "op": "EQUAL",
                                "value": {
                                    "stringValue": client
                                }
                            }
                        },
                        "orderBy": [{
                            "field": {
                                "fieldPath": "dateTime"
                            },
                            "direction": "DESCENDING"
                        }]
                    }
                }
            }
            if(client !== null && client !== "none" && client !== "👩"
                && category !== null && category !== "none" && category !== "✏️"){
                console.innerHTML += "<br> fetch client and category"  
                    queryObj = {
                            "structuredQuery": {
                                "where": {
                                    "compositeFilter": {
                                        "op": "AND",
                                        "filters": [
                                        {
                                            "fieldFilter": {
                                                "field": {
                                                    "fieldPath": "clientId"
                                                },
                                                "op": "EQUAL",
                                                "value": {
                                                    "stringValue": client
                                                }
                                            }
                                        },
                                        {
                                            "fieldFilter": {
                                                "field": {
                                                    "fieldPath": "category"
                                                },
                                                "op": "EQUAL",
                                                "value": {
                                                    "stringValue": category
                                                }
                                            }
                                        }
                                        ]
                                    }
                                },
                                "from": [{
                                    "collectionId": "notes",
                                    "allDescendants": false
                                }],
                                "orderBy": [{
                                    "field": {
                                        "fieldPath": "dateTime"
                                    },
                                    "direction": "DESCENDING"
                                }]                    
                            }
                        }           
                    }

            var rawBody = JSON.stringify(queryObj)
            var requestOptions = {
                    method: 'POST',
                    body: rawBody,
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    }
                }
            console.innerHTML += "<br>"  + rawBody;

        
            
            fetch(url, requestOptions)
                    .then(response => response.text())
                    .then(result => {
                        var parsedResult = JSON.parse(result);
                        
                    
                    
                        for(var d = 0; d < parsedResult.length; d++){
                            var document = parsedResult[d].document
                            createNoteObj(document, "load")
                        }
                    })
                    .catch(err => {
                    console.innerText += err;
                })
        }


    }

    function createTimeStamp(time){
        var newD = new Date(time)

        var dOptions = {
            timeZone: 'PST', 
            dateStyle: 'short',
            timeStyle: 'short'
        }

        var parsedD = newD.toLocaleString('en-US', dOptions);

        return parsedD
    }

    function loadClientFilter(fanId){
        var url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}`
        
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var parsedResult = JSON.parse(result);
                var subbedTo = parsedResult.fields.subbedTo.arrayValue.values;
                
                var clientSelect = document.getElementById('filterClient');
                clientSelect.length = 0;

                var clientPlaceholder = document.createElement("option");
                clientPlaceholder.value = "";
                clientPlaceholder.text = "👩";
                clientPlaceholder.disabled = true;
                clientPlaceholder.selected = true;
                clientSelect.appendChild(clientPlaceholder);

                var noneOption = document.createElement("option");
                noneOption.value = "none";
                noneOption.text = "None";
                clientSelect.appendChild(noneOption);

                for(var s = 0; s < subbedTo.length; s++){
                    var clientName = subbedTo[s].stringValue;
                    var clientOption = document.createElement("option");
                    clientOption.value = clientName;
                    clientOption.text = clientName;
                    clientSelect.appendChild(clientOption);
                }


                var console = document.getElementById('consoleLog');
                console.innerHTML = JSON.stringify(subbedTo);
            })

        }

    function editNote(text, category, infoObj, noteId, clientId){
        var fanId = infoObj.fan;
        var mod = infoObj.mod;

        var url = `https://firestore.googleapis.com/v1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}/notes/${noteId}`
        var payload = {
            "fields": {
                "author":{
                    "stringValue": mod
                },"category":{
                    "stringValue": category
                },"note":{
                    "stringValue": text
                },"clientId":{
                    "stringValue": clientId
                },"dateTime":{
                    "timestampValue": new Date()
                }
            }
        }
        
        var rawBody = JSON.stringify(payload)
        var requestOptions = {
            method: 'PATCH',
            body: rawBody,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }
            
        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                var parsedResult = JSON.parse(result);
                console.innerHTML = JSON.stringify(parsedResult);
                editNoteDom(noteId, parsedResult);
            })
    }

    function editNoteDom(noteId, result){
        var note = document.getElementById(noteId);

        var authSpan = note.getElementsByClassName('notePoster')[0];
        var noteSpan = note.getElementsByClassName('noteContent')[0];
        var noteCategory = note.getElementsByClassName('noteCategory')[0];
        var noteTime = note.getElementsByClassName('noteDate')[0];

        var editAuth = result.fields.author.stringValue;
        var editNote = result.fields.note.stringValue;
        var editCategory = result.fields.category.stringValue;
        var updateTime = result.updateTime
        var timestamp = createTimeStamp(updateTime)

        authSpan.innerText = editAuth;
        noteSpan.innerText = editNote;
        noteCategory.innerText = catObj[editCategory];
        noteTime.innerText = timestamp;

    }

    function deleteNote(fanId, noteId){
        console.innerHTML = JSON.stringify(noteId);
        var url = `https://firestore.googleapis.com/v1beta1/projects/new-dash-15264/databases/(default)/documents/fans/${fanId}/notes/${noteId}`

        var requestOptions = {
            method: 'DELETE',
            redirect: 'follow'
        };

        fetch(url, requestOptions)
            .then(response => response.text())
            .then(result => {
                document.getElementById(noteId).remove();
            })
    }

    // DISABLE EDIT if client is not current client


