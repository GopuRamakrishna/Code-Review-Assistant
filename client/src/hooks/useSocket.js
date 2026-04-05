import { useEffect,useState,useCallback } from "react";
import {io} from 'socket.io-client';

let socket=null;   //singleton socket instance for the whole app

export function useSocket(){
    const [connected,setConnected]=useState(false);

    useEffect(()=>{
        if(!socket){
            socket=io('http://localhost:5000',{
                transports:       ['websocket'],
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            })
        }

        socket.on('connect',()=>{setConnected(true)});
        socket.on('disconnect',()=>{setConnected(false)});


        return ()=>{
            socket.off('connect');
            socket.off('disconnect');
        }
    },[]);



    //subscibe to an event -- return cleanup functions
    const on=useCallback((eventName,handler)=>{
        if(!socket) return ()=>{};
        socket.on(eventName,handler)
        return ()=>{socket.off(eventName,handler)}
    },[])

    return {connected,on,socket};

}