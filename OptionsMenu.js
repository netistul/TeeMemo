import { DefaultTheme, Button, Menu, Dialog, Portal} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated, Modal, TouchableWithoutFeedback} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import EmojiPicker, { emojiFromUtf16 } from "rn-emoji-picker";
import { emojis as emojiData } from "rn-emoji-picker/dist/data";

import { deleteNote, handleBulkDelete } from './DeleteNote.js';

export default function OptionsMenu(props) {
    // Destructuring the props
    const { editingNoteIdRef, setContent, setTitle, setIsAddingNote, toggleUndoRedo, showUndoRedo, noteBackgroundColor, isDeleteDialogVisible, setDeleteDialogVisible, isOptionsDialogVisible, setOptionsDialogVisible, setSoftBlackBackground, setPureDarkBackground, setEvernoteStyle, visible, setVisible, fontSize, setFontSize, visibleContrast, setVisibleContrast, fontContrast, setFontContrast, emojis, notes, noteToDeleteId, setNotes, deleteNote } = props;
    const [showBackupInfo, setShowBackupInfo] = React.useState(false);
    const [showRestoreInfo, setShowRestoreInfo] = React.useState(false);
    const [recentEmojis, setRecentEmojis] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmoji, setSelectedEmoji] = useState(null);
    const emojiOpacity = useRef(new Animated.Value(1)).current;

    const createBackup = async () => {
        try {
            const backupPath = FileSystem.documentDirectory + "notes_backup.json";
            await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(notes));
    
            // Check if sharing is available
            if (!(await Sharing.isAvailableAsync())) {
                alert("Sharing is not available on your platform");
                return;
            }
    
            // Use sharing to let the user decide where to save/share the file
            await Sharing.shareAsync(backupPath);
            // Close the Backup dialog
            setShowBackupInfo(false);

        } catch (error) {
            alert("Error creating backup: " + error.message);
        }
    };

    function generateNewID() {
        return new Date().getTime().toString();
    }

    async function restoreNotes() {
        // Step 1: Let the user pick the backup file
        let result;
        try {
            result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
            });
        } catch (e) {
            console.error("Error during document selection:", e);
            alert('Failed to select a backup file.');
            return;
        }
    
        // Extract the URI from the assets array
        let fileUri = result.assets && result.assets[0] && result.assets[0].uri;
    
        if (!fileUri) {
            console.error("Document Picker Error:", result);
            alert('Failed to select a backup file.');
            return;
        }        
    
        try {
            // Copy the file to a temporary directory
            const tempUri = FileSystem.cacheDirectory + result.name;
            await FileSystem.copyAsync({
                from: fileUri,
                to: tempUri
            });
    
            // Step 2: Read the contents of the copied file
            let fileContents = await FileSystem.readAsStringAsync(tempUri);
    
            // Step 3: Parse the JSON data
            let restoredNotes = JSON.parse(fileContents);
    
            // Optional: Data validation
            if (!Array.isArray(restoredNotes) || restoredNotes.length === 0 || !restoredNotes[0].id || !restoredNotes[0].content) {
                alert('Invalid backup file format.');
                return;
            }
    
            // Fetch current notes
            const currentNotesString = await AsyncStorage.getItem('notes');
            let currentNotes = [];
            if (currentNotesString) {
                currentNotes = JSON.parse(currentNotesString);
            }
        
            // Map to store the IDs of current notes for quick lookup
            const currentNoteIDs = new Set(currentNotes.map(note => note.id));
        
            // Adjust IDs of restored notes if they conflict with current notes
            for (let note of restoredNotes) {
                while (currentNoteIDs.has(note.id)) {
                    note.id = generateNewID();
                }
                currentNoteIDs.add(note.id);  // Add the (potentially new) ID to the set
            }
        
            // Merge notes
            const mergedNotes = [...currentNotes, ...restoredNotes];
    
            // Step 4: Restore the notes by saving them back into AsyncStorage
            await AsyncStorage.setItem('notes', JSON.stringify(mergedNotes));
    
            // Step 5: Update the app's state to reflect restored notes
            setNotes(mergedNotes);
    
            alert('Notes restored successfully!');
            // Close the Restore dialog
            setShowRestoreInfo(false);
    
        } catch (e) {
            console.error("Error while restoring notes:", e);
            alert('Failed to restore notes. Please check the backup file and try again.');
        }
    }   

    const handleEmojiSelected = (emoji) => {
        console.log("Emoji selected: ", emoji.emoji);

        setSelectedEmoji(emoji.emoji);
        emojiOpacity.setValue(1);
    
        setTimeout(() => {
            Animated.timing(emojiOpacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
            }).start(() => {
                setSelectedEmoji(null);
            });
        }, 4000);
        
        // Update notes state
        const updatedNotes = [...notes];
        const noteIndex = updatedNotes.findIndex(n => n.id === noteToDeleteId);
        if (noteIndex !== -1) {
            updatedNotes[noteIndex].customEmoji = emoji.emoji; 
            setNotes(updatedNotes);
            AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
        }
        
        setShowEmojiPicker(false);
    }; 

    const openEmojiPicker = () => {
        setIsLoading(true);
        setShowEmojiPicker(true);
        
        setTimeout(() => {
            setIsLoading(false);
        }, 2000);
    };
    
    
    const AnimatedArrow = () => {
        const fadeAnim = useRef(new Animated.Value(0.3)).current;
    
        useEffect(() => {
            const fadeIn = Animated.timing(
                fadeAnim,
                {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }
            );
    
            const fadeOut = Animated.timing(
                fadeAnim,
                {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }
            );
    
            const sequence = Animated.sequence([fadeIn, fadeOut]);
            
            const loop = Animated.loop(sequence);
            loop.start();
    
            return () => loop.stop();
        }, [fadeAnim]);
    
        return (
            <Animated.View style={{ ...styles.animatedArrow, opacity: fadeAnim }}>
                <MaterialIcons name="arrow-forward" size={24} color="white" />
            </Animated.View>
        );
    }

    return (
        <>
           {selectedEmoji && (
            <Animated.View style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                zIndex: 10,
                opacity: emojiOpacity
            }}>
                        {selectedEmoji === "No Emoji" ? (
                    <MaterialCommunityIcons 
                        name="emoticon-neutral" 
                        size={30} 
                        color="white"
                        style={{ textAlign: 'left' }}
                    />
                ) : (
                <Text style={{ fontSize: 30, textAlign: 'left', color: 'white' }}>
                    {selectedEmoji}
                </Text>
                )}
            </Animated.View>
        )}
    <Dialog visible={isDeleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={{ backgroundColor: '#333' }}>
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Confirm Delete</Text>
        </View>
            <Dialog.Content>
            <Text style={{ color: 'white' }}>Are you sure you want to delete this note?</Text>
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
                <Button onPress={() => deleteNote(
                    noteToDeleteId,
                    setNotes,
                    setDeleteDialogVisible,
                    setIsAddingNote,
                    setTitle,
                    setContent,
                    editingNoteIdRef,
                    notes
                )}>Delete</Button>
            </Dialog.Actions>
        </Dialog>
        <Dialog visible={isOptionsDialogVisible} onDismiss={() => setOptionsDialogVisible(false)} style={{ backgroundColor: '#333' }}>                                      
        <View style={{ padding: 20 }}>
                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'white' }}>Options</Text>
                                <TouchableOpacity 
                                    onPress={toggleUndoRedo}
                                    style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MaterialCommunityIcons 
                                        name="undo-variant" 
                                        size={24} 
                                        color="#9d9fd2"
                                    />
                                    <Text style={{ color: '#9d9fd2', fontSize: 17, marginHorizontal: 8 }}>
                                        {showUndoRedo ? "Close" : "Open"} Undo/Redo
                                    </Text>
                                    <MaterialCommunityIcons 
                                        name="redo" 
                                        size={24} 
                                        color="#9d9fd2"
                                    />
                                </TouchableOpacity>
                            </View>

        <Dialog.Content style={{ backgroundColor: '#333' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            {/* Theme selection */}
            <View>
                <Text style={{ color: '#d6d6d4', fontSize: 20, marginBottom: 15, fontWeight: 'bold' }}>
                    Select theme:
                </Text>
            
                <TouchableOpacity 
                    onPress={setSoftBlackBackground}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                >
                    <MaterialCommunityIcons 
                        name="palette" 
                        size={20} 
                        color={noteBackgroundColor === '#121212' ? DefaultTheme.colors.primary : 'white'} 
                    />
                    <Text style={{ color: 'white', marginLeft: 10, fontSize: 13 }}>Soft Black</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={setPureDarkBackground}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                >
                    <MaterialCommunityIcons 
                        name="palette" 
                        size={20} 
                        color={noteBackgroundColor === '#000000' ? DefaultTheme.colors.primary : 'white'} 
                    />
                    <Text style={{ color: 'white', marginLeft: 10, fontSize: 13 }}>Pure Dark</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={setEvernoteStyle}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                >
                    <MaterialCommunityIcons 
                        name="palette" 
                        size={20} 
                        color={noteBackgroundColor === '#262626' ? DefaultTheme.colors.primary : 'white'} 
                    />
                    <Text style={{ color: 'white', marginLeft: 10, fontSize: 13 }}>Evernote style</Text>
                </TouchableOpacity>

            </View>

            <View style={{ flexDirection: 'column' }}>
                            {/* Font size selector */}
                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Text style={{ flexDirection: 'row', alignItems: 'center', color: '#d6d6d4', fontSize: 15, marginBottom: 5,  marginLeft: 11, fontWeight: 'bold' }}>
                                        <MaterialCommunityIcons name="format-size" size={20} color="grey" />
                                        Font Size:
                                    </Text>
                                    <Menu
                                        visible={visible}
                                        onDismiss={() => setVisible(false)}
                                        anchor={
                                            <Button 
                                                onPress={() => setVisible(true)} 
                                                textColor="white" 
                                                mode="outlined" 
                                                style={{ borderColor: 'white', width: 80, justifyContent: 'center', alignItems: 'center', marginLeft: 25, paddingHorizontal: 5 }} 
                                                contentStyle={{ justifyContent: 'center', alignItems: 'center' }}
                                                labelStyle={{fontSize: 14}}
                                            >
                                                {fontSize}
                                            </Button>
                                        }
                                    >
                                    <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: 'white', fontSize: 13}} onPress={() => { setVisible(false); setFontSize(13); }} title="13" />
                                    <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: 'white', fontSize: 14}} onPress={() => { setVisible(false); setFontSize(14); }} title="14 (default)" />
                                    <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: 'white', fontSize: 15}} onPress={() => { setVisible(false); setFontSize(15); }} title="15" />
                                    <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: 'white', fontSize: 16}} onPress={() => { setVisible(false); setFontSize(16); }} title="16" />
                                    <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: 'white', fontSize: 18}} onPress={() => { setVisible(false); setFontSize(18); }} title="18" />
                                    <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: 'white', fontSize: 20}} onPress={() => { setVisible(false); setFontSize(20); }} title="20" />
                                </Menu>

                            </View>

                        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Text style={{ flexDirection: 'row', alignItems: 'center', color: '#d6d6d4', fontSize: 15, marginBottom: 5,  marginLeft: -7, fontWeight: 'bold' }}>
                                <MaterialCommunityIcons name="format-color-text" size={20} color="grey" />
                                Font Contrast:
                            </Text>
                            <Menu
                                visible={visibleContrast}
                                onDismiss={() => setVisibleContrast(false)}
                                anchor={
                                    <Button onPress={() => setVisibleContrast(true)} textColor="white" mode="outlined" style={{ borderColor: 'white', width: 120, justifyContent: 'center', paddingHorizontal: 0, marginLeft: 5 }} contentStyle={{ justifyContent: 'center' }} labelStyle={{fontSize: 13}}>
                                        {fontContrast.label}
                                    </Button>
                                }
                            >
                                <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: '#d6d6d4'}} onPress={() => { setVisibleContrast(false); setFontContrast({color: '#d6d6d4', label: 'Default'}); }} title="Default" />
                                <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: '#ffffff'}} onPress={() => { setVisibleContrast(false); setFontContrast({color: '#ffffff', label: 'High'}); }} title="High" />
                                <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: '#aaaaaa'}} onPress={() => { setVisibleContrast(false); setFontContrast({color: '#aaaaaa', label: 'Medium'}); }} title="Medium" />
                                <Menu.Item style={{backgroundColor: '#333'}} titleStyle={{color: '#555555'}} onPress={() => { setVisibleContrast(false); setFontContrast({color: '#555555', label: 'Low'}); }} title="Low" />
                            </Menu>
                        </View>
                </View>
            </View>

            <Text style={{ color: '#d6d6d4', marginBottom: 10, marginTop: 15, fontWeight: 'bold' }}>Change emoji for the note:</Text>
            <AnimatedArrow />
                        <ScrollView 
                            horizontal={true} 
                            style={{ flexDirection: 'row', marginBottom: 20 }}
                            keyboardShouldPersistTaps="always"
                        >
                            {emojis.map((emoji, index) => (
                                <TouchableOpacity 
                                key={index} 
                                onPress={() => {
                                    const updatedNotes = [...notes];
                                    const noteIndex = updatedNotes.findIndex(n => n.id === noteToDeleteId);
                                    if (noteIndex !== -1) {
                                        updatedNotes[noteIndex].customEmoji = emoji;
                                        setNotes(updatedNotes);
                                        AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
                                    }
                                    setSelectedEmoji(emoji);
                                    emojiOpacity.setValue(1);
                                    setTimeout(() => {
                                        Animated.timing(emojiOpacity, {
                                            toValue: 0,
                                            duration: 1000,
                                            useNativeDriver: true
                                        }).start(() => {
                                            setSelectedEmoji(null);
                                        });
                                    }, 2000);
                                    setOptionsDialogVisible(false);
                                }}
                                style={[
                                    emoji === 'No Emoji' ? { 
                                        backgroundColor: '#ccc',
                                        borderRadius: 5,
                                        padding: -4,
                                        margin: 10,
                                        height: 30,
                                        justifyContent: 'center',
                                        marginTop: emoji === 'No Emoji' ? 3 : 0
                                    } : {}
                                ]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    {emoji === 'No Emoji' && (
                                        
                                        <MaterialCommunityIcons 
                                            name="emoticon-neutral" 
                                            size={24} 
                                            color="#333"
                                        />
                                    )}
                                    <Text 
                                        style={{ 
                                            fontSize: emoji === 'No Emoji' ? 17.5 : 25, 
                                            marginRight: 10, 
                                            marginLeft: emoji === 'No Emoji' ? 5 : 0,
                                            color: emoji === 'No Emoji' ? '#333' : '#d6d6d4',
                                            marginTop: emoji === 'No Emoji' ? -2 : 0,
                                        }}
                                    >
                                        {emoji}
                                    </Text>

                                </View>
                            </TouchableOpacity>                            
                            ))}
                            
                            <TouchableOpacity 
                                onPress={openEmojiPicker}
                                style={{ 
                                    backgroundColor: '#ccc',
                                    borderRadius: 5,
                                    padding: -4,
                                    margin: 10,
                                    height: 30,
                                    justifyContent: 'center',
                                    marginTop: 3
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    
                                    <MaterialCommunityIcons 
                                        name="emoticon-happy"
                                        size={24} 
                                        color="#333"
                                    />
                                    
                                    <Text 
                                        style={{ 
                                            fontSize: 17.5,
                                            marginLeft: 5,
                                            marginRight: 10,
                                            color: '#333',
                                            marginTop: -2
                                        }}
                                    >
                                        Select a different emoji
                                    </Text>
                                </View>
                            </TouchableOpacity>

                        </ScrollView>
                            {/* Emoji Picker */}
                            <Portal>
                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={showEmojiPicker}
                                    onRequestClose={() => {
                                        setShowEmojiPicker(false);
                                    }}
                                >
                                    <TouchableWithoutFeedback onPress={() => setShowEmojiPicker(false)}>
                                        <View style={styles.container}>
                                            <TouchableWithoutFeedback onPress={() => {}}>
                                                <View style={styles.emojiPickerContainer}>
                                                    <EmojiPicker
                                                        emojis={emojiData}
                                                        recent={recentEmojis}
                                                        autoFocus={true}
                                                        loading={isLoading}
                                                        perLine={7}
                                                        onSelect={handleEmojiSelected}
                                                        onChangeRecent={setRecentEmojis}
                                                        backgroundColor={'#262626'}
                                                    />
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            </Portal>
                                                                    
                            {/* Dialog for Backup Information */}
                            <Portal>
                            <Dialog visible={showBackupInfo} onDismiss={() => setShowBackupInfo(false)}>
                                <Dialog.Title>Backup Notes</Dialog.Title>
                                <Dialog.Content>
                                        <Text style={{ marginBottom: 10 }}> 
                                        You're about to create a backup of your notes. To save the backup, simply choose a cloud service like Google Drive or Dropbox from the sharing options that appear.
                                        </Text>
                                        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>For example:</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <Text style={{ marginRight: 5 }}>Select </Text>
                                            <View style={{ alignItems: 'center', marginRight: 10 }}>
                                                <MaterialCommunityIcons 
                                                    name="google-drive" 
                                                    size={20} 
                                                    color="#4c2a5b" 
                                                />
                                                <Text>Drive</Text>
                                            </View>
                                            <Text style={{ flex: 1 }}>from the sharing icons and save notes_backup.json there.</Text>
                                            </View>
                                        </Dialog.Content>

                                        <Dialog.Actions>
                                        <Button 
                                            mode="contained"
                                            onPress={() => setShowBackupInfo(false)} 
                                            style={{ backgroundColor: 'grey' }}
                                            labelStyle={{ color: 'white' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            mode="contained"
                                            onPress={createBackup} 
                                            style={{ backgroundColor: '#8a3dad' }}
                                            labelStyle={{ color: 'white' }}
                                        >
                                            Proceed
                                        </Button>
                                        </Dialog.Actions>
                            </Dialog>
                            </Portal>

                            <Portal>
                                <Dialog visible={showRestoreInfo} onDismiss={() => setShowRestoreInfo(false)}>
                                    <Dialog.Title>Restore Notes</Dialog.Title>
                                    <Dialog.Content>
                                    <Text style={{flexWrap: 'wrap', flexDirection: 'row'}}>
                                        To restore notes, you will need a backup file saved in JSON format. 
                                        While the default backup file is named:
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <MaterialCommunityIcons name="file-outline" size={16} color="#000" style={{marginRight: -2.5}} />
                                        <Text>notes_backup.json,</Text>
                                    </View>
                                    <Text>you can select any compatible JSON file either from your device's storage or directly from cloud services like Google Drive.</Text>
                                    </Dialog.Content>
                                    <Dialog.Actions>
                                    <Button 
                                        mode="contained"
                                        onPress={() => setShowRestoreInfo(false)} 
                                        style={{ backgroundColor: 'grey' }}
                                        labelStyle={{ color: 'white' }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        mode="contained"
                                        onPress={restoreNotes} 
                                        style={{ backgroundColor: '#8a3dad' }}
                                        labelStyle={{ color: 'white' }}
                                    >
                                        Proceed
                                    </Button>
                                    </Dialog.Actions>
                                </Dialog>
                                </Portal>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                            {/* Backup Button */}
                                    <TouchableOpacity 
                                        onPress={() => setShowBackupInfo(true)}  // Show the backup info dialog
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <MaterialCommunityIcons 
                                            name="backup-restore" 
                                            size={34} 
                                            color="#262626" 
                                        />
                                        <Text style={{ color: '#9d9fd2', marginLeft: -1, fontSize: 17 }}>Backup Notes</Text>
                                    </TouchableOpacity>

                                    {/* Restore Button */}
                                    <TouchableOpacity 
                                        onPress={() => setShowRestoreInfo(true)}
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <MaterialCommunityIcons 
                                            name="restore" 
                                            size={34} 
                                            color="#262626" 
                                        />
                                        <Text style={{ color: '#9d9fd2', marginLeft: -1, fontSize: 17 }}>Restore notes</Text>
                                    </TouchableOpacity>

                            </View>

            <TouchableOpacity 
                onPress={() => {
                    setDeleteDialogVisible(true);
                    setOptionsDialogVisible(false);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}
            >
                <MaterialCommunityIcons 
                    name="trash-can-outline" 
                    size={34} 
                    color="red" 
                />
                <Text style={{ color: 'red', marginLeft: 10, fontSize: 18 }}>Delete note</Text>
            </TouchableOpacity>
        </Dialog.Content>
        <Dialog.Actions>
            <Button onPress={() => setOptionsDialogVisible(false)}>Close</Button>
        </Dialog.Actions>
    </Dialog>
    </>
 );
}

const styles = StyleSheet.create({
    animatedArrow: {
    position: 'absolute',
    right: 10,
    top: '50%',
    zIndex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(214,214,212,0.1)',
        paddingTop: 50
    },
    emojiPickerContainer: {
        height: '80%',
        width: '100%',
    }
});