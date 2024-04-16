import { AudioStream, AvatarAnchorPointType, AvatarAttach, Entity, engine } from "@dcl/sdk/ecs";
import { Client, Room } from "colyseus.js"
import { openDialogWindow } from "./npc";
import { Dialog } from "./types";
import { getUserData } from '~system/UserIdentity'
import { invokeInput } from "./uiInput";
import * as utils from '@dcl-sdk/utils'

// connection variables, npc maps
export let debug_on: boolean = true;
export let connected: boolean = false;
export let connectedRoom: Room;
export let npcId = new Map<Entity, number>();
export let npcRagMode = new Map<Entity, boolean>();
let npcCounter = 0;
let colyseusServerURL = "http://localhost:2574";
let serverFileURL = "http://localhost:2574";
let colyseusRoom = "lobby_room";

// call this function to remove logs
export function debugOff() {
    debug_on = false;
}

// function to invoke voice sound after generation
function enablePlayerSound(sound: string) {
    let playerSoundEntity: Entity
    playerSoundEntity = engine.addEntity()

    AudioStream.createOrReplace(playerSoundEntity,
        {
            url: sound,
            playing: false,
        })

    AvatarAttach.createOrReplace(playerSoundEntity,{
        anchorPointId: AvatarAnchorPointType.AAPT_POSITION,
    })

    //AudioStream.getMutable(playerSoundEntity).volume = 4
    AudioStream.getMutable(playerSoundEntity).playing = true
    utils.timers.setTimeout(() => {
        engine.removeEntity(playerSoundEntity)
    }, 100 * 1000);
}

// Call this function before creating NPC to set colyseus server url OR input url directly in create() function argument
export async function setCustomServerUrl(customURL: string, customFileURL: string = "") {
    colyseusServerURL = customURL;
    if (customFileURL == "")
        serverFileURL = colyseusServerURL;
    else
        serverFileURL = customFileURL;
    if (debug_on) console.log("Custom server URL is set");
}
export async function setCustomServerRoomName(customRoom: string) {
    colyseusRoom = customRoom
    if (debug_on) console.log("Custom server room name is set");
}

// Initiating server / adding new npc to the map
// This function is called automatically when new NPC is created
// When called for the first time it connects to colyseus server by specified url from setCustomServerUrl()
export async function initServerModel(npc: Entity, ragMode: boolean) {
    if (connectedRoom == undefined) {
        const colyseusClient: Client = new Client(colyseusServerURL);
        let user = await getUserData({});
        while(!connected) {
            try {
                const availableRooms = await colyseusClient.getAvailableRooms(colyseusRoom);
                let roomExist = false
                // using "primary" as id to not create extra colyseus rooms
                for (let room of availableRooms) {
                    if (room.roomId == "primary") {
                        roomExist = true
                    }
                }

                connectedRoom = !roomExist ? await colyseusClient.create<any>(colyseusRoom, {user: user})
                    : await colyseusClient.joinById<any>("primary", {user: user})

                if (debug_on) console.log("Connected to llm server ", connectedRoom?.roomId);
                connected = true;
            } catch(error:any) {
                console.log("error connecting", error?.message);
                await dclSleep(3000);
                connected = false;
            }
        }

        // adding onMessage listener to receive answers from llm server
        connectedRoom.onMessage("getAnswer",(msg)=>{
            npcId.forEach((value, key)=>{
                if (value == msg.id) {
                    if (debug_on) console.log("Received prompt response from server: ", msg);
                    // Creating dialog for npc
                    openDialogWindow(key,createAiDialogSequence(key,msg.answer));
                    // Playing voice file if voice is enabled on server
                    if (msg.voiceEnabled) {
                        if (msg.voiceUrl)
                            enablePlayerSound(`${serverFileURL}${msg.voiceUrl}`);
                        else if (msg.voiceFullUrl)
                            enablePlayerSound(`${msg.voiceFullUrl}`)
                    }
                }
            })
        })
    }

    // Adding NPC to maps, including if Rag system is on/off for particular NPC
    npcId.set(npc,npcCounter++);
    npcRagMode.set(npc,ragMode);
}

// This function is called to send message to server, consisting of user prompt
export function npcAiTalk(npc: Entity, text: string) {
    connectedRoom.send("getAnswer",{
        id: npcId.get(npc),
        text: text,
        rag: npcRagMode.get(npc)
    });
}

// This function is called to create a generic dialog, that asks user to submit their prompt
export function initAiDialog(npc: Entity) {
    openDialogWindow(npc,createAiDialogSequence(npc));
}

// This function generates a generic dialog sequence, that asks user to submit their prompt
function createAiDialogSequence(npc: Entity, firstText: string = 'Hi there!') {
    let NPCTalk: Dialog[] = [
        {
            text: firstText,
        },
        {
            text: 'What do you want?',
            isQuestion: true,
            buttons: [
                {label: 'Talk!', goToDialog: 3, triggeredActions: ()=>{
                    invokeInput("Hey!","Tell me something!",(input: string)=>{
                        npcAiTalk(npc,input);
                    })
                }},
                {label: 'Exit!', goToDialog: 2},
            ]
        },
        {
            text: 'I must go, my planet needs me',
            isEndOfDialog: true,
        },
        {
            text: 'Listening...',
            isEndOfDialog: true,
        },
    ]
    return NPCTalk;
}

function dclSleep(milliseconds: number) {
    return new Promise((resolve, reject) => {
        utils.timers.setTimeout(() => {
            resolve(null);
        }, milliseconds);
    });
}