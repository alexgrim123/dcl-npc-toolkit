import { AudioSource, AudioStream, AvatarAnchorPointType, AvatarAttach, Entity, engine } from "@dcl/sdk/ecs";
import { Client, Room } from "colyseus.js"
import { getUserData } from "~system/UserIdentity"
import { createDialogWindow, openDialogWindow } from "./npc";
import { Dialog } from "./types";
import { invokeInput } from "./uiInput";

export let connected: boolean = false;
export let connectedRoom: Room;
export let npcId = new Map<Entity, number>();
export let npcRagMode = new Map<Entity, boolean>();

let npcCounter = 0;
let colyseusServerURL = "http://localhost:2574"

import * as utils from '@dcl-sdk/utils'

function enablePlayerSound(sound: string){
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

export async function setCustomServerUrl(customURL: string) {
    colyseusServerURL = customURL;
}

export async function initServerModel(npc: Entity, ragMode: boolean) {
    if (connectedRoom == undefined) {
        const colyseusClient: Client = new Client(colyseusServerURL);
        const user = await getUserData({});
        while(!connected){
            try {
                connectedRoom = await colyseusClient.joinOrCreate(`lobby_room`, {
                    user: user
                });
                console.log("CONNECTED", connectedRoom?.roomId);
                connected = true;
            } catch(error:any) {
                console.log("error connecting", error?.message);
                connected = false;
            }
        }

        connectedRoom.onMessage("getAnswer",(msg)=>{
            npcId.forEach((value, key)=>{
                if (value == msg.id) {
                    openDialogWindow(key,createAiDialogSequence(key,msg.answer));
                    if (msg.voiceEnabled)
                        enablePlayerSound(`${colyseusServerURL}${msg.voiceUrl}`);
                }
            })
        })
    }

    npcId.set(npc,npcCounter++);
    npcRagMode.set(npc,ragMode);
}

export function npcAiTalk(npc: Entity, text: string) {
    connectedRoom.send("getAnswer",{
        id: npcId.get(npc),
        text: text,
        rag: npcRagMode.get(npc)
    });
}

export function initAiDialog(npc: Entity) {
    openDialogWindow(npc,createAiDialogSequence(npc));
}

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
                {label: 'Listen!', goToDialog: 2},
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