import "./compatibility/polyfill/declares";
import "./compatibility/polyfill/urlDeclares";
import {
    activate,
    stopWalking,
    followPath,
    create,
    handleWalkAway,
    playAnimation,
    showDebug,
    getData,
    changeIdleAnim,
    talkBubble,
    createDialogWindow,
    openDialogWindow,
    closeDialogWindow
} from "./npc";
import {
    initServerModel,
    npcAiTalk,
    setCustomServerUrl,
    initAiDialog,
    debugOff
} from "./ai";
import { talk } from "./dialog";
import { Dialog, NPCPathType, NPCType } from "./types";
import { NpcUtilsUi } from './ui'
import { closeBubble, closeBubbleEndAll } from "./bubble";
import { NpcUtilsInputUi, NpcUtilsLoadingUi } from "./uiInput";

export {
    activate,
    stopWalking,
    followPath,
    create,
    handleWalkAway,
    playAnimation,
    showDebug,
    talk,
    Dialog,
    getData,
    NPCPathType,
    NPCType,
    changeIdleAnim,
    talkBubble,
    closeBubble,
    closeBubbleEndAll,
    createDialogWindow,
    openDialogWindow,
    closeDialogWindow,
    NpcUtilsUi,
    npcAiTalk,
    initServerModel,
    setCustomServerUrl,
    initAiDialog,
    NpcUtilsInputUi,
    NpcUtilsLoadingUi,
    debugOff
}

export const debugLabel: string = 'NPC-Toolkit'