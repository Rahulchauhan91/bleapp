/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { cloneElement, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  TextInput,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import newble from './ble';
import { DebugInstructions } from 'react-native/Libraries/NewAppScreen';
import { BleManager, Device } from 'react-native-ble-plx';
import babelConfig from './babel.config';
import { element, number } from 'prop-types';


export default function App() {
  const [isModalvisible, setisModalVisible] = useState<boolean>(false);

  const [availableText, setAvailableText] = useState<string>("");
  const [scanText, setScanText] = useState<string>("Start Scanning");    /// Changes scan button text when pressed..
  const [currentDeviceName, setCurrentDeviceName] = useState<any>(" ");
  const [currentDeviceNameHeader, setCurrentDeviceNameHeader] = useState<any>("Connecting..");
  const [Refreshing, setRefreshing] = useState(false);


  const handeleSetScanText = () => {                                  ////scan button text handler.
    if (scanText === "Start Scanning") {
      setScanText("Scanning for Devices....")
      setAvailableText("AVAILABLE DEVICES:")
    } else {
      setScanText("Start Scanning")
    }
  };

  const { requestPermissions, scanforDevices, allDevices, connectToDevice, currentDevice, message, sendData, heartRate } = newble();


  const listRefreshHandler = () => {
    if (allDevices != null) {
      setRefreshing(true);                      //this is for handling the flatlist refresh state
      scanforDevices();
      setScanText("Scanning for Devices....")
      setRefreshing(false);
    }
  };

    const currentDeviceChecker= async(device: Device) => {
      setCurrentDeviceNameHeader("Trying to Connect...");
      setCurrentDeviceName(" ");
      setTimeout(() => {
        if (currentDevice!== undefined) {
            setCurrentDeviceName(device.name);                      
            setCurrentDeviceNameHeader("Connected: ")
            console.log("Should connect.."+ currentDevice?.name);
            
          } else {
            setCurrentDeviceNameHeader("Not Connected");
            setCurrentDeviceName(" "); 
            
          }
      }, 6000);

      // if (currentDevice?.isConnected) {
      //   setCurrentDeviceName(device.name);                      
      //   setCurrentDeviceNameHeader("Conncted: ")
      // } else {
      //   setCurrentDeviceNameHeader("Trying to Connect...")
      // }
    };

  const openModal = async () => {
    requestPermissions((isGranted: boolean) => {
      if (isGranted) {
        scanforDevices();
        handeleSetScanText();
      }
    })
  };
  /// send message data will be stored here///
  const [writeSSID, setWriteSSID] = useState<any>();      ////sends string, number and even null
  const [writePass, setWritePass] = useState<any>();
  const [writeTwillioSSID, setWriteTwillioSSID] = useState<any>();
  const [writeTwillioPass, setWriteTwillioPass] = useState<any>();
  const [writeFrom, setWriteFrom] = useState<any>();                     ///WA from message
  const [writeTo, setWriteTo] = useState<any>();                         ///WA To message
  const [SMSWriteFrom, setSMSWriteFrom] = useState<any>();
  const [SMSWriteTo, setSMSWriteTo] = useState<any>();
  const [lastMessage, setLastMessage] = useState<any>();

  ///handling Wifi message here start//

  const handleWriteWifiMessage = () => {

    setWriteSSID(null);
    setWritePass(null);
    Keyboard.dismiss();                             ////will clear the keyboard after send

    // var newMessage1 = `${writeMessage}`;            ////combined message sent to prop below in last.
    // var newMessage2 = `${writeMessage2}`;

    commandHandler("C");

    processLeftBox(writeSSID);
    processRightBox(writePass);

    console.log("Wifi SSID: " + writeSSID);                        ////data before conversion
    console.log("Wifi Pass: " + writePass);


  };
  ///handling Wifi message here end//

  ///handling twillio message here start//

  const handleWriteTwillioMessage = () => {
    setWriteTwillioSSID(null);
    setWriteTwillioPass(null);
    Keyboard.dismiss();

    commandHandler("t");

    processLeftBox(writeTwillioSSID);
    processRightBox(writeTwillioPass);

    console.log("Wifi SSID: " + writeTwillioSSID);                        ////data before conversion
    console.log("Wifi Pass: " + writeTwillioPass);
  };

  ///handling twillio message here end//

  ///handling WA fromto message here start
  const handleWriteFromToMessage = () => {
    setWriteFrom(null);
    setWriteTo(null);
    Keyboard.dismiss();

    commandHandler("P");

    processLeftBox(`whatsapp:${writeFrom}`);
    processRightBox(`whatsapp:${writeTo}`);

    console.log("From: " + writeFrom);                        ////data before conversion
    console.log("To: " + writeTo);

  };
  //handling WA from to message here end

  //handling SMS From to message from here start

  const handleSMSwriteFromToMessage = () => {
    setSMSWriteFrom(null);
    setSMSWriteTo(null);
    Keyboard.dismiss();

    commandHandler("S");

    processLeftBox(SMSWriteFrom);
    processRightBox(SMSWriteTo);

    console.log("From: " + SMSWriteFrom);                        ////data before conversion
    console.log("To: " + SMSWriteTo);

  };

  //handling SMS from to message end here

  //handling last message here start
  const handleLastMessage = () => {
    setLastMessage(null);
    Keyboard.dismiss();

    commandHandler("m");

    processLeftBox(lastMessage);
    processRightBox(" ");                                   ///left it blank so I can process it the same way..

    console.log("last message: " + lastMessage);

  };

  //handling last message here end


  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>
        DEVICE SCANNER
      </Text>
      <View style={styles.buttons}>
        {/* <Button
          title="start Scanning"
          onPress={openModal}
        /> */}

        <TouchableOpacity onPress={openModal}>
          <Text style={styles.start}>{scanText}</Text>
        </TouchableOpacity>
      </View>



      <Text style={styles.sectionTitle2}>
        {availableText}
      </Text>

      {/* Check new device list with Flatlist start */}

      <FlatList 
      data={allDevices}
      refreshing={Refreshing} onRefresh={listRefreshHandler}
      extraData={allDevices}
      renderItem= {({item}) => {
        return (
          <TouchableOpacity onPress={() => { connectToDevice(item); setisModalVisible(true) ; currentDeviceChecker(item)}}>
             <View style={styles.list}>
                <Text >{item.name} {item.id}</Text>

              </View>
          </TouchableOpacity>
        )
      } }
      />

      {/* Check new device list with Flatlist end */}



      {/* //old device list for scanned devices being replaced by flatlist above start*/}

      {/* <ScrollView refreshControl={<RefreshControl refreshing={Refreshing} onRefresh={openModal} />}>
        {
          allDevices.map((device: Device) => (
            <TouchableOpacity onPress={() => { connectToDevice(device); setisModalVisible(true) }} >
              <View style={styles.list}>
                <Text >{device.name} {device.id}</Text>

              </View>
            </TouchableOpacity>
          ))
        }
      </ScrollView> */}

      {/* // old device list  for scanned devices being replaced by flatlist above end */}


      <Modal visible={isModalvisible} animationType='slide'>

        <ScrollView>


          <View style={styles.sectionTitle3}>

            {/* new currentDevice portion starts from here */}

            <View style={styles.row}>
              <Text style={styles.currentDeviceWrapText}>{currentDeviceNameHeader}</Text>
              <Text style={styles.CurrentDeviceWrap}>{currentDeviceName}</Text>
            </View>


            <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 3 }}>Received Messages: </Text>


            {/* test view box with scrollview start */}
            <View style= {{maxHeight: 350, justifyContent: 'center'}}>
            <ScrollView style= {{width: "95%", height: "15%", backgroundColor: 'grey', borderRadius: 5}} 
            persistentScrollbar={true}
            showsVerticalScrollIndicator={true}
            indicatorStyle= 'white'
            >
            <View >
            {
                  message.map(message => {
                    return (
                      <View>
                        <Text style= {{marginLeft: 5 ,marginVertical: 1, color: '#2EFA00'}}>{message}</Text>
                      </View>
                    )
                  })
                }
            </View>
            </ScrollView>
            </View>
            {/* test view box  with scrollview end*/}


            <View style={styles.sendDataForm}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, marginVertical: 5, }}>Wifi Settings: </Text>

              {/* TextInput Wifi starts here 1 */}

              <View style={styles.row}>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>SSID</Text>
                  <TextInput style={styles.input}
                    value={writeSSID}
                    onChangeText={(value) => { setWriteSSID(value) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput style={styles.input}
                    value={writePass}
                    onChangeText={(v) => { setWritePass(v) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}></Text>
                  <TouchableOpacity onPress={() => { handleWriteWifiMessage(); if (currentDevice) { sendData(currentDevice) } if (currentDevice?.isConnected) {console.log("fine as per send butn")} else{setCurrentDeviceNameHeader("Disconnected"); setCurrentDeviceName("")} }}>
                    <Text style={styles.send}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TextInput Wifi ends here 1*/}
              <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 8, }}>Twillio Settings: </Text>

              {/* TextInput starts here Twillio */}

              <View style={styles.row}>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>SID</Text>
                  <TextInput style={styles.input}
                    value={writeTwillioSSID}
                    onChangeText={(value) => { setWriteTwillioSSID(value) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Token</Text>
                  <TextInput style={styles.input}
                    value={writeTwillioPass}
                    onChangeText={(v) => { setWriteTwillioPass(v) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}></Text>
                  <TouchableOpacity onPress={() => { handleWriteTwillioMessage(); if (currentDevice) { sendData(currentDevice) }; if (currentDevice?.isConnected) {console.log("fine as per send butn")} else{setCurrentDeviceNameHeader("Disconnected"); setCurrentDeviceName("")} }}>
                    <Text style={styles.send}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TextInput ends here Twillio*/}

              <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 8, }}>WhatsApp: </Text>

              {/* TextInput starts here for WA FromAndTo */}

              <View style={styles.row}>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>From</Text>
                  <TextInput style={styles.input}
                    value={writeFrom}
                    onChangeText={(value) => { setWriteFrom(value) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>To</Text>
                  <TextInput style={styles.input}
                    value={writeTo}
                    onChangeText={(v) => { setWriteTo(v) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}></Text>
                  <TouchableOpacity onPress={() => { handleWriteFromToMessage(); if (currentDevice) { sendData(currentDevice) } }}>
                    <Text style={styles.send}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TextInput ends here for WA FromAndTo*/}

              <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 8, }}>SMS:</Text>

              {/* TextInput starts here for SMS FromAndTo */}

              <View style={styles.row}>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>From</Text>
                  <TextInput style={styles.input}
                    value={SMSWriteFrom}
                    onChangeText={(value) => { setSMSWriteFrom(value) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>To</Text>
                  <TextInput style={styles.input}
                    value={SMSWriteTo}
                    onChangeText={(v) => { setSMSWriteTo(v) }}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}></Text>
                  <TouchableOpacity onPress={() => { handleSMSwriteFromToMessage(); if (currentDevice) { sendData(currentDevice) } }}>
                    <Text style={styles.send}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TextInput ends here SMS FromAndTo*/}

              {/* Sending last message from here start */}

              <View style={styles.row}>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Message</Text>
                  <TextInput style={{
                    backgroundColor: "white", padding: 2, marginRight: -56, borderRadius: 4, elevation: 3,
                    shadowColor: '#171717',
                    shadowRadius: 3,
                    shadowOpacity: 0.2,
                    shadowOffset: { width: -2, height: 4 }
                  }}
                    value={lastMessage}
                    onChangeText={(value) => { setLastMessage(value) }}
                  />
                </View>
 
                <View style={styles.inputWrap}>
                  <Text style={styles.label}></Text>
                  <TouchableOpacity onPress={() => { handleLastMessage(); if (currentDevice) { sendData(currentDevice) } }}>
                    <Text style={styles.sendLastMessage}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sending last message from here end */}

              {/* trying to send data to currentDevice below with send data below */}


              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"}>

                <TouchableOpacity onPress={() => {
                  if (isModalvisible) { setisModalVisible(false) }; setScanText("Start Scanning"); if (currentDevice) {
                    currentDevice?.cancelConnection; console.log("Device Disconnected");
                  }
                }}>
                  <Text style={styles.closeModal}>Back to scan</Text>
                </TouchableOpacity>

              </KeyboardAvoidingView>

            </View>


          </View>

        </ScrollView>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    alignItems: 'center',
    marginVertical: 10,
    alignSelf: 'center',

  },
  button: {
    elevation: 8,
    backgroundColor: "#009688",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    fontWeight: 'bold',
    alignItems: 'center',
  },
  sectionTitle2: {
    fontSize: 15,
    fontWeight: 'bold',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
    marginHorizontal: 10
  },
  list: {
    flexDirection: 'row',
    padding: 25,
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 10,
    backgroundColor: "#A2DAFC",
    marginVertical: 4,
    borderRadius: 20,
    elevation: 2 ,
    shadowColor: '#171717',
    shadowRadius: 3,
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 4 }
  },
  buttons: {
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 30,
  },
  id: {
    justifyContent: 'flex-end', fontSize: 10, position: 'absolute', bottom: 8,
    marginHorizontal: 27,
  },
  sectionTitle3: {
    fontSize: 16,
    fontWeight: 'bold',
    justifyContent: 'center',
    marginVertical: 14,
    marginHorizontal: 10,
    margin: 20,
  },
  list2: {
    padding: 6,
    flexDirection: 'row',
    backgroundColor: "#66CCFF",
    borderRadius: 20,
    paddingRight: 120,
    marginLeft: 30,
    marginVertical: 10,
  },
  input: {
    backgroundColor: "white",
    padding: 2,
    marginHorizontal: 2,
    borderRadius: 4,
    elevation: 2 ,
    shadowColor: '#171717',
    shadowRadius: 3,
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 4 }

  },
  send: {
    backgroundColor: "#000000",
    fontWeight: 'bold',
    color: "#FFFFFF",
    borderRadius: 26,
    textAlign: 'center',
    padding: 4,
    width: "80%",
    marginLeft: 5,
    elevation: 3,
    shadowColor: '#171717',
    shadowRadius: 3,
    shadowOpacity: 0.2,
    shadowOffset: { width: -2, height: 4 }
  },
  start: {
    backgroundColor: "#3399CC",
    fontWeight: 'bold',
    color: "#fff",
    borderRadius: 29,
    justifyContent: 'center',
    padding: 8,
    textAlign: 'center',
  },
  connected: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#ffff",
    marginTop: 10,
    borderRadius: 20
  },
  connectedMessage: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
    backgroundColor: "#98AFC7",
    marginTop: 10,
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sendDataForm: {
  },
  closeModal: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#99ccff",
    textAlign: 'center',
    marginTop: 13,
    width: "45%",
    marginLeft: "26%",
    padding: 4,
    borderRadius: 4,
  },
  showSentMessage: {

  },
  row: {
    flex: 1,
    flexDirection: "row"
  },
  inputWrap: {
    flex: 1,
    borderColor: "#cccccc",
    marginBottom: 10,
  },
  label: {
    fontStyle: 'italic'
  },
  sendLastMessage: {
    backgroundColor: "#000000",
    fontWeight: 'bold',
    color: "#FFFFFF",
    borderRadius: 29,
    textAlign: 'center',
    padding: 4,
    width: "55%",
    marginLeft: 63,
    elevation: 3,
    shadowColor: '#171717',
    shadowRadius: 3,
    shadowOpacity: 0.2,
    shadowOffset: { width: -2, height: 4 }
  },
  currentDeviceWrapText: {
    borderColor: "#cccccc",
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 20,
  },
  CurrentDeviceWrap: {
    borderColor: "#cccccc",
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 18,
    color: "#228b22",
    marginTop: 1,
  },

});

var transferDataLeft: string | number = "";                //// default value to send is blank string.
var transferDataRight: string | number = "";
var command: string = '';



function processLeftBox(props: string | number) {
  transferDataLeft = props;
  console.log("transfer 1: " + transferDataLeft);                   ///this is used to send data to ble device.

  return props;
};

function processRightBox(props: string | number) {
  transferDataRight = props;
  console.log("transfer 2" + transferDataRight);                   ///this is used to send data to ble device.

  return props;
};

function commandHandler(c: string) {
  console.log("Command before: " + c);
  command = c;
  return c;
};



export { transferDataLeft };
export { transferDataRight };
export { command };


