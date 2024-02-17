"use strict";

const stringifyFace = [
    "_imageID",
    "_cornerLT",
    "_cornerLB",
    "_cornerRT",
    "_cornerRB",
    "_flipX",
    "_flipY",
    "_rotation",
];

const cornerUnset = new Vector2(-1, -1);

class Face{
    constructor(imageBank, imageID) {

        this._imageURL = undefined;
        this._imageID = imageID;

        //Simple Edits
        this._flipX = false;
        this._flipY = false;
        this._rotation = 0;//0, 90, 180, 270

        //Rectangle Projection
        this._cornerLT = cornerUnset; //new Vector2(0, 0);
        this._cornerLB = cornerUnset; //new Vector2(0, this.height);
        this._cornerRT = cornerUnset; //new Vector2(this.width, 0);
        this._cornerRB = cornerUnset; //new Vector2(this.width, this.height);

        this.onChanged = new hookupDelegates("url");

        this.init(imageBank);
    }

    init(imageBank) {
        this.imageBank = imageBank;//this image bank is owned by the parent object
        this.corners = [this._cornerLT, this._cornerRT, this._cornerRB, this._cornerLB];
    }

    get imageURL() {
        return this._imageURL ?? this.imageBank[this._imageID];
    }
    set imageURL(imageURL) {
        this._imageURL = imageURL;
        this.onChanged.run(this._imageURL);
    }

    get imageID(){
        return this._imageID;
    }
    set imageID(imageID) {
        this._imageID = imageID;
        this._imageURL = this.imageBank[this._imageID];
        this.onChanged.run(this._imageURL);
    }
}

function inflateFace(face, imageBank) {

    let inflated = inflateObject(face, Face.prototype, ["onChanged"]);
    if (!inflated) { return; }

    face.init(imageBank);

}
