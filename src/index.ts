/// <reference path="./typings/tsd.d.ts" />
import * as m from "mithril";
import * as Q from "q";
import {Note} from "./note";

const noteName: string = require('../config.json').noteName;

class InputDateType {
    value: Date = null;

    constructor (value?: number | string | Date | InputDateType) {
        if (arguments.length) {
            if (value instanceof InputDateType) {
                this.value = new Date(value.value.getTime());
            } else if (value instanceof Date) {
                this.value = value;
            } else if (typeof value === 'number') {
                this.value = new Date(value);
            } else if (typeof value === 'string') {
                this.fromString(value);
            }
        } else {
            this.value = new Date();
        }

        // delete time infomation
        this.value.setHours(0, 0, 0, 0);
    }

    fromString = (value: string): void => {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (m.length) {
            var year  = parseInt(m[1], 10);
            var month = parseInt(m[2], 10) - 1;
            var day   = parseInt(m[3], 10);

            this.value = new Date();
            this.value.setFullYear(year, month, day);
        } else {
            throw "Format error: " + value;
        }
    }

    toString = (): string => {
        return [
            '' + this.value.getFullYear(),
            ('0' + (this.value.getMonth() + 1)).slice(-2),
            ('0' + (this.value.getDate())).slice(-2),
        ].join("-");
    }

    toShortString = (): string => {
        return [
            ('0' + (this.value.getMonth() + 1)).slice(-2),
            ('0' + (this.value.getDate())).slice(-2),
        ].join("/");
    }

    static compare (a: InputDateType, b: InputDateType): number {
        return a.value.getTime() - b.value.getTime();
    }
}

class Todo {
    id   = m.prop<number>(0)
    name = m.prop<string>(null);
    date = m.prop<InputDateType>(null);

    constructor (id: number, name: string, date: InputDateType) {
        this.id(id);
        this.name(name);
        this.date(date);
    }

    static compare (a: Todo, b: Todo): number {
       return InputDateType.compare(a.date(), b.date())
           || (a.id() - b.id());
    }
}

class TodoSelizalizer {
    static serialize(task: Todo): string {
        return task.date().toString() + " " + task.name();
    }

    static deserialize(text: string, id: number): Todo {
        text = text.trim();
        let date_str = text.split(/\s+/, 1)[0];
        let date = new InputDateType(date_str);
        let name = text.substr(date_str.length).trim();
        return new Todo(id, name, date);
    }
}

class Controller {
    list = m.prop<Todo[]>([]);
    date = m.prop(new InputDateType());
    name = m.prop("");
    synced = m.prop(false);
    loading = m.prop(false);
    note: Note = null;

    constructor() {
        this.note = new Note();
    }

    add = () => {
        if (this.name()) {
            let task = new Todo(this.list().length, this.name(), this.date());
            this.list().push(task);
            this.sort();

            this.name("");
            this.date(new InputDateType(this.date()));
        }
    }

    remove = (value: Todo) => {
        let index = this.list().indexOf(value);
        this.list().splice(index, 1);
        this.sort();
    }

    sort = () => {
        this.list().sort((a, b) => { return Todo.compare(b, a); });
    }

    checkEnterKey = (ev: KeyboardEvent) => {
        if (ev.keyCode === 13) {
            document.getElementById('submit').click();
        } else {
            m.redraw.strategy("none");
        }
    }

    update = () => {
        if (this.loading())
            return;

        this.note.connect();

        let f = () => {
            let synced = this.synced();

            this.synced(false);
            this.loading(true);

            if (!synced)
                return this._load();
            else
                return this._save();
        };

        Q(f())
        .then(() => {
            this.synced(true);
        })
        .catch((err: any) => {
            this.synced(false);
            console.log(err);
        })
        .finally(() => {
            this.loading(false);
            m.redraw(true);
        });
    }

    private _load = () => {
        return this.note.readNote(noteName)
                   .then((text: string) => {
                       let ary = text.split("\n");
                       ary.forEach((t: string) => {
                           let task = TodoSelizalizer.deserialize(t, this.list().length);
                           this.list().push(task);
                       });
                       this.sort();
                   })
                   .catch((err: any) => {
                       if (typeof err === 'string') {
                           // no exist note
                           return Promise.resolve<void>();
                       } else {
                           return Promise.reject(err);
                       }
                   });
    }

    private _save = () => {
        let data = this.list()
            .map((task) => TodoSelizalizer.serialize(task))
            .join("\n");

        return this.note.writeNote(noteName, data)
                   .then(() => {}); //type match Promise<void>
    }
}

function view (ctrl: Controller) {
    return m('div', [
        m('#input-form', {class: 'flow'}, [
            m('input[type=date]', {onchange: m.withAttr('value', ctrl.date().fromString), value: ctrl.date().toString()}),
            m('input[type=text]', {onkeyup: m.withAttr('value', ctrl.name), value: ctrl.name(), onkeydown: ctrl.checkEnterKey}),
            m('button#submit', {onclick: ctrl.add}, [
                m('i', {class: 'fa fa-pencil'})
            ]),
            m('button#update', {onclick: ctrl.add}, [
                m('i', {class: ctrl.synced()  ? 'fa fa-cloud-upload' :
                               ctrl.loading() ? 'fa fa-refresh fa-spin' : 'fa fa-cloud-download',
                        onclick: ctrl.update })
            ])
        ]),
        m('#drop-list', [
            m('table', ctrl.list().map(function (task: Todo) {
                return m('tr', {class: 'flow'}, [
                    m('td', {class: 'date'}, task.date().toShortString()),
                    m('td', {class: 'name'}, task.name()),
                    m('td', {class: 'trash'}, [
                        m('button', {onclick: () => {ctrl.remove(task)}}, [
                            m('i', {class: 'fa fa-trash-o'})
                        ])
                    ])
                ]);
            }))
        ])
    ]);
}

m.mount(document.getElementById('todo-board'), {controller: () => {return new Controller();}, view: view});
