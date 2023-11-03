import React from 'react';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SaveNote = ({ noteId, content, setNotes }) => {
  const saveNote = async () => {
    try {
      const notesString = await AsyncStorage.getItem('testingnotes');
      let notesArray = notesString ? JSON.parse(notesString) : [];
      const noteIndex = notesArray.findIndex((n) => n.id === noteId);

      if (noteIndex !== -1) {
        // Update existing note
        notesArray[noteIndex].content = content;
      } else {
        // This should not happen, but in case the note ID is not found, add it as a new note
        const newNote = {
          id: noteId,
          content: content,
          createdAt: new Date().toISOString(),
        };
        notesArray.push(newNote);
      }

      await AsyncStorage.setItem('testingnotes', JSON.stringify(notesArray));
      setNotes(notesArray);
      console.log('Note saved with ID:', noteId);
    } catch (error) {
      console.error('Failed to save content to AsyncStorage:', error);
    }
  };

  return (
    <Button title="Save Note" onPress={saveNote} />
  );
};

export default SaveNote;
