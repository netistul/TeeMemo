import { Button, IconButton, DefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect,useRef } from 'react';
import { View, TextInput, StyleSheet, Platform, StatusBar as RNStatusBar, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

export default function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const statusBarHeight = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const hasChangedRef = useRef(hasChanged);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const richEditor = useRef(null);
  const [editorInitialized, setEditorInitialized] = useState(false);
  const isSavedRef = useRef(isSaved);
  const [isNearEnd, setIsNearEnd] = useState(false);
  const scrollViewRef = useRef(null);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        alert('Sorry, we need gallery permissions to make this work!');
        return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
        let base64URI = `data:image/jpg;base64,${result.assets[0].base64}`;
        richEditor.current?.insertImage(base64URI);
    }
};


  const saveNote = async () => {
    // Get content directly from the editor
    const editorContent = await richEditor.current?.getContentHtml();

    // Check if the content is just the placeholder or empty
    if (editorContent === '<div>Start writing...</div>' || !editorContent) {
        console.log("Placeholder or empty content. Not saving.");
        return;
    }

    if (titleRef.current || editorContent) {
      console.log("Saving note");

      setNotes(prevNotes => {
        let newNotes;
        if (editingNoteIndex !== null) {
          newNotes = [...prevNotes];
          newNotes[editingNoteIndex] = { title: titleRef.current, content: editorContent };
        } else {
          const newNote = { title: titleRef.current, content: editorContent };
          newNotes = [...prevNotes, newNote];
        }
        try {
          AsyncStorage.setItem('notes', JSON.stringify(newNotes));
          setIsSaved(true);
        } catch (error) {
          console.log("Error saving note:", error);
        }
        return newNotes;
      });
    }
};



  const handleTitleChange = (text) => {
    console.log("Title changed");
    setTitle(text);
    setHasChanged(true);
    setIsSaved(false);
    console.log("Set isSaved to false in handleTitleChange");
  };

  const richTextHandle = async (descriptionText) => { //ex handleContentChange code
    if (descriptionText === '<div>Start writing...</div>') {
        richEditor.current?.setContentHTML(''); // Clear placeholder
    } else if (!descriptionText || descriptionText.trim() === '') {
        // Handle empty content
        setContent(""); // Update the state
    } else {
        setContent(descriptionText); // Update the state
        setHasChanged(true);  // Indicate that content has changed
        setIsSaved(false);    // Indicate that the content is not saved yet
        console.log("Set isSaved to false in richTextHandle");
    }
};


  useEffect(() => {
    hasChangedRef.current = hasChanged;
  }, [hasChanged]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('notes');
      if (savedNotes !== null) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.log("Error loading notes:", error);
    }
  };

  useEffect(() => {
    console.log("Auto-save useEffect triggered");
    if (isAddingNote && hasChangedRef.current) {
      console.log("Setting auto-save interval");
      const autoSaveInterval = setInterval(() => {
        console.log(`Inside interval. hasChanged: ${hasChangedRef.current}, isSaved: ${isSaved}`);
        if (hasChangedRef.current && !isSavedRef.current) {
          console.log("Auto-saving note");
          saveNote();
          setHasChanged(false);
        }
      }, 3000);
  
      return () => {
        console.log("Clearing auto-save interval");
        clearInterval(autoSaveInterval);
      };
    }
  }, [isAddingNote, hasChanged]);
  
  

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);  
  
  
  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1 }}>
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>

        {isAddingNote ? (
          <>
          <View style={styles.noteWrapper}>
            <View style={[styles.titleRow, styles.titleBackground]}>
              <IconButton 
                icon="arrow-left" 
                onPress={async () => {
                  await saveNote();
                  setIsAddingNote(false);
                  loadNotes();
                  setTitle('');
                  setContent('');
                  setEditingNoteIndex(null);
                }} 
              />
              <TextInput
                style={[styles.input, styles.titleInput]}
                placeholder="Title"
                placeholderTextColor="#777"
                value={title}
                onChangeText={handleTitleChange}
              />
              <TouchableOpacity onPress={saveNote} style={styles.checkButton}>
                <MaterialCommunityIcons 
                  name="check" 
                  size={24} 
                  color={isSaved ? DefaultTheme.colors.primary : (hasChanged ? "white" : "#777")} 
                />
              </TouchableOpacity>
            </View>
  
            <ScrollView 
                  ref={scrollViewRef}
                  onContentSizeChange={() => {
                    if (isNearEnd) {
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                  }}
                  onScroll={({ nativeEvent }) => {
                    const padding = 50; // adjust this value to determine how close to the end the user should be for auto-scrolling to activate
                    const isNearBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - padding;
                    setIsNearEnd(isNearBottom);
                  }}
                  scrollEventThrottle={400} // adjust this value as needed for performance
                  keyboardDismissMode="interactive" 
                  style={{flex: 1}}
                >
                <RichEditor
                  ref={richEditor}
                  style={[styles.input, styles.contentInput]}
                  androidHardwareAccelerationDisabled={true}
                  initialContentHTML={content || '<div>Start writing...</div>'}
                  editorStyle={{
                      backgroundColor: '#262626',
                      color: '#c1bcbc',
                      placeholderColor: '#757578',
                  }}
                  onChange={richTextHandle}
                  onFocus={() => {
                      if (content === '<div>Start writing...</div>' || !content) {
                          richEditor.current?.setContentHTML('');  // clear the editor content
                      }
                  }}
                />
              </ScrollView>
  
              <RichToolbar
                editor={richEditor}
                selectedIconTint="#873c1e"
                iconTint="#f7f7f8"
                onPressAddImage={pickImage}
                actions={[
                    actions.insertImage,
                    actions.setBold,
                    actions.setItalic,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.insertLink,
                    actions.setStrikethrough,
                    actions.setUnderline,
                ]}
                style={styles.richTextToolbarStyle}
            />
        </View>
          </>
        ) : (
          <>
            <Button icon="plus" mode="contained" onPress={() => {
              setIsAddingNote(true);
              setTitle('');
              setContent('');
              setEditingNoteIndex(null);
              setIsSaved(false);
              setEditorInitialized(false);
            }}>
              Add Note
            </Button>
            <ScrollView>
              {notes.map((note, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => {
                    setIsAddingNote(true);
                    setTitle(note.title);
                    setContent(note.content);
                    if (editorInitialized) {
                        console.log("Setting editor content to:", note.content);
                        richEditor.current?.setContentHTML(note.content);
                    }
                    setEditingNoteIndex(index);
                    setIsSaved(false);             
                    console.log("Selected note content:", note.content);
                  }}                                                              
                >
                  <View style={styles.customCard}>
                    <Text style={styles.customTitle}>{note.title}</Text>
                    <Text style={styles.customContent}>{note.content}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
    </View>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  noteWrapper: {
    flex: 1,
    backgroundColor: '#262626',  // background color inside notes
},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  input: {
    color: '#c1bcbc',
    borderColor: 'transparent',
    flex: 1,
    padding: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  titleInput: {
    color: '#c1bcbc',
    fontSize: 24,
    marginRight: 8,
  },
  contentInput: {
    flex: 1,
    textAlignVertical: 'top',
  },
  customCard: {
    margin: 8,
    padding: 16,
    backgroundColor: '#262626',
    borderRadius: 4,
    width: '96%',
  },
  customTitle: {
    color: '#c1bcbc',
    fontSize: 16,
    marginBottom: 4,
  },
  titleBackground: {
    backgroundColor: '#262626',
  },  
  customContent: {
    color: '#757578',
  },
  checkButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  richTextToolbarStyle: {
    backgroundColor: '#121212',
  },
});
