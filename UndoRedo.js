// UndoRedo.js
export const undo = (undoStack, editingNoteIdRef, setTitle, setContent, setHasChanged, setIsSaved, redoStack, notes, setRedoStack, setNotes) => {
        const lastState = undoStack.pop();
    
        if (lastState) {
          const noteBeingEdited = lastState.find(note => note.id === editingNoteIdRef.current);
          if (noteBeingEdited) {
            setTitle(noteBeingEdited.title);
            setContent(noteBeingEdited.content);
            setHasChanged(true); 
            setIsSaved(false);
          }
          setRedoStack([...redoStack, [...notes]]);
          setNotes(lastState);
            // Trigger auto-save after undo
          setHasChanged(true);
          setIsSaved(false); 
        }
      };

export const redo = (redoStack, editingNoteIdRef, setTitle, setContent, setHasChanged, setIsSaved, undoStack, notes, setUndoStack, setNotes) => {
        console.log("Redo Stack before pop:", redoStack);
        const nextState = redoStack.pop();
        console.log("Popped state:", nextState);
    
        if (nextState) {
          const noteBeingEdited = nextState.find(note => note.id === editingNoteIdRef.current);
          if (noteBeingEdited) {
            setTitle(noteBeingEdited.title);
            setContent(noteBeingEdited.content);
            setHasChanged(true);
            setIsSaved(false);
          }
          setUndoStack([...undoStack, [...notes]]);
          setNotes(nextState);
        }
      };
