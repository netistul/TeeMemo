// UndoRedo.js
export const undo = (undoStack, editingNoteIdRef, setTitle, setContent, setHasChanged, setIsSaved, redoStack, notes, setRedoStack, setNotes, contentInputRef) => {
  const lastState = undoStack.pop();

  if (lastState) {
    const noteBeingEdited = lastState.find(note => note.id === editingNoteIdRef.current);
    if (noteBeingEdited) {
      setTitle(noteBeingEdited.title);
      setContent(noteBeingEdited.content);
      contentInputRef.current?.setContentHTML(noteBeingEdited.content);
      setHasChanged(true); 
      setIsSaved(false);
    }
    setRedoStack([...redoStack, [...notes]]);
    setNotes(lastState);
    setHasChanged(true);
    setIsSaved(false); 
  }
};

export const redo = (redoStack, editingNoteIdRef, setTitle, setContent, setHasChanged, setIsSaved, undoStack, notes, setUndoStack, setNotes, contentInputRef) => {
  const nextState = redoStack.pop();

  if (nextState) {
    const noteBeingEdited = nextState.find(note => note.id === editingNoteIdRef.current);
    if (noteBeingEdited) {
      setTitle(noteBeingEdited.title);
      setContent(noteBeingEdited.content);
      contentInputRef.current?.setContentHTML(noteBeingEdited.content);
      setHasChanged(true);
      setIsSaved(false);
    }
    setUndoStack([...undoStack, [...notes]]);
    setNotes(nextState);
  }
};

