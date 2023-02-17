import { Platform, PermissionsAndroid, Alert } from "react-native";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import { useState } from "react";
import { atob, btoa } from 'react-native-quick-base64';
import DeviceInfo from 'react-native-device-info';
import { PERMISSIONS, requestMultiple } from "react-native-permissions";

import { transferDataLeft } from "./App";
import { transferDataRight } from "./App";
import { command } from "./App";
import { any, number, string } from "prop-types";



///Heart rate data
const UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID_RX = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";                 //uuid and charact. used of ESP ble
const CHARACTERISTIC_UUID_TX = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
///Heart rate data
const bleMan = new BleManager();

type permisionCallback = (result: boolean) => void;


interface bleManApi {
    requestPermissions(callback: permisionCallback): Promise<void>;
    connectToDevice(device: Device): Promise<void>;
    scanforDevices(): void;                                                        ///interface for ble (return values)
    currentDevice: Device | null,
    heartRate: number;
    allDevices: Device[];
    message: [];


    sendData(device: Device): Promise<void>;
}

export default function newble(): bleManApi {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [currentDevice, setConnectedDevice] = useState<Device | null>(null);
    const [heartRate, setHeartRate] = useState<number>(0);
    const [message, setMessage] = useState<any>([]);         //new message  
    const [messageItems, setMessageItems]= useState<any>([]);                           ///this is not used

    // const [message, setMessage] = useState<(string | number)[]>(["No messages.", ""]);       //original message  
    // const [sendMessage, setSendMessage]= useState<string>;                ///storing sent data.. not used yet.

    const requestPermissions = async (callback: permisionCallback) => {

        if (Platform.OS === "android") {
            const apiLevel = await DeviceInfo.getApiLevel();
            if (apiLevel < 31) {
                const grantedStatus = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permision",
                        message: "BLE requires location permission",                     ///checks permissions in devices lower than android
                        buttonPositive: 'Okay',
                        buttonNeutral: "Maybe Later",
                        buttonNegative: "no",

                    },
                );
                callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED);
            } else {
                const result = await requestMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,                      //// checks permissions in android 12
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ]);

                const isAllPermissionsGranted =
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED

                callback(isAllPermissionsGranted);                                  ////if all permissions granted then make permissions granted to success.
            }
        } else {
            callback(true);
        }

    };

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex(device => nextDevice.id === device.id) > -1;                 //cheks for duplicate devices.



    const scanforDevices = () => {
        console.log("Scanning for devices..");
        

        bleMan.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log(error);
            }
            if (device !== null) {                           //scans for devices
                setAllDevices(prevState => {                                            
                    if (!isDuplicateDevice(prevState, device)) {
                        return [...prevState, device];                          
                    }

                    return prevState;

                    
                    
                })
            }
        })
    };

    const connectToDevice = async (device: Device) => {
        console.log("Connecting to device...");
        
        try {
            const deviceConnection = await bleMan.connectToDevice(device.id, { requestMTU: 256 }) ///added MTU
            setConnectedDevice(deviceConnection)
            bleMan.stopDeviceScan();
            await deviceConnection.discoverAllServicesAndCharacteristics()
            startStreamingData(device);
            console.log("Connection created to :" + device.name)

            bleMan.stopDeviceScan();                                                    ///to stop device scanning if connected.

            ///tried to send data from here.


            // if (device.name === "ESP32_UART") {                         ////will only send data to ESP32.
            //     console.log("Trying to send data to: " + device.name)
            //     sendData(device)
            // }

            //Tryied sending data ends here.

        } catch (e) {
            console.log("Error while connecting" + e);
        
        }
    };

    const startStreamingData = async (device: Device) => {                                       ///no need of this function.
        if (device) {
            device.monitorCharacteristicForService(
                UUID, CHARACTERISTIC_UUID_TX,
                (error, characteristic) => onHeartRateUpdate(error, characteristic),
            );

        } else {
            console.log("No Device Connected.")

        }
    };

    const onHeartRateUpdate = (
        error: BleError | null,
        characterstic: Characteristic | null,
    ) => {
        if (error) {
            console.error(error)
            return;
        }
        else if (!characterstic?.value) {
            console.error("No Characterstics found");
            return;
        } else {
            
        }

        const rawData: any = atob(characterstic.value);
        /// making dummy to handle messages start

        setMessage((arr: any) => [rawData, ...arr]);

  
        // setMessage((arr: any) =>[...arr, rawData].reverse());       //grabbing messages here

        /// making dummy to handle messages end


       
        
        /// old this is used for storing the messages.
        // setMessage((arr: any) =>[...arr, rawData]);                   //new without reverse
        

        let innerHeartRate = -1
        const firstBitValue = Number(rawData) & 0x01;

        if (firstBitValue === 0) {
            innerHeartRate = rawData[1].charCodeAt(0);
        } else {
            innerHeartRate =
                Number(rawData[1].charCodeAt(0) << 8) +
                Number(rawData[2].charCodeAt(0));
        }
                                                         

        // console.log("innerheart "+ innerHeartRate)
        // console.log("set: "+ setHeartRate);
        // console.log("set: "+ heartRate);

    };

    ///send data start

    const sendData = async (device: Device) => {
        console.log("Sending data from input to " + device.name)

        const firstConverteMessage= dataToSend(transferDataLeft);
        const secondConvertedMessage= dataToSend(transferDataRight);

        console.log("first message"+ firstConverteMessage);
        console.log("first message"+ secondConvertedMessage);
        console.log("comamand is "+ command);
        

        // const convertedValue= `C${firstConverteMessage}${secondConvertedMessage}`;           //concated value also added C.
        
        const convertedValue = `${command}${firstConverteMessage}${secondConvertedMessage}`
        const convertedValueSent= btoa(convertedValue);                               //concat value converted to base64 and sent.
        console.log("This is sent value: "+ convertedValue);
        console.log("This is len: "+ convertedValue.length);                        //this is len of actual string sent         
           
        console.log("Initailizing sending data to: " + device.name)
        try {
            await bleMan.writeCharacteristicWithResponseForDevice(device.id,    
                UUID,
                CHARACTERISTIC_UUID_RX, 
                convertedValueSent,                                              //// Data will be send from here..
            );
            console.log("Sending Data...")
            console.log("Sent");

        }
        catch (e) {
            console.log("Failed to send data: " + e);
            
        }
        ///send data end

    };


    ///// here the  len of data will be started converting to hex///        //this will convert legnth of data in hexadecimal
    function convertToHexDec(n: number) {

        let hex = n.toString(16).toUpperCase();
      
        if (hex.length < 2) {
      
          hex = `0${hex}`;
      
        }
        return hex;
      };

    ///// here the data will be ended converting to hex///
    

    ////convert string to hex start

    function convertToHex(str: any) {

        var hex = '';
    
        for(var i=0;i<str.length;i++) {
    
            hex += ''+str.charCodeAt(i).toString(16);
    
        }
    
        return hex;
    
    };

    //convert string to hex end

    //here all the data will be converted to hex and quickbase also with legnth (start).
    function dataToSend (check: any) {
        const stringVal= new String(check);
        const strLen= stringVal.length; 
        const strValLenInHex= convertToHexDec(strLen);  
        const strValInHex=  convertToHex(stringVal);
        
        const strValLenInAscii= hex_to_ascii(strValLenInHex);
        var dataWithLenToSend = `${strValLenInAscii}${stringVal}`;            //only len in hex
        console.log("data from msg box: "+dataWithLenToSend)
        
        return dataWithLenToSend;
      };
      

    //here all the data will be converted to hex and quickbase also with legnth (end).

    ///converting hex to ascii for checking purpose (start)

    function hex_to_ascii(str1: any)
    {
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
    };
 
    ///converting hex to ascii for checking purpose (end)

    ///split of value starts here

    function split(str: any) {
        const result = [str.slice(0, 30), str.slice(30)];
      
        return result;
      };

    ///spit of values ends here


    return {
        requestPermissions,
        connectToDevice,
        scanforDevices,
        currentDevice,
        heartRate,
        allDevices,
        message,
        sendData,
       
    }

}


