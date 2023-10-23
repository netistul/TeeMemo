import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ setPreloadedNotes, setIsAppReady }) => {

    const loadNotes = async () => {
      let savedNotes = [];
      try {
        const notesFromStorage = await AsyncStorage.getItem('notes');
        if (notesFromStorage !== null) {
          savedNotes = JSON.parse(notesFromStorage);
        }
      } catch (error) {
        console.log("Error loading notes:", error);
      }
      setPreloadedNotes(savedNotes);
      setIsAppReady(true); // Setting isAppReady to true after notes are loaded
    };
  
    useEffect(() => {
      loadNotes();
    }, []);
  
    return null; // Return null to render nothing
};
  
export default SplashScreen;
