// DeleteNote.js
import React from 'react';
import { Button } from 'react-native-paper'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export const deleteNote = async (noteToDeleteId, setNotes, setDeleteDialogVisible, setIsAddingNote, setTitle, setContent, editingNoteIdRef, notes) => {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDeleteId));
        setDeleteDialogVisible(false);
    
        try {
            AsyncStorage.setItem('notes', JSON.stringify(notes.filter(note => note.id !== noteToDeleteId)));
        } catch (error) {
            console.log("Error deleting note:", error);
        }
    
        setIsAddingNote(false);
        setTitle('');
        setContent('');
        editingNoteIdRef.current = null;
    };
  
  export const handleBulkDelete = async (selectedNotes, setNotes, setIsBulkDeleteMode, setSelectedNotes, notes) => {
    const newNotes = notes.filter(note => !selectedNotes.has(note.id));
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
    } catch (error) {
      console.log("Error in bulk delete:", error);
    }
    setNotes(newNotes);
    setIsBulkDeleteMode(false);
    setSelectedNotes(new Set());
  };
  
  export const toggleSelectNote = (noteId, setSelectedNotes) => {
    setSelectedNotes(prevSelected => {
      console.log("Previous selected notes: ", Array.from(prevSelected));
      const newSelected = new Set([...prevSelected]);
      if (newSelected.has(noteId)) {
        newSelected.delete(noteId);
      } else {
        newSelected.add(noteId);
      }
      console.log("Newly selected notes: ", Array.from(newSelected));
      return newSelected;
    });
  };  
  
  export const exitBulkDeleteMode = (setIsBulkDeleteMode, setSelectedNotes) => {
    setIsBulkDeleteMode(false);
    setSelectedNotes(new Set());
  };
  
  export const DeleteButtons = ({ handleBulkDelete, exitBulkDeleteMode, selectedNotes }) => (
    <>
      <Button 
        mode="contained"
        buttonColor="#ed3b5a"
        onPress={handleBulkDelete}
      >
        {`Delete ${selectedNotes.size} selected notes`}
      </Button>
  
      <Button 
        mode="outlined"
        onPress={exitBulkDeleteMode}
      >
        Cancel
      </Button>
    </>
  );

  export const CustomCheckBox = ({ isSelected, onChange }) => {
    console.log("Is selected:", isSelected);
    return (
      <TouchableOpacity onPress={onChange} style={{ padding: 10 }}>
        <View
          style={[
            {
              width: 20,
              height: 20,
              borderWidth: 2,
              borderColor: "#000",
              justifyContent: 'center',
              alignItems: 'center',
            },
            isSelected ? { backgroundColor: "#000" } : {},
          ]}
        >
          {isSelected ? <Text style={{ color: "#FFF", fontSize: 18 }}>X</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };