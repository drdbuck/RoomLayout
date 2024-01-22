"use strict";
//2024-01-04: copied from CalendarJournal

const imageFileTypes = [
    "image/png",
    "image/jpeg",
    "image/bmp",
    "image/webp",
];
const textFileTypes = [
    "text/plain",
    "application/json",
];

class FileManager {
    constructor(dropPanel) {
        this.dropPanel = dropPanel;

        //bind responder functions
        const _preventDefaults = this.preventDefaults.bind(this);
        const _handleDrop = this.handleDrop.bind(this);

        //Drop image event handlers// Prevent default drag behaviors
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropPanel.addEventListener(eventName, _preventDefaults, false);
            document.body.addEventListener(eventName, _preventDefaults, false);
        })
        dropPanel.addEventListener('drop', _handleDrop, false);

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
        this.handleFiles(files);
    }

    handleFiles(files) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        files = [...files];
        files.forEach((file) => {
            if (imageFileTypes.includes(file.type)) {
                this.uploadImage(file);
            }
            else if (textFileTypes.includes(file.type)) {
                this.handleTextFile(file);
            }
            else {
                console.warn("Unknown file type:", file.type, "filename:", file.name);
            }
        });
    }

    uploadImage(file) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        let _uploadImage = this._uploadImage.bind(this);
        reader.onloadend = (progressEvent) => {
            // log("result,", progressEvent);
            let imageURL = progressEvent.currentTarget.result;
            _uploadImage(file, imageURL);
        };
    }
    _uploadImage(file, imageURL) {
        //Get values
        let imageName = file.name.split(".")[0];
        //Create object
        let image = createImage(imageName, imageURL);
        //Run delegate
        this.onImageUploaded.run(image);
    }

    handleTextFile(file) {
        if (file.name.endsWith(".json")) {
            this.uploadJson(file);
        }
        else {
            console.warn("Not implemented: handling text file:", file.name, file.type);
        }
    }

    uploadJson(file) {
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            let json = reader.result;
            //Run delegate
            this.onJsonUploaded.run(json);
        }
    }
}
