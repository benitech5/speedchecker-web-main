import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput,FlatList, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import React,  { useState } from 'react'; 

export default function App() {
  const [speedlog,setspeedlog]= useState([])
  ;
  const addlog=()=>{
    const logentry = {speed:(speed),time:(time),overspeed:(overspeed)};
    setspeedlog([...speedlog,logentry])
  };


  
  const[speed,setspeed]= useState('')
  const[time,settime]= useState('')
  const[overspeed,setoverspeed]= useState('')

  const handlepress =()=>{
    addlog();
    setoverspeed('');
    settime('');
    setspeed('');
  }
  const renderitem = ({item}) => (
    <View style={{flexDirection:'row',margin:8}} >
      <Text>{item.speed}</Text>
      <Text>{item.time}</Text>
      <Text>{item.overspeed}</Text>

    </View>

  );



return(
  <View>
  <SafeAreaView>
  <View>
      <Text>HELLO WORLD TRIALS</Text>
    </View>
    <View>
      <TextInput style={{borderColor:'black',margin:20,borderWidth:1,padding:5}} value={speed} placeholder='speed' onChangeText={setspeed} />
      <TextInput style={{borderColor:'black',margin:20,borderWidth:1,padding:5}} value={time} placeholder='time' onChangeText={settime} />
      <TextInput style={{borderColor:'black',margin:20,borderWidth:1,padding:5}} value={overspeed} placeholder='overspeed' onChangeText={setoverspeed} />
    </View>
    <TouchableOpacity onPress={handlepress} style={{borderColor:'red',alignItems:'center',backgroundColor:'red'}}>
      <Text>ADD TO</Text>
    </TouchableOpacity>
    <Text>{speed}</Text>
    <View style={{alignItems:'center'}}>
    <FlatList
    data={speedlog}
    renderItem={renderitem}
    keyExtractor={(item, index)=>index.toString()}
    
    />
    </View>
    


  </SafeAreaView>
    

    


  </View>

)
  
};
