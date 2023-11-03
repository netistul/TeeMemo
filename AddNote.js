import React, { useState } from 'react';
import { View, Button, TextInput, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

const AddNote = ({ onSave }) => {
  const [noteText, setNoteText] = useState('');

  const handleSaveNote = () => {
    // Generate a new ID for the note
    const newNoteId = uuidv4();
    // Call the onSave function passed from the parent component, which handles the actual saving logic
    onSave(newNoteId, noteText);
    // Clear the text input after saving
    setNoteText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter note content here"
        value={noteText}
        onChangeText={setNoteText}
        multiline
      />
      <Button title="Save Note" onPress={handleSaveNote} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    // Rest of your styles for layout, etc.
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 20,
    // Rest of your styles for the input
  },
});

export default AddNote;
