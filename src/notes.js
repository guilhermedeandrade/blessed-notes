'use strict';

const fs = require ('fs');
const {resolve} = require ('path');
const S = require ('sanctuary');
const $ = require ('sanctuary-def');
const {log} = require ('./utils');

const stringify = str => JSON.stringify (str);

const writeFile = path =>
  data => fs.writeFileSync (resolve (__dirname, path), data);

const readFileSync = path =>
  fs.readFileSync (resolve (__dirname, path));

const saveJSON = path =>
  S.pipe ([S.map (stringify), S.map (writeFile (path))]);

const loadJSON = S.pipe ([
  readFileSync,
  S.show,
  S.parseJson (S.is ($.Array ($.Object))),
]);

const isDuplicated = value =>
  note => S.equals (value) (S.prop ('title') (note));

const addNote = ({title, body}) => {
  const notes = loadJSON ('../db/notes.json');
  const duplicateNote = S.chain (S.find (isDuplicated (title))) (notes);

  if (S.isNothing (duplicateNote)) {
    const newNotes = S.map (S.append ({title, body})) (notes);
    saveJSON ('../db/notes.json') (newNotes);
    log.success ('new note added!');
  } else {
    log.warning ('note title taken');
  }
};

const removeNote = ({title}) => {
  const notes = loadJSON ('../db/notes.json');
  const newNotes = S.map (S.reject (isDuplicated (title))) (notes);

  if (S.equals (notes) (newNotes)) {
    log.warning ('note not found');
  } else {
    log.warning (`the following note will be removed: ${title}`);
    saveJSON ('../db/notes.json') (newNotes);
    log.success ('the note was successfully removed!');
  }
};

const listNotes = () => {
  const notes = loadJSON ('../db/notes.json');

  if (S.isNothing (notes) || S.equals (S.maybeToNullable (notes).length) (0)) {
    log.warning ('no notes were found :cry:');
  } else {
    log.success ('your notes:');
    S.map (S.map (note => log.plain (S.prop ('title') (note)))) (notes);
  }
};

const readNote = ({title}) => {
  const note = S.pipe ([loadJSON, S.chain (S.find (isDuplicated (title)))]) (
    '../db/notes.json'
  );

  if (S.isNothing (note)) {
    log.warning ('no note was found :cry:');
  } else {
    const body = S.maybeToNullable (S.map (S.prop ('body')) (note));

    log.strong (title);
    log.plain (body);
  }
};

module.exports = {addNote, removeNote, listNotes, readNote};
