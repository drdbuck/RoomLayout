"use strict";
//2024-01-04: copied from CalendarJournal

const imageFileTypes = [
    "image/png",
];
const textFileTypes = [
    "text/plain",
    "application/json",
];

class FileManager {
    constructor(dropPanel) {
        this.dropPanel = dropPanel;

        //bind responder functions
        this.preventDefaults.bind(this);
        this.handleDrop.bind(this);
        
        //Drop image event handlers// Prevent default drag behaviors
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropPanel.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        })
        dropPanel.addEventListener('drop', this.handleDrop, false);
        
        //Delegate initialization
        this.onImageUploaded = new Delegate();//param: image
        this.onJsonUploaded = new Delegate();//param: json
    }

    preventDefaults(e) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        e.preventDefault()
        e.stopPropagation()
    }
    handleDrop(e) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }
  
    handleFiles(files) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        files = [...files];
        files.forEach((file) => {
            if (imageFileTypes.includes(file.type)) {
                this.onImageUploaded.run(file);
            }
            else if (textFileTypes.includes(file.type)) {
                handleTextFile(file);
            }
            else {
                console.warning("Unknown file type:", file.type, "filename:", file.name);
            }
        });
    }

    uploadImage(file){
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            //Get values
            let imageName = file.name.split(".")[0];
            //Create object
            let image = {
                name: imageName,
                imageURL: reader.result,
                icon: new Image(),
            }
            image.icon.src = image.imageURL;
            //Run delegate
            this.onImageUploaded.run(image);
        }
    }
    
    handleTextFile(file) {
        if (file.name.endsWith(".json")){
            uploadJson(file);
        }
        else{
            console.warn("Not implemented: handling text file:", file.name, file.type);
        }
    }

    uploadJson(file){
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function() {
            let json = reader.result;
            //Run delegate
            this.onJsonUploaded.run(json);
        }
    }
}