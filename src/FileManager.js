"use strict";

//2024-01-04: copied from CalendarJournal
class FileManager{
    constructor() {
        //Drop image event handlers// Prevent default drag behaviors
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        let pnlEntry = $("pnlEntry");
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            pnlEntry.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        })
        pnlEntry.addEventListener('drop', handleDrop, false);
        //
    }

    function preventDefaults (e) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        e.preventDefault()
        e.stopPropagation()
    }
    function handleDrop(e) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }
    const imageFileTypes = [
        "image/png",
    ];
    const symbolSetFileTypes = [
        "text/plain",
        "application/json",
    ];
    function handleFiles(files){
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        files = [...files];
        files.forEach((file)=>{
            if (imageFileTypes.includes(file.type)){
                uploadSymbol(file);
            }
            else if (symbolSetFileTypes.includes(file.type)){
                handleTextFile(file);
            }
            else{
                console.warning("Unknown file type:",file.type,"filename:",file.name);
            }
        });
    }
    
    function handleTextFile(file){
        if (file.name.endsWith(".entry.json")){
            uploadEntryList(file);
        }
        else {
            uploadSymbolSet(file);
        }
    }

    function uploadSymbol(file){
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            //Get values
            let symbolName = file.name.split(".")[0];
            //Create object
            let symbol = {
                name: symbolName,
                imageURL: reader.result,
                icon: new Image(),
            }
            symbol.icon.src = symbol.imageURL;
            //Add symbol to symbolSet
            miscSymbolSet.addSymbol(symbol);
            //Update UI
            miscSymbolSet.alphabetizeSymbols();
            refreshSymbolBank();
            updateSymbolBank();
        }
    }

    function uploadSymbolSet(file){
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function() {
            let json = reader.result;
            importSymbolSet(json);
        }
    }
}