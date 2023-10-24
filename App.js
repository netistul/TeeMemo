import { Button, Menu, IconButton, DefaultTheme, Portal, Provider} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect,useRef } from 'react';
import { View, TextInput, StyleSheet, Platform, StatusBar as RNStatusBar, Text, ScrollView, TouchableOpacity, Keyboard, TouchableNativeFeedback, BackHandler, FlatList, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import * as ImagePicker from 'expo-image-picker';

import OptionsMenu from './OptionsMenu';
import { undo, redo } from './UndoRedo';
import { CustomCheckBox, deleteNote, handleBulkDelete, toggleSelectNote, exitBulkDeleteMode, DeleteButtons } from './DeleteNote';

export default function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const statusBarHeight = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
  const [isSaved, setIsSaved] = useState(false);
  const isSavedRef = useRef(isSaved);
  const [hasChanged, setHasChanged] = useState(false);
  const hasChangedRef = useRef(hasChanged);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const notesRef = useRef(notes);
  const editingNoteIdRef = useRef(null);
  const [isEditMode, setEditMode] = useState(false);
  const contentInputRef = useRef(null);
  const tempCreatedDateRef = useRef(null);
  const [isDeleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState(null);
  const [isOptionsDialogVisible, setOptionsDialogVisible] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [noteBackgroundColor, setNoteBackgroundColor] = useState('#262626');
  const [visible, setVisible] = React.useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontContrast, setFontContrast] = useState({color: '#d6d6d4', label: 'Default'});
  const [visibleContrast, setVisibleContrast] = useState(false);
  const [statusBarColor, setStatusBarColor] = useState('#262626');
  const [isAtBottom, setIsAtBottom] = useState(false);
  const TouchableComponent = Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showUndoRedo, setShowUndoRedo] = useState(false);
  const [pressedIndex, setPressedIndex] = useState(null);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [hasLoadedNotes, setHasLoadedNotes] = useState(false);

  const saveNote = async () => {
    // First, get the HTML content from the RichEditor
    let richEditorContent = '';
    if (contentInputRef.current) {
      richEditorContent = await contentInputRef.current.getContentHtml();
    }
  
    // Now proceed with your existing logic, replacing `contentRef.current` with `richEditorContent`
    if (titleRef.current || richEditorContent) {
      console.log("Saving note");
  
      setNotes(prevNotes => {
        let newNotes = [...prevNotes];
  
        const existingNoteIndex = newNotes.findIndex(note => note.id === editingNoteIdRef.current);
  
        const currentDateTime = new Date();
        const currentDateTimeString = currentDateTime.toISOString();
  
        if (existingNoteIndex !== -1) {
          // We are editing an existing note
          const updatedNote = { 
            ...newNotes[existingNoteIndex], 
            title: titleRef.current, 
            content: richEditorContent, // Changed this line
            lastEdited: currentDateTimeString
          };
          
          newNotes.splice(existingNoteIndex, 1);
          newNotes.unshift(updatedNote);
  
        } else {
          // We are adding a new note
          const newNoteId = Date.now().toString();
          const newNote = { 
            id: newNoteId, 
            title: titleRef.current, 
            content: richEditorContent, // Changed this line
            created: tempCreatedDateRef.current || currentDateTimeString, 
            lastEdited: currentDateTimeString
          };
          newNotes.unshift(newNote);
  
          editingNoteIdRef.current = newNoteId;
        }
  
        try {
          // Your storage logic
          AsyncStorage.setItem('notes', JSON.stringify(newNotes));
          setIsSaved(true);
          setHasChanged(false);
        } catch (error) {
          console.log("Error saving note:", error);
        }
  
        tempCreatedDateRef.current = null;
        return newNotes;
      });
  
      setUndoStack([...undoStack, [...notes]]);
    }
  };

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
        contentInputRef.current?.insertImage(base64URI);
    }
};
  

  const ListItem = ({ note, index, setPressedIndex, pressedIndex, setIsViewMode, setIsAddingNote, setTitle, setContent, setIsSaved, editingNoteIdRef, contentInputRef, styles, getEmojiForNote, getEmojiSizeForTitle, getColorByIndex }) => {

    return (
      <TouchableOpacity
        key={note.id}
        onLongPress={() => handleLongPressNote(note.id)}
        onPress={() => {
          if (contentInputRef.current && preloadedNotes[note.id]) {
            contentInputRef.current.setContentHTML(preloadedNotes[note.id]);
          }
          setIsViewMode(true);
          setIsAddingNote(true);
          setTitle(note.title);
          setContent(note.content);
          setIsViewMode(false);
          editingNoteIdRef.current = note.id;
          setIsSaved(false);
        }}
      >
        <View style={[styles.customCard, { backgroundColor: getColorByIndex(index) }]}>
        {isBulkDeleteMode && (
          <CustomCheckBox 
          isSelected={selectedNotes.has(note.id)}
          onChange={() => toggleSelectNote(note.id, setSelectedNotes)} />
        )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={[styles.emoji, getEmojiSizeForTitle(note.title)]}>
                {getEmojiForNote(note.id)}
              </Text>
              <Text style={[styles.customTitle, { flexShrink: 1 }]}>{note.title}</Text>
            </View>
            <View style={[
              styles.dateContainer, 
              { right: 10, top: 5 }, 
              note.title.length > 13 ? styles.adjustedPosition : {}
            ]}>
              <Text style={styles.creationDate}>
                Created: {note.created && !isNaN(new Date(note.created))
                    ? new Date(note.created).toLocaleDateString()
                    : 'Unknown'}
              </Text>
              <Text style={styles.lastEditedDate}>
                Last edited: {new Date(note.lastEdited).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Text style={styles.customContent}>
            {note.content.length > 200 ? note.content.replace(/\n+/g, '\n').substring(0, 200) + '...' : note.content.replace(/\n+/g, '\n')}
          </Text>
        </View>
      </TouchableOpacity>
       
    );
  };

  const MemoizedListItem = React.memo(ListItem);


  const handleLongPressNote = (noteId) => {
    setIsBulkDeleteMode(true);
    setSelectedNotes(new Set([...selectedNotes, noteId]));
  };

  const setPureDarkBackground = async () => {
    const color = '#000000';
    setNoteBackgroundColor(color);
    setStatusBarColor(color);
    await AsyncStorage.setItem('selectedBackgroundColor', color);
  };

  const setSoftBlackBackground = async () => {
    const color = '#121212';
    setNoteBackgroundColor(color);
    setStatusBarColor(color);
    await AsyncStorage.setItem('selectedBackgroundColor', color);
  };

  const setEvernoteStyle = async () => {
    const color = '#262626';
    setNoteBackgroundColor(color);
    setStatusBarColor(color);
    await AsyncStorage.setItem('selectedBackgroundColor', color);
  };


  const loadFontSize = async () => {
    const storedFontSize = await AsyncStorage.getItem('fontSize');
    if (storedFontSize) {
        setFontSize(Number(storedFontSize));
    }
};

  const loadFontContrast = async () => {
    try {
        const storedFontContrast = await AsyncStorage.getItem('fontContrast');
        if (storedFontContrast) {
            setFontContrast(JSON.parse(storedFontContrast));
        } else {
            setFontContrast({color: '#d6d6d4', label: 'Default'});
        }
    } catch (error) {
        console.log("Error loading font contrast:", error);
    }
  };

  const getColorByIndex = (index) => {
    const colors = ['#262626', '#282626'];
    return colors[index % colors.length];
  }

  const emojis = ['\uD83D\uDCD2', '\uD83D\uDCD7', '\uD83D\uDCD9', '\uD83D\uDCD8', '\uD83D\uDCD3', '\uD83D\uDCD4', '\uD83D\uDCDD', '\uD83D\uDCDC', 'No Emoji'];

  const getEmojiSizeForTitle = (title) => {
    return title.length > 49 ? styles.largeEmoji : {};
  };
  
  const emojisForNewNotes = emojis.slice(0, 8);
  const getEmojiForNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    
    if (note && note.customEmoji) {
        if (note.customEmoji === 'No Emoji') {
            return '';
        }
        return note.customEmoji;
    }

    const index = parseInt(noteId, 10) % emojisForNewNotes.length;
    return emojisForNewNotes[index];
};

  const handleTitleChange = (text) => {
    console.log("Title changed");
    setTitle(text);
    if (!isViewMode) {
        setHasChanged(true);
    }
    setIsSaved(false);
    setSelectedEmoji(getEmojiSizeForTitle(text));
  };  

  const handleContentChange = async () => {
    if (contentInputRef.current) {
      const htmlContent = await contentInputRef.current.getContentHtml();
      console.log("Content changed");
      setContent(htmlContent);
      if (!isViewMode) {
          setHasChanged(true);
      }
      setIsSaved(false);
    }
  };
  

  const theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      primary: 'white', 
      background: '#1e1e2d',
      text: 'white',
    },
  };

  const handleBackPress = () => {
    if (isAddingNote) {
  
      if (hasChanged) {
        saveNote();
      }
      
      setIsAddingNote(false);
      loadNotes();
      setTitle('');
      setContent('');
      setEditMode(false);
      return true;
    }
    return false;
  };
  
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [isAddingNote, hasChanged]);  

  useEffect(() => {
    hasChangedRef.current = hasChanged;
 }, [hasChanged]);

  useEffect(() => {
  const loadBackgroundColor = async () => {
    try {
      const savedColor = await AsyncStorage.getItem('selectedBackgroundColor');
      if (savedColor !== null) {
        setNoteBackgroundColor(savedColor);
        setStatusBarColor(savedColor);
      }
    } catch (error) {
      console.log("Error loading background color:", error);
    }
  };

  loadNotes();
  loadBackgroundColor();
  loadFontSize();
  loadFontContrast();
}, []);

  useEffect(() => {
    AsyncStorage.setItem('fontSize', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    AsyncStorage.setItem('fontContrast', JSON.stringify(fontContrast));
}, [fontContrast]);


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
    if (isAddingNote && hasChangedRef.current) {
        console.log("Setting up auto-save interval");
        
        const autoSaveInterval = setInterval(async () => {
          if (hasChangedRef.current && !isSavedRef.current) {
            console.log("Auto-saving note");
            await saveNote();
            setHasChanged(false);
            setIsSaved(true);
          }
        }, 2000);        

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

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    const loadShowUndoRedo = async () => {
      try {
        const savedState = await AsyncStorage.getItem('showUndoRedo');
        if (savedState !== null) {
          setShowUndoRedo(JSON.parse(savedState));
        }
      } catch (error) {
        console.log("Error loading showUndoRedo state:", error);
      }
    };
  
    loadShowUndoRedo();
  }, []);
  

  useEffect(() => {
    const saveShowUndoRedo = async () => {
      try {
        await AsyncStorage.setItem('showUndoRedo', JSON.stringify(showUndoRedo));
      } catch (error) {
        console.log("Error saving showUndoRedo state:", error);
      }
    };
  
    saveShowUndoRedo();
  }, [showUndoRedo]);


  return (
    <Provider theme={theme}>
            <View style={styles.container}>
            {/* Conditionally set the StatusBar color */}
            {isAddingNote 
                ? <RNStatusBar backgroundColor={noteBackgroundColor} barStyle="light-content" />
                : <RNStatusBar backgroundColor="#1e1e2d" barStyle="light-content" />
            }
        {isAddingNote ? (
            <>
                <View style={[styles.titleRow, styles.titleSection, { backgroundColor: noteBackgroundColor || '#262626' }]}>
                <TouchableComponent
                      onPress={async () => {
                          if (hasChanged) {
                              await saveNote();
                          }
                          setIsAddingNote(false);
                          loadNotes();
                          setTitle('');
                          setContent('');
                          setEditMode(false);
                      }}
                      background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('#1e1e2d', true) : undefined}

                  >
                      <View style={{ padding: 10, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="arrow-left" size={23} color="#9d9292" />
                      </View>
                  </TouchableComponent>

                    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
                            <TextInput
                                style={[styles.input, styles.titleInput]}
                                placeholder="Title"
                                placeholderTextColor="#777"
                                value={title}
                                onChangeText={handleTitleChange}
                                selectionColor="#4c2a5b"
                            />
                        </TouchableOpacity>
                        {showUndoRedo && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  {/* Undo Button */}
                                  <TouchableOpacity onPress={() => undo(undoStack, editingNoteIdRef, setTitle, setContent, setHasChanged, setIsSaved, redoStack, notes, setRedoStack, setNotes)}>
                                    <MaterialCommunityIcons 
                                      name="undo" 
                                      size={30} 
                                      color="#777" 
                                    />
                                  </TouchableOpacity>

                                  {/* Redo Button */}
                                  <TouchableOpacity onPress={() => redo(redoStack, editingNoteIdRef, setTitle, setContent, setHasChanged, setIsSaved, undoStack, notes, setUndoStack, setNotes)}>
                                    <MaterialCommunityIcons 
                                      name="redo" 
                                      size={30} 
                                      color="#777" 
                                    />
                                  </TouchableOpacity>
                                </View>
                              )}
                        <TouchableOpacity 
                            onPress={async () => {
                                await saveNote();
                                setHasChanged(false);
                            }} 
                            style={[styles.checkButton, { marginRight: -20 }]}
                        >
                            <MaterialCommunityIcons 
                                name="check" 
                                size={24} 
                                color={isSaved ? "#4c2a5b" : (hasChanged ? "white" : "#777")} 
                            />
                        </TouchableOpacity>
                        {/* opening Options menu for OptionsMenu.js */}
                        <TouchableComponent
                                  onPress={() => {
                                      Keyboard.dismiss();
                                      setNoteToDeleteId(editingNoteIdRef.current);
                                      setOptionsDialogVisible(true);
                                  }}
                                  background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('#1e1e2d', true) : undefined}
                              >
                                  <View style={{ padding: 10, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="dots-vertical" size={24} color="#777" />
                                  </View>
                              </TouchableComponent>

                    </View>
                </View>

                
                      <>
                      <ScrollView style={{ flex: 1, backgroundColor: noteBackgroundColor || '#262626' }}>
                        <RichEditor
                        key={fontSize}
                        ref={contentInputRef} 
                        customCSS={`body { font-size: 28px; }`}
                        style={styles.contentInput}
                        androidHardwareAccelerationDisabled={true}
                        initialContentHTML={content || '<div>Start writing...</div>'}
                        editorStyle={{
                          contentCSSText: `font-size: ${fontSize}px;`,
                          backgroundColor: noteBackgroundColor || '#262626',
                          color: fontContrast.color,
                          placeholderColor: '#757578',
                        }}
                        onChange={handleContentChange}
                        onFocus={() => {
                          if (content === '<div>Start writing...</div>' || !content) {
                            contentInputRef.current?.setContentHTML('');  // clear the editor content
                          }
                        }}
                      />
                       </ScrollView>
                      <RichToolbar 
                        editor={contentInputRef}
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
                      </>

            </>
        ) : (
            <>  
                    {isBulkDeleteMode ? (
                                   <DeleteButtons
                                   handleBulkDelete={() => handleBulkDelete(selectedNotes, setNotes, setIsBulkDeleteMode, setSelectedNotes, notes)}
                                   exitBulkDeleteMode={() => exitBulkDeleteMode(setIsBulkDeleteMode, setSelectedNotes)}
                                   selectedNotes={selectedNotes}
                               />
                           ) : (
                <Button 
                    icon="plus" 
                    mode="contained" 
                    style={styles.addNoteButton} 
                    onPress={() => {
                        setIsAddingNote(true);
                        setTitle('');
                        setContent('');
                        editingNoteIdRef.current = null;
                        setIsSaved(false);
                        tempCreatedDateRef.current = new Date().toISOString();
                    }}
                >
                    Add Note
                </Button>
                )}
                    {isAtBottom && (
                        <View style={styles.scrollIndicator}>
                          <IconButton icon="arrow-down" size={20} color="#777" />
                        </View>
                      )}

                    {
                        hasLoadedNotes && notes.length === 0 ? (
                          <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ marginRight: 20, fontSize: 18, color: '#777' }}>No notes available</Text>
                              <Image 
                                source={require('./teememo.png')}
                                style={{ width: 200, height: 200 }}
                              />
                            </View>
                          </View>
                        ) : (
                     
                          <FlatList
                            removeClippedSubviews={true}
                            data={notes}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={21}
                            keyExtractor={note => note.id}
                            onScroll={({ nativeEvent }) => {
                              const isAtEnd = nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height >= nativeEvent.contentSize.height;
                              setIsAtBottom(!isAtEnd);
                            }}
                            scrollEventThrottle={16}
                            renderItem={({ item: note, index }) => (
                              <MemoizedListItem 
                                note={note} 
                                index={index}
                                setPressedIndex={setPressedIndex}
                                pressedIndex={pressedIndex}
                                setIsViewMode={setIsViewMode}
                                setIsAddingNote={setIsAddingNote}
                                setTitle={setTitle}
                                setContent={setContent}
                                setIsSaved={setIsSaved}
                                editingNoteIdRef={editingNoteIdRef}
                                contentInputRef={contentInputRef}
                                styles={styles}
                                getEmojiForNote={getEmojiForNote}
                                getEmojiSizeForTitle={getEmojiSizeForTitle}
                                getColorByIndex={getColorByIndex}
                              />
                            )}
                          />     
                      )
                    }    
                              </>
                          )}
              <Portal>
                <OptionsMenu editingNoteIdRef={editingNoteIdRef} setContent={setContent} setTitle={setTitle} setIsAddingNote={setIsAddingNote} showUndoRedo={showUndoRedo} toggleUndoRedo={() => setShowUndoRedo(!showUndoRedo)} undo={undo} redo={redo} noteBackgroundColor={noteBackgroundColor} isDeleteDialogVisible={isDeleteDialogVisible} setDeleteDialogVisible={setDeleteDialogVisible} deleteNote={deleteNote} isOptionsDialogVisible={isOptionsDialogVisible} setOptionsDialogVisible={setOptionsDialogVisible} setSoftBlackBackground={setSoftBlackBackground} setPureDarkBackground={setPureDarkBackground} setEvernoteStyle={setEvernoteStyle} visible={visible} setVisible={setVisible} fontSize={fontSize} setFontSize={setFontSize} visibleContrast={visibleContrast} setVisibleContrast={setVisibleContrast} fontContrast={fontContrast} setFontContrast={setFontContrast} emojis={emojis} notes={notes} noteToDeleteId={noteToDeleteId} setNotes={setNotes} />
              </Portal>
    </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleSection: {
    backgroundColor: '#262626',
  },
  input: {
    color: '#d6d6d4',
    borderColor: 'transparent',
    flex: 1,
    padding: 8,
    paddingLeft: 16,
    paddingRight: 16,
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
    margin: 4.5,
    padding: 7,
    backgroundColor: '#262626',
    borderRadius: 8,
    width: '97%',
  },
  customTitle: {
    color: '#c1bcbc',
    fontSize: 16,
    marginBottom: 4,
    paddingLeft: 1,
  },
  customContent: {
    color: '#757578',
  },
  checkButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteButton: {
    backgroundColor: '#44304e',
    fontSize: 50,
    borderRadius: 5,
    marginBottom: 7,
  },
  emoji: {
    fontSize: 15, 
    marginTop: -3, 
},
  largeEmoji: {
    fontSize: 30,
  },

  creationDate: {
    fontSize: 10,
    color: 'rgba(136, 136, 136, 0.4)',
  },
  lastEditedDate: {
    fontSize: 10,
    color: 'rgba(136, 136, 136, 0.4)',
    marginLeft: 10,
  },
  adjustedPosition: {
    marginTop: -13,
},
  dateContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },

  scrollIndicator: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
  richTextToolbarStyle: {
    backgroundColor: '#121212',
  },
});