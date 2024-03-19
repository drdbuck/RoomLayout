"use strict";
//2024-01-04: copied from CalendarJournal

const EXTENSION_FURNITURE = "frn";//furniture file extension
const EXTENSION_ROOM = "room";//room file extension

const imageFileTypes = [
    "image/png",
    "image/jpeg",
    "image/bmp",
    "image/webp",
];
const textFileTypes = [
    "text/plain",
    "application/json",
    EXTENSION_FURNITURE,
    EXTENSION_ROOM,
];
const allFileTypes = [imageFileTypes, textFileTypes].flat();
const acceptStringAllFiles = allFileTypes
    .map(f => (f.includes("/")) ? f : `.${f}`)
    .join(", ");

class FileManager {
    constructor(dropPanel) {
        this.dropPanel = dropPanel;

        //bind responder functions
        const _preventDefaults = this.preventDefaults.bind(this);
        const _handleDrop = this.handleDrop.bind(this);
        const _handlePaste = this.handlePaste.bind(this);

        //Prevent default drag behaviors
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropPanel.addEventListener(eventName, _preventDefaults, false);
            document.body.addEventListener(eventName, _preventDefaults, false);
        })
        dropPanel.addEventListener("paste", _preventDefaults, false);

        //drop event handlers
        dropPanel.addEventListener('drop', _handleDrop, false);

        //Paste image event handlers
        dropPanel.addEventListener('paste', _handlePaste, false);

        //Delegate initialization
        this.onImageUploaded = new Delegate();//param: image
        this.onFurnitureUploaded = new Delegate();//param: furniture
        this.onRoomUploaded = new Delegate("room");
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
    handlePaste(event) {
        //2024-02-13: copied from https://stackoverflow.com/a/51586232/2336212
        let items = (event.clipboardData || event.originalEvent.clipboardData).items;
        let files = [];
        for (let item of items) {
            if (item.kind === 'file') {
                var blob = item.getAsFile();
                files.push(blob);
            }
        }
        this.handleFiles(files);
    }

    handleFiles(files) {
        //2022-05-26: copied from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
        files = [...files];
        files.forEach((file) => {
            let fileType = file.type;
            let fileExtension = file.name.split(".").at(-1);
            if (imageFileTypes.includes(fileType)) {
                this.uploadImage(file);
            }
            else if (textFileTypes.includes(fileType) || textFileTypes.includes(fileExtension)) {
                this.handleTextFile(file);
            }
            else {
                console.warn("Unknown file type:", fileType, "filename:", file.name, "extension", fileExtension);
            }
        });
    }

    uploadImage(file) {
        let reader = new FileReader();
        console.log("uploadImage", file);
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
        let imageName = file.name?.split(".")[0] ?? "untitled";
        //Create object
        let image = createImage(imageName, imageURL);
        //Run delegate
        this.onImageUploaded.run(image);
    }

    handleTextFile(file) {
        //early exit: invalid filename
        if (!file.name) {
            console.error("file does not have a name!", file);
            return;
        }
        //
        if (file.name.endsWith("." + EXTENSION_FURNITURE)) {
            this.uploadFurniture(file);
        }
        else if (file.name.endsWith("." + EXTENSION_ROOM)) {
            this.uploadRoom(file);
        }
        else if (file.name.endsWith(".json")) {
            this.uploadJson(file);
        }
        else {
            console.warn("Not implemented: handling text file:", file.name, file.type);
        }
    }

    uploadFurniture(file) {
        const reader = new FileReader();
        reader.readAsText(file);
        const flm = this;
        reader.onloadend = function () {
            let json = reader.result;
            let furnitueObj = JSON.parse(json);
            if (!furnitueObj) {
                console.error("Unable to parse furniture list!", file.name, json);
                return;
            }
            for (let furniture of furnitueObj.list) {
                inflateData(furniture);
                //Run delegate
                flm.onFurnitureUploaded.run(furniture);
            }
        }
    }

    uploadRoom(file) {
        const reader = new FileReader();
        reader.readAsText(file);
        const flm = this;
        reader.onloadend = function () {
            let json = reader.result;
            let room = JSON.parse(json);
            if (!room) {
                console.error("Unable to parse room!", file.name, json);
                return;
            }
            inflateData(room);
            //Run delegate
            flm.onRoomUploaded.run(room);
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
