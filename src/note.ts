import {Evernote} from "evernote"
import * as enml from "enml-js"

const config = require('../config.json');

export class Note {
    noteStore: Evernote.NoteStoreClient;
    hasConnection: boolean;

    constructor () {
        this.noteStore = null;
        this.hasConnection = false;
    }

    connect = () => {
        if (!this.hasConnection) {
            let client = new Evernote.Client({token: config.token, sandbox: false});
            this.noteStore = client.getNoteStore();
            this.hasConnection = true;
        }
    }

    createNote = (title: string, data = '') => {
        let note = new Evernote.Note();
        note.title = title;

        // empty note
        note.content = enml.ENMLOfPlainText(data);

        // create note
        return new Promise<Evernote.Note>((resolve, reject) => {
            this.noteStore.createNote(note, (err, _note) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(_note);
                }
            });
        });
    }

    getNote = (title: string) => {
        // get note guid
        return this._getNoteGuidFromTitle(title).then((guid: string) => {
            // get & return note
            return new Promise<Evernote.Note>((resolve, reject) => {
                this.noteStore.getNote(guid, true, false, false, false, (err, note) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(note);
                    }
                });
            });
        });
    }

    readNote = (title: string) => {
        // get note
        return this.getNote(title).then((note: Evernote.Note)=>{
            // read & unpacking
            let data = enml.PlainTextOfENML(note.content);
            return data;
        })
    }

    writeNote = (title: string, data: string) => {
        return new Promise<Evernote.Note>((resolve, reject) => {
            // get note
            this.getNote(title).then((note: Evernote.Note)=>{
                // update & save note
                note.content = enml.ENMLOfPlainText(data);
                this.noteStore.updateNote(note, (err, _note) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(_note);
                    }
                });
            }).catch((err: any) => {
                // create & save note
                resolve(this.createNote(title, data));
            });
        });
    }

    private _getNoteGuidFromTitle = (title: string) => {
        let filter = new Evernote.NoteFilter();
        filter.words = title;

        let spec = new Evernote.NotesMetadataResultSpec();
        spec.includeTitle = true;

        return new Promise<string>((resolve, reject) => {
            this.noteStore.findNotesMetadata(filter, 0, 1, spec, (err, meta) => {
               if (err) {
                   reject(err);
               } else if (meta.notes.length == 0) {
                   reject("no exist note");
               } else {
                   resolve(meta.notes[0].guid);
               }
            });
        });
    }
}