import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Button, ActivityIndicator, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import { v4 as uuidv4 } from 'uuid';
import SaveNote from './SaveNote';
import AddNote from './AddNote';

export default function App() {
  const [editorHtml, setEditorHtml] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorKey, setEditorKey] = useState(uuidv4()); 
  const [toolbarKey, setToolbarKey] = useState(uuidv4());
  const [isNoteLoaded, setIsNoteLoaded] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState(null);

  const editorRef = useRef(null);

  const handleHtmlChange = (htmlContent) => {
    setEditorHtml(htmlContent.html);
  };

  const saveEditorContent = async () => {
    const noteId = uuidv4();
    const note = {
      id: noteId,
      content: editorHtml,
      createdAt: new Date().toISOString(),
    };

    try {
      const notesString = await AsyncStorage.getItem('testingnotes');
      let notesArray = [];
      if (notesString) {
        notesArray = JSON.parse(notesString);
      }
      notesArray.push(note);
      setNotes(notesArray);
      await AsyncStorage.setItem('testingnotes', JSON.stringify(notesArray));
      console.log('Note saved with ID:', noteId);
    } catch (error) {
      console.error('Failed to save content to AsyncStorage:', error);
    }
  };

  const loadNoteContent = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setEditorHtml(note.content);
      setCurrentNoteId(noteId); // Set the current note ID
      setEditorKey(uuidv4()); // Re-render the editor
      setToolbarKey(uuidv4());
      setIsNoteLoaded(true);
    }
  };

  const handleBackToList = () => {
    setIsNoteLoaded(false);
    setEditorHtml('');
    setCurrentNoteId(null); // Reset the current note ID
  };

  useEffect(() => {
    const loadStoredContent = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem('testingnotes');
        if (storedNotes) {
          const notesArray = JSON.parse(storedNotes);
          setNotes(notesArray);
          if (notesArray.length > 0) {
            setEditorHtml(notesArray[0].content);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load content from AsyncStorage:', error);
        setLoading(false);
      }
    };

    loadStoredContent();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      {!isNoteLoaded && (
       <ScrollView style={styles.scrollView}>
       {notes.map((note) => (
         <View key={note.id} style={styles.notePreviewContainer}>
           <Button
             title={`${note.content.substring(0, 50)}...`}
             onPress={() => loadNoteContent(note.id)}
           />
         </View>
       ))}
          <Button title="Save Content" onPress={saveEditorContent} />
        </ScrollView>
      )}
      {isNoteLoaded && (
  <>
    <SaveNote noteId={currentNoteId} content={editorHtml} setNotes={setNotes} />
    <Button title="Back to Notes List" onPress={handleBackToList} />
  </>
)}
      <QuillEditor
        key={editorKey}
        ref={editorRef}
        style={styles.editor}
        initialHtml={editorHtml}
        onHtmlChange={handleHtmlChange}
        theme={{ background: '#343541', color: '#ffffff', placeholder: '#555555' }}
      />
      <QuillToolbar
        key={toolbarKey}
        editor={editorRef}
        options="full"
        theme="dark"
        
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    marginVertical: 10,
  },
  noteButtonContainer: {
    marginVertical: 5,
    
  },
  notePreviewContainer: {
    marginVertical: 5,
  }, 
  
 
});
